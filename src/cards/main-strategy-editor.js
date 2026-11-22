import { LitElement, css, html } from "lit";
import { t } from "../i18n/index.js";

export class MainStrategyEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    config: { attribute: false },
  };

  setConfig(config) {
    this.config = config || {};
  }

  _fire(patch) {
    const config = { ...this.config, ...patch };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  render() {
    const cfg = this.config || {};
    return html`
      <div class="ed">
        <div class="hint">${t("Hauptdashboard für Tablet: Räume oben, evcc in der Mitte, Kalender nebeneinander, Ereignis-Ticker unten.")}</div>
        <label class="fld">
          <span>${t("Titel")}</span>
          <input type="text" .value=${cfg.title || ""} placeholder="Hauptdashboard" @input=${(ev) => this._fire({ title: ev.target.value || undefined })} />
        </label>
        <label class="fld">
          <span>${t("Entity-Präfix")}</span>
          <input type="text" .value=${cfg.prefix || ""} placeholder="evcc" @input=${(ev) => this._fire({ prefix: ev.target.value || undefined })} />
        </label>
        <label class="fld">
          <span>${t("Auto-Bild (Pfad)")}</span>
          <input type="text" .value=${cfg.image || ""} placeholder="/local/evcc/auto.png" @input=${(ev) => this._fire({ image: ev.target.value || undefined })} />
        </label>
        <label class="opt">
          <input type="checkbox" .checked=${cfg.ticker !== false} @change=${(ev) => this._fire({ ticker: ev.target.checked ? undefined : false })} />
          <span>${t("Ereignis-Ticker unten anzeigen")}</span>
        </label>
        <label class="opt">
          <input type="checkbox" .checked=${cfg.rooms_control !== false} @change=${(ev) => this._fire({ rooms_control: ev.target.checked ? undefined : false })} />
          <span>${t("Räume steuerbar (Lichter/Klima/Media per Klick)")}</span>
        </label>
      </div>
    `;
  }

  static styles = css`
    .ed { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
    .hint { font-size: .9rem; color: var(--secondary-text-color, #727272); }
    .fld { display: flex; align-items: center; gap: 10px; font-size: .9rem; }
    .fld span { width: 130px; color: var(--secondary-text-color, #727272); }
    .fld input {
      flex: 1;
      font: inherit;
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--primary-text-color, #212121) 18%, transparent);
      background: transparent;
      color: var(--primary-text-color, #212121);
    }
    .opt { display: flex; align-items: center; gap: 8px; font-size: .9rem; padding: 4px 6px; border-radius: 8px; cursor: pointer; }
  `;
}
