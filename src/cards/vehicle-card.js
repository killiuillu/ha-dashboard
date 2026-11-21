import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import { fmtInt, num } from "../util/format.js";
import { stateOf, unitOf } from "../util/hass.js";
import { loadpointStatus, splitPower, vehicleRange } from "../util/evcc.js";

export class EvccVehicleCard extends EvccBaseCard {
  static properties = { ...EvccBaseCard.properties, _help: { state: true } };

  static getStubConfig() {
    return { title: t("Auto") };
  }

  getCardSize() {
    return 3;
  }

  _stat(label, val, tone) {
    return html`<div class="stat">
      <div class="l">${label}</div>
      <div class="v${tone ? " tone" : ""}" style=${tone ? `--st:${tone}` : nothing}>${val.v}<small>${val.u}</small></div>
    </div>`;
  }

  render() {
    const cfg = this._config || {};
    const em = this.entityMap;
    if (!em.vehicle_soc && !em.charge_power && !em.status && !em.range) {
      return html`<ha-card><div class="err">${t("Keine Entity konfiguriert")}</div></ha-card>`;
    }
    const soc = num(stateOf(this.hass, em.vehicle_soc));
    const cp = num(stateOf(this.hass, em.charge_power));
    const raw = stateOf(this.hass, em.status)?.state;
    const range = vehicleRange(soc, num(stateOf(this.hass, em.range)), cfg.capacity_kwh);
    const st = loadpointStatus(raw, cp);
    const tone = toneVar(st.tone);
    const title = cfg.title || t("Auto");
    const media = cfg.image
      ? html`<img class="carimg" src="${cfg.image}" alt="${title}" />`
      : html`<ha-icon class="caricon" icon="mdi:car-electric"></ha-icon>`;
    return html`
      <ha-card style="--tone:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Zeigt Fahrzeugbild, Ladestand (SoC) und Reichweite. Nur Anzeige – es wird nichts gesteuert.")}</div>`
          : nothing}
        <div class="carwrap">
          ${media}
          <div class="carinfo">
            <div class="now">${soc === null ? "–" : fmtInt(soc)}<small>%</small></div>
            <div class="target">${t("Ladestand")}</div>
            <div class="range">${range === null ? "–" : fmtInt(range)}<small>km</small></div>
            <div class="target">${t("Reichweite")}</div>
          </div>
        </div>
        <div class="chips">
          <span class="chip"><ha-icon icon="${st.icon}"></ha-icon>${st.label}</span>
        </div>
        <div class="stats">
          ${this._stat(t("Reichweite"), { v: range === null ? "–" : fmtInt(range), u: "km" }, toneVar("ok"))}
          ${this._stat(t("Ladeleistung"), splitPower(cp, unitOf(this.hass, em.charge_power)), cp ? tone : "")}
        </div>
      </ha-card>`;
  }
}
