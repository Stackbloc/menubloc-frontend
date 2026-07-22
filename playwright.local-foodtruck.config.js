import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  testMatch: "**/food-truck-custom-profile.spec.js",
  timeout: 45_000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    // Prefer installed Google Chrome when sandbox browser path is unavailable.
    channel: "chrome",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        channel: "chrome",
      },
    },
  ],
});
