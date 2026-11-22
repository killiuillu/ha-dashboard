import { setLang, t } from "../i18n/index.js";
import { detectModules, evccCards } from "./strategy.js";

const StrategyBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {};

const calTitle = (hass, id) => hass?.states?.[id]?.attributes?.friendly_name || id.replace(/^calendar\./, "");

export class MainDashboardStrategy extends StrategyBase {
  static configRequired = true;

  static getConfigElement() {
    return document.createElement("main-strategy-editor");
  }

  static getCreateSuggestions() {
    return { title: t("Hauptdashboard"), icon: "mdi:tablet-dashboard" };
  }

  static async generate(config = {}, hass) {
    setLang(hass);
    const prefix = config.prefix || "evcc";
    const title = config.title || t("Hauptdashboard");
    const det = detectModules(hass, prefix);
    const sections = [];

    sections.push({
      type: "grid",
      column_span: 4,
      title: t("Räume"),
      cards: [
        {
          type: "custom:modular-rooms-card",
          title: t("Räume"),
          control: config.rooms_control !== false,
          ...(Array.isArray(config.rooms) && config.rooms.length ? { areas: config.rooms } : {}),
          grid_options: { columns: "full" },
        },
      ],
    });

    const hasEvcc = Object.values(det.evcc || {}).some((v) => typeof v === "string") || (det.evcc?.loadpoints || []).length;
    if (hasEvcc) {
      const cards = evccCards(det.evcc, config, "evcc").map((c) => ({
        ...c,
        grid_options: { columns: c.type === "custom:evcc-overview-card" ? "full" : 4 },
      }));
      sections.push({ type: "grid", column_span: 4, title: "evcc", cards });
    }

    if (det.calendar.length) {
      const cards = det.calendar.slice(0, 4).map((id) => ({
        type: "custom:modular-calendar-card",
        title: calTitle(hass, id),
        entities: [id],
        view: "list",
        max: 5,
        grid_options: { columns: 3 },
      }));
      sections.push({ type: "grid", column_span: 4, title: t("Kalender"), cards });
    }

    if (config.ticker !== false) {
      sections.push({
        type: "grid",
        column_span: 4,
        title: t("Ereignisse"),
        cards: [{ type: "custom:modular-ticker-card", title: t("Ereignisse"), grid_options: { columns: "full" } }],
      });
    }

    const views = [
      {
        title,
        path: "haupt",
        icon: "mdi:tablet-dashboard",
        type: "sections",
        max_columns: 4,
        sections,
      },
    ];

    const histKeys = ["pv_power", "grid_power", "battery_power", "home_power"];
    const hist = {};
    for (const k of histKeys) if (det.evcc[k]) hist[k] = det.evcc[k];
    if (Object.keys(hist).length) {
      views.push({
        title: t("Verlauf"),
        path: "verlauf",
        icon: "mdi:chart-line",
        type: "sections",
        max_columns: 4,
        sections: [
          {
            type: "grid",
            column_span: 4,
            cards: [{ type: "custom:evcc-history-card", title: t("Tagesverlauf"), entities: hist, grid_options: { columns: "full" } }],
          },
        ],
      });
    }
    return { title, views };
  }
}
