import { t, loc } from "../i18n/index.js";
import { num } from "./format.js";
import { stateOf } from "./hass.js";

export function parseWasteEntities(cfg) {
  let raw = cfg;
  if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) raw = cfg.entities ?? cfg.tonnen ?? cfg.types;
  if (!Array.isArray(raw)) raw = raw == null ? [] : [raw];
  return raw
    .map((item) =>
      typeof item === "string"
        ? { entity: item }
        : item && typeof item === "object"
          ? { entity: item.entity, name: item.name, icon: item.icon, color: item.color }
          : null,
    )
    .filter((x) => x && x.entity);
}

const DAY = 86400000;

export const daysUntil = (date, now = new Date()) => {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b - a) / DAY);
};

const parseDate = (v) => {
  if (!v || typeof v !== "string") return null;
  const d = new Date(v.length <= 10 ? `${v}T00:00:00` : v);
  return isNaN(d) ? null : d;
};

const prettify = (entity) =>
  entity
    .replace(/^sensor\./, "")
    .replace(/^(waste_collection_schedule|muelltonnen|muell)_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || entity;

export function iconForName(name) {
  const n = String(name || "").toLowerCase();
  if (/bio|garten|gr[aä]n|organisch/.test(n)) return "mdi:leaf";
  if (/papier|paper/.test(n)) return "mdi:package-variant-closed";
  if (/gelb|leicht|verpackung|lvp|wertstoff|recycle/.test(n)) return "mdi:recycle";
  if (/glas/.test(n)) return "mdi:bottle-wine";
  if (/rest|schwarz|hausm/.test(n)) return "mdi:trash-can";
  return "mdi:trash-can-outline";
}

export function wasteEntry(hass, item, now = new Date()) {
  const s = stateOf(hass, item.entity);
  const a = s?.attributes || {};
  let nextDate = parseDate(a.next_date) || parseDate(a.next_collection);
  let days = num(s);
  if (days === null && typeof s?.state === "string" && /^\d{4}-\d{2}-\d{2}/.test(s.state)) {
    nextDate = nextDate || parseDate(s.state);
    days = nextDate ? daysUntil(nextDate, now) : null;
  }
  if (days === null && nextDate) days = daysUntil(nextDate, now);
  if (days === null && a.daysTo !== undefined && a.daysTo !== null && a.daysTo !== "") {
    const d = Number(a.daysTo);
    days = isNaN(d) ? null : d;
  }
  const name = item.name || a.friendly_name || prettify(item.entity);
  return {
    entity: item.entity,
    name,
    icon: item.icon || iconForName(name),
    color: item.color || null,
    days,
    nextDate,
    available: !!s,
  };
}

export function wasteEntries(hass, items, now = new Date()) {
  const list = items.map((it) => wasteEntry(hass, it, now)).filter((e) => e.available);
  list.sort((x, y) => (x.days ?? 1e9) - (y.days ?? 1e9) || String(x.name).localeCompare(String(y.name)));
  const first = list.find((e) => e.days !== null);
  if (first) first.isNext = true;
  return list;
}

export function daysLabel(days) {
  if (days === null || days === undefined) return t("unbekannt");
  if (days <= 0) return t("Heute");
  if (days === 1) return t("Morgen");
  return t("in {n} Tagen", { n: days });
}

export function detectWasteSensors(hass) {
  const states = hass?.states || {};
  const entities = hass?.entities || {};
  const ids = new Set();
  for (const e of Object.values(entities)) {
    if (e && (e.platform === "waste_collection_schedule" || /waste|muell|tonne/i.test(e.entity_id))) ids.add(e.entity_id);
  }
  for (const [id, st] of Object.entries(states)) {
    if (!id.startsWith("sensor.")) continue;
    const a = (st && st.attributes) || {};
    if (a.daysTo !== undefined || a.next_date || a.next_collection || /waste|muell|tonne/i.test(id)) ids.add(id);
  }
  return [...ids].slice(0, 10);
}

export const fmtWasteDate = (d) =>
  d ? d.toLocaleDateString(loc(), { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }) : "–";
