import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import { parseWasteEntities, wasteEntries, daysLabel, fmtWasteDate } from "../util/waste.js";

export class ModularWasteCard extends EvccBaseCard {
  static properties = { ...EvccBaseCard.properties, _help: { state: true } };

  static getStubConfig() {
    return { title: t("Mülltonnen"), entities: ["sensor.waste_collection_schedule_restmuell"] };
  }

  getCardSize() {
    return 3;
  }

  render() {
    const cfg = this._config || {};
    const items = parseWasteEntities(cfg.entities ?? cfg);
    const title = cfg.title || t("Mülltonnen");
    const tone = toneVar("ok");
    if (!items.length) {
      return html`<ha-card><div class="err">${t("Keine Entity konfiguriert")}</div></ha-card>`;
    }
    const entries = wasteEntries(this.hass, items);
    return html`
      <ha-card class="rcard" style="--tone:${tone};--accent:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Zeigt die nächsten Abholungen der gewählten Tonnen. Die große Zahl ist die Anzahl der Tage bis zur nächsten Abholung, der hervorgehobene Eintrag ist der nächste Termin. Nur Anzeige – es wird nichts gesteuert.")}</div>`
          : nothing}
        ${entries.length
          ? html`
              <div class="wlist">
                ${entries.map(
                  (e) => html`
                    <div class="wrow${e.isNext ? " wnext" : ""}" style=${e.color ? `--wc:${e.color}` : nothing}>
                      ${e.isNext ? html`<span class="chip wchip">${t("als Nächstes")}</span>` : nothing}
                      <ha-icon class="wicon" icon="${e.icon}"></ha-icon>
                      <div class="winfo">
                        <div class="wname">${e.name}</div>
                        <div class="wdate">${e.nextDate ? fmtWasteDate(e.nextDate) : "–"}</div>
                      </div>
                      <div class="wnum">
                        <b>${e.days === null ? "–" : e.days}</b><span>${t("Tage")}</span>
                        <em>${daysLabel(e.days)}</em>
                      </div>
                    </div>
                  `,
                )}
              </div>
              <div class="wnote">${t("Die Zahl ist die Anzahl der Tage bis zur nächsten Abholung – der erste Eintrag ist der nächste Termin.")}</div>
            `
          : html`<div class="empty">${t("Keine Abholungen gefunden")}</div>`}
      </ha-card>
    `;
  }
}
