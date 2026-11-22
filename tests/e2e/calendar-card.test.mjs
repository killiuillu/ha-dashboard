import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

const card = "#cards modular-calendar-card";

test("Kalender-Karte Listenansicht: Events beider Kalender sortiert aus der Mock-API", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} .evrow`).first().waitFor({ state: "attached", timeout: 15000 });
  const sums = await page.locator(`${card} .evsum`).allTextContents();
  expect(sums).toEqual(["Zahnarzt", "Team-Meeting", "Elternabend Schule", "Release", "Urlaub"]);
  const legend = await page.locator(`${card} .calleg span`).allTextContents();
  expect(legend.join(" ")).toContain("Familienkalender");
  expect(legend.join(" ")).toContain("Arbeitskalender");
  const firstTime = await page.locator(`${card} .evrow .evtime`).first().textContent();
  expect(firstTime).toMatch(/\d{2}:\d{2}/);
  expect(errors).toEqual([]);
});

test("Kalender-Karte Monatsansicht: 6x7-Grid, heute markiert mit Punkten, Tagesauswahl + Monatswechsel", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    const el = document.createElement("modular-calendar-card");
    el.setConfig({ title: "Kalender", entities: ["calendar.familie", "calendar.arbeit"], view: "calendar" });
    el.hass = window.__hass;
    document.getElementById("cards").appendChild(el);
  });
  const month = page.locator("#cards modular-calendar-card").nth(1);
  await month.locator(".calgrid .calcell").first().waitFor({ state: "attached", timeout: 15000 });
  expect(await month.locator(".calgrid .calcell").count()).toBe(42);
  expect(await month.locator(".calgrid .wd").count()).toBe(7);
  const todayDots = await month.locator(".calcell.today .dots i").count();
  expect(todayDots).toBeGreaterThan(0);

  const labelBefore = await month.locator(".calhead .m").textContent();
  await month.locator(".calhead .calnav").nth(1).click();
  const labelAfter = await month.locator(".calhead .m").textContent();
  expect(labelAfter).not.toBe(labelBefore);
  await month.locator(".calhead .calnav").nth(2).click();
  expect(await month.locator(".calhead .m").textContent()).toBe(labelBefore);

  await month.locator(".calcell.today").click();
  await page.waitForTimeout(300);
  const dayEvents = await month.locator(".evlist .evrow .evsum").allTextContents();
  expect(dayEvents).toContain("Zahnarzt");
  expect(errors).toEqual([]);
});

test("Kalender-Karte: ?-Button klappt die Erklärung auf", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.locator(`${card} ha-card`).waitFor({ state: "attached" });
  await page.locator(`${card} .top .qm`).click();
  const help = await page.locator(`${card} .helpbox`).textContent();
  expect(help).toContain("Nur Anzeige");
  expect(errors).toEqual([]);
});
