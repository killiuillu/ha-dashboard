import { mkdirSync, writeFileSync } from "node:fs";
import { test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

const SHOTS = "shots";
const TAGS = ["evcc-overview-card", "evcc-loadpoint-card", "evcc-vehicle-card", "evcc-history-card", "evcc-energy-card"];

test("Screenshots aller evcc-Karten für den Optik-Vergleich", async ({ page, browser }) => {
  mkdirSync(SHOTS, { recursive: true });
  await openDevPage(page);
  await page.setViewportSize({ width: 480, height: 900 });
  await page.waitForTimeout(500);
  for (const tag of TAGS) {
    const loc = page.locator(`#cards ${tag}`);
    if (await loc.count()) await loc.screenshot({ path: `${SHOTS}/${tag}.png` });
  }
  await page.screenshot({ path: `${SHOTS}/dev-page.png`, fullPage: true });

  const ctx = await browser.newContext({ viewport: { width: 480, height: 900 }, deviceScaleFactor: 2 });
  const p2 = await ctx.newPage();
  await openDevPage(p2);
  await p2.waitForTimeout(500);
  await p2.locator("#cards evcc-loadpoint-card .lp .dial").screenshot({ path: `${SHOTS}/dial-zoom.png` });
  await p2.locator("#cards evcc-history-card .chart").screenshot({ path: `${SHOTS}/chart-zoom.png` });
  await ctx.close();

  const diag = await page.evaluate(() => {
    const out = {};
    const lp = document.querySelector("#cards evcc-loadpoint-card");
    const dialSvg = lp?.shadowRoot?.querySelector(".dial svg");
    out.dial = {
      paths: dialSvg ? dialSvg.querySelectorAll("path").length : 0,
      trackD: dialSvg?.querySelector(".track")?.getAttribute("d")?.slice(0, 60),
      trackStroke: dialSvg?.querySelector(".track") ? getComputedStyle(dialSvg.querySelector(".track")).stroke : null,
      trackWidth: dialSvg?.querySelector(".track") ? getComputedStyle(dialSvg.querySelector(".track")).strokeWidth : null,
      box: dialSvg?.getBoundingClientRect().toJSON(),
      knob: dialSvg?.querySelectorAll(".knob").length,
    };
    const hist = document.querySelector("#cards evcc-history-card");
    const paths = hist?.shadowRoot?.querySelectorAll(".chart svg path") || [];
    out.chart = {
      paths: paths.length,
      firstD: paths[0]?.getAttribute("d")?.slice(0, 60),
      firstStroke: paths[0] ? getComputedStyle(paths[0]).stroke : null,
      firstWidth: paths[0] ? getComputedStyle(paths[0]).strokeWidth : null,
    };
    out.mdiFont = document.fonts.check('16px "Material Design Icons"');
    out.evcVar = getComputedStyle(document.documentElement).getPropertyValue("--evc-color-status-ok").trim();
    return out;
  });
  writeFileSync(`${SHOTS}/diagnostics.json`, JSON.stringify(diag, null, 2));
});
