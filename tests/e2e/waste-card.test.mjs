import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

const card = "#cards modular-waste-card";

test("Mülltonnen-Karte: 4 Tonnen sortiert nach Tagen, nächster Termin hervorgehoben mit „als Nächstes“", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} .wrow`).first().waitFor({ state: "attached" });
  const rows = page.locator(`${card} .wrow`);
  expect(await rows.count()).toBe(4);
  const names = await page.locator(`${card} .wname`).allTextContents();
  expect(names).toEqual(["Papier", "Biotonne", "Restmüll", "Gelbe Tonne"]);

  const first = rows.first();
  expect(await first.getAttribute("class")).toContain("wnext");
  expect((await first.locator(".wchip").textContent()).trim()).toBe("als Nächstes");
  const num = await first.locator(".wnum").textContent();
  expect(num).toContain("0");
  expect(num).toContain("Tage");
  expect(num).toContain("Heute");
  expect(await rows.nth(1).locator(".wnum").textContent()).toContain("Morgen");
  expect(await rows.nth(2).locator(".wnum").textContent()).toContain("in 2 Tagen");

  const note = await page.locator(`${card} .wnote`).textContent();
  expect(note).toContain("Tage bis zur nächsten Abholung");
  const icons = await page.locator(`${card} .wicon`).evaluateAll((els) => els.map((e) => e.getAttribute("icon")));
  expect(icons[0]).toBe("mdi:package-variant-closed");
  expect(icons[1]).toBe("mdi:leaf");
  expect(errors).toEqual([]);
});

test("Mülltonnen-Karte: ?-Button erklärt die Zahl (Tage bis Abholung)", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  await page.locator(`${card} .top .qm`).click();
  const help = await page.locator(`${card} .helpbox`).textContent();
  expect(help).toContain("Anzahl der Tage bis zur nächsten Abholung");
  expect(help).toContain("Nur Anzeige");
  expect(errors).toEqual([]);
});
