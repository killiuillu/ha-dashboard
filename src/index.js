import { applyTokens } from "./tokens/apply-tokens.js";
import { setLang, t } from "./i18n/index.js";
import { EvccOverviewCard } from "./cards/overview-card.js";

applyTokens();

let storedLang = null;
try {
  storedLang = JSON.parse(globalThis.localStorage?.getItem("selectedLanguage") || "null");
} catch {
  storedLang = null;
}
setLang({ language: storedLang || (typeof navigator !== "undefined" && navigator.language) || "de" });

if (!customElements.get("evcc-overview-card")) customElements.define("evcc-overview-card", EvccOverviewCard);

window.customCards = window.customCards || [];
if (!window.customCards.find((c) => c.type === "custom:evcc-overview-card")) {
  window.customCards.push({
    type: "custom:evcc-overview-card",
    name: t("evcc – Übersicht"),
    description: t("PV, Netz, Haus und Batterie auf einen Blick"),
    preview: true,
  });
}

globalThis.evccDashboard = { version: __APP_VERSION__ };

console.info(
  `%c EVCC-DASHBOARD %c ${__APP_VERSION__} `,
  "background:#2ec4a6;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px",
  "background:#ff7a45;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px",
);
