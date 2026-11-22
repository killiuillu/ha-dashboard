import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { MODULES, EvccDashboardStrategy, detectModules, normalizeModules } from "../../src/cards/strategy.js";

setLang({ language: "de" });

const hass = {
  locale: { language: "de" },
  states: {
    "sensor.evcc_pv_power": {},
    "sensor.evcc_loadpoint_1_charge_power": {},
    "calendar.familie": {},
    "sensor.waste_collection_schedule_bio": { attributes: { daysTo: 1, next_date: "2026-11-23" } },
  },
  entities: {
    "sensor.evcc_pv_power": { entity_id: "sensor.evcc_pv_power", platform: "evcc", domain: "sensor" },
    "sensor.evcc_loadpoint_1_charge_power": { entity_id: "sensor.evcc_loadpoint_1_charge_power", platform: "evcc", domain: "sensor" },
    "climate.wohnzimmer": { entity_id: "climate.wohnzimmer", platform: "raumklima", domain: "climate" },
    "light.wohnzimmer": { entity_id: "light.wohnzimmer", platform: "hue", domain: "light" },
    "light.schreibtisch": { entity_id: "light.schreibtisch", platform: "ikea", domain: "light" },
    "calendar.familie": { entity_id: "calendar.familie", platform: "calendar", domain: "calendar" },
    "sensor.muelltonnen_restmuell": { entity_id: "sensor.muelltonnen_restmuell", platform: "waste_collection_schedule", domain: "sensor" },
  },
};

test("normalizeModules: Default = alle Module, Aliase (Mülltonnen, Kalender, Lichter)", () => {
  assert.deepEqual(normalizeModules(undefined), MODULES);
  assert.deepEqual(normalizeModules(["Mülltonnen", "kalender", "Hue"]), ["muell", "calendar", "hue"]);
  assert.deepEqual(normalizeModules(["unbekannt"]), MODULES);
});

test("detectModules erkennt raumklima/hue/calendar/muell über die Entity-Registry", () => {
  const det = detectModules(hass, "evcc");
  assert.deepEqual(det.raumklima, ["climate.wohnzimmer"]);
  assert.deepEqual(det.hue, ["light.wohnzimmer"]);
  assert.deepEqual(det.calendar, ["calendar.familie"]);
  assert.deepEqual(det.muell, ["sensor.muelltonnen_restmuell", "sensor.waste_collection_schedule_bio"]);
});

test("generate ohne modules: alle erkannten Module als Sections", async () => {
  const dash = await EvccDashboardStrategy.generate({ prefix: "evcc" }, hass);
  const titles = dash.views[0].sections.map((s) => s.title);
  assert.deepEqual(titles, ["evcc", "Raumklima", "Lichter", "Kalender", "Müllabfuhr"]);
  const hue = dash.views[0].sections.find((s) => s.title === "Lichter");
  assert.equal(hue.cards[0].type, "custom:modular-lights-card");
  assert.deepEqual(hue.cards[0].entities, ["light.wohnzimmer"]);
  const cal = dash.views[0].sections.find((s) => s.title === "Kalender");
  assert.equal(cal.cards[0].type, "custom:modular-calendar-card");
  assert.equal(cal.cards[0].view, "list");
  assert.deepEqual(cal.cards[0].entities, ["calendar.familie"]);
  const muell = dash.views[0].sections.find((s) => s.title === "Müllabfuhr");
  assert.equal(muell.cards[0].type, "custom:modular-waste-card");
  assert.deepEqual(muell.cards[0].entities, ["sensor.muelltonnen_restmuell", "sensor.waste_collection_schedule_bio"]);
});

test("generate: calendar/waste-Config (entities, view, days) ueberschreibt die Auto-Erkennung", async () => {
  const dash = await EvccDashboardStrategy.generate(
    {
      prefix: "evcc",
      modules: ["calendar", "muell", "hue"],
      calendar: { entities: ["calendar.arbeit"], view: "calendar", days: 30, group: true, max: 5 },
      waste: { entities: ["sensor.waste_collection_schedule_bio"] },
      hue: { entities: ["light.schreibtisch"], control: true },
    },
    hass,
  );
  const cal = dash.views[0].sections.find((s) => s.title === "Kalender");
  assert.equal(cal.cards[0].type, "custom:modular-calendar-card");
  assert.equal(cal.cards[0].view, "calendar");
  assert.equal(cal.cards[0].days, 30);
  assert.equal(cal.cards[0].group, true);
  assert.equal(cal.cards[0].max, 5);
  assert.deepEqual(cal.cards[0].entities, ["calendar.arbeit"]);
  const muell = dash.views[0].sections.find((s) => s.title === "Müllabfuhr");
  assert.equal(muell.cards[0].type, "custom:modular-waste-card");
  assert.deepEqual(muell.cards[0].entities, ["sensor.waste_collection_schedule_bio"]);
  const hue = dash.views[0].sections.find((s) => s.title === "Lichter");
  assert.equal(hue.cards[0].type, "custom:modular-lights-card");
  assert.deepEqual(hue.cards[0].entities, ["light.schreibtisch"]);
  assert.equal(hue.cards[0].control, true);
});

test("generate mit modules: nur gewünschte Module", async () => {
  const dash = await EvccDashboardStrategy.generate({ prefix: "evcc", modules: ["evcc", "Mülltonnen"] }, hass);
  const titles = dash.views[0].sections.map((s) => s.title);
  assert.deepEqual(titles, ["evcc", "Müllabfuhr"]);
});

test("raumklima-Modul fällt auf entities-Karte zurück, wenn die Raumklima-Cards nicht registriert sind", async () => {
  const dash = await EvccDashboardStrategy.generate({ prefix: "evcc", modules: ["raumklima"] }, hass);
  const rk = dash.views[0].sections.find((s) => s.title === "Raumklima");
  assert.equal(rk.cards[0].type, "entities");
  assert.deepEqual(rk.cards[0].entities, ["climate.wohnzimmer"]);
});
