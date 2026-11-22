import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

test("Räume-Karte: Strip mit allen Räumen (Temp + Licht-Indikator), Klick öffnet Steuerung mit schaltbaren Lichtern", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    window.__calls = [];
    window.__hass.callService = async (d, svc, t) => {
      window.__calls.push([d, svc, t]);
      return {};
    };
    const el = document.createElement("modular-rooms-card");
    el.setConfig({ title: "Räume", control: true });
    el.hass = window.__hass;
    document.getElementById("cards").appendChild(el);
  });
  const card = page.locator("#cards modular-rooms-card").nth(1);
  await card.locator(".room").first().waitFor({ state: "attached" });
  expect(await card.locator(".room").count()).toBe(3);
  const names = await card.locator(".rname").allTextContents();
  expect(names).toEqual(["Wohnzimmer", "Küche", "Schlafzimmer"]);
  const wz = card.locator(".room").first();
  expect(await wz.locator(".rtemp").textContent()).toContain("19");
  const sz = card.locator(".room").nth(2);
  expect(await sz.locator(".rname").textContent()).toBe("Schlafzimmer");
  expect(await sz.locator(".rtemp").textContent()).toContain("21,5");
  const dotColor = await wz.locator(".rdot").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(dotColor).toBe("rgb(255, 176, 32)");

  await wz.click();
  await page.waitForTimeout(300);
  expect(await wz.getAttribute("class")).toContain("sel");
  const overlay = card.locator(".overlay");
  await overlay.waitFor({ state: "attached", timeout: 10000 });
  expect(await overlay.locator(".dlg-title").textContent()).toBe("Wohnzimmer");
  const detail = overlay.locator(".roomdetail");
  await detail.locator("modular-lights-card").waitFor({ state: "attached", timeout: 10000 });
  const lightRows = detail.locator("modular-lights-card button.lrow");
  expect(await lightRows.count()).toBe(1);
  await lightRows.first().click();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__calls)).toEqual([["light", "turn_off", { entity_id: "light.wohnzimmer" }]]);
  await overlay.locator(".dlg-close").click();
  await page.waitForTimeout(200);
  expect(await card.locator(".overlay").count()).toBe(0);
  expect(errors).toEqual([]);
});

test("Räume-Karte mit areas-Filter zeigt nur gewählte Räume", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    const el = document.createElement("modular-rooms-card");
    el.setConfig({ title: "Räume", areas: ["wohnzimmer"] });
    el.hass = window.__hass;
    document.getElementById("cards").appendChild(el);
  });
  const card2 = page.locator("#cards modular-rooms-card").nth(1);
  await card2.locator(".room").first().waitFor({ state: "attached" });
  expect(await card2.locator(".room").count()).toBe(1);
  expect(await card2.locator(".rname").first().textContent()).toBe("Wohnzimmer");
  expect(errors).toEqual([]);
});

test("Ticker-Karte: Laufband mit Müll/Paket/Terminen (Track doppelt für nahtlosen Loop)", async ({ page }) => {
  const errors = await openDevPage(page);
  const card = page.locator("#cards modular-ticker-card");
  await card.locator(".ticker .track").waitFor({ state: "attached", timeout: 15000 });
  const texts = await card.locator(".tk").allTextContents();
  const joined = texts.join(" ");
  expect(joined).toContain("Papier");
  expect(joined).toContain("DHL Paket");
  expect(joined).toContain("Zahnarzt");
  expect(await card.locator(".tk").count()).toBeGreaterThanOrEqual(6);
  const anim = await card.locator(".track").evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe("evc-tick");
  expect(errors).toEqual([]);
});

test("Haupt-Strategie custom:main ist registriert und generiert Tablet-Layout", async ({ page }) => {
  const errors = await openDevPage(page);
  const res = await page.evaluate(async () => {
    const entries = (window.customStrategies || []).map((s) => `${s.strategyType}:${s.type}`);
    const Cls = customElements.get("ll-strategy-dashboard-main");
    const editor = Cls.getConfigElement();
    const dash = await Cls.generate({ prefix: "evcc" }, window.__hass);
    return {
      entries,
      editorTag: editor.tagName.toLowerCase(),
      configRequired: Cls.configRequired === true,
      view: dash.views[0],
      title: dash.title,
    };
  });
  expect(res.entries).toContain("dashboard:main");
  expect(res.entries).toContain("dashboard:modular");
  expect(res.editorTag).toBe("main-strategy-editor");
  expect(res.configRequired).toBe(true);
  expect(res.view.max_columns).toBe(4);
  expect(res.view.sections.map((s) => s.title)).toEqual(["Räume", "evcc", "Kalender", "Ereignisse"]);
  expect(errors).toEqual([]);
});

test("Haupt-Editor: Felder feuern config-changed (Titel, Ticker aus)", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    const ed = document.createElement("main-strategy-editor");
    ed.setConfig({});
    ed.hass = window.__hass;
    document.body.appendChild(ed);
    window.__med = ed;
  });
  await page.waitForTimeout(200);
  const changed = await page.evaluate(async () => {
    const ed = window.__med;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const inputs = [...ed.shadowRoot.querySelectorAll(".fld input[type=text]")];
    inputs[0].value = "Mein Zuhause";
    inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
    return p;
  });
  expect(changed.title).toBe("Mein Zuhause");
  const changed2 = await page.evaluate(async () => {
    const ed = window.__med;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const boxes = [...ed.shadowRoot.querySelectorAll(".opt input[type=checkbox]")];
    boxes[0].click();
    return p;
  });
  expect(changed2.ticker).toBe(false);

  const roomBoxes = await page.locator("main-strategy-editor .subhead").count();
  expect(roomBoxes).toBe(1);
  expect(await page.locator("main-strategy-editor .opt input[type=checkbox]").count()).toBe(5);
  const changedRooms = await page.evaluate(async () => {
    const ed = window.__med;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const boxes = [...ed.shadowRoot.querySelectorAll(".opt input[type=checkbox]")];
    boxes[4].click();
    return p;
  });
  expect(changedRooms.rooms).toEqual(["wohnzimmer", "kueche"]);

  const changedCols = await page.evaluate(async () => {
    const ed = window.__med;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const sel = ed.shadowRoot.querySelector(".fld select");
    sel.value = "full";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    return p;
  });
  expect(changedCols.calendar_columns).toBe("full");
  expect(errors).toEqual([]);
});
