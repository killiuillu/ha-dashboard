export const CHART_W = 600;
export const CHART_H = 240;
export const PAD = { l: 34, r: 8, t: 10, b: 18 };

export function niceTicks(min, max, count = 4) {
  if (!isFinite(min) || !isFinite(max)) return { ticks: [], lo: 0, hi: 1 };
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  const step0 = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(v);
  const lo = Math.min(min, ticks[0]);
  const hi = Math.max(max, ticks[ticks.length - 1]);
  return { ticks, lo, hi };
}

export function scaleY(v, lo, hi) {
  const span = hi - lo || 1;
  return PAD.t + (1 - (v - lo) / span) * (CHART_H - PAD.t - PAD.b);
}

export function scaleX(i, n) {
  return PAD.l + (i / Math.max(1, n - 1)) * (CHART_W - PAD.l - PAD.r);
}

export function seriesRange(series) {
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) for (const p of s.points) {
    if (p.v === null || !isFinite(p.v)) continue;
    if (p.v < min) min = p.v;
    if (p.v > max) max = p.v;
  }
  if (min === Infinity) return { min: 0, max: 1 };
  return { min, max };
}

export function hourLabel(t) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}
