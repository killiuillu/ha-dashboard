import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

test("Strategie liefert Config-Editor und Create-Suggestions", async ({ page }) => {
  const errors = await openDevPage(page);
  const res = await page.evaluate(() => {
    const Cls = customElements.get("ll-strategy-dashboard-modular");
    const editor = Cls.getConfigElement();
    return {
      editorTag: editor.tagName.toLowerCase(),
      suggestions: Cls.getCreateSuggestions(),
      registered: !!customElements.get("evcc-strategy-editor"),
      configRequired: Cls.configRequired === true,
    };
  });
  expect(res.editorTag).toBe("evcc-strategy-editor");
  expect(res.registered).toBe(true);
  expect(res.configRequired).toBe(true);
  expect(res.suggestions.title).toBe("Modulares Dashboard");
  expect(res.suggestions.icon).toBe("mdi:view-dashboard");
  expect(errors).toEqual([]);
});

test("Editor zeigt Modul-Checkboxen (erkannte aktiv) und feuert config-changed", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    const ed = document.createElement("evcc-strategy-editor");
    ed.setConfig({ modules: ["evcc"] });
    ed.hass = window.__hass;
    document.body.appendChild(ed);
    window.__ed = ed;
  });
  await page.waitForTimeout(200);
  const labels = await page.locator("evcc-strategy-editor .mod").allTextContents();
  expect(labels.length).toBe(5);
  const checked = await page.locator("evcc-strategy-editor .mod input:checked").count();
  expect(checked).toBeGreaterThan(0);

  const changed = await page.evaluate(async () => {
    const ed = window.__ed;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const boxes = [...ed.shadowRoot.querySelectorAll(".mod input")];
    boxes.find((b) => b.closest(".mod").textContent.includes("Müllabfuhr")).click();
    return p;
  });
  expect(changed.modules).toContain("muell");
  expect(errors).toEqual([]);
});

test("Editor: Kalender-Auswahl + Ansicht (Liste/Kalender) und Tonnen-Auswahl feuern config-changed", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    const ed = document.createElement("evcc-strategy-editor");
    ed.setConfig({ modules: ["calendar", "muell", "hue"] });
    ed.hass = window.__hass;
    document.body.appendChild(ed);
    window.__ed2 = ed;
  });
  await page.waitForTimeout(200);
  const subs = page.locator("evcc-strategy-editor .sub");
  expect(await subs.count()).toBe(3);
  expect(await subs.nth(0).locator(".opt input[type=checkbox]").count()).toBe(3);
  expect(await subs.nth(0).locator(".opt input[type=radio]").count()).toBe(2);
  expect(await subs.nth(0).locator(".mini").count()).toBe(2);
  expect(await subs.nth(1).locator(".opt input[type=checkbox]").count()).toBe(4);
  expect(await subs.nth(2).locator(".opt input[type=checkbox]").count()).toBe(2);

  const changedHue = await page.evaluate(async () => {
    const ed = window.__ed2;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const boxes = [...ed.shadowRoot.querySelectorAll(".sub")][2].querySelectorAll(".opt input[type=checkbox]");
    boxes[1].click();
    return p;
  });
  expect(changedHue.hue.entities).toEqual(["light.wohnzimmer"]);

  const changedCal = await page.evaluate(async () => {
    const ed = window.__ed2;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const boxes = [...ed.shadowRoot.querySelectorAll(".sub")][0].querySelectorAll(".opt input[type=checkbox]");
    boxes[1].click();
    return p;
  });
  expect(changedCal.calendar.entities).toEqual(["calendar.familie"]);
  expect(changedCal.calendar.view).toBe("list");

  const changedView = await page.evaluate(async () => {
    const ed = window.__ed2;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const radios = [...ed.shadowRoot.querySelectorAll(".sub")][0].querySelectorAll(".opt input[type=radio]");
    radios[1].click();
    return p;
  });
  expect(changedView.calendar.view).toBe("calendar");

  const changedWaste = await page.evaluate(async () => {
    const ed = window.__ed2;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const boxes = [...ed.shadowRoot.querySelectorAll(".sub")][1].querySelectorAll(".opt input[type=checkbox]");
    boxes[0].click();
    return p;
  });
  expect(changedWaste.waste.entities.length).toBe(3);

  const changedGroup = await page.evaluate(async () => {
    const ed = window.__ed2;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const boxes = [...ed.shadowRoot.querySelectorAll(".sub")][0].querySelectorAll(".opt input[type=checkbox]");
    boxes[2].click();
    return p;
  });
  expect(changedGroup.calendar.group).toBe(true);

  const changedMax = await page.evaluate(async () => {
    const ed = window.__ed2;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const num = [...ed.shadowRoot.querySelectorAll(".sub")][0].querySelector(".fld input[type=number]");
    num.value = "5";
    num.dispatchEvent(new Event("input", { bubbles: true }));
    return p;
  });
  expect(changedMax.calendar.max).toBe(5);

  const changedCalMax = await page.evaluate(async () => {
    const ed = window.__ed2;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const mini = [...ed.shadowRoot.querySelectorAll(".sub")][0].querySelectorAll(".mini")[1];
    mini.value = "3";
    mini.dispatchEvent(new Event("input", { bubbles: true }));
    return p;
  });
  const arb = changedCalMax.calendar.entities.find((x) => (typeof x === "string" ? x : x?.entity) === "calendar.arbeit");
  expect(arb.max).toBe(3);
  expect(errors).toEqual([]);
});

test("Editor: Auto-Bild-Feld feuert config-changed mit image-Pfad", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    const ed = document.createElement("evcc-strategy-editor");
    ed.setConfig({ modules: ["evcc"] });
    ed.hass = window.__hass;
    document.body.appendChild(ed);
    window.__ed3 = ed;
  });
  await page.waitForTimeout(200);
  const changed = await page.evaluate(async () => {
    const ed = window.__ed3;
    const p = new Promise((res) => ed.addEventListener("config-changed", (e) => res(e.detail.config), { once: true }));
    const inputs = [...ed.shadowRoot.querySelectorAll(".fld input[type=text]")];
    const img = inputs[inputs.length - 1];
    img.value = "/local/evcc/auto.png";
    img.dispatchEvent(new Event("input", { bubbles: true }));
    return p;
  });
  expect(changed.image).toBe("/local/evcc/auto.png");
  expect(errors).toEqual([]);
});

test("customStrategies-Eintrag hat configRequired (Dialog fragt vor dem Anlegen)", async ({ page }) => {
  const errors = await openDevPage(page);
  const entry = await page.evaluate(() => (window.customStrategies || []).find((s) => s.type === "modular"));
  expect(entry.strategyType).toBe("dashboard");
  expect(entry.configRequired).toBe(true);
  expect(errors).toEqual([]);
});
