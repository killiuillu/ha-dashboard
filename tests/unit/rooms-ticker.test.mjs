import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setLang } from "../../src/i18n/index.js";
import { detectAreas } from "../../src/util/rooms.js";
import { tickerItems, packageSensors, tickerCalendarItems } from "../../src/util/ticker.js";
import { MainDashboardStrategy } from "../../src/cards/main-strategy.js";
import { buildApi, callApiMock } from "../../dev/mock-api.mjs";

setLang({ language: "de" });

const fixture = JSON.parse(readFileSync(new URL("../../dev/fixture.json", import.meta.url), "utf8"));
const hass = {
  states: fixture.states,
  entities: fixture.entities,
  areas: fixture.areas,
  devices: fixture.devices,
  locale: { language: "de" },
  callApi: callApiMock(buildApi(new Date())),
};

test("detectAreas: Räume mit Lichtern, Klima, Media, Temperatur und lightsOn", () => {
  const areas = detectAreas(hass);
  assert.equal(areas.length, 3);
  const wz = areas.find((a) => a.area_id === "wohnzimmer");
  assert.equal(wz.name, "Wohnzimmer");
  assert.deepEqual(wz.lights, ["light.wohnzimmer"]);
  assert.deepEqual(wz.climates, ["climate.wohnzimmer"]);
  assert.deepEqual(wz.media, ["media_player.wohnzimmer"]);
  assert.equal(wz.lightsOn, 1);
  assert.equal(wz.temp, 19);
  const kueche = areas.find((a) => a.area_id === "kueche");
  assert.equal(kueche.lightsOn, 0);
  assert.equal(kueche.temp, null);
  const schlafzimmer = areas.find((a) => a.area_id === "schlafzimmer");
  assert.equal(schlafzimmer.temp, 21.5);
});

test("tickerItems: Müll <= Schwelle + Pakete, nur wenn wirklich Pakete kommen", () => {
  const now = new Date();
  const items = tickerItems(hass, { days: 2, now });
  const texts = items.map((i) => i.text).join(" | ");
  assert.ok(texts.includes("Papier: Heute"));
  assert.ok(texts.includes("Biotonne: Morgen"));
  assert.ok(texts.includes("Restmüll: in 2 Tagen"));
  assert.ok(!texts.includes("Gelbe Tonne"));
  assert.ok(texts.includes("DHL: unterwegs (erwartet 2026-11-24)"));
  assert.ok(texts.includes("Hermes: 1 Paket (erwartet 2026-11-25)"));
  assert.ok(texts.includes("Amazon: 2 Pakete"));
  assert.ok(!texts.includes("GLS"));
  assert.ok(!texts.includes("DPD"));
  assert.deepEqual(packageSensors(hass), [
    "sensor.dhl_paket_1",
    "sensor.hermes_paket",
    "sensor.amazon_packages",
    "sensor.gls_pakete",
    "sensor.dpd_lieferung",
  ]);
});

test("tickerCalendarItems: Termine heute/morgen aus Mock-API", async () => {
  const items = await tickerCalendarItems(hass, ["calendar.familie"], new Date());
  assert.ok(items.some((i) => i.text.includes("Zahnarzt")));
  assert.ok(items.every((i) => i.icon === "mdi:calendar"));
});

