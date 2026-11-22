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

export const MODULES = ["evcc", "raumklima", "hue", "calendar", "muell"];

const MODULE_ALIASES = {
  evcc: "evcc",
  raumklima: "raumklima",
  hue: "hue",
  licht: "hue",
  lichter: "hue",
  lights: "hue",
  kalender: "calendar",
  calendar: "calendar",
  müll: "muell",
  mülltonnen: "muell",
  muell: "muell",
  waste: "muell",
};

export function normalizeModules(list) {
  if (!Array.isArray(list) || !list.length) return MODULES.slice();
  const out = [];
  for (const m of list) {
    const k = MODULE_ALIASES[String(m).toLowerCase()];
    if (k && !out.includes(k)) out.push(k);
  }
  return out.length ? out : MODULES.slice();
}

export function detectModules(hass, prefix = "evcc") {
  const states = (hass && hass.states) || {};
  const entities = (hass && hass.entities) || {};
  const det = { evcc: detectEvcc(states, prefix) };
  det.raumklima = Object.values(entities)
    .filter((e) => e.platform === "raumklima" && e.entity_id.startsWith("climate."))
    .map((e) => e.entity_id);
  const lights = Object.values(entities)
    .filter((e) => e.entity_id.startsWith("light."))
    .map((e) => e.entity_id);
  const hueOnly = Object.values(entities)
    .filter((e) => e.entity_id.startsWith("light.") && e.platform === "hue")
    .map((e) => e.entity_id);
  det.hue = (hueOnly.length ? hueOnly : lights).slice(0, 12);
  det.calendar = Object.keys(states).filter((id) => id.startsWith("calendar.")).slice(0, 5);
  det.muell = Object.values(entities)
    .filter((e) => e.platform === "waste_collection_schedule" || /waste|muell|tonne/i.test(e.entity_id))
    .map((e) => e.entity_id)
    .slice(0, 10);
  return det;
}

function evccCards(evcc, config, title) {
  const overviewEntities = {};
  for (const k of LIVE_KEYS) if (evcc[k]) overviewEntities[k] = evcc[k];
  const cards = [];
  if (Object.keys(overviewEntities).length) {
    cards.push({ type: "custom:evcc-overview-card", title, entities: overviewEntities, grid_options: { columns: "full" } });
  }
  if (evcc.loadpoints.length) {
    cards.push({
      type: "custom:evcc-loadpoint-card",
      title: evcc.loadpoints.length > 1 ? t("Ladepunkte") : t("Ladepunkt"),
      entities: { loadpoints: evcc.loadpoints },
      grid_options: { columns: "full" },
    });
    const veh = evcc.loadpoints.find((lp) => lp.vehicle_soc);
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
  const energyEntities = {};
  for (const k of TODAY_KEYS) if (evcc[k]) energyEntities[k] = evcc[k];
  if (Object.keys(energyEntities).length) {
    cards.push({ type: "custom:evcc-energy-card", title: t("Energie & Kosten"), entities: energyEntities, grid_options: { columns: "full" } });
  }
  return cards;
}

function evccHistoryEntities(evcc) {
  const out = {};
  for (const k of POWER_KEYS) if (evcc[k]) out[k] = evcc[k];
  return out;
}

const StrategyBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {};

export class EvccDashboardStrategy extends StrategyBase {
  static async generate(config = {}, hass) {
    setLang(hass);
    const prefix = config.prefix || "evcc";
    const title = config.title || t("evcc Dashboard");
    const det = detectModules(hass, prefix);
    const modules = normalizeModules(config.modules);
    const sections = [];

    if (modules.includes("evcc")) {
      const cards = evccCards(det.evcc, config, title);
      if (cards.length) sections.push({ type: "grid", column_span: 3, title: "evcc", cards });
    }
    if (modules.includes("raumklima") && det.raumklima.length) {
      const hasRk = typeof customElements !== "undefined" && !!customElements.get("raumklima-card");
      const cards = hasRk
        ? [
            { type: "custom:raumklima-overview-card", title: t("Raumklima"), grid_options: { columns: "full" } },
            ...det.raumklima.slice(0, 8).map((id) => ({ type: "custom:raumklima-card", entity: id, grid_options: { columns: "full" } })),
          ]
        : [{ type: "entities", title: t("Raumklima"), entities: det.raumklima }];
      sections.push({ type: "grid", column_span: 3, title: t("Raumklima"), cards });
    }
    if (modules.includes("hue") && det.hue.length) {
      sections.push({
        type: "grid",
        column_span: 3,
        title: t("Lichter"),
        cards: [{ type: "entities", title: t("Lichter"), entities: det.hue }],
      });
    }
    if (modules.includes("calendar") && det.calendar.length) {
      sections.push({
        type: "grid",
        column_span: 3,
        title: t("Kalender"),
        cards: [{ type: "calendar", title: t("Kalender"), entities: det.calendar, grid_options: { columns: "full" } }],
      });
    }
    if (modules.includes("muell") && det.muell.length) {
      sections.push({
        type: "grid",
        column_span: 3,
        title: t("Müllabfuhr"),
        cards: [{ type: "entities", title: t("Müllabfuhr"), entities: det.muell }],
      });
    }
    if (!sections.length) {
      sections.push({ type: "grid", column_span: 3, cards: [{ type: "custom:evcc-overview-card", title, entities: {}, grid_options: { columns: "full" } }] });
    }

    const views = [
      {
        title: t("Übersicht"),
        path: "uebersicht",
        icon: "mdi:view-dashboard",
        type: "sections",
        max_columns: 3,
        sections,
      },
    ];
    const historyEntities = modules.includes("evcc") ? evccHistoryEntities(det.evcc) : {};
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
