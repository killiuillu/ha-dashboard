import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { PACKAGE_RE, carrierOf, packageSensors, packageEntries, tickerItems } from "../../src/util/ticker.js";

setLang({ language: "de" });

const mk = (states) => ({ states, locale: { language: "de" } });

test("PACKAGE_RE: matcht Carrier/Keywords, aber nicht sensor.backups", () => {
  assert.ok(PACKAGE_RE.test("sensor.dhl_paket_1"));
  assert.ok(PACKAGE_RE.test("sensor.gls_pakete"));
  assert.ok(PACKAGE_RE.test("sensor.hermes_tracking"));
  assert.ok(PACKAGE_RE.test("sensor.dpd_lieferung"));
  assert.ok(PACKAGE_RE.test("sensor.ups_packages"));
  assert.ok(PACKAGE_RE.test("sensor.amazon_packages"));
  assert.ok(PACKAGE_RE.test("sensor.paket_status"));
  assert.ok(!PACKAGE_RE.test("sensor.backups"));
  assert.ok(!PACKAGE_RE.test("sensor.schlafzimmer_temperatur"));
});

test("carrierOf: erkennt Carrier aus Entity-ID oder friendly_name", () => {
  assert.equal(carrierOf("sensor.dhl_paket_1", "DHL Paket")?.label, "DHL");
  assert.equal(carrierOf("sensor.gls_pakete")?.label, "GLS");
  assert.equal(carrierOf("sensor.x", "Hermes Lieferung")?.label, "Hermes");
  assert.equal(carrierOf("sensor.y", "DPD")?.label, "DPD");
  assert.equal(carrierOf("sensor.z", "UPS")?.label, "UPS");
  assert.equal(carrierOf("sensor.w", "Amazon")?.label, "Amazon");
  assert.equal(carrierOf("sensor.paket_1", "Paket 1"), null);
});

test("packageEntries: nur Sensoren mit tatsächlich kommenden Paketen", () => {
  const hass = mk({
    "sensor.dhl_a": { state: "2", attributes: { friendly_name: "DHL", expected_date: "2026-11-24" } },
    "sensor.gls_b": { state: "0", attributes: { friendly_name: "GLS" } },
    "sensor.hermes_c": { state: "keine", attributes: {} },
    "sensor.dpd_d": { state: "unavailable", attributes: {} },
    "sensor.ups_e": { state: "unknown", attributes: {} },
    "sensor.amazon_f": { state: "geliefert", attributes: {} },
    "sensor.paket_g": { state: "unterwegs", attributes: { friendly_name: "Paket Post" } },
    "sensor.paket_h": { state: "0", attributes: { expected_count: 3 } },
    "sensor.paket_i": { state: "", attributes: { tracking_numbers: ["abc123", "def456"] } },
    "sensor.backups": { state: "3", attributes: {} },
  });
  assert.deepEqual(packageSensors(hass), [
    "sensor.dhl_a",
    "sensor.gls_b",
    "sensor.hermes_c",
    "sensor.dpd_d",
    "sensor.ups_e",
    "sensor.amazon_f",
    "sensor.paket_g",
    "sensor.paket_h",
    "sensor.paket_i",
  ]);
  const entries = packageEntries(hass);
  assert.deepEqual(
    entries.map((e) => e.entity),
    ["sensor.dhl_a", "sensor.paket_g", "sensor.paket_h", "sensor.paket_i"],
  );
  const dhl = entries.find((e) => e.entity === "sensor.dhl_a");
  assert.equal(dhl.carrier.label, "DHL");
  assert.equal(dhl.icon, "mdi:truck-fast");
  assert.equal(dhl.count, 2);
  assert.equal(dhl.expected, "2026-11-24");
  const g = entries.find((e) => e.entity === "sensor.paket_g");
  assert.equal(g.carrier, null);
  assert.equal(g.icon, "mdi:package-variant");
  assert.equal(g.count, null);
  assert.equal(g.state, "unterwegs");
  assert.equal(entries.find((e) => e.entity === "sensor.paket_h").count, 3);
  assert.equal(entries.find((e) => e.entity === "sensor.paket_i").count, 2);
});

test("tickerItems: Paket-Texte mit Carrier + Anzahl, nur kommende Pakete sichtbar", () => {
  const hass = mk({
    "sensor.hermes_paket": { state: "1", attributes: { friendly_name: "Hermes Paket", expected_date: "2026-11-25" } },
    "sensor.gls_pakete": { state: "0", attributes: { friendly_name: "GLS Pakete" } },
    "sensor.amazon_packages": { state: "2", attributes: { friendly_name: "Amazon Pakete" } },
  });
  const items = tickerItems(hass, { days: 2, now: new Date() });
  const texts = items.map((i) => i.text).join(" | ");
  assert.ok(texts.includes("Hermes: 1 Paket (erwartet 2026-11-25)"));
  assert.ok(texts.includes("Amazon: 2 Pakete"));
  assert.ok(!texts.includes("GLS"));
  assert.equal(items.find((i) => i.text.startsWith("Hermes")).icon, "mdi:email-fast");
});
