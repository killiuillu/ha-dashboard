import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

test("Bundle lädt fehlerfrei und setzt die Design-Tokens als CSS-Variablen", async ({ page }) => {
  const errors = await openDevPage(page);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.evccDashboard?.version)).toBeTruthy();
  const heat = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--evc-color-status-heat").trim());
  expect(heat).toBe("#ff7a45");
  const radius = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--evc-radius-card").trim());
  expect(radius).toBe("28px");
  const tip = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--evc-shadow-tip").trim());
  expect(tip).toContain("8px 28px");
});

test("Dev-Seite zeigt die Status-Farben aus den Tokens an", async ({ page }) => {
  await page.goto("/dev/");
  await page.waitForSelector(".swatch");
  const names = await page.$$eval(".swatch .n", (els) => els.map((e) => e.textContent.split("\n")[0]));
  expect(names).toEqual(expect.arrayContaining(["heat", "ok", "air", "warn", "cold", "off", "eco"]));
});
