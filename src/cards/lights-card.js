import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import { parseLightEntities, lightEntries } from "../util/lights.js";
import { fmtInt } from "../util/format.js";

export class ModularLightsCard extends EvccBaseCard {
  static properties = { ...EvccBaseCard.properties, _help: { state: true } };

  static getStubConfig() {
    return { title: t("Lichter"), entities: ["light.wohnzimmer"] };
  }

  getCardSize() {
    return 3;
  }

  render() {
    const cfg = this._config || {};
    const items = parseLightEntities(cfg.entities ?? cfg);
    const title = cfg.title || t("Lichter");
    const tone = toneVar("eco");
    if (!items.length) {
      return html`<ha-card><div class="err">${t("Keine Entity konfiguriert")}</div></ha-card>`;
    }
    const lights = lightEntries(this.hass, items);
    return html`
      <ha-card class="rcard" style="--tone:${tone};--accent:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Zeigt die gewählten Lichter mit Status und Helligkeit im Raumklima-Stil (an = warm, aus = grau). Nur Anzeige – es wird nichts geschaltet.")}</div>`
          : nothing}
        ${lights.length
          ? html`
              <div class="llist">
                ${lights.map((l) => {
                  const c = l.color || (l.on ? toneVar("warn") : toneVar("off"));
                  return html`
                    <div class="lrow${l.on ? " on" : ""}" style="--lc:${c}">
                      <ha-icon class="licon" icon="${l.icon}"></ha-icon>
                      <div class="linfo">
                        <div class="lname">${l.name}</div>
                        ${l.on && l.brightness !== null
                          ? html`<div class="lbar"><i style="width:${l.brightness}%"></i></div>`
                          : nothing}
                      </div>
                      <span class="chip" style="--tone:${c}">${l.available ? (l.on ? t("An") : t("Aus")) : t("Nicht erreichbar")}</span>
                      ${l.on && l.brightness !== null ? html`<span class="lpct">${fmtInt(l.brightness)} %</span>` : nothing}
                    </div>
                  `;
                })}
              </div>
            `
          : html`<div class="empty">${t("Keine Lichter konfiguriert")}</div>`}
      </ha-card>
    `;
  }
}
