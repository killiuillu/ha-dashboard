import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

const card = "#cards evcc-history-card";

test("Verlaufskarte rendert eine Linie pro Serie aus den Recorder-Daten", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} .chart svg`).waitFor({ state: "attached" });
  const paths = await page.locator(`${card} .chart svg path`).count();
  expect(paths).toBe(3);
  const legs = await page.locator(`${card} .tleg span`).allTextContents();
  expect(legs.join(" ")).toContain("PV");
  expect(legs.join(" ")).toContain("Netz");
  expect(legs.join(" ")).toContain("Hausverbrauch");
  const xlabels = await page.locator(`${card} .xlabh`).allTextContents();
  expect(xlabels.some((l) => l.includes("06:00"))).toBe(true);
  expect(errors).toEqual([]);
});

test("Tooltip am Chart zeigt Werte der Serien am Zeiger", async ({ page }) => {
  const errors = await openDevPage(page);
  const svg = page.locator(`${card} .chart svg`);
  await svg.waitFor({ state: "attached" });
  const box = await svg.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.waitForTimeout(100);
  const tip = page.locator(`${card} .tip`);
  expect(await tip.count()).toBe(1);
  const text = await tip.textContent();
  expect(text).toContain("PV");
  expect(text).toContain("kW");
  expect(errors).toEqual([]);
});

test("?-Button klappt die Erklärung auf", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  await page.locator(`${card} .top .qm`).click();
  const help = await page.locator(`${card} .helpbox`).textContent();
  expect(help).toContain("Nur Anzeige");
  expect(errors).toEqual([]);
});
