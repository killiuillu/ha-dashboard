import { statusOf } from "../status.js";
import { fmt, fmtInt } from "./format.js";

export const W_THRESHOLD = 50;

export function overviewStatus(pv, grid, bat) {
  if (grid !== null && grid > W_THRESHOLD) return statusOf("grid_import");
  if (grid !== null && grid < -W_THRESHOLD) return statusOf("grid_export");
  if (bat !== null && bat > W_THRESHOLD) return statusOf("battery_charge");
  if (bat !== null && bat < -W_THRESHOLD) return statusOf("battery_discharge");
  if (pv !== null && pv > W_THRESHOLD) return statusOf("solar_producing");
  if (pv === null && grid === null && bat === null) return statusOf("unavailable");
  return statusOf("off");
}

export function splitPower(w, unit = "W") {
  if (w === null) return { v: "–", u: "" };
  if (unit === "kW") return { v: fmt(w, 2), u: "kW" };
  const abs = Math.abs(w);
  return abs >= 1000 ? { v: fmt(w / 1000, 2), u: "kW" } : { v: fmtInt(w), u: "W" };
}

export function loadpointStatus(raw, chargePower) {
  if (chargePower !== null && chargePower > W_THRESHOLD) return statusOf("charging");
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s || s === "unavailable" || s === "unknown") return statusOf("unavailable");
  if (["c", "charging", "charge"].includes(s)) return statusOf("charging");
  if (["b", "connected", "plugged"].includes(s)) return statusOf("vehicle_connected");
  if (["paused", "pause", "p"].includes(s)) return statusOf("paused");
  if (["f", "error", "fault"].includes(s)) return statusOf("unavailable");
  return statusOf("off");
}

export function normalizeLoadpoints(cfg) {
  const em = (cfg && cfg.entities) || {};
  if (Array.isArray(em.loadpoints)) return em.loadpoints.filter((x) => x && typeof x === "object");
  const lp = {};
  for (const k of ["charge_power", "vehicle_soc", "status"]) if (em[k]) lp[k] = em[k];
  if (!Object.keys(lp).length) return [];
  return [{ name: (cfg && cfg.name) || "", ...lp }];
}

export const DIAL_ARC = "M 20.3 79.7 A 42 42 0 1 1 79.7 79.7";

export function knobPos(pct) {
  const p = Math.max(0, Math.min(100, pct));
  const rad = ((135 + (270 * p) / 100) * Math.PI) / 180;
  return { x: 50 + 42 * Math.cos(rad), y: 50 + 42 * Math.sin(rad) };
}
