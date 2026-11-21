import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const bundle = () => readFileSync(resolve(root, "dist/evcc-dashboard.js"), "utf8");
export const fixture = () => JSON.parse(readFileSync(resolve(root, "dev/fixture.json"), "utf8"));

export async function openDevPage(page, lang = "de") {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/dev/", { qs: lang === "de" ? undefined : { lang } });
  await page.evaluate(({ fixture, lang }) => {
    window.__hass = {
      states: fixture.states,
      entities: fixture.entities || {},
      language: lang,
      locale: { language: lang, number_format: "language" },
      user: { is_admin: true, name: "Test" },
      themes: { darkMode: false },
      callWS: async (msg) => (msg.type in (fixture.ws || {}) ? structuredClone(fixture.ws[msg.type]) : {}),
      callService: async () => ({}),
      connection: { subscribeMessage: async () => () => {} },
      formatEntityState: (s) => s.state,
    };
  }, { fixture: fixture(), lang });
  await page.addScriptTag({ content: bundle() });
  return errors;
}

export function trackErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}
