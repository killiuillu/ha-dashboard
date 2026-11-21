import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import { fmt, fmtInt, num } from "../util/format.js";
import { stateOf, unitOf } from "../util/hass.js";
import { autarkyTone, energyStats } from "../util/evcc.js";

export class EvccEnergyCard extends EvccBaseCard {
  static properties = { ...EvccBaseCard.properties, _help: { state: true } };

  static getStubConfig() {
    return { title: t("Energie & Kosten") };
  }

  getCardSize() {
    return 4;
  }

  _stat(label, v, u, tone) {
    return html`<div class="stat">
      <div class="l">${label}</div>
      <div class="v${tone ? " tone" : ""}" style=${tone ? `--st:${tone}` : nothing}>${v}<small>${u}</small></div>
    </div>`;
  }

  render() {
    const cfg = this._config || {};
    const em = this.entityMap;
    if (!Object.keys(em).length) {
      return html`<ha-card><div class="err">${t("Keine Entity konfiguriert")}</div></ha-card>`;
    }
    const pv = num(stateOf(this.hass, em.pv_today));
    const imp = num(stateOf(this.hass, em.grid_import_today));
    const exp = num(stateOf(this.hass, em.grid_export_today));
    const home = num(stateOf(this.hass, em.home_today));
    const price = num(stateOf(this.hass, em.price));
    const feedin = num(stateOf(this.hass, em.feed_in_price));
    const { autarky, selfc, costs } = energyStats({ pv, imp, exp, home, price, feedin });
    const tone = toneVar(autarkyTone(autarky));
    const title = cfg.title || t("evcc Dashboard");
    const kwh = (v) => (v === null ? "–" : fmt(v, 1));
    return html`
      <ha-card class="rcard" style="--tone:${tone};--accent:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Energie und Kosten heute. Preise über entities.price und entities.feed_in_price, z. B. aus dem HA-Energy-Dashboard. Nur Anzeige – es wird nichts gesteuert.")}</div>`
          : nothing}
        <div class="chips">
          <span class="chip"><ha-icon icon="mdi:home-lightning-bolt"></ha-icon>${autarky === null ? "–" : `${fmtInt(autarky * 100)} %`} ${t("Autarkie")}</span>
        </div>
        <div class="main">
          <div class="now">${autarky === null ? "–" : fmtInt(autarky * 100)}<small>%</small></div>
          <div class="target">${t("Autarkie")} · ${t("Heute")}</div>
        </div>
        <div class="stats">
          ${this._stat(`${t("PV")} · ${t("Heute")}`, kwh(pv), "kWh", toneVar("ok"))}
          ${this._stat(`${t("Bezug")} · ${t("Heute")}`, kwh(imp), "kWh", imp ? toneVar("cold") : "")}
          ${this._stat(`${t("Einspeisung")} · ${t("Heute")}`, kwh(exp), "kWh", exp ? toneVar("ok") : "")}
          ${this._stat(`${t("Hausverbrauch")} · ${t("Heute")}`, kwh(home), "kWh", "")}
          ${selfc === null ? nothing : this._stat(t("Eigenverbrauch"), fmtInt(selfc * 100), "%", toneVar("eco"))}
          ${costs === null ? nothing : this._stat(t("Kosten"), fmt(costs, 2), "€", toneVar(costs <= 0 ? "ok" : "warn"))}
          ${price === null ? nothing : this._stat(t("Strompreis"), fmt(price, 4), unitOf(this.hass, em.price), "")}
        </div>
      </ha-card>`;
  }
}
