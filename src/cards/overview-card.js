import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import { fmtInt, num } from "../util/format.js";
import { stateOf, unitOf } from "../util/hass.js";
import { overviewStatus, splitPower } from "../util/evcc.js";

export class EvccOverviewCard extends EvccBaseCard {
  static properties = { ...EvccBaseCard.properties, _help: { state: true } };

  static getStubConfig() {
    return { title: "evcc" };
  }

  getCardSize() {
    return 4;
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
    if (!Object.keys(em).length) {
      return html`<ha-card><div class="err">${t("Keine Entity konfiguriert")}</div></ha-card>`;
    }
    const pv = num(stateOf(this.hass, em.pv_power));
    const grid = num(stateOf(this.hass, em.grid_power));
    const home = num(stateOf(this.hass, em.home_power));
    const soc = num(stateOf(this.hass, em.battery_soc));
    const bat = num(stateOf(this.hass, em.battery_power));
    const st = overviewStatus(pv, grid, bat);
    const tone = toneVar(st.tone);
    const main = splitPower(grid, unitOf(this.hass, em.grid_power));
    const title = cfg.title || t("evcc Dashboard");
    const pvTone = pv !== null && pv > 0 ? toneVar("ok") : "";
    const batTone = bat !== null && bat !== 0 ? toneVar(bat > 0 ? "heat" : "air") : "";
    return html`
      <ha-card style="--tone:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Zeigt die Live-Leistung von PV, Netz, Haus und Batterie. Nur Anzeige – es wird nichts gesteuert.")}</div>`
          : nothing}
        <div class="chips">
          <span class="chip"><ha-icon icon="${st.icon}"></ha-icon>${st.label}</span>
        </div>
        <div class="main">
          <div class="now">${main.v}<small>${main.u}</small></div>
          <div class="target">${t("Netz")}</div>
        </div>
        <div class="stats">
          ${this._stat(t("PV"), splitPower(pv, unitOf(this.hass, em.pv_power)), pvTone)}
          ${this._stat(t("Hausverbrauch"), splitPower(home, unitOf(this.hass, em.home_power)), "")}
          ${this._stat(t("Ladestand"), { v: soc === null ? "–" : fmtInt(soc), u: "%" }, toneVar("air"))}
          ${this._stat(t("Batterie-Leistung"), splitPower(bat, unitOf(this.hass, em.battery_power)), batTone)}
        </div>
      </ha-card>`;
  }
}
