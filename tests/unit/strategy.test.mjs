import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { EvccDashboardStrategy, detectEvcc } from "../../src/cards/strategy.js";

const hass = (states) => ({ states, locale: { language: "de" } });

test("detectEvcc findet Live-/Tages-Entities und Ladepunkte am Präfix", () => {
  const states = {
    "sensor.evcc_pv_power": {},
    "sensor.evcc_grid_power": {},
    "sensor.evcc_home_power": {},
    "sensor.evcc_battery_soc": {},
    "sensor.evcc_battery_power": {},
    "sensor.evcc_pv_today": {},
    "sensor.evcc_grid_import_today": {},
    "sensor.evcc_grid_export_today": {},
    "sensor.evcc_home_today": {},
    "sensor.evcc_price": {},
    "sensor.evcc_loadpoint_1_charge_power": {},
    "sensor.evcc_loadpoint_1_vehicle_soc": {},
    "sensor.evcc_loadpoint_1_status": {},
    "sensor.evcc_loadpoint_2_charge_power": {},
    "sensor.anderer_pv_power": {},
  };
  const det = detectEvcc(states, "evcc");
  assert.equal(det.pv_power, "sensor.evcc_pv_power");
  assert.equal(det.grid_power, "sensor.evcc_grid_power");
  assert.equal(det.price, "sensor.evcc_price");
  assert.equal(det.loadpoints.length, 2);
  assert.equal(det.loadpoints[0].charge_power, "sensor.evcc_loadpoint_1_charge_power");
  assert.equal(det.loadpoints[0].vehicle_soc, "sensor.evcc_loadpoint_1_vehicle_soc");
  assert.equal(det.loadpoints[1].name, "Ladepunkt 2");
});

test("generate baut Übersicht- und Verlaufsansicht aus den Entities", async () => {
  setLang({ language: "de" });
  const states = {
    "sensor.evcc_pv_power": {},
    "sensor.evcc_grid_power": {},
    "sensor.evcc_home_power": {},
    "sensor.evcc_battery_soc": {},
    "sensor.evcc_pv_today": {},
    "sensor.evcc_grid_import_today": {},
    "sensor.evcc_price": {},
    "sensor.evcc_loadpoint_1_charge_power": {},
  };
  const dash = await EvccDashboardStrategy.generate({ prefix: "evcc" }, hass(states));
  assert.equal(dash.title, "Modulares Dashboard");
  assert.equal(dash.views.length, 2);
  assert.equal(dash.views[0].path, "uebersicht");
  const types = dash.views[0].sections[0].cards.map((c) => c.type);
  assert.deepEqual(types, ["custom:evcc-overview-card", "custom:evcc-loadpoint-card", "custom:evcc-energy-card"]);
  const ov = dash.views[0].sections[0].cards[0];
  assert.equal(ov.entities.pv_power, "sensor.evcc_pv_power");
  assert.equal(ov.entities.battery_soc, "sensor.evcc_battery_soc");
  const lp = dash.views[0].sections[0].cards[1];
  assert.equal(lp.entities.loadpoints.length, 1);
  assert.equal(dash.views[1].sections[0].cards[0].type, "custom:evcc-history-card");
  assert.ok(dash.views[0].sections[0].cards.every((c) => c.grid_options.columns === 12));
  assert.equal(lp.control, undefined);
  const dashCC = await EvccDashboardStrategy.generate({ prefix: "evcc", charge_control: true }, hass(states));
  const lpCC = dashCC.views[0].sections[0].cards.find((c) => c.type === "custom:evcc-loadpoint-card");
  assert.equal(lpCC.control, true);
});

test("generate ohne evcc-Entities liefert eine leere Übersicht mit Hinweis-Karte", async () => {
  setLang({ language: "de" });
  const dash = await EvccDashboardStrategy.generate({}, hass({ "sensor.unrelated": {} }));
  assert.equal(dash.views.length, 1);
  const cards = dash.views[0].sections[0].cards;
  assert.equal(cards[0].type, "custom:evcc-overview-card");
  assert.deepEqual(cards[0].entities, {});
});

test("generate respektiert konfigurierbaren Titel und Präfix", async () => {
  setLang({ language: "de" });
  const states = { "sensor.wallbox_pv_power": {} };
  const dash = await EvccDashboardStrategy.generate({ prefix: "wallbox", title: "Meine Wallbox" }, hass(states));
  assert.equal(dash.title, "Meine Wallbox");
  assert.equal(dash.views[0].sections[0].cards[0].entities.pv_power, "sensor.wallbox_pv_power");
});

test("generate: config.image landet auf der Fahrzeug-Karte (Auto-Bild)", async () => {
  setLang({ language: "de" });
  const states = {
    "sensor.evcc_pv_power": {},
    "sensor.evcc_loadpoint_1_charge_power": {},
    "sensor.evcc_loadpoint_1_vehicle_soc": {},
  };
  const dash = await EvccDashboardStrategy.generate({ prefix: "evcc", image: "/local/evcc/auto.png" }, hass(states));
  const veh = dash.views[0].sections[0].cards.find((c) => c.type === "custom:evcc-vehicle-card");
  assert.ok(veh);
  assert.equal(veh.image, "/local/evcc/auto.png");
  assert.equal(veh.entities.vehicle_soc, "sensor.evcc_loadpoint_1_vehicle_soc");
});

test("Strategie-Klasse hat static configRequired = true (HA zeigt den Editor vor dem Anlegen, ab HA 2026.5)", () => {
  assert.equal(EvccDashboardStrategy.configRequired, true);
  assert.equal(typeof EvccDashboardStrategy.getConfigElement, "function");
  assert.equal(typeof EvccDashboardStrategy.getCreateSuggestions, "function");
});
