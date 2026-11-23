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

  get _areaIds() {
    return Object.keys(this.hass?.areas || {});
  }

  get _roomsSelected() {
    const r = this.config?.rooms;
    return new Set(Array.isArray(r) && r.length ? r : this._areaIds);
  }

  _toggleRoom(id, on) {
    const sel = new Set(this._roomsSelected);
    if (on) sel.add(id);
    else sel.delete(id);
    this._fire({ rooms: this._areaIds.filter((a) => sel.has(a)) });
  }

  get _calIds() {
    return Object.keys(this.hass?.states || {}).filter((id) => id.startsWith("calendar."));
  }

  get _calSelected() {
    const c = this.config?.calendars;
    return new Set(Array.isArray(c) && c.length ? c : this._calIds);
  }

  _toggleCal(id, on) {
    const sel = new Set(this._calSelected);
    if (on) sel.add(id);
    else sel.delete(id);
    this._fire({ calendars: this._calIds.filter((c) => sel.has(c)) });
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
        <label class="fld">
          <span>${t("Kalender-Anordnung")}</span>
          <select @change=${(ev) => this._fire({ calendar_columns: ev.target.value === "full" ? "full" : ev.target.value === "auto" ? undefined : Number(ev.target.value) })}>
            ${["auto", "12", "24", "full"].map((v) => {
              const raw = cfg.calendar_columns;
              const num = Number(raw);
              const cur = raw === "full" || num === 48 ? "full" : num === 3 || num === 12 ? "12" : num === 6 || num === 24 ? "24" : "auto";
              return html`<option value="${v}" ?selected=${cur === v}>${v === "auto" ? t("Automatisch – volle Breite") : v === "12" ? t("4 nebeneinander") : v === "24" ? t("2 nebeneinander") : t("vollbreit untereinander")}</option>`;
            })}
          </select>
        </label>
        <div class="subhead">${t("Kalender auswählen")}</div>
        ${this._calIds.map(
          (id) => html`
            <label class="opt">
              <input type="checkbox" .checked=${this._calSelected.has(id)} @change=${(ev) => this._toggleCal(id, ev.target.checked)} />
              <span class="grow">${this.hass?.states?.[id]?.attributes?.friendly_name || id}</span>
            </label>
          `,
        )}
        <label class="opt">
          <input type="checkbox" .checked=${cfg.ticker !== false} @change=${(ev) => this._fire({ ticker: ev.target.checked ? undefined : false })} />
          <span>${t("Ereignis-Ticker unten anzeigen")}</span>
        </label>
        <label class="opt">
          <input type="checkbox" .checked=${cfg.rooms_control !== false} @change=${(ev) => this._fire({ rooms_control: ev.target.checked ? undefined : false })} />
          <span>${t("Räume steuerbar (Lichter/Klima/Media per Klick)")}</span>
        </label>
        <div class="subhead">${t("Räume anzeigen")}</div>
        ${this._areaIds.map((id) => html`
          <label class="opt">
            <input type="checkbox" .checked=${this._roomsSelected.has(id)} @change=${(ev) => this._toggleRoom(id, ev.target.checked)} />
            <span class="grow">${this.hass?.areas?.[id]?.name || id}</span>
          </label>
        `)}
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
    .fld select {
      flex: 1;
      font: inherit;
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--primary-text-color, #212121) 18%, transparent);
      background: transparent;
      color: var(--primary-text-color, #212121);
    }
    .opt .grow { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .subhead {
      font-size: .78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--secondary-text-color, #727272);
      margin-top: 6px;
    }
  `;
}
