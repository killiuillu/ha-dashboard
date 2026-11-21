import { test } from "node:test";
import assert from "node:assert/strict";
import { setLang } from "../../src/i18n/index.js";
import { CHART_H, CHART_W, PAD, niceTicks, scaleX, scaleY, seriesRange } from "../../src/util/chart.js";
import { autarkyTone, energyStats, fmtVal } from "../../src/util/evcc.js";

setLang({ language: "de" });

test("niceTicks liefert runde Ticks im Datenbereich", () => {
  const { ticks, lo, hi } = niceTicks(-2600, 3800, 4);
  assert.ok(lo <= -2600 && hi >= 3800);
  assert.ok(ticks.length >= 3);
  const step = ticks[1] - ticks[0];
  for (let i = 1; i < ticks.length; i++) assert.ok(Math.abs(ticks[i] - ticks[i - 1] - step) < 1e-9);
  assert.ok(niceTicks(5, 5, 4).lo < niceTicks(5, 5, 4).hi);
});

test("scaleX/scaleY bilden linear in den Chart-Bereich ab", () => {
  assert.equal(scaleX(0, 7), PAD.l);
  assert.equal(scaleX(6, 7), CHART_W - PAD.r);
  assert.ok(scaleY(0, 0, 100) > scaleY(100, 0, 100));
  assert.equal(scaleY(50, 0, 100), PAD.t + (CHART_H - PAD.t - PAD.b) / 2);
});

test("seriesRange über alle Serien", () => {
  const r = seriesRange([
    { points: [{ v: 3 }, { v: 9 }] },
    { points: [{ v: -4 }, { v: null }] },
  ]);
  assert.deepEqual(r, { min: -4, max: 9 });
  assert.deepEqual(seriesRange([]), { min: 0, max: 1 });
});

test("energyStats: Autarkie, Eigenverbrauch, Kosten", () => {
  const s = energyStats({ pv: 18.4, imp: 3.2, exp: 9.8, home: 11.6, price: 0.2987, feedin: 0 });
  assert.ok(Math.abs(s.autarky - (1 - 3.2 / 11.6)) < 1e-9);
  assert.ok(Math.abs(s.selfc - (18.4 - 9.8) / 18.4) < 1e-9);
  assert.ok(Math.abs(s.costs - 3.2 * 0.2987) < 1e-9);
  assert.equal(energyStats({ pv: null, imp: null, exp: null, home: null, price: null }).autarky, null);
  assert.equal(energyStats({ pv: 1, imp: 0, exp: 0, home: 1, price: null }).costs, null);
});

test("autarkyTone: Schwellen 70/40", () => {
  assert.equal(autarkyTone(0.9), "ok");
  assert.equal(autarkyTone(0.5), "warn");
  assert.equal(autarkyTone(0.1), "cold");
  assert.equal(autarkyTone(null), "off");
});

test("fmtVal nach Einheit", () => {
  assert.equal(fmtVal(3450, "W"), "3,45 kW");
  assert.equal(fmtVal(18.4, "kWh"), "18,40 kWh");
  assert.equal(fmtVal(54, "%"), "54 %");
  assert.equal(fmtVal(null, "W"), "–");
});
