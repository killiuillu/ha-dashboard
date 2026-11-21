import { mkdirSync } from "node:fs";
import { test } from "@playwright/test";
import { openDevPage } from "../helpers.mjs";

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
});
