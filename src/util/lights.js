import { stateOf } from "./hass.js";

export function parseLightEntities(cfg) {
  let raw = cfg;
  if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) raw = cfg.entities ?? cfg.lights;
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

const prettify = (entity) =>
  entity
    .replace(/^light\./, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || entity;

export function lightEntry(hass, item) {
  const s = stateOf(hass, item.entity);
  const a = s?.attributes || {};
  const state = s?.state ?? null;
  const on = state === "on";
  let brightness = null;
  if (typeof a.brightness_pct === "number") brightness = a.brightness_pct;
  else if (typeof a.brightness === "number") brightness = Math.round((a.brightness / 255) * 100);
  if (brightness !== null) brightness = Math.max(0, Math.min(100, brightness));
  const name = item.name || a.friendly_name || prettify(item.entity);
  return {
    entity: item.entity,
    name,
    icon: item.icon || "mdi:lightbulb",
    color: item.color || null,
    on,
    available: state !== null && state !== "unavailable" && state !== "unknown",
    brightness,
  };
}

export function lightEntries(hass, items) {
  const list = items.map((it) => lightEntry(hass, it));
  list.sort(
    (x, y) =>
      (y.available ? 1 : 0) - (x.available ? 1 : 0) ||
      (y.on ? 1 : 0) - (x.on ? 1 : 0) ||
      String(x.name).localeCompare(String(y.name)),
  );
  return list;
}
