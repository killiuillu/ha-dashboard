import { applyTokens } from "./tokens/apply-tokens.js";
import { setLang, t } from "./i18n/index.js";
import { EvccOverviewCard } from "./cards/overview-card.js";
import { EvccLoadpointCard } from "./cards/loadpoint-card.js";
import { EvccHistoryCard } from "./cards/history-card.js";
import { EvccEnergyCard } from "./cards/energy-card.js";
import { EvccDashboardStrategy } from "./cards/strategy.js";
import { EvccStrategyEditor } from "./cards/strategy-editor.js";
import { EvccVehicleCard } from "./cards/vehicle-card.js";

applyTokens();

let storedLang = null;
try {
  storedLang = JSON.parse(globalThis.localStorage?.getItem("selectedLanguage") || "null");
} catch {
  storedLang = null;
}
setLang({ language: storedLang || (typeof navigator !== "undefined" && navigator.language) || "de" });

if (!customElements.get("evcc-overview-card")) customElements.define("evcc-overview-card", EvccOverviewCard);
if (!customElements.get("evcc-loadpoint-card")) customElements.define("evcc-loadpoint-card", EvccLoadpointCard);
if (!customElements.get("evcc-history-card")) customElements.define("evcc-history-card", EvccHistoryCard);
if (!customElements.get("evcc-energy-card")) customElements.define("evcc-energy-card", EvccEnergyCard);
if (!customElements.get("evcc-vehicle-card")) customElements.define("evcc-vehicle-card", EvccVehicleCard);
if (!customElements.get("ll-strategy-dashboard-evcc")) customElements.define("ll-strategy-dashboard-evcc", EvccDashboardStrategy);
if (!customElements.get("evcc-strategy-editor")) customElements.define("evcc-strategy-editor", EvccStrategyEditor);

window.customCards = window.customCards || [];
if (!window.customCards.find((c) => c.type === "custom:evcc-overview-card")) {
  window.customCards.push({
    type: "custom:evcc-overview-card",
    name: t("evcc – Übersicht"),
    description: t("PV, Netz, Haus und Batterie auf einen Blick"),
    preview: true,
  });
}
if (!window.customCards.find((c) => c.type === "custom:evcc-loadpoint-card")) {
  window.customCards.push({
    type: "custom:evcc-loadpoint-card",
    name: t("evcc – Ladepunkt"),
    description: t("Ladeleistung und Fahrzeug-Ladestand eines Ladepunkts"),
    preview: true,
  });
}
if (!window.customCards.find((c) => c.type === "custom:evcc-history-card")) {
  window.customCards.push({
    type: "custom:evcc-history-card",
    name: t("evcc – Tagesverlauf"),
    description: t("PV, Netz und Batterie als Verlaufskurve"),
    preview: true,
  });
}
if (!window.customCards.find((c) => c.type === "custom:evcc-energy-card")) {
  window.customCards.push({
    type: "custom:evcc-energy-card",
    name: t("evcc – Energie & Kosten"),
    description: t("Energie heute und Preise/Kosten aus dem HA-Energy-Dashboard"),
    preview: true,
  });
}
if (!window.customCards.find((c) => c.type === "custom:evcc-vehicle-card")) {
  window.customCards.push({
    type: "custom:evcc-vehicle-card",
    name: t("evcc – Fahrzeug"),
    description: t("Fahrzeugbild mit Ladestand und Reichweite"),
    preview: true,
  });
}

window.customStrategies = window.customStrategies || [];
if (!window.customStrategies.find((x) => x.type === "evcc")) {
  window.customStrategies.push({
    type: "evcc",
    strategyType: "dashboard",
    name: t("evcc Dashboard"),
    description: t("Baut das Dashboard automatisch auf – mit Modul-Auswahl im Dialog"),
    documentationURL: "https://github.com/killiuillu/ha-dashboard",
    configRequired: true,
  });
}

globalThis.evccDashboard = { version: __APP_VERSION__ };

console.info(
  `%c EVCC-DASHBOARD %c ${__APP_VERSION__} `,
  "background:#2ec4a6;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px",
  "background:#ff7a45;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px",
);
