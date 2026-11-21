import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { DIAL_ARC, knobPos, loadpointStatus, normalizeLoadpoints } from "../../src/util/evcc.js";

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

test("Dial-Geometrie: Bogen und Knopf-Position", () => {
  assert.ok(DIAL_ARC.startsWith("M "));
  const a = knobPos(0);
  const b = knobPos(50);
  const c = knobPos(100);
  assert.ok(Math.abs(a.x - 20.3) < 0.1 && Math.abs(a.y - 79.7) < 0.1);
  assert.ok(Math.abs(b.y - 8) < 0.1);
  assert.ok(Math.abs(c.x - 79.7) < 0.1 && Math.abs(c.y - 79.7) < 0.1);
  const clamped = knobPos(150);
  assert.deepEqual(clamped, c);
});
