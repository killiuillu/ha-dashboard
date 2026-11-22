import { html, nothing } from "lit";
import { EvccBaseCard } from "./base-card.js";
import { t } from "../i18n/index.js";
import { toneVar } from "../tokens/apply-tokens.js";
import {
  parseCalendarEntities,
  calName,
  fetchCalendarEvents,
  sortEvents,
  eventsByDay,
  monthGrid,
  dayKey,
  fmtEventTime,
  fmtDateLong,
  fmtMonthYear,
  fmtWeekdayShort,
} from "../util/calendar.js";

const WEEKDAY_BASE = 6; // 2026-01-05 ist ein Montag

export class ModularCalendarCard extends EvccBaseCard {
  static properties = {
    ...EvccBaseCard.properties,
    _help: { state: true },
    _events: { state: true },
    _month: { state: true },
    _selDay: { state: true },
  };

  static getStubConfig() {
    return { title: t("Kalender"), entities: ["calendar.familie"], view: "list" };
  }

  constructor() {
    super();
    this._events = [];
    const now = new Date();
    this._month = { y: now.getFullYear(), m: now.getMonth() };
    this._selDay = dayKey(now);
  }

  getCardSize() {
    return 4;
  }

  get _cals() {
    return parseCalendarEntities(this._config?.entities ?? this._config);
  }

  get _view() {
    return this._config?.view === "calendar" ? "calendar" : "list";
  }

  get _days() {
    const d = Number(this._config?.days);
    return Number.isFinite(d) && d > 0 && d <= 90 ? Math.floor(d) : 14;
  }

  entityIds() {
    return this._cals.map((c) => c.entity);
  }

  willUpdate(changed) {
    if (!this.hass) return;
    if (!changed.has("hass") && !changed.has("_month")) return;
    const now = new Date();
    let start;
    let end;
    if (this._view === "calendar") {
      const grid = monthGrid(this._month.y, this._month.m);
      start = grid[0][0].date;
      end = new Date(grid[5][6].date.getFullYear(), grid[5][6].date.getMonth(), grid[5][6].date.getDate() + 1);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start.getTime() + this._days * 86400000);
    }
    const key = `${this._view}|${this._month.y}-${this._month.m}|${dayKey(now)}|${this._cals.map((c) => c.entity).join(",")}|${this._days}`;
    if (key === this.__calKey) return;
    this.__calKey = key;
    fetchCalendarEvents(this.hass, this._cals, start, end).then((ev) => {
      this._events = ev;
    });
  }

  _evRow(ev, cal) {
    return html`
      <div class="evrow">
        <div class="evdate" style="--c:${ev.color}">
          <b>${ev.start ? ev.start.getDate() : "–"}</b>
          <span>${ev.start ? fmtWeekdayShort(ev.start) : ""}</span>
        </div>
        <div class="evmain">
          <div class="evsum">${ev.summary}</div>
          <div class="evtime">${fmtEventTime(ev)} · ${calName(this.hass, cal)}</div>
        </div>
        <i class="evdot" style="--c:${ev.color}"></i>
      </div>
    `;
  }

  _renderList() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const events = sortEvents(this._events).filter((ev) => !ev.end || ev.end >= today);
    return html`
      ${events.length
        ? html`<div class="evlist">${events.map((ev) => this._evRow(ev, this._cals.find((c) => c.entity === ev.calendar)))}</div>`
        : html`<div class="empty">${t("Keine Termine in den nächsten {n} Tagen", { n: this._days })}</div>`}
    `;
  }

  _renderMonth() {
    const { y, m } = this._month;
    const weeks = monthGrid(y, m);
    const byDay = eventsByDay(this._events);
    const todayK = dayKey(new Date());
    const selEvents = byDay[this._selDay] || [];
    const wd = Array.from({ length: 7 }, (_, i) => fmtWeekdayShort(new Date(2026, 0, WEEKDAY_BASE + i)));
    return html`
      <div class="calhead">
        <button class="calnav" title="◀" aria-label="◀" @click=${() => this._shiftMonth(-1)}>◀</button>
        <div class="m">${fmtMonthYear(y, m)}</div>
        <button class="calnav" title="▶" aria-label="▶" @click=${() => this._shiftMonth(1)}>▶</button>
        <button class="calnav" title=${t("Heute")} @click=${() => this._today()}>•</button>
      </div>
      <div class="calgrid">
        ${wd.map((w) => html`<div class="wd">${w}</div>`)}
        ${weeks.flat().map((cell) => {
          const k = dayKey(cell.date);
          const evs = byDay[k] || [];
          const dots = evs.slice(0, 3);
          return html`
            <button
              class="calcell${cell.inMonth ? "" : " out"}${k === todayK ? " today" : ""}${k === this._selDay ? " sel" : ""}"
              @click=${() => (this._selDay = k)}
            >
              ${cell.date.getDate()}
              <span class="dots">
                ${dots.map((e) => html`<i style="--c:${e.color}"></i>`)}
                ${evs.length > 3 ? html`<em>+${evs.length - 3}</em>` : nothing}
              </span>
            </button>
          `;
        })}
      </div>
      <div class="evlist" style="margin-top:10px">
        <div class="evday">${this._selDay ? fmtDateLong(new Date(this._selDay + "T00:00:00")) : ""}</div>
        ${selEvents.length
          ? selEvents.map((ev) => this._evRow(ev, this._cals.find((c) => c.entity === ev.calendar)))
          : html`<div class="empty" style="padding:12px 0">${t("Keine Termine an diesem Tag")}</div>`}
      </div>
    `;
  }

  _shiftMonth(d) {
    const dt = new Date(this._month.y, this._month.m + d, 1);
    this._month = { y: dt.getFullYear(), m: dt.getMonth() };
    this._selDay = dayKey(new Date(this._month.y, this._month.m, 1));
  }

  _today() {
    const now = new Date();
    this._month = { y: now.getFullYear(), m: now.getMonth() };
    this._selDay = dayKey(now);
  }

  render() {
    const cfg = this._config || {};
    const cals = this._cals;
    const title = cfg.title || t("Kalender");
    const tone = toneVar("air");
    if (!cals.length) {
      return html`<ha-card><div class="err">${t("Keine Entity konfiguriert")}</div></ha-card>`;
    }
    return html`
      <ha-card class="rcard" style="--tone:${tone};--accent:${tone}">
        <div class="top">
          <div class="name">${title}</div>
          <button class="qm" style="--g:${tone}" title="?" aria-label="?" @click=${() => (this._help = !this._help)}>?</button>
        </div>
        ${this._help
          ? html`<div class="helpbox" style="--g:${tone}">${t("Zeigt die Termine der gewählten Kalender als Liste oder Monatsansicht. Daten read-only über die HA-Kalender-API. Nur Anzeige – es wird nichts gesteuert.")}</div>`
          : nothing}
        <div class="calleg">
          ${cals.map((c) => html`<span><i style="--c:${c.color}"></i>${calName(this.hass, c)}</span>`)}
        </div>
        ${this._view === "calendar" ? this._renderMonth() : this._renderList()}
      </ha-card>
    `;
  }
}
