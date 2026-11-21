import { setLang, t } from "../i18n/index.js";

const POWER_KEYS = ["pv_power", "grid_power", "battery_power", "home_power"];
const LIVE_KEYS = [...POWER_KEYS, "battery_soc"];
const TODAY_KEYS = ["pv_today", "grid_import_today", "grid_export_today", "home_today", "price", "feed_in_price"];

export function detectEvcc(states, prefix = "evcc") {
  const find = (suffix) => {
    const exact = `sensor.${prefix}_${suffix}`;
    if (states[exact]) return exact;
    return Object.keys(states).find((id) => id.startsWith("sensor.") && id.includes(prefix) && id.endsWith(`_${suffix}`));
  };
  const out = { prefix };
  for (const k of LIVE_KEYS) out[k] = find(k);
  for (const k of TODAY_KEYS) out[k] = find(k);
  const lps = {};
  const re = new RegExp(`^sensor\\.${prefix}_loadpoint_(\\d+)_(charge_power|vehicle_soc|status|range|vehicle_range)$`);
  for (const id of Object.keys(states)) {
    const m = id.match(re);
    if (!m) continue;
    const [, idx, rawKey] = m;
    const key = rawKey === "vehicle_range" ? "range" : rawKey;
    lps[idx] = lps[idx] || { name: `${t("Ladepunkt")} ${idx}` };
    lps[idx][key] = id;
  }
  out.loadpoints = Object.values(lps).filter((lp) => lp.charge_power);
  return out;
}

const StrategyBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {};

export class EvccDashboardStrategy extends StrategyBase {
  static async generate(config = {}, hass) {
    setLang(hass);
    const prefix = config.prefix || "evcc";
    const det = detectEvcc((hass && hass.states) || {}, prefix);
    const title = config.title || t("evcc Dashboard");

    const overviewEntities = {};
    for (const k of LIVE_KEYS) if (det[k]) overviewEntities[k] = det[k];
    const historyEntities = {};
    for (const k of POWER_KEYS) if (det[k]) historyEntities[k] = det[k];
    const energyEntities = {};
    for (const k of TODAY_KEYS) if (det[k]) energyEntities[k] = det[k];

    const cards = [];
    if (Object.keys(overviewEntities).length) {
      cards.push({ type: "custom:evcc-overview-card", title, entities: overviewEntities, grid_options: { columns: "full" } });
    }
    if (det.loadpoints.length) {
      cards.push({
        type: "custom:evcc-loadpoint-card",
        title: det.loadpoints.length > 1 ? t("Ladepunkte") : t("Ladepunkt"),
        entities: { loadpoints: det.loadpoints },
        grid_options: { columns: "full" },
      });
      const veh = det.loadpoints.find((lp) => lp.vehicle_soc);
      if (veh) {
        cards.push({
          type: "custom:evcc-vehicle-card",
          title: veh.name || t("Auto"),
          image: config.image,
          capacity_kwh: config.capacity_kwh,
          entities: { vehicle_soc: veh.vehicle_soc, range: veh.range, charge_power: veh.charge_power, status: veh.status },
          grid_options: { columns: "full" },
        });
      }
    }
    if (Object.keys(energyEntities).length) {
      cards.push({ type: "custom:evcc-energy-card", title: t("Energie & Kosten"), entities: energyEntities, grid_options: { columns: "full" } });
    }
    if (!cards.length) {
      cards.push({ type: "custom:evcc-overview-card", title, entities: {}, grid_options: { columns: "full" } });
    }

    const views = [
      {
        title: t("Übersicht"),
        path: "uebersicht",
        icon: "mdi:solar-power",
        type: "sections",
        max_columns: 3,
        sections: [{ type: "grid", column_span: 3, cards }],
      },
    ];
    if (Object.keys(historyEntities).length) {
      views.push({
        title: t("Verlauf"),
        path: "verlauf",
        icon: "mdi:chart-line",
        type: "sections",
        max_columns: 3,
        sections: [
          {
            type: "grid",
            column_span: 3,
            cards: [{ type: "custom:evcc-history-card", title: t("Tagesverlauf"), entities: historyEntities, grid_options: { columns: "full" } }],
          },
        ],
      });
    }
    return { title, views };
  }
}
