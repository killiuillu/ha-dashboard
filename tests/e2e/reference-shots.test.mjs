import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "@playwright/test";

const REF = "reference/raumklima-2";

test("Referenz-Screenshot: Raumklima-2 Demo-Karte (nur wenn Referenz geklont)", async ({ page }) => {
  test.skip(!existsSync(resolve(REF)), "Referenz nicht geklont");
  mkdirSync("shots", { recursive: true });
  const fixture = JSON.parse(readFileSync(resolve(REF, "frontend/test/fixture.json"), "utf8"));
  const bundle = readFileSync(resolve(REF, "custom_components/raumklima/www/raumklima-card.js"), "utf8");
  await page.goto("/dev/");
  await page.setViewportSize({ width: 480, height: 1200 });
  await page.evaluate(({ fixture }) => {
    window.__hass = {
      states: fixture.states,
      entities: fixture.entities,
      language: "de",
      locale: { language: "de", number_format: "language" },
      user: { is_admin: true, name: "Test" },
      themes: { darkMode: false },
      callWS: async (m) => (m.type in (fixture.ws || {}) ? structuredClone(fixture.ws[m.type]) : {}),
      callService: async () => ({}),
      connection: { subscribeMessage: async () => () => {} },
      formatEntityState: (s) => s.state,
    };
  }, { fixture });
  await page.addScriptTag({ content: bundle });
  await page.evaluate(() => {
    const el = document.createElement("raumklima-demo-card");
    el.setConfig({});
    el.hass = window.__hass;
    el.style.width = "440px";
    document.body.appendChild(el);
  });
  await page.waitForTimeout(800);
  await page.locator("raumklima-demo-card").screenshot({ path: "shots/raumklima-demo.png" });

  await page.evaluate(() => {
    const el = document.createElement("raumklima-card");
    el.setConfig({ entity: "climate.bad" });
    el.hass = window.__hass;
    el.style.width = "440px";
    document.body.appendChild(el);
  });
  await page.waitForTimeout(800);
  await page.locator("raumklima-card").screenshot({ path: "shots/raumklima-room.png" });
});
