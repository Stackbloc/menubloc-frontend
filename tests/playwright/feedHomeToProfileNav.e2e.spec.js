/**
 * E2E — Feed home → My Menuply → bottom nav still clickable.
 *
 * Root cause (feed-as-home): `/` used to mount a second FeedShell via children while
 * Profile lived under `/feed/*`. Leaving Feed for Profile rebuilt the shell and left
 * mobile primary tabs dead (Share My QR still opened a sheet).
 * Fix: HomeRoot redirects `/` → `/feed` (one shell + Outlet).
 *
 * Lab:
 *   npx playwright test tests/playwright/feedHomeToProfileNav.e2e.spec.js \
 *     --config=playwright.local.config.js --project=mobile
 *
 * Live tip (required for CPD Completeness):
 *   PLAYWRIGHT_BASE_URL=https://menuply.com \
 *     npx playwright test tests/playwright/feedHomeToProfileNav.e2e.spec.js \
 *     --config=playwright.local.config.js --project=mobile
 */

import { test, expect } from "@playwright/test";

const SESSION = {
  consumer: { id: 29, email: "e2e@menuply.test", email_verified: true },
  profile: { display_name: "E2E Diner" },
};

const FEED_ITEM = {
  id: "e2e-feed-clip-1",
  video_url: "https://example.com/e2e-clip.mp4",
  screen_name: "E2E Clip",
  restaurant_id: "11111111-1111-1111-1111-111111111111",
  restaurant_name: "E2E Cafe",
};

function emptyListBody() {
  return {
    ok: true,
    items: [],
    entries: [],
    activities: [],
    sessions: [],
    accepted: [],
    people: [],
    restaurants: [],
    likes: [],
    crews: [],
    events: [],
    groups: [],
    dishes: [],
    days: [],
    recommendations: [],
  };
}

async function mockApis(page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/api/consumer-auth/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SESSION),
      });
    }

    if (url.includes("see-whos-eating") || url.includes("live-feed") || url.includes("feed/videos")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, items: [FEED_ITEM], videos: [FEED_ITEM] }),
      });
    }

    if (url.includes("/api/consumer/profile") && !url.includes("/media") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: {
            display_name: "E2E Diner",
            diner_about: "",
            invite_me_out_audience: "none",
            diner_social_defaults: null,
            profile_completion: { needs_primary_location: false },
          },
          consumer: SESSION.consumer,
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(emptyListBody()),
    });
  });
}

test.describe("Feed home → Profile bottom nav", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("apex / redirects into one Feed shell; Profile then Deals/Home stay clickable", async ({ page }) => {
    await mockApis(page);
    // Feed-as-home entry: must not mount a second shell on `/`.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/feed\/?$/, { timeout: 30_000 });
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("feed-primary-nav")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("feed-nav-profile").click();
    await expect(page).toHaveURL(/\/feed\/profile/);
    await expect(page.getByTestId("feed-shell")).toBeVisible();

    await page.getByTestId("feed-nav-deals").click();
    await expect(page).toHaveURL(/\/feed\/deals/);

    await page.getByTestId("feed-nav-profile").click();
    await page.getByTestId("feed-nav-home").click();
    await expect(page).toHaveURL(/\/feed\/?$/);
  });

  test("after Feed→Profile, Home Deals Waiter Search navigate; feed reel unmounts", async ({ page }) => {
    await mockApis(page);
    await page.goto("/feed", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("feed-primary-nav")).toBeVisible({ timeout: 15_000 });

    // Feed home reel may or may not appear depending on API shape; Profile path is the bug.
    await page.getByTestId("feed-nav-profile").click();
    await expect(page).toHaveURL(/\/feed\/profile/);
    await expect(page.getByTestId("feed-shell")).toBeVisible();

    // Leftover body-portaled feedHome reel must not remain after leaving Feed home.
    await expect(page.locator('[data-testid="see-whos-eating-fullscreen"][data-variant="feedHome"]')).toHaveCount(
      0
    );

    await page.getByTestId("feed-nav-home").click();
    await expect(page).toHaveURL(/\/(feed\/?)?$/);

    await page.getByTestId("feed-nav-profile").click();
    await expect(page).toHaveURL(/\/feed\/profile/);

    await page.getByTestId("feed-nav-deals").click();
    await expect(page).toHaveURL(/\/feed\/deals/);

    await page.getByTestId("feed-nav-profile").click();
    await page.getByTestId("feed-nav-shop").click();
    await expect(page).toHaveURL(/\/feed\/search/);

    await page.getByTestId("feed-nav-profile").click();
    await page.getByTestId("feed-nav-waiter").click();
    await expect(page).toHaveURL(/\/waiter/);
  });

  test("Multiplier closes when tapping a primary tab without route change", async ({ page }) => {
    await mockApis(page);
    await page.goto("/feed/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("feed-nav-create-x").click();
    await expect(page.getByTestId("feed-video-create-sheet")).toBeVisible({ timeout: 10_000 });

    // Same route — pathname effect alone would leave Multiplier open.
    await page.getByTestId("feed-nav-profile").click();
    await expect(page.getByTestId("feed-video-create-sheet")).toHaveCount(0);
    await expect(page).toHaveURL(/\/feed\/profile/);
  });
});

test.describe("Feed home → Profile desktop rail", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("apex / → Profile → Deals/Home via desktop rail (same single shell)", async ({ page }) => {
    await mockApis(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/feed\/?$/, { timeout: 30_000 });
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("feed-desktop-rail")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("feed-primary-nav")).toHaveCount(0);

    await page.getByTestId("feed-nav-profile-desktop").click();
    await expect(page).toHaveURL(/\/feed\/profile/);
    await expect(page.getByTestId("feed-desktop-rail")).toBeVisible();

    await page.getByTestId("feed-nav-deals-desktop").click();
    await expect(page).toHaveURL(/\/feed\/deals/);

    await page.getByTestId("feed-nav-profile-desktop").click();
    await page.getByTestId("feed-nav-home-desktop").click();
    await expect(page).toHaveURL(/\/feed\/?$/);
  });
});
