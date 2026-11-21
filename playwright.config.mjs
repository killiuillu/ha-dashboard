import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8123",
    browserName: "chromium",
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
  },
  webServer: {
    command: "node scripts/serve.mjs",
    env: { ...process.env, EVCC_DEV_PORT: "8123" },
    url: "http://127.0.0.1:8123/dev/",
    reuseExistingServer: true,
    timeout: 15000,
  },
  projects: [{ name: "chromium" }],
});
