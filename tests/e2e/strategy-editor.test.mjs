import { expect, test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

test("Strategie liefert Config-Editor und Create-Suggestions", async ({ page }) => {
  const errors = await openDevPage(page);
  const res = await page.evaluate(() => {
    const strat = document.querySelector("ll-strategy-dashboard-evcc");
    const Cls = strat.constructor;
    const editor = Cls.getConfigElement();
    return {
      editorTag: editor.tagName.toLowerCase(),
      suggestions: Cls.getCreateSuggestions(),
      registered: !!customElements.get("evcc-strategy-editor"),
    };
  });
  expect(res.editorTag).toBe("evcc-strategy-editor");
  expect(res.registered).toBe(true);
  expect(res.suggestions.title).toBe("evcc Dashboard");
  expect(res.suggestions.icon).toBe("mdi:view-dashboard");
  expect(errors).toEqual([]);
});

test("Editor zeigt Modul-Checkboxen (erkannte aktiv) und feuert config-changed", async ({ page }) => {
  const errors = await openDevPage(page);
  await page.evaluate(() => {
    const ed = document.createElement("evcc-strategy-editor");
    ed.setConfig({});
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

test("customStrategies-Eintrag hat configRequired (Dialog fragt vor dem Anlegen)", async ({ page }) => {
  const errors = await openDevPage(page);
  const entry = await page.evaluate(() => (window.customStrategies || []).find((s) => s.type === "evcc"));
  expect(entry.strategyType).toBe("dashboard");
  expect(entry.configRequired).toBe(true);
  expect(errors).toEqual([]);
});
