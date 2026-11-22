import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

const card = "#cards modular-lights-card";

test("Lichter-Karte im Raumklima-Stil: an zuerst mit Helligkeit, aus grau, Ampel-Chips", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} .lrow`).first().waitFor({ state: "attached" });
  const rows = page.locator(`${card} .lrow`);
  expect(await rows.count()).toBe(2);

  const names = await page.locator(`${card} .lname`).allTextContents();
  expect(names).toEqual(["Wohnzimmer Lampe", "Küchenlicht"]);

  const first = rows.first();
  expect((await first.getAttribute("class"))).toContain("on");
  expect(await first.locator(".chip").textContent()).toContain("An");
  expect(await first.locator(".lpct").textContent()).toContain("50");
  const bar = await first.locator(".lbar > i").evaluate((el) => el.style.width);
  expect(bar).toBe("50%");
  const iconColor = await first.locator(".licon").evaluate((el) => getComputedStyle(el).color);
  expect(iconColor).toBe("rgb(255, 176, 32)");

  const second = rows.nth(1);
  expect((await second.getAttribute("class"))).not.toContain("on");
  expect(await second.locator(".chip").textContent()).toContain("Aus");
  expect(errors).toEqual([]);
});

test("Lichter-Karte: ?-Button klappt die Erklärung auf (nur Anzeige)", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  await page.locator(`${card} .top .qm`).click();
  const help = await page.locator(`${card} .helpbox`).textContent();
  expect(help).toContain("nichts geschaltet");
  expect(errors).toEqual([]);
});

test("Lichter-Karte mit control: true – Klick ruft light.turn_off/turn_on per callService auf", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    window.__calls = [];
    window.__hass.callService = async (d, svc, t) => {
      window.__calls.push([d, svc, t]);
      return {};
    };
    const el = document.createElement("modular-lights-card");
    el.setConfig({ title: "Lichter steuerbar", control: true, entities: ["light.wohnzimmer", "light.kueche"] });
    el.hass = window.__hass;
    document.getElementById("cards").appendChild(el);
  });
  const card2 = page.locator("#cards modular-lights-card").nth(1);
  await card2.locator("button.lrow").first().waitFor({ state: "attached", timeout: 15000 });
  expect(await card2.locator("button.lrow").count()).toBe(2);
  await card2.locator("button.lrow").first().click();
  await card2.locator("button.lrow").nth(1).click();
  await page.waitForTimeout(200);
  const calls = await page.evaluate(() => window.__calls);
  expect(calls).toEqual([
    ["light", "turn_off", { entity_id: "light.wohnzimmer" }],
    ["light", "turn_on", { entity_id: "light.kueche" }],
  ]);
  expect(errors).toEqual([]);
});

test("Lichter-Karte ohne control bleibt read-only (keine Buttons)", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} .lrow`).first().waitFor({ state: "attached" });
  expect(await page.locator(`${card} button.lrow`).count()).toBe(0);
  expect(await page.locator(`${card} .ltoggle`).count()).toBe(0);
  expect(errors).toEqual([]);
});
