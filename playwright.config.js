import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  timeout: 30_000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "https://menuply.com",
    headless: true,
    ignoreHTTPSErrors: false,
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
  snapshotDir: "./tests/baseline-screenshots",
});
