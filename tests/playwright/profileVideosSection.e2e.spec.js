/**
 * Lab E2E — restaurant profile Videos redesign.
 * Asserts exclude_kinds=plan, tile grid, sheet playback, B11 frame sizing.
 *
 *   VITE_API_BASE_URL=https://menubloc-backend-production.up.railway.app npm run dev -- --port 5173
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npx playwright test \
 *     tests/playwright/profileVideosSection.e2e.spec.js --config=playwright.local.config.js
 */

import { test, expect } from "@playwright/test";

async function openFirstTile(page) {
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

  await videosReq;

  const section = page.getByTestId("profile-videos-section");
  await expect(section).toBeVisible({ timeout: 45000 });
  const tiles = page.getByTestId("profile-video-tile");
  await expect(tiles.first()).toBeVisible({ timeout: 20000 });
  await tiles.nth(0).click();
  const sheet = page.getByTestId("profile-video-player-sheet");
  await expect(sheet).toBeVisible();
  const player = page.getByTestId("profile-video-player");
  await expect(player).toBeVisible();
  const frame = page.getByTestId("profile-video-player-frame");
  await expect(frame).toBeVisible();
  return { sheet, player, frame };
}

test.describe("Profile Videos section — mobile 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.setTimeout(90_000);

  test("exclude_kinds=plan; sheet plays; frame clamped", async ({ page }) => {
    const { sheet, player, frame } = await openFirstTile(page);

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

    const box = await frame.boundingBox();
    expect(box).toBeTruthy();
    expect(box.width).toBeLessThanOrEqual(210);
    expect(box.height).toBeLessThanOrEqual(640);

    const fit = await player.evaluate((el) => getComputedStyle(el).objectFit);
    expect(fit).toBe("contain");

    await page.getByTestId("profile-video-player-close").click();
    await expect(sheet).toHaveCount(0);
  });
});

test.describe("Profile Videos section — desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(90_000);

  test("sheet frame max-width respects portrait/landscape clamp", async ({ page }) => {
    const { player, frame } = await openFirstTile(page);

    await expect
      .poll(
        async () =>
          player.evaluate((el) => {
            const v = /** @type {HTMLVideoElement} */ (el);
            return v.readyState >= 1 && v.videoWidth > 0;
          }),
        { timeout: 25000 }
      )
      .toBe(true);

    const meta = await player.evaluate((el) => {
      const v = /** @type {HTMLVideoElement} */ (el);
      return { w: v.videoWidth, h: v.videoHeight };
    });
    const landscape = meta.w >= meta.h;
    const box = await frame.boundingBox();
    expect(box).toBeTruthy();
    if (landscape) {
      expect(box.width).toBeLessThanOrEqual(560 + 2);
    } else {
      expect(box.width).toBeLessThanOrEqual(360 + 2);
    }
    expect(box.height).toBeLessThanOrEqual(640 + 2);

    const aspect = await frame.getAttribute("data-aspect");
    expect(["portrait", "landscape"]).toContain(aspect);
  });
});

test.describe("C1 diary text-only — All Burgers", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.setTimeout(90_000);

  test("What diners logged here has no video player", async ({ page }) => {
    await page.goto("/foodtrucks/all-burgers", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const diary = page.getByTestId("what-i-ate-at-restaurant");
    if ((await diary.count()) === 0) {
      test.info().annotations.push({ type: "note", description: "no diary entries — skip" });
      return;
    }
    await diary.first().scrollIntoViewIfNeeded();
    await expect(diary.locator("video")).toHaveCount(0);
    await expect(page.getByTestId("what-i-ate-restaurant-video")).toHaveCount(0);
    await expect(page.getByTestId("diners-saying-activity").locator("video")).toHaveCount(0);
  });
});
