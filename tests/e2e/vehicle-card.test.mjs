import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

const card = "#cards evcc-vehicle-card";

test("Fahrzeug-Karte zeigt SoC groß, Reichweite und Status (Fixture: 54 %, 231 km, Status A)", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });

  const now = await page.locator(`${card} .now`).textContent();
  expect(now).toContain("54");
  expect(now).toContain("%");

  const range = await page.locator(`${card} .range`).textContent();
  expect(range).toContain("231");
  expect(range).toContain("km");

  const chip = await page.locator(`${card} .chip`).textContent();
  expect(chip).toContain("Aus");

  const stats = await page.locator(`${card} .stat .v`).allTextContents();
  expect(stats.join(" ")).toContain("231");

  const tone = await page
    .locator(`${card} ha-card`)
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--tone").trim());
  expect(tone).toBe("#8a94a6");

  expect(errors).toEqual([]);
});

test("Ohne image-Config rendert das Auto-Icon als Fallback", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  expect(await page.locator(`${card} .caricon`).count()).toBe(1);
  expect(await page.locator(`${card} .carimg`).count()).toBe(0);
  expect(errors).toEqual([]);
});

test("Mit image-Config wird das Bild angezeigt", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  await page.evaluate(() => {
    const el = document.createElement("evcc-vehicle-card");
    el.setConfig({
      title: "Auto mit Bild",
      image: "/dev/pixel.png",
      entities: { vehicle_soc: "sensor.evcc_loadpoint_1_vehicle_soc", range: "sensor.evcc_loadpoint_1_vehicle_range" },
    });
    el.hass = window.__hass;
    document.getElementById("cards").appendChild(el);
  });
  await page.waitForTimeout(100);
  const imgs = await page.locator("#cards evcc-vehicle-card .carimg").count();
  expect(imgs).toBe(1);
  const src = await page.locator("#cards evcc-vehicle-card .carimg").last().getAttribute("src");
  expect(src).toBe("/dev/pixel.png");
  expect(errors).toEqual([]);
});

test("Reichweite ohne Range-Entity wird aus SoC × capacity_kwh berechnet", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  await page.evaluate(() => {
    const el = document.createElement("evcc-vehicle-card");
    el.setConfig({
      title: "Berechnet",
      capacity_kwh: 60,
      entities: { vehicle_soc: "sensor.evcc_loadpoint_1_vehicle_soc" },
    });
    el.hass = window.__hass;
    document.getElementById("cards").appendChild(el);
  });
  await page.waitForTimeout(100);
  const ranges = await page.locator("#cards evcc-vehicle-card .range").allTextContents();
  expect(ranges.some((r) => r.includes("32"))).toBe(true);
  expect(errors).toEqual([]);
});
