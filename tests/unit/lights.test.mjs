import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { parseLightEntities, lightEntry, lightEntries } from "../../src/util/lights.js";

setLang({ language: "de" });

const hass = {
  states: {
    "light.wohnzimmer": { state: "on", attributes: { friendly_name: "Wohnzimmer Lampe", brightness: 128, brightness_pct: 50 } },
    "light.kueche": { state: "off", attributes: { friendly_name: "Küchenlicht" } },
    "light.schreibtisch": { state: "on", attributes: { brightness: 255 } },
    "light.kaputt": { state: "unavailable", attributes: {} },
  },
};

test("parseLightEntities: String, Objekte mit name/icon/color", () => {
  assert.deepEqual(parseLightEntities("light.a"), [{ entity: "light.a" }]);
  const list = parseLightEntities(["light.a", { entity: "light.b", name: "Lampe", icon: "mdi:lamp", color: "#fff" }]);
  assert.equal(list[1].name, "Lampe");
  assert.equal(list[1].icon, "mdi:lamp");
  assert.deepEqual(parseLightEntities({ entities: ["light.x"] }).map((x) => x.entity), ["light.x"]);
  assert.deepEqual(parseLightEntities(undefined), []);
});

test("lightEntry: on/off, Helligkeit aus brightness (0-255) und brightness_pct, Name aus friendly_name", () => {
  const wz = lightEntry(hass, { entity: "light.wohnzimmer" });
  assert.equal(wz.on, true);
  assert.equal(wz.brightness, 50);
  assert.equal(wz.name, "Wohnzimmer Lampe");
  const st = lightEntry(hass, { entity: "light.schreibtisch" });
  assert.equal(st.brightness, 100);
  assert.equal(st.name, "Schreibtisch");
  const k = lightEntry(hass, { entity: "light.kueche" });
  assert.equal(k.on, false);
  assert.equal(k.brightness, null);
  const kaputt = lightEntry(hass, { entity: "light.kaputt" });
  assert.equal(kaputt.available, false);
  const missing = lightEntry(hass, { entity: "light.gibt_es_nicht" });
  assert.equal(missing.available, false);
});

test("lightEntries: an zuerst, dann aus, dann unavailable; Name-Sortierung", () => {
  const list = lightEntries(hass, parseLightEntities(["light.kueche", "light.kaputt", "light.wohnzimmer", "light.schreibtisch"]));
  assert.deepEqual(
    list.map((l) => l.name),
    ["Schreibtisch", "Wohnzimmer Lampe", "Küchenlicht", "Kaputt"],
  );
});
