import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { chargeModeMap, modeActive, overviewStatus, splitPower } from "../../src/util/evcc.js";
import { detectEvcc } from "../../src/cards/strategy.js";
import { readFileSync } from "node:fs";

setLang({ language: "de" });

test("Ampel-Logik der Übersicht: Netzbezug rot, Einspeisung grün", () => {
  assert.equal(overviewStatus(3000, 800, 0).label, "Netzbezug");
  assert.equal(overviewStatus(3000, 800, 0).tone, "cold");
  assert.equal(overviewStatus(3000, -1200, 0).label, "Einspeisung");
  assert.equal(overviewStatus(3000, -1200, 0).tone, "ok");
});

test("Ampel-Logik: Batterie und PV ohne Netzfluss", () => {
  assert.equal(overviewStatus(0, 10, 2000).tone, "heat");
  assert.equal(overviewStatus(0, 10, -2000).tone, "air");
  assert.equal(overviewStatus(3000, 10, 0).label, "PV erzeugt");
  assert.equal(overviewStatus(3000, 10, 0).tone, "ok");
  assert.equal(overviewStatus(0, 0, 0).tone, "off");
  assert.equal(overviewStatus(null, null, null).label, "Nicht erreichbar");
});

test("splitPower formatiert W und kW lokalisiert", () => {
  assert.deepEqual(splitPower(1200), { v: "1,20", u: "kW" });
  assert.deepEqual(splitPower(-1200), { v: "-1,20", u: "kW" });
  assert.deepEqual(splitPower(500), { v: "500", u: "W" });
  assert.deepEqual(splitPower(null), { v: "–", u: "" });
  assert.deepEqual(splitPower(3.4, "kW"), { v: "3,40", u: "kW" });
});

test("detectEvcc erkennt Lademodus-Select (select.<prefix>_loadpoint_<n>_charge_mode)", () => {
  const fixture = JSON.parse(readFileSync(new URL("../../dev/fixture.json", import.meta.url), "utf8"));
  const det = detectEvcc(fixture.states, "evcc");
  assert.equal(det.loadpoints.length, 1);
  assert.equal(det.loadpoints[0].charge_mode, "select.evcc_loadpoint_1_charge_mode");
  assert.equal(det.loadpoints[0].charge_power, "sensor.evcc_loadpoint_1_charge_power");
});

test("chargeModeMap mappt Optionen auf Aus/Schnell/Smart (off/now/pv), minpv nicht als pv", () => {
  const fixture = JSON.parse(readFileSync(new URL("../../dev/fixture.json", import.meta.url), "utf8"));
  const hass = { states: fixture.states };
  const m = chargeModeMap(hass, "select.evcc_loadpoint_1_charge_mode");
  assert.equal(m.current, "pv");
  assert.equal(m.off, "off");
  assert.equal(m.now, "now");
  assert.equal(m.smart, "pv");
  assert.ok(modeActive(m.current, m.smart));
  assert.ok(!modeActive("minpv", m.smart));
  assert.ok(modeActive("Off", "off"));
  const none = chargeModeMap(hass, "select.unbekannt");
  assert.equal(none.off, null);
  assert.equal(none.smart, null);
});
