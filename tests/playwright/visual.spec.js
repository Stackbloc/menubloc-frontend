/**
 * Visual Baseline Screenshot Tests — menuply.com
 *
 * Captures full-page screenshots for each protected route on desktop and mobile.
 * On first run: generates baseline images under tests/baseline-screenshots/
 * On subsequent runs: compares against baseline, fails if diff > threshold.
 *
 * Run: npm run ui:visual
 *
 * To update baselines after an intentional visual change:
 *   npx playwright test --project=desktop tests/playwright/visual.spec.js --update-snapshots
 */

import { test, expect } from "@playwright/test";

const VISUAL_ROUTES = [
  { name: "home",     path: "/",                                              waitFor: ".disc-feed-grid, body" },
  { name: "search",   path: "/search?q=burger&city=Los+Angeles&state=CA",     waitFor: "body" },
  { name: "waiter",   path: "/waiter",                                        waitFor: "body" },
  { name: "following",path: "/account/following",                             waitFor: "body" },
  { name: "checkout", path: "/checkout",                                      waitFor: "body" },
  { name: "signup",   path: "/restaurant/signup",                             waitFor: "body" },
];

for (const route of VISUAL_ROUTES) {
  test(`visual: ${route.name}`, async ({ page, browserName }, testInfo) => {
    const project = testInfo.project.name; // "desktop" or "mobile"

    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000); // allow React hydration and async data

    // Dismiss any overlays or prompts
    await page.keyboard.press("Escape").catch(() => {});

    await expect(page).toHaveScreenshot(`${project}-${route.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.03, // allow up to 3% pixel difference
      animations: "disabled",
      mask: [
        // Mask time-dependent elements
        page.locator("time"),
        page.locator('[data-testid="timestamp"]'),
      ],
    });
  });
}
