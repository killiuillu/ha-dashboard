import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { overviewStatus, splitPower } from "../../src/util/evcc.js";

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
