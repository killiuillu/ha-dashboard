import { t } from "../i18n/index.js";
import { detectWasteSensors, parseWasteEntities, wasteEntries, daysLabel } from "./waste.js";
import { fetchCalendarEvents, parseCalendarEntities, fmtEventTime } from "./calendar.js";

export const PACKAGE_RE = /(paket|package|lieferung|delivery|dhl|dpd|gls|hermes|amazon|ups|fedex)/i;

export function packageSensors(hass) {
  return Object.keys(hass?.states || {})
    .filter((id) => id.startsWith("sensor.") && PACKAGE_RE.test(id))
    .slice(0, 6);
}

export function tickerItems(hass, { days = 2, now = new Date() } = {}) {
  const items = [];
  for (const e of wasteEntries(hass, parseWasteEntities(detectWasteSensors(hass)), now)) {
    if (e.days !== null && e.days <= days) {
      items.push({ icon: e.icon, text: `${e.name}: ${daysLabel(e.days)}` });
    }
  }
  for (const id of packageSensors(hass)) {
    const s = hass.states[id];
    if (!s || s.state === "unavailable" || s.state === "unknown") continue;
    const name = s.attributes?.friendly_name || id.replace(/^sensor\./, "");
    const exp = s.attributes?.expected_date || s.attributes?.expected || s.attributes?.next_date;
    items.push({ icon: "mdi:package-variant", text: `${t("Paket")} ${name} – ${s.state}${exp ? ` (${t("erwartet")} ${exp})` : ""}` });
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
