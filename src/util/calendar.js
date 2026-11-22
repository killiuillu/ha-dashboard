import { t, loc } from "../i18n/index.js";

export const CALENDAR_COLORS = ["#4f9dff", "#ff7a45", "#2ec4a6", "#8b7cf6", "#ffb020", "#ff4d6d", "#4fd1c5", "#f687b3"];

export function parseCalendarEntities(cfg) {
  let raw = cfg;
  if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) raw = cfg.entities ?? cfg.calendars;
  if (!Array.isArray(raw)) raw = raw == null ? [] : [raw];
  const out = [];
  for (const item of raw) {
    if (typeof item === "string" && item) {
      out.push({ entity: item, name: null, color: CALENDAR_COLORS[out.length % CALENDAR_COLORS.length] });
    } else if (item && typeof item === "object" && item.entity) {
      out.push({
        entity: item.entity,
        name: item.name || null,
        color: item.color || CALENDAR_COLORS[out.length % CALENDAR_COLORS.length],
      });
    }
  }
  return out;
}

export const calName = (hass, cal) =>
  cal.name || hass?.states?.[cal.entity]?.attributes?.friendly_name || cal.entity.replace(/^calendar\./, "");

const toDate = (v) => {
  if (!v) return null;
  if (typeof v === "object") {
    if (v.dateTime) return toDate(v.dateTime);
    if (v.date) return toDate(v.date + "T00:00:00");
    return null;
  }
  const d = new Date(v);
  return isNaN(d) ? null : d;
};

export function normalizeEvent(cal, ev) {
  const start = toDate(ev.start);
  const end = toDate(ev.end) || start;
  return {
    summary: ev.summary || "",
    description: ev.description || "",
    start,
    end,
    allDay: !!(ev.start && typeof ev.start === "object" && ev.start.date && !ev.start.dateTime),
    calendar: cal.entity,
    color: cal.color,
  };
}

export const sortEvents = (events) =>
  events.slice().sort((a, b) => (a.start?.getTime?.() ?? 0) - (b.start?.getTime?.() ?? 0) || String(a.summary).localeCompare(String(b.summary)));

export async function fetchCalendarEvents(hass, calendars, start, end) {
  const out = [];
  for (const cal of calendars) {
    let events = [];
    try {
      if (typeof hass?.callApi === "function") {
        const path = `calendars/${cal.entity}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
        const res = await hass.callApi("GET", path);
        events = Array.isArray(res) ? res : [];
      } else if (typeof hass?.callWS === "function") {
        const res = await hass.callWS({
          type: "calendar/event/list",
          start: start.toISOString(),
          end: end.toISOString(),
          calendar_ids: [cal.entity],
        });
        events = Array.isArray(res) ? res : [];
      }
    } catch {
      events = [];
    }
    for (const ev of events) {
      const n = normalizeEvent(cal, ev);
      if (n.start) out.push(n);
    }
  }
  return sortEvents(out);
}

export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function eventsByDay(events) {
  const map = {};
  for (const ev of events) {
    if (!ev.start) continue;
    const d = new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate());
    let end = ev.end ? new Date(ev.end.getFullYear(), ev.end.getMonth(), ev.end.getDate()) : d;
    if (ev.allDay && ev.end) end = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
    while (d <= end) {
      const k = dayKey(d);
      (map[k] = map[k] || []).push(ev);
      d.setDate(d.getDate() + 1);
    }
  }
  for (const k of Object.keys(map)) map[k] = sortEvents(map[k]);
  return map;
}

export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - ((first.getDay() + 6) % 7));
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push({ date: new Date(start), inMonth: start.getMonth() === month });
      start.setDate(start.getDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

export const fmtWeekdayShort = (d) => d.toLocaleDateString(loc(), { weekday: "short" });
export const fmtDateShort = (d) => d.toLocaleDateString(loc(), { day: "2-digit", month: "2-digit" });
export const fmtDateLong = (d) => d.toLocaleDateString(loc(), { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
export const fmtMonthYear = (y, m) => new Date(y, m, 1).toLocaleDateString(loc(), { month: "long", year: "numeric" });
export const fmtTime = (d) => d.toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" });

export function fmtEventTime(ev) {
  if (ev.allDay) return t("ganztägig");
  if (!ev.start) return "–";
  const sameDay = ev.end && dayKey(ev.start) === dayKey(ev.end);
  return sameDay
    ? `${fmtTime(ev.start)}–${fmtTime(ev.end)}`
    : `${fmtDateShort(ev.start)} ${fmtTime(ev.start)} – ${fmtDateShort(ev.end)} ${fmtTime(ev.end)}`;
}
