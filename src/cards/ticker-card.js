import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import { tickerItems, tickerCalendarItems } from "../util/ticker.js";
import { dayKey } from "../util/calendar.js";

export class ModularTickerCard extends EvccBaseCard {
  static properties = { ...EvccBaseCard.properties, _help: { state: true }, _items: { state: true } };

  static getStubConfig() {
    return { title: t("Ereignisse") };
  }

  constructor() {
    super();
    this._items = [];
  }

  getCardSize() {
    return 2;
  }

  get _days() {
    const d = Number(this._config?.days);
    return Number.isFinite(d) && d >= 0 ? Math.floor(d) : 2;
  }

  get _cals() {
    const c = this._config?.calendars;
    if (Array.isArray(c) && c.length) return c;
    return Object.keys(this.hass?.states || {}).filter((id) => id.startsWith("calendar."));
  }

  willUpdate(changed) {
    if (!this.hass || !changed.has("hass")) return;
    const now = new Date();
    const key = `${dayKey(now)}|${this._cals.join(",")}|${this._days}`;
    if (key === this.__tickKey) return;
    this.__tickKey = key;
    const base = tickerItems(this.hass, { days: this._days, now });
    tickerCalendarItems(this.hass, this._cals, now).then((cal) => {
      this._items = [...cal, ...base];
    });
  }

  render() {
    const cfg = this._config || {};
    const title = cfg.title || t("Ereignisse");
    const tone = toneVar("warn");
    const items = this._items || [];
    const track = items.length ? [...items, ...items] : [];
    return html`
      <ha-card class="rcard" style="--tone:${tone};--accent:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Laufband mit wichtigen Ereignissen (Termine heute/morgen, Müll bald fällig, erwartete Pakete). Reine Anzeige.")}</div>`
          : nothing}
        ${items.length
          ? html`<div class="ticker"><div class="track">
              ${track.map((i) => html`<span class="tk"><ha-icon icon="${i.icon}"></ha-icon>${i.text}</span><span class="sep">•</span>`)}
            </div></div>`
          : html`<div class="empty">${t("Keine Ereignisse")}</div>`}
      </ha-card>
    `;
  }
}
