import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

const card = "#cards evcc-energy-card";

test("Energie-Karte zeigt Autarkie groß und Tageswerte als Stats (Fixture)", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });

  const now = await page.locator(`${card} .now`).textContent();
  expect(now).toContain("72");
  expect(now).toContain("%");

  const tone = await page
    .locator(`${card} ha-card`)
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--tone").trim());
  expect(tone).toBe("#2ec4a6");

  const stats = await page.locator(`${card} .stat .v`).allTextContents();
  const joined = stats.join(" ");
  expect(joined).toContain("18,4");
  expect(joined).toContain("3,2");
  expect(joined).toContain("9,8");
  expect(joined).toContain("11,6");
  expect(joined).toContain("0,96");
  expect(joined).toContain("0,2987");

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
