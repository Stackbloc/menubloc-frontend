/**
 * LIVE TIP E2E — post-alias menuply.com (not localhost).
 * Auth mocked; browser loads the production tip JS.
 *
 *   PLAYWRIGHT_BASE_URL=https://menuply.com \
 *     npx playwright test tests/playwright/liveTipProfileNav.e2e.spec.js --config=playwright.local.config.js --project=mobile
 */

import { test, expect } from "@playwright/test";

const SESSION = {
  consumer: { id: 29, email: "e2e@menuply.test", email_verified: true },
  profile: { display_name: "E2E Diner" },
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

async function mockDinerApis(page) {
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

test.describe("Live tip profile nav + Edit/Connect", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Edit/Connect flips URL; Home and Deals navigate", async ({ page }) => {
    test.skip(
      !String(process.env.PLAYWRIGHT_BASE_URL || "").includes("menuply.com"),
      "Requires PLAYWRIGHT_BASE_URL=https://menuply.com (live tip)"
    );

    await mockDinerApis(page);
    await page.goto("/feed/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("profile-view-mode-toggle")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("profile-view-chrome")).toHaveCount(0);

    await page.getByTestId("profile-view-mode-toggle").click();
    await expect(page).toHaveURL(/view=connect/);
    await expect(page.getByTestId("profile-view-mode-label")).toHaveText("Connect View");
    await page.getByTestId("profile-view-mode-toggle").click();
    await expect(page).not.toHaveURL(/view=connect/);
    await expect(page.getByTestId("profile-view-mode-label")).toHaveText("Edit View");

    await page.getByTestId("feed-nav-home").click();
    await expect(page).toHaveURL(/\/feed\/?$/);

    await page.goto("/feed/profile");
    await page.getByTestId("feed-nav-deals").click();
    await expect(page).toHaveURL(/\/feed\/deals/);
  });
});
