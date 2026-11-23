import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

const card = "#cards evcc-loadpoint-card";

test("Ladepunkt-Karte rendert Dial, Ampel und Live-Wert (Fixture: Status A, 0 W, SoC 54 %)", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });

  const chip = await page.locator(`${card} .lp .chip`).textContent();
  expect(chip).toContain("Aus");

  const now = await page.locator(`${card} .lp .now`).textContent();
  expect(now).toContain("0");
  expect(now).toContain("W");

  const target = await page.locator(`${card} .lp .target`).textContent();
  expect(target).toContain("Ladestand");
  expect(target).toContain("54");

  expect(await page.locator(`${card} .lp .fill`).count()).toBe(1);
  expect(await page.locator(`${card} .lp .knob`).count()).toBe(1);
  const fillD = await page.locator(`${card} .lp .fill`).getAttribute("d");
  expect(fillD).toContain("A 100 100");

  const tone = await page
    .locator(`${card} .lp`)
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--tone").trim());
  expect(tone).toBe("#8a94a6");

  expect(errors).toEqual([]);
});

test("Ladepunkt-Karte mit Lademodus (Leistung > 0) wird orange (heat)", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    window.__hass.states["sensor.evcc_loadpoint_1_charge_power"].state = "7360";
    window.__hass.states["sensor.evcc_loadpoint_1_status"].state = "C";
  });
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  const el = page.locator(card);
  el.evaluate((node) => {
    node.hass = { ...window.__hass, states: { ...window.__hass.states } };
  });
  await page.waitForTimeout(100);
  const chip = await page.locator(`${card} .lp .chip`).textContent();
  expect(chip).toContain("Fahrzeug lädt");
  const now = await page.locator(`${card} .lp .now`).textContent();
  expect(now).toContain("7,36");
  const tone = await page
    .locator(`${card} .lp`)
    .evaluate((el2) => getComputedStyle(el2).getPropertyValue("--tone").trim());
  expect(tone).toBe("#ff7a45");
  expect(errors).toEqual([]);
});

test("Mehrere Ladepunkte über entities.loadpoints rendern je einen Dial", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  await page.evaluate(() => {
    const el = document.createElement("evcc-loadpoint-card");
    el.setConfig({
      title: "Wallboxen",
      entities: {
        loadpoints: [
          { name: "LP 1", charge_power: "sensor.evcc_loadpoint_1_charge_power", vehicle_soc: "sensor.evcc_loadpoint_1_vehicle_soc", status: "sensor.evcc_loadpoint_1_status" },
          { name: "LP 2", charge_power: "sensor.evcc_loadpoint_1_charge_power", vehicle_soc: "sensor.evcc_battery_soc" },
        ],
      },
    });
    el.hass = window.__hass;
    document.getElementById("cards").appendChild(el);
  });
  await page.waitForTimeout(100);
  const all = page.locator("#cards evcc-loadpoint-card");
  expect(await all.count()).toBe(2);
  const lps = await all.nth(1).locator(".lp").count();
  expect(lps).toBe(2);
  const names = await all.nth(1).locator(".lp .name").allTextContents();
  expect(names.map((n) => n.trim())).toEqual(["LP 1", "LP 2"]);
  expect(errors).toEqual([]);
});

test("Ladepunkt-Karte mit control:true zeigt Aus/Schnell/Smart und schaltet per select.select_option", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    window.__calls = [];
    window.__hass.callService = async (d, svc, t) => {
      window.__calls.push([d, svc, t]);
      return {};
    };
    const el = document.createElement("evcc-loadpoint-card");
    el.setConfig({
      title: "Wallbox",
      control: true,
      entities: {
        loadpoints: [
          {
            name: "LP 1",
            charge_power: "sensor.evcc_loadpoint_1_charge_power",
            vehicle_soc: "sensor.evcc_loadpoint_1_vehicle_soc",
            status: "sensor.evcc_loadpoint_1_status",
            charge_mode: "select.evcc_loadpoint_1_charge_mode",
          },
        ],
      },
    });
    el.hass = window.__hass;
    document.getElementById("cards").appendChild(el);
  });
  const card2 = page.locator("#cards evcc-loadpoint-card").nth(1);
  await card2.locator(".modes .mode").first().waitFor({ state: "attached" });
  const labels = await card2.locator(".modes .mode").allTextContents();
  expect(labels.map((x) => x.trim())).toEqual(["Aus", "Schnell", "Smart"]);
  expect((await card2.locator(".modes .mode.on").textContent()).trim()).toBe("Smart");
  expect(await page.locator("#cards evcc-loadpoint-card").nth(0).locator(".modes").count()).toBe(0);
  await card2.locator(".modes .mode").nth(1).click();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__calls)).toEqual([
    ["select", "select_option", { entity_id: "select.evcc_loadpoint_1_charge_mode", option: "now" }],
  ]);
  expect(errors).toEqual([]);
});

test("?-Button klappt die Erklärung auf", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  await page.locator(`${card} > .qm, ${card} .top .qm`).first().click();
  const help = await page.locator(`${card} .helpbox`).textContent();
  expect(help).toContain("Nur Anzeige");
  expect(errors).toEqual([]);
});
