import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import { fmtInt, num } from "../util/format.js";
import { stateOf, unitOf } from "../util/hass.js";
import { DIAL_ARC, knobPos, loadpointStatus, normalizeLoadpoints, splitPower } from "../util/evcc.js";

export class EvccLoadpointCard extends EvccBaseCard {
  static properties = { ...EvccBaseCard.properties, _help: { state: true } };

  static getStubConfig() {
    return { title: t("Ladepunkt") };
  }

  getCardSize() {
    return 4;
  }

  _renderLp(lp) {
    const cp = num(stateOf(this.hass, lp.charge_power));
    const soc = num(stateOf(this.hass, lp.vehicle_soc));
    const raw = stateOf(this.hass, lp.status)?.state;
    const st = loadpointStatus(raw, cp);
    const tone = toneVar(st.tone);
    const main = splitPower(cp, unitOf(this.hass, lp.charge_power));
    const pct = soc === null ? null : Math.max(0, Math.min(100, soc));
    const knob = pct === null ? nothing : html`<circle class="knob" cx="${knobPos(pct).x}" cy="${knobPos(pct).y}" r="4.5" />`;
    return html`
      <div class="lp" style="--tone:${tone}">
        <div class="top">
          <div class="name" style="font-size:1.05rem">${lp.name || t("Ladepunkt")}</div>
          <span class="chip compact"><ha-icon icon="${st.icon}"></ha-icon>${st.label}</span>
        </div>
        <div class="dial">
          <svg viewBox="0 0 100 100">
            <path class="track" d="${DIAL_ARC}" pathLength="100" fill="none" stroke-width="8" stroke-linecap="round" />
            <path
              class="fill${pct === null ? " muted" : ""}"
              d="${DIAL_ARC}"
              pathLength="100"
              stroke-dasharray="${pct === null ? 0 : pct} 100"
              fill="none"
              stroke-width="8"
              stroke-linecap="round"
            />
            ${knob}
          </svg>
          <div class="center">
            <div class="now">${main.v}<small>${main.u}</small></div>
            <div class="target">${pct === null ? st.label : html`${t("Ladestand")} <b>${fmtInt(soc)} %</b>`}</div>
          </div>
        </div>
      </div>`;
  }

  render() {
    const cfg = this._config || {};
    const lps = normalizeLoadpoints(cfg);
    if (!lps.length) {
      return html`<ha-card><div class="err">${t("Keine Entity konfiguriert")}</div></ha-card>`;
    }
    const title = cfg.title || t("evcc Dashboard");
    const first = loadpointStatus(
      stateOf(this.hass, lps[0].status)?.state,
      num(stateOf(this.hass, lps[0].charge_power)),
    );
    const tone = toneVar(first.tone);
    return html`
      <ha-card style="--tone:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Zeigt Ladeleistung und Fahrzeug-Ladestand am Ladepunkt. Nur Anzeige – es wird nichts gesteuert.")}</div>`
          : nothing}
        <div class="lps">${lps.map((lp) => this._renderLp(lp))}</div>
      </ha-card>`;
  }
}
