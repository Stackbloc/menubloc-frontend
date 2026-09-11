/**
 * E2E — My Highlights stage → Save, then Home / Deals / Search / Waiter stay clickable.
 *
 * Proves the leftover camera/compose overlay does not freeze Feed nav after adding a photo.
 *
 * Run (dev server on :5173):
 *   npx playwright test tests/playwright/highlightsStageSaveNav.e2e.spec.js --config=playwright.local.config.js --project=mobile
 */

import { test, expect } from "@playwright/test";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

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

async function mockDinerApis(page, { uploadPosts, mealPosts }) {
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes("/api/consumer-auth/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SESSION),
      });
    }

    if (url.includes("/api/consumer/profile/media") && method === "POST") {
      uploadPosts.push({ url, method });
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          item: {
            id: 90001,
            media_kind: "photo",
            media_url: "https://example.test/e2e-highlight.png",
            is_highlight: true,
            sort_order: 0,
          },
        }),
      });
    }

    if (url.includes("/api/consumer/what-i-ate-today/meals") && method === "POST") {
      mealPosts.push({ url, method });
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          meal: { id: 80001, items: [{ id: 1 }, { id: 2 }] },
          items: [{ id: 1 }, { id: 2 }],
        }),
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

test.describe("My Highlights stage + Save does not freeze nav", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("library pick stages, Save POSTs, then Home/Deals/Search/Waiter click", async ({
    page,
  }) => {
    const uploadPosts = [];
    const mealPosts = [];
    await mockDinerApis(page, { uploadPosts, mealPosts });

    await page.goto("/feed/profile");
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("my-highlights-add")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("my-highlights-add").click();
    await expect(page.getByTestId("profile-gallery-compose-sheet")).toBeVisible();

    const chooserPromise = page.waitForEvent("filechooser", { timeout: 8_000 }).catch(() => null);
    await page.getByTestId("profile-gallery-option-library").click();
    const chooser = await chooserPromise;
    if (chooser) {
      await chooser.setFiles({
        name: "e2e-highlight.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      });
    } else {
      await page.getByTestId("profile-gallery-x-picker-library-input").setInputFiles({
        name: "e2e-highlight.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      });
    }

    expect(uploadPosts.length).toBe(0);
    await expect(page.getByTestId("profile-gallery-confirm-upload")).toBeVisible();
    await page.getByTestId("profile-gallery-confirm-upload").click();

    await expect(page.getByTestId("profile-gallery-compose-sheet")).toHaveCount(0);
    await expect(page.getByTestId("consumer-camera-sheet")).toHaveCount(0);
    await expect(page.getByTestId("my-highlight-pending")).toBeVisible();
    expect(uploadPosts.length).toBe(0);

    await page.getByTestId("my-highlights-save").click();
    await expect.poll(() => uploadPosts.length).toBe(1);

    await expect(page.getByTestId("profile-view-mode-toggle")).toBeVisible();
    await page.getByTestId("profile-view-mode-toggle").click();
    await expect(page).toHaveURL(/view=connect/);
    await page.getByTestId("profile-view-mode-toggle").click();
    await expect(page).not.toHaveURL(/view=connect/);

    await page.getByTestId("feed-nav-home").click();
    await expect(page).toHaveURL(/\/feed\/?$/);

    await page.goto("/feed/profile");
    await expect(page.getByTestId("feed-nav-deals")).toBeVisible();
    await page.getByTestId("feed-nav-deals").click();
    await expect(page).toHaveURL(/\/feed\/deals/);

    await page.goto("/feed/profile");
    await page.getByTestId("feed-nav-shop").click();
    await expect(page).toHaveURL(/\/feed\/search/);

    await page.goto("/feed/profile");
    await page.getByTestId("feed-nav-waiter").click();
    await expect(page).toHaveURL(/\/waiter/);
  });

  test("Edit View What I'm Eating Add another item POSTs items", async ({ page }) => {
    const uploadPosts = [];
    const mealPosts = [];
    await mockDinerApis(page, { uploadPosts, mealPosts });

    await page.goto("/feed/profile");
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 20_000 });
    await page.locator('[data-testid="eating-ate-panel"] [data-testid="status-compose-open"]').click();
    await expect(page.getByTestId("eating-status-line-compose")).toBeVisible();

    await page.getByRole("button", { name: "@home" }).click();
    await page.getByTestId("athome-free-text").fill("E2E CPD item A");
    await page.getByTestId("ate-add-item").click();
    await page.getByTestId("ate-extra-item-0").fill("E2E CPD item B");
    await page.getByTestId("status-line-post").click();
    await expect.poll(() => mealPosts.length).toBe(1);
  });
});
