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
