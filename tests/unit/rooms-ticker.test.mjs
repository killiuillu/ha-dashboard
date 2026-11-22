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

test("tickerItems: Müll <= Schwelle + Pakete, unavailable raus", () => {
  const now = new Date();
  const items = tickerItems(hass, { days: 2, now });
  const texts = items.map((i) => i.text).join(" | ");
  assert.ok(texts.includes("Papier: Heute"));
  assert.ok(texts.includes("Biotonne: Morgen"));
  assert.ok(texts.includes("Restmüll: in 2 Tagen"));
  assert.ok(!texts.includes("Gelbe Tonne"));
  assert.ok(texts.includes("DHL Paket"));
  assert.ok(texts.includes("unterwegs"));
  assert.deepEqual(packageSensors(hass), ["sensor.dhl_paket_1"]);
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

  const evccTypes = view.sections[1].cards.map((c) => c.type);
  assert.ok(evccTypes.includes("custom:evcc-overview-card"));
  assert.ok(evccTypes.includes("custom:evcc-loadpoint-card"));
  assert.ok(evccTypes.includes("custom:evcc-vehicle-card"));
  const overview = view.sections[1].cards.find((c) => c.type === "custom:evcc-overview-card");
  assert.equal(overview.grid_options.columns, "full");

  const calCards = view.sections[2].cards;
  assert.equal(calCards.length, 2);
  assert.ok(calCards.every((c) => c.type === "custom:modular-calendar-card" && c.grid_options.columns === 3 && c.view === "list"));
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
