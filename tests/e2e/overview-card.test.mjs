import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

const card = "#cards evcc-overview-card";

test("Übersichtskarte rendert Live-Werte und Ampelfarbe (Fixture: Einspeisung 1,20 kW)", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(card).waitFor({ state: "attached" });
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });

  const chip = await page.locator(`${card} .chip`).textContent();
  expect(chip).toContain("Einspeisung");

  const now = await page.locator(`${card} .now`).textContent();
  expect(now).toContain("-1,20");
  expect(now).toContain("kW");

  const stats = await page.locator(`${card} .stat .v`).allTextContents();
  const joined = stats.join(" ");
  expect(joined).toContain("3,45");
  expect(joined).toContain("2,25");
  expect(joined).toContain("67");

  const tone = await page
    .locator(`${card} ha-card`)
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--tone").trim());
  expect(tone).toBe("#2ec4a6");

  expect(errors).toEqual([]);
});

test("?-Button klappt die Erklärung auf und zu", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  expect(await page.locator(`${card} .helpbox`).count()).toBe(0);
  await page.locator(`${card} .qm`).click();
  const help = await page.locator(`${card} .helpbox`).textContent();
  expect(help).toContain("Nur Anzeige");
  await page.locator(`${card} .qm`).click();
  expect(await page.locator(`${card} .helpbox`).count()).toBe(0);
  expect(errors).toEqual([]);
});

test("Karte ist im HA-Kartenpicker registriert", async ({ page }) => {
  const errors = await openDevPage(page);
  const types = await page.evaluate(() => (window.customCards || []).map((c) => c.type));
  expect(types).toContain("custom:evcc-overview-card");
  expect(errors).toEqual([]);
});
