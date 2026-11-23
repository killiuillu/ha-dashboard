import { t } from "../i18n/index.js";
import { fmtInt, num } from "./format.js";
import { stateOf } from "./hass.js";
import { detectWasteSensors, parseWasteEntities, wasteEntries, daysLabel } from "./waste.js";
import { fetchCalendarEvents, parseCalendarEntities, fmtEventTime } from "./calendar.js";

export const PACKAGE_RE = /(^|[^a-z])(dhl|dpd|gls|hermes|amazon|ups|fedex|paket|package|lieferung|delivery)([^a-z]|$)/i;

export const CARRIERS = [
  { key: "dhl", re: /(^|[^a-z])dhl([^a-z]|$)/i, label: "DHL", icon: "mdi:truck-fast" },
  { key: "gls", re: /(^|[^a-z])gls([^a-z]|$)/i, label: "GLS", icon: "mdi:truck-delivery" },
  { key: "hermes", re: /(^|[^a-z])hermes([^a-z]|$)/i, label: "Hermes", icon: "mdi:email-fast" },
  { key: "dpd", re: /(^|[^a-z])dpd([^a-z]|$)/i, label: "DPD", icon: "mdi:cube-outline" },
  { key: "ups", re: /(^|[^a-z])ups([^a-z]|$)/i, label: "UPS", icon: "mdi:shield-check" },
  { key: "amazon", re: /(^|[^a-z])amazon([^a-z]|$)/i, label: "Amazon", icon: "mdi:cart-outline" },
  { key: "fedex", re: /(^|[^a-z])fedex([^a-z]|$)/i, label: "FedEx", icon: "mdi:package-variant-closed" },
];

export function carrierOf(...hints) {
  const hay = hints.filter(Boolean).join(" ");
  return CARRIERS.find((c) => c.re.test(hay)) || null;
}

export function packageSensors(hass) {
  return Object.keys(hass?.states || {})
    .filter((id) => id.startsWith("sensor.") && PACKAGE_RE.test(id))
    .slice(0, 10);
}

export const NO_PACKAGE_RE = /^(|0+(\.0+)?|-|keine?|nein|none|no|geliefert|zugestellt|delivered|abgeschlossen|completed)$/i;

const COUNT_ATTRS = ["expected_count", "count", "pakete", "packages", "anzahl"];
const LIST_ATTRS = ["packets", "parcels", "sendungen", "tracking_numbers", "sendungsnummern"];
const DATE_ATTRS = ["expected_date", "expected", "next_date", "estimated_delivery", "lieferdatum"];

export function packageEntry(hass, id) {
  const s = stateOf(hass, id);
  if (!s) return null;
  const a = s.attributes || {};
  const raw = String(s.state ?? "").trim();
  if (/^(unavailable|unknown)$/i.test(raw)) return null;
  const n = num(s);
  let count = null;
  let coming = false;
  if (n !== null) {
    count = n;
    coming = n > 0;
  } else if (raw && !NO_PACKAGE_RE.test(raw)) {
    coming = true;
  }
  for (const k of COUNT_ATTRS) {
    const v = Number(a[k]);
    if (a[k] !== undefined && a[k] !== null && a[k] !== "" && !isNaN(v) && v > 0) {
      coming = true;
      if (count === null || count <= 0) count = v;
    }
  }
  for (const k of LIST_ATTRS) {
    if (Array.isArray(a[k]) && a[k].length > 0) {
      coming = true;
      if (count === null || count <= 0) count = a[k].length;
    }
  }
  if (!coming) return null;
  const name = a.friendly_name || id.replace(/^sensor\./, "");
  const carrier = carrierOf(id, name);
  const expected = DATE_ATTRS.map((k) => a[k]).find((v) => v !== undefined && v !== null && v !== "") || null;
  return { entity: id, name, carrier, icon: carrier ? carrier.icon : "mdi:package-variant", count, state: raw, expected };
}

export function packageEntries(hass) {
  return packageSensors(hass)
    .map((id) => packageEntry(hass, id))
    .filter(Boolean);
}

export function batterySensors(hass) {
  return Object.keys(hass?.states || {})
    .filter((id) => id.startsWith("sensor.") && hass.states[id]?.attributes?.device_class === "battery")
    .slice(0, 20);
}

export function batteryItems(hass, { threshold = 20, all = true, list = [] } = {}) {
  const ids = all ? batterySensors(hass) : [];
  for (const e of list) if (e && !ids.includes(e)) ids.push(e);
  const out = [];
  for (const id of ids) {
    const s = stateOf(hass, id);
    const soc = num(s);
    if (s === null || soc === null || soc > threshold) continue;
    const name = s.attributes?.friendly_name || id.replace(/^sensor\./, "");
    out.push({ icon: soc <= 10 ? "mdi:battery-low" : "mdi:battery-alert", text: `${name}: ${fmtInt(soc)} %` });
  }
  return out;
}

export function tickerItems(hass, { days = 2, now = new Date(), battery_soc, battery_socs, battery_threshold, battery_all = true } = {}) {
  const items = [];
  const list = Array.isArray(battery_socs) && battery_socs.length ? battery_socs : battery_soc ? [battery_soc] : [];
  items.push(...batteryItems(hass, { threshold: battery_threshold ?? 20, all: battery_all, list }));
  for (const e of wasteEntries(hass, parseWasteEntities(detectWasteSensors(hass)), now)) {
    if (e.days !== null && e.days <= days) {
      items.push({ icon: e.icon, text: `${e.name}: ${daysLabel(e.days)}` });
    }
  }
  for (const p of packageEntries(hass)) {
    const label = p.carrier ? p.carrier.label : p.name;
    const what = p.count !== null ? `${p.count} ${p.count === 1 ? t("Paket") : t("Pakete")}` : p.state;
    const exp = p.expected ? ` (${t("erwartet")} ${p.expected})` : "";
    items.push({ icon: p.icon, text: `${label}: ${what}${exp}` });
  }
  return items;
}

export async function tickerCalendarItems(hass, calendars, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 2 * 86400000);
  const evs = await fetchCalendarEvents(hass, parseCalendarEntities(calendars), start, end);
  return evs.map((ev) => ({
    icon: "mdi:calendar",
    text: `${ev.start ? fmtEventTime(ev) : ""} ${ev.summary}`.trim(),
  }));
}
