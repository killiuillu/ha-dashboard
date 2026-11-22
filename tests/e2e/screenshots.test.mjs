import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

async function probe(page, file, points) {
  const b64 = readFileSync(file).toString("base64");
  return page.evaluate(
    async ({ b64, points }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      return {
        size: [img.width, img.height],
        px: points.map(([x, y]) => [x, y, ...g.getImageData(Math.round(x), Math.round(y), 1, 1).data]),
      };
    },
    { b64, points },
  );
}

async function countColor(page, file, rgb, tol = 30) {
  const b64 = readFileSync(file).toString("base64");
  return page.evaluate(
    async ({ b64, rgb, tol }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i] - rgb[0]) < tol && Math.abs(d[i + 1] - rgb[1]) < tol && Math.abs(d[i + 2] - rgb[2]) < tol) n++;
      }
      return n;
    },
    { b64, rgb, tol },
  );
}

const SHOTS = "shots";
const TAGS = ["evcc-overview-card", "evcc-loadpoint-card", "evcc-vehicle-card", "evcc-history-card", "evcc-energy-card"];

test("Screenshots aller evcc-Karten für den Optik-Vergleich", async ({ page }) => {
  mkdirSync(SHOTS, { recursive: true });
  await openDevPage(page);
  await page.setViewportSize({ width: 480, height: 900 });
  await page.waitForTimeout(500);
  for (const tag of TAGS) {
    const loc = page.locator(`#cards ${tag}`);
    if (await loc.count()) await loc.screenshot({ path: `${SHOTS}/${tag}.png` });
  }
  await page.screenshot({ path: `${SHOTS}/dev-page.png`, fullPage: true });

  await page.locator("#cards evcc-loadpoint-card .lp .dial").screenshot({ path: `${SHOTS}/dial-zoom.png` });
  await page.locator("#cards evcc-history-card .chart").screenshot({ path: `${SHOTS}/chart-zoom.png` });
  const dialProbe = await probe(page, `${SHOTS}/dial-zoom.png`, [[120, 12], [138, 14], [49, 183], [191, 183], [120, 95]]);
  const chartProbe = await probe(page, `${SHOTS}/chart-zoom.png`, [[150, 50], [150, 100], [220, 120], [50, 200]]);
  const fillPx = await countColor(page, `${SHOTS}/dial-zoom.png`, [138, 148, 166], 25);
  const trackPx = await countColor(page, `${SHOTS}/dial-zoom.png`, [233, 233, 233], 6);
  const greenPx = await countColor(page, `${SHOTS}/chart-zoom.png`, [46, 196, 166], 25);
  const bluePx = await countColor(page, `${SHOTS}/chart-zoom.png`, [79, 157, 255], 25);
  await page.locator("#cards evcc-loadpoint-card").screenshot({ path: `${SHOTS}/loadpoint-zoom.png` });
  const iconPx = await countColor(page, `${SHOTS}/loadpoint-zoom.png`, [60, 60, 60], 60);

  const pixelCounts = { fillPx, trackPx, greenPx, bluePx, iconPx };
  const diag = await page.evaluate(async ({ dialProbe, chartProbe, pixelCounts }) => {
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
    out.dial.fillStroke = dialSvg?.querySelector(".fill") ? getComputedStyle(dialSvg.querySelector(".fill")).stroke : null;
    out.dial.dotFill = dialSvg?.querySelector(".dot") ? getComputedStyle(dialSvg.querySelector(".dot")).fill : null;
    await document.fonts.load('16px "Material Design Icons"').catch(() => {});
    out.mdiFont = document.fonts.check('16px "Material Design Icons"');
    out.fontsLoaded = document.fonts.size;
    out.mdiCss = await fetch("/dev/vendor/mdi/materialdesignicons.min.css").then((r) => r.status).catch(() => "fetch-error");
    out.dialProbe = dialProbe;
    out.chartProbe = chartProbe;
    out.pixelCounts = pixelCounts;
    out.evcVar = getComputedStyle(document.documentElement).getPropertyValue("--evc-color-status-ok").trim();
    return out;
  }, { dialProbe, chartProbe, pixelCounts });
  writeFileSync(`${SHOTS}/diagnostics.json`, JSON.stringify(diag, null, 2));
});
