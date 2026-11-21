import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { dialGeometry, loadpointStatus, normalizeLoadpoints } from "../../src/util/evcc.js";

setLang({ language: "de" });

test("loadpointStatus: Laden über Leistung und evcc-Statuscodes", () => {
  assert.equal(loadpointStatus(null, 7400).label, "Fahrzeug lädt");
  assert.equal(loadpointStatus(null, 7400).tone, "heat");
  assert.equal(loadpointStatus("C", 0).tone, "heat");
  assert.equal(loadpointStatus("B", 0).label, "Fahrzeug verbunden");
  assert.equal(loadpointStatus("B", 0).tone, "air");
  assert.equal(loadpointStatus("paused", 0).tone, "warn");
  assert.equal(loadpointStatus("A", 0).tone, "off");
  assert.equal(loadpointStatus("F", 0).label, "Nicht erreichbar");
  assert.equal(loadpointStatus(null, null).label, "Nicht erreichbar");
  assert.equal(loadpointStatus("unavailable", 0).label, "Nicht erreichbar");
});

test("normalizeLoadpoints: flach (ein Ladepunkt) und Liste (mehrere)", () => {
  const flat = normalizeLoadpoints({
    title: "Wallbox",
    entities: { charge_power: "sensor.lp1_power", vehicle_soc: "sensor.lp1_soc", status: "sensor.lp1_status" },
  });
  assert.equal(flat.length, 1);
  assert.equal(flat[0].charge_power, "sensor.lp1_power");

  const multi = normalizeLoadpoints({
    entities: {
      loadpoints: [
        { name: "LP1", charge_power: "sensor.lp1_power" },
        { name: "LP2", charge_power: "sensor.lp2_power", vehicle_soc: "sensor.lp2_soc" },
        null,
      ],
    },
  });
  assert.equal(multi.length, 2);
  assert.equal(multi[1].name, "LP2");

  assert.deepEqual(normalizeLoadpoints({}), []);
  assert.deepEqual(normalizeLoadpoints({ entities: {} }), []);
});

test("Dial-Geometrie wie Raumklima (viewBox 240x200, R=100, 135°+270°)", () => {
  const g0 = dialGeometry(0);
  assert.equal(g0.viewBox, "0 0 240 200");
  assert.ok(g0.track.startsWith("M "));
  assert.ok(g0.track.includes("A 100 100 0 1 1"));
  const g50 = dialGeometry(0.5);
  assert.ok(Math.abs(g50.knob.x - 120) < 0.5 && Math.abs(g50.knob.y - 12) < 0.5);
  const g100 = dialGeometry(1);
  assert.ok(Math.abs(g100.knob.x - 220) < 0.5 && Math.abs(g100.knob.y - 112) < 0.5);
  assert.deepEqual(dialGeometry(1.5), g100);
  assert.ok(g0.fill.length < g100.fill.length || g0.fill !== g100.fill);
});
