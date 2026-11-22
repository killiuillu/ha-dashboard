import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

test("Strategie ll-strategy-dashboard-evcc generiert Dashboard aus der Fixture", async ({ page }) => {
  const errors = await openDevPage(page);
  const dash = await page.evaluate(async () => {
    const el = document.createElement("ll-strategy-dashboard-evcc");
    return el.constructor.generate({ prefix: "evcc" }, window.__hass);
  });
  expect(dash.title).toBe("evcc Dashboard");
  const types = dash.views[0].sections[0].cards.map((c) => c.type);
  expect(types).toContain("custom:evcc-overview-card");
  expect(types).toContain("custom:evcc-loadpoint-card");
  expect(types).toContain("custom:evcc-energy-card");
  expect(dash.views.some((v) => v.path === "verlauf")).toBe(true);
  expect(errors).toEqual([]);
});

test("Strategie erkennt zusätzliche Module (Raumklima/Hue/Kalender/Müll) aus der Fixture", async ({ page }) => {
  const errors = await openDevPage(page);
  const dash = await page.evaluate(async () => {
    const el = document.createElement("ll-strategy-dashboard-evcc");
    return el.constructor.generate({ prefix: "evcc" }, window.__hass);
  });
  const titles = dash.views[0].sections.map((s) => s.title);
  expect(titles).toContain("evcc");
  expect(titles).toContain("Raumklima");
  expect(titles).toContain("Lichter");
  expect(titles).toContain("Kalender");
  expect(titles).toContain("Müllabfuhr");
  const restricted = await page.evaluate(async () => {
    const el = document.createElement("ll-strategy-dashboard-evcc");
    return el.constructor.generate({ prefix: "evcc", modules: ["evcc", "Mülltonnen"] }, window.__hass);
  });
  expect(restricted.views[0].sections.map((s) => s.title)).toEqual(["evcc", "Müllabfuhr"]);
  expect(errors).toEqual([]);
});

test("Strategie ist in window.customStrategies registriert", async ({ page }) => {
  const errors = await openDevPage(page);
  const strategies = await page.evaluate(() => (window.customStrategies || []).map((s) => `${s.strategyType}:${s.type}`));
  expect(strategies).toContain("dashboard:evcc");
  expect(errors).toEqual([]);
});
