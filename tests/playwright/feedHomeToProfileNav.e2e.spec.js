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

    if (
      url.includes("/api/consumer/social-events") &&
      !url.includes("/connections/") &&
      method === "GET"
    ) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          events: [
            {
              id: 9001,
              title: "Thanksgiving dinner",
              event_date: "2026-11-26",
              start_time: null,
              location_label: null,
              description: null,
              join_me_open: false,
              join_audience: "none",
              join_allowed_user_ids: [],
              is_past: false,
              kind: "diner_social",
            },
          ],
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

    // Signed-in repro: let the reel mount/play before leaving for Profile.
    await expect(page.getByTestId("see-whos-eating-fullscreen")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("see-whos-eating-video-tap")).toBeVisible({
      timeout: 15_000,
    });
    // clearStuck must not strip the live Feed <video> src on route enter.
    const feedVideo = page.locator(
      '[data-testid="see-whos-eating-fullscreen"][data-variant="feedHome"] video'
    );
    await expect(feedVideo).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () => feedVideo.evaluate((el) => Boolean(el.currentSrc || el.getAttribute("src"))), {
        timeout: 15_000,
      })
      .toBe(true);
    await expect
      .poll(
        async () =>
          feedVideo.evaluate((el) => !el.paused || el.readyState >= 2),
        { timeout: 15_000 }
      )
      .toBe(true);
    await page.waitForTimeout(400);

    await page.getByTestId("feed-nav-profile").click();
    await expect(page).toHaveURL(/\/feed\/profile/);
    await expect(page.getByTestId("feed-shell")).toBeVisible();
    await expect(page.getByTestId("my-menuply-page")).toBeVisible({ timeout: 15_000 });

    // Leftover body-portaled feedHome reel must not remain after leaving Feed home.
    await expect(page.locator('[data-testid="see-whos-eating-fullscreen"][data-variant="feedHome"]')).toHaveCount(
      0
    );
    // Mobile nav is body-portaled and must still be the hit target.
    await expect(page.getByTestId("feed-primary-nav")).toBeVisible();

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

  test("guest Feed → Profile → sign-in return keeps primary nav clickable", async ({ page }) => {
    let authed = false;
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (url.includes("/api/consumer-auth/me")) {
        if (!authed) {
          return route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "unauthorized" }),
          });
        }
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

    await page.goto("/feed", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("feed-nav-profile").click();
    await expect(page.getByTestId("feed-guest-profile-landing")).toBeVisible({ timeout: 15_000 });

    // Login return: same next=/feed/profile path as FeedGuestProfileLanding sign-in.
    authed = true;
    await page.goto("/feed/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("my-menuply-page")).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("feed-nav-deals").click();
    await expect(page).toHaveURL(/\/feed\/deals/);
    await page.getByTestId("feed-nav-home").click();
    await expect(page).toHaveURL(/\/feed\/?$/);
  });

  test("after Deals reel → Profile, Home/Deals stay clickable", async ({ page }) => {
    await mockApis(page);
    await page.route("**/api/deals**", async (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          deals: [
            {
              id: "e2e-deal-1",
              title: "E2E Deal",
              video_url: "https://example.com/e2e-deal.mp4",
              restaurant_id: "11111111-1111-1111-1111-111111111111",
              restaurant_name: "E2E Cafe",
              href: "/deals",
            },
          ],
        }),
      });
    });

    await page.goto("/feed/deals", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("feed-primary-nav")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);

    await page.getByTestId("feed-nav-profile").click();
    await expect(page).toHaveURL(/\/feed\/profile/);
    await expect(page.getByTestId("my-menuply-page")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("feed-deals-video-swipe")).toHaveCount(0);

    await page.getByTestId("feed-nav-home").click();
    await expect(page).toHaveURL(/\/feed\/?$/);
    await page.getByTestId("feed-nav-deals").click();
    await expect(page).toHaveURL(/\/feed\/deals/);
  });

  test("Feed → Profile Edit View (default) keeps Home/Deals clickable", async ({ page }) => {
    await mockApis(page);
    await page.goto("/feed", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(400);

    await page.getByTestId("feed-nav-profile").click();
    await expect(page).toHaveURL(/\/feed\/profile/);
    await expect(page.getByTestId("my-menuply-page")).toBeVisible({ timeout: 15_000 });
    // Default signed-in profile is Edit View (no ?view=connect).
    expect(page.url()).not.toMatch(/view=connect/);

    await page.getByTestId("feed-nav-home").click();
    await expect(page).toHaveURL(/\/feed\/?$/);
    await page.getByTestId("feed-nav-deals").click();
    await expect(page).toHaveURL(/\/feed\/deals/);
    await page.getByTestId("feed-nav-profile").click();
    await expect(page.getByTestId("my-menuply-page")).toBeVisible({ timeout: 15_000 });
  });

  test("Profile Edit View shows eight shared SectionHeader titles", async ({ page }) => {
    await mockApis(page);
    await page.goto("/feed/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("my-menuply-page")).toBeVisible({ timeout: 30_000 });

    const headers = [
      ["about-me-section-header", "About me"],
      ["my-highlights-section-header", "My reel"],
      ["my-favs-section-header", "My Favs"],
      ["what-im-eating-section-header", "What I'm eating"],
      ["wanna-eat-section-header", "What I wanna eat"],
      ["eating-plans-section-header", "What's cookin'"],
      ["crews-section-header", "My crews"],
      ["events-section-header", "My events"],
    ];

    for (const [testId, title] of headers) {
      const header = page.getByTestId(testId);
      await expect(header).toBeVisible({ timeout: 15_000 });
      await expect(header.getByRole("heading", { level: 2 })).toHaveText(title);
      await expect(header.getByTestId("section-header-accent")).toBeVisible();
    }
  });

  test("Profile Edit View has no section Join Me preset; event Join Me is per card", async ({
    page,
  }) => {
    await mockApis(page);
    await page.goto("/feed/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("my-menuply-page")).toBeVisible({ timeout: 30_000 });

    await expect(page.getByTestId("preset-plans")).toHaveCount(0);
    await expect(page.getByTestId("preset-events")).toHaveCount(0);
    await expect(page.getByText("Join Me is On", { exact: false })).toHaveCount(0);

    await expect(page.getByTestId("named-share-edit-join-me").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("named-share-edit-join-me").first()).toHaveText(
      "Turn on Join Me"
    );
    await page.getByTestId("named-share-edit-join-me").first().click();
    await expect(page.getByTestId("event-compose-sheet")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("event-compose-join-me")).toBeVisible();
    await expect(page.getByText("Open to Join Me")).toBeVisible();
    await expect(page.getByTestId("event-compose-submit")).toHaveText("Save event");
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
