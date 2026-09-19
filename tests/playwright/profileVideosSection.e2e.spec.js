/**
 * Lab E2E — restaurant profile Videos redesign (390×844).
 * Uses live restaurant SusieCakes (78941) + production API via Vite VITE_API_BASE_URL.
 * Asserts exclude_kinds=plan request, tile grid, sheet playback.
 *
 *   VITE_API_BASE_URL=https://menubloc-backend-production.up.railway.app npm run dev -- --port 5173
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npx playwright test \
 *     tests/playwright/profileVideosSection.e2e.spec.js --config=playwright.local.config.js --project=mobile
 *
 * Post-alias: PLAYWRIGHT_BASE_URL=https://menuply.com (same file; requires FE tip + BE projection).
 */

import { test, expect } from "@playwright/test";

test.describe("Profile Videos section", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.setTimeout(90_000);

  test("requests exclude_kinds=plan; tile opens sheet; video plays", async ({ page }) => {
    const videosReq = page.waitForRequest(
      (req) =>
        /\/public\/restaurants\/[^/?]+\/videos/.test(req.url()) &&
        req.url().includes("exclude_kinds=plan") &&
        req.url().includes("limit=60"),
      { timeout: 45000 }
    );

    await page.goto("/restaurants/california/los-angeles/susiecakes", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const matched = await videosReq;
    expect(matched.url()).toMatch(/exclude_kinds=plan/);
    expect(matched.url()).toMatch(/limit=60/);

    const section = page.getByTestId("profile-videos-section");
    await expect(section).toBeVisible({ timeout: 45000 });

    const grid = page.getByTestId("profile-videos-grid");
    await expect(grid).toBeVisible();
    const tiles = page.getByTestId("profile-video-tile");
    await expect(tiles.first()).toBeVisible({ timeout: 20000 });
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThanOrEqual(1);
    expect(tileCount).toBeLessThanOrEqual(6);

    await page.waitForTimeout(400);
    expect(await grid.locator("video").count()).toBeLessThanOrEqual(6);

    await tiles.nth(0).click();
    const sheet = page.getByTestId("profile-video-player-sheet");
    await expect(sheet).toBeVisible();
    const player = page.getByTestId("profile-video-player");
    await expect(player).toBeVisible();

    await expect
      .poll(
        async () =>
          player.evaluate((el) => {
            const v = /** @type {HTMLVideoElement} */ (el);
            return !v.paused && v.readyState >= 2;
          }),
        { timeout: 25000 }
      )
      .toBe(true);

    await page.getByTestId("profile-video-player-close").click();
    await expect(sheet).toHaveCount(0);
    await expect(grid).toBeVisible();
    await expect(tiles.first()).toBeVisible();
  });
});
