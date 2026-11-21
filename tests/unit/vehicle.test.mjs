import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { vehicleRange } from "../../src/util/evcc.js";
import { EvccDashboardStrategy, detectEvcc } from "../../src/cards/strategy.js";

setLang({ language: "de" });

test("vehicleRange: Entity-Wert hat Vorrang, sonst SoC × Kapazität", () => {
  assert.equal(vehicleRange(54, 231, 60), 231);
  assert.equal(vehicleRange(50, null, 60), 30);
  assert.equal(vehicleRange(50, null, undefined), null);
  assert.equal(vehicleRange(null, null, 60), null);
});

test("detectEvcc mappt vehicle_range auf range am Ladepunkt", () => {
  const det = detectEvcc(
    {
      "sensor.evcc_loadpoint_1_charge_power": {},
      "sensor.evcc_loadpoint_1_vehicle_soc": {},
      "sensor.evcc_loadpoint_1_vehicle_range": {},
    },
    "evcc",
  );
  assert.equal(det.loadpoints[0].range, "sensor.evcc_loadpoint_1_vehicle_range");
});

test("generate fügt Fahrzeug-Karte hinzu, wenn ein Ladepunkt vehicle_soc hat", async () => {
  const states = {
    "sensor.evcc_pv_power": {},
    "sensor.evcc_loadpoint_1_charge_power": {},
    "sensor.evcc_loadpoint_1_vehicle_soc": {},
    "sensor.evcc_loadpoint_1_vehicle_range": {},
  };
  const dash = await EvccDashboardStrategy.generate({ prefix: "evcc", image: "/local/auto.png", capacity_kwh: 60 }, { states, locale: { language: "de" } });
  const types = dash.views[0].sections[0].cards.map((c) => c.type);
  assert.deepEqual(types, ["custom:evcc-overview-card", "custom:evcc-loadpoint-card", "custom:evcc-vehicle-card"]);
  const veh = dash.views[0].sections[0].cards[2];
  assert.equal(veh.entities.vehicle_soc, "sensor.evcc_loadpoint_1_vehicle_soc");
  assert.equal(veh.entities.range, "sensor.evcc_loadpoint_1_vehicle_range");
  assert.equal(veh.image, "/local/auto.png");
  assert.equal(veh.capacity_kwh, 60);
});
