import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { parseWasteEntities, wasteEntry, wasteEntries, daysLabel, daysUntil, iconForName } from "../../src/util/waste.js";

setLang({ language: "de" });

const hass = {
  states: {
    "sensor.waste_collection_schedule_restmuell": {
      state: "2",
      attributes: { friendly_name: "Restmüll", next_date: "2026-11-24", daysTo: 2 },
    },
    "sensor.waste_collection_schedule_bio": { state: "1", attributes: { friendly_name: "Biotonne", next_date: "2026-11-23", daysTo: 1 } },
    "sensor.muelltonnen_papier": { state: "2026-11-21", attributes: { friendly_name: "Papier", next_collection: "2026-11-21" } },
    "sensor.custom_ohne_attr": { state: "unavailable", attributes: {} },
  },
};

test("parseWasteEntities: String, gemischte Objekte, {entities: [...]}", () => {
  assert.deepEqual(parseWasteEntities("sensor.a"), [{ entity: "sensor.a" }]);
  const list = parseWasteEntities(["sensor.a", { entity: "sensor.b", name: "Bio", icon: "mdi:leaf", color: "#00ff00" }]);
  assert.equal(list[1].name, "Bio");
  assert.equal(list[1].icon, "mdi:leaf");
  assert.deepEqual(parseWasteEntities({ entities: ["sensor.x"] }).map((x) => x.entity), ["sensor.x"]);
  assert.deepEqual(parseWasteEntities(undefined), []);
});

test("wasteEntry: Tage aus State (Zahl), Datum aus next_date; Date-as-State-Fallback berechnet Tage", () => {
  const now = new Date("2026-11-21T12:00:00+01:00");
  const rest = wasteEntry(hass, { entity: "sensor.waste_collection_schedule_restmuell" }, now);
  assert.equal(rest.days, 2);
  assert.equal(rest.name, "Restmüll");
  assert.equal(rest.nextDate.getDate(), 24);
  const papier = wasteEntry(hass, { entity: "sensor.muelltonnen_papier" }, now);
  assert.equal(papier.days, 0);
  const unavail = wasteEntry(hass, { entity: "sensor.custom_ohne_attr" }, now);
  assert.equal(unavail.available, true);
  assert.equal(unavail.days, null);
  const missing = wasteEntry(hass, { entity: "sensor.gibt_es_nicht" }, now);
  assert.equal(missing.available, false);
});

test("wasteEntries: sortiert nach Tagen, nächster Termin (kleinste Tage) ist isNext, unavailable fällt raus", () => {
  const items = parseWasteEntities([
    "sensor.waste_collection_schedule_restmuell",
    "sensor.waste_collection_schedule_bio",
    "sensor.muelltonnen_papier",
    "sensor.custom_ohne_attr",
    "sensor.gibt_es_nicht",
  ]);
  const now = new Date("2026-11-21T12:00:00+01:00");
  const list = wasteEntries(hass, items, now);
  assert.equal(list.length, 4);
  assert.deepEqual(list.map((e) => e.name), ["Papier", "Biotonne", "Restmüll", "Custom Ohne Attr"]);
  assert.equal(list[0].isNext, true);
  assert.equal(list[1].isNext, undefined);
});

test("daysLabel: Heute / Morgen / in n Tagen / unbekannt", () => {
  assert.equal(daysLabel(0), "Heute");
  assert.equal(daysLabel(-1), "Heute");
  assert.equal(daysLabel(1), "Morgen");
  assert.equal(daysLabel(5), "in 5 Tagen");
  assert.equal(daysLabel(null), "unbekannt");
});

test("daysUntil: Mitternachts-basiert (lokale Zeit)", () => {
  const now = new Date(2026, 10, 21, 23, 59);
  assert.equal(daysUntil(new Date(2026, 10, 22, 0, 1), now), 1);
  assert.equal(daysUntil(new Date(2026, 10, 21, 8, 0), now), 0);
});

test("iconForName: deutsche Tonnen-Namen => passende MDI-Icons", () => {
  assert.equal(iconForName("Restmüll"), "mdi:trash-can");
  assert.equal(iconForName("Biotonne"), "mdi:leaf");
  assert.equal(iconForName("Papier"), "mdi:package-variant-closed");
  assert.equal(iconForName("Gelbe Tonne"), "mdi:recycle");
  assert.equal(iconForName("Glas"), "mdi:bottle-wine");
  assert.equal(iconForName("Irgendwas"), "mdi:trash-can-outline");
});
