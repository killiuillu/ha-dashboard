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
  for (const k of ["charge_power", "vehicle_soc", "status", "charge_mode", "mode"]) if (em[k]) lp[k] = em[k];
  if (lp.mode && !lp.charge_mode) {
    lp.charge_mode = lp.mode;
    delete lp.mode;
  }
  if (!Object.keys(lp).length) return [];
  return [{ name: (cfg && cfg.name) || "", ...lp }];
}

export function fmtVal(v, unit) {
  if (v === null || !isFinite(v)) return "–";
  if (unit === "kWh") return `${fmt(v, 2)} kWh`;
  if (unit === "%") return `${fmtInt(v)} %`;
  const sp = splitPower(v, unit);
  return `${sp.v} ${sp.u}`.trim();
}

export function energyStats({ pv, imp, exp, home, price, feedin }) {
  const autarky = home && home > 0 ? Math.max(0, Math.min(1, 1 - (imp ?? 0) / home)) : null;
  const selfc = pv && pv > 0 ? Math.max(0, Math.min(1, (pv - (exp ?? 0)) / pv)) : null;
  const costs = price !== null && price !== undefined ? (imp ?? 0) * price - (exp ?? 0) * (feedin ?? 0) : null;
  return { autarky, selfc, costs };
}

export function vehicleRange(soc, rangeKm, capacityKwh) {
  if (rangeKm !== null && rangeKm !== undefined && isFinite(rangeKm)) return rangeKm;
  if (soc !== null && capacityKwh) return (soc / 100) * Number(capacityKwh);
  return null;
}

export function autarkyTone(autarky) {
  if (autarky === null || autarky === undefined) return "off";
  if (autarky >= 0.7) return "ok";
  if (autarky >= 0.4) return "warn";
  return "cold";
}

export function dialGeometry(frac) {
  const R = 100;
  const CX = 120;
  const CY = 112;
  const START = 135;
  const SWEEP = 270;
  const pt = (deg, r = R) => {
    const a = (deg * Math.PI) / 180;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  };
  const path = (a, b) => {
    const [x1, y1] = pt(a);
    const [x2, y2] = pt(b);
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 ${b - a > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const p = Math.max(0, Math.min(1, frac));
  const end = START + p * SWEEP;
  const [kx, ky] = pt(end);
  const [sx, sy] = pt(START, R + 18);
  const [ex, ey] = pt(START + SWEEP, R + 18);
  return {
    viewBox: "0 0 240 200",
    track: path(START, START + SWEEP),
    fill: path(START, Math.max(START + 0.5, end)),
    knob: { x: kx, y: ky },
    scaleStart: { x: sx, y: sy },
    scaleEnd: { x: ex, y: ey },
  };
}

export function chargeModeMap(hass, entityId) {
  const st = hass?.states?.[entityId];
  const opts = (st?.attributes?.options || []).map((o) => String(o));
  const lower = opts.map((o) => o.toLowerCase());
  const pick = (re) => {
    const i = lower.findIndex((o) => re.test(o));
    return i >= 0 ? opts[i] : null;
  };
  return {
    current: String(st?.state ?? ""),
    off: pick(/^(off|aus)\b/),
    now: pick(/^(now|schnell|fast)\b/),
    smart: pick(/\bsmart\b/) || pick(/(^|[^a-z])pv([^a-z]|$)/) || pick(/solar/),
  };
}

export function modeActive(current, option) {
  if (!option) return false;
  return String(current ?? "").toLowerCase() === String(option).toLowerCase();
}