test("MainDashboardStrategy.generate: Tablet-Layout (Räume oben, evcc, Kalender nebeneinander, Ticker unten)", async () => {
  const dash = await MainDashboardStrategy.generate({ prefix: "evcc" }, hass);
  assert.equal(dash.title, "Hauptdashboard");
  const view = dash.views[0];
  assert.equal(view.path, "haupt");
  assert.equal(view.max_columns, 4);
  const titles = view.sections.map((s) => s.title);
  assert.deepEqual(titles, ["Räume", "evcc", "Kalender", "Ereignisse"]);

  const rooms = view.sections[0].cards[0];
  assert.equal(rooms.type, "custom:modular-rooms-card");
  assert.equal(rooms.control, true);
  assert.equal(rooms.grid_options.columns, "full");
  assert.equal(rooms.areas, undefined);

  const dashSel = await MainDashboardStrategy.generate({ prefix: "evcc", rooms: ["wohnzimmer", "kueche"] }, hass);
  assert.deepEqual(dashSel.views[0].sections[0].cards[0].areas, ["wohnzimmer", "kueche"]);

  const evccTypes = view.sections[1].cards.map((c) => c.type);
  assert.ok(evccTypes.includes("custom:evcc-overview-card"));
  assert.ok(evccTypes.includes("custom:evcc-loadpoint-card"));
  assert.ok(evccTypes.includes("custom:evcc-vehicle-card"));
  const overview = view.sections[1].cards.find((c) => c.type === "custom:evcc-overview-card");
  assert.equal(overview.grid_options.columns, 12);
  assert.equal(view.sections[1].cards.find((c) => c.type === "custom:evcc-loadpoint-card").grid_options.columns, 12);
  assert.equal(view.sections[1].cards.find((c) => c.type === "custom:evcc-vehicle-card").grid_options.columns, 12);
  assert.equal(view.sections[1].cards.find((c) => c.type === "custom:evcc-energy-card").grid_options.columns, 12);
  assert.equal(view.sections[1].cards.find((c) => c.type === "custom:evcc-loadpoint-card").control, undefined);
  const dashCC = await MainDashboardStrategy.generate({ prefix: "evcc", charge_control: true }, hass);
  const lpCard = dashCC.views[0].sections[1].cards.find((c) => c.type === "custom:evcc-loadpoint-card");
  assert.equal(lpCard.control, true);
  assert.equal(lpCard.entities.loadpoints[0].charge_mode, "select.evcc_loadpoint_1_charge_mode");

  const calCards = view.sections[2].cards;
  assert.equal(calCards.length, 2);
  assert.ok(calCards.every((c) => c.type === "custom:modular-calendar-card" && c.grid_options.columns === 24 && c.view === "list"));
  const dashFull = await MainDashboardStrategy.generate({ prefix: "evcc", calendar_columns: "full" }, hass);
  assert.ok(dashFull.views[0].sections.find((x) => x.title === "Kalender").cards.every((c) => c.grid_options.columns === "full"));
  const dash3 = await MainDashboardStrategy.generate({ prefix: "evcc", calendar_columns: 3 }, hass);
  assert.ok(dash3.views[0].sections.find((x) => x.title === "Kalender").cards.every((c) => c.grid_options.columns === 12));
  const dash6 = await MainDashboardStrategy.generate({ prefix: "evcc", calendar_columns: 6 }, hass);
  assert.ok(dash6.views[0].sections.find((x) => x.title === "Kalender").cards.every((c) => c.grid_options.columns === 24));
  const dash12 = await MainDashboardStrategy.generate({ prefix: "evcc", calendar_columns: 12 }, hass);
  assert.ok(dash12.views[0].sections.find((x) => x.title === "Kalender").cards.every((c) => c.grid_options.columns === 12));
  const dash24 = await MainDashboardStrategy.generate({ prefix: "evcc", calendar_columns: 24 }, hass);
  assert.ok(dash24.views[0].sections.find((x) => x.title === "Kalender").cards.every((c) => c.grid_options.columns === 24));
  const dashOne = await MainDashboardStrategy.generate({ prefix: "evcc", calendars: ["calendar.arbeit"] }, hass);
  assert.ok(dashOne.views[0].sections.find((x) => x.title === "Kalender").cards.every((c) => c.grid_options.columns === "full"));
  assert.deepEqual(calCards[0].entities, ["calendar.familie"]);

  const ticker = view.sections[3].cards[0];
  assert.equal(ticker.type, "custom:modular-ticker-card");
  assert.equal(ticker.grid_options.columns, "full");

  assert.ok(dash.views.some((v) => v.path === "verlauf"));
});

test("MainDashboardStrategy: ticker:false blendet Ticker-Sektion aus, configRequired static gesetzt", async () => {
  assert.equal(MainDashboardStrategy.configRequired, true);
  const dash = await MainDashboardStrategy.generate({ prefix: "evcc", ticker: false, rooms_control: false }, hass);
  const titles = dash.views[0].sections.map((s) => s.title);
  assert.ok(!titles.includes("Ereignisse"));
  assert.equal(dash.views[0].sections[0].cards[0].control, false);
});

test("MainDashboardStrategy: calendars-Konfig wählt die Kalender-Kacheln aus", async () => {
  const dash = await MainDashboardStrategy.generate({ prefix: "evcc", calendars: ["calendar.arbeit"] }, hass);
  const cal = dash.views[0].sections.find((s) => s.title === "Kalender");
  assert.equal(cal.cards.length, 1);
  assert.deepEqual(cal.cards[0].entities, ["calendar.arbeit"]);
  assert.equal(cal.cards[0].title, "Arbeitskalender");
  const def = await MainDashboardStrategy.generate({ prefix: "evcc" }, hass);
  assert.equal(def.views[0].sections.find((s) => s.title === "Kalender").cards.length, 2);
  const bad = await MainDashboardStrategy.generate({ prefix: "evcc", calendars: ["sensor.kein_kalender"] }, hass);
  assert.equal(bad.views[0].sections.find((s) => s.title === "Kalender").cards.length, 2);
});
