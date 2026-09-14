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

async function expectPostButtonInViewport(page) {
  const post = page.getByTestId("status-line-post");
  await expect(post).toBeVisible();
  const box = await post.boundingBox();
  const vp = page.viewportSize();
  expect(box, "Post/Save must have a layout box").toBeTruthy();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual((vp?.height || 0) + 1);
  expect(box.x + box.width).toBeGreaterThan(0);
  expect(box.x).toBeLessThan(vp?.width || 0);
}

async function mockDinerApis(page, { uploadPosts, mealPosts, mealPatches = [], mealCreates = [] }) {
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

    if (
      method === "POST" &&
      url.includes("/api/consumer/what-i-ate-today") &&
      !url.includes("/meals") &&
      !url.includes("/photo")
    ) {
      const body = JSON.parse(req.postData() || "{}");
      mealCreates.push({ url, method, body });
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          entry: {
            id: 70002,
            food_name: body.food_name || "E2E extra",
            meal_id: body.meal_id || 80002,
            meal_period: body.meal_period || "lunch",
          },
        }),
      });
    }

    if (/\/api\/consumer\/what-i-ate-today\/\d+(?:\?|$)/.test(url) && method === "PATCH") {
      const body = JSON.parse(req.postData() || "{}");
      mealPatches.push({ url, method, body });
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          meal_id: body.ensure_meal ? 80002 : null,
          entry: {
            id: 70001,
            food_name: body.food_name || "E2E leftover pasta",
            meal_period: body.meal_period || "lunch",
            homemade: true,
            eaten_at: body.eaten_at || null,
            meal_id: body.ensure_meal ? 80002 : null,
          },
        }),
      });
    }

    if (
      method === "GET" &&
      url.includes("/api/consumer/what-i-ate-today") &&
      !url.includes("/calendar") &&
      !url.includes("/suggestions") &&
      !url.includes("/photo") &&
      !url.includes("/meals") &&
      !url.includes("/users/") &&
      !url.includes("/visibility")
    ) {
      let eatenOn = "2026-09-14";
      try {
        eatenOn = new URL(url).searchParams.get("eaten_on") || eatenOn;
      } catch {
        /* keep fallback */
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          entries: [
            {
              id: 70001,
              item_name: "E2E leftover pasta",
              food_name: "E2E leftover pasta",
              homemade: true,
              comment: "Homemade",
              meal_period: "lunch",
              eaten_on: eatenOn,
              eaten_at: `${eatenOn}T19:30:00.000Z`,
            },
          ],
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
    await expect(page.getByTestId("profile-view-mode-label")).toHaveText("Edit View");
    for (let i = 0; i < 3; i++) {
      await page.getByTestId("profile-view-mode-toggle").click();
      await expect(page).toHaveURL(/view=connect/);
      await expect(page.getByTestId("profile-view-mode-label")).toHaveText("Connect View");
      await expect(page.getByTestId("my-highlights-add")).toHaveCount(0);
      await page.getByTestId("profile-view-mode-toggle").click();
      await expect(page).not.toHaveURL(/view=connect/);
      await expect(page.getByTestId("profile-view-mode-label")).toHaveText("Edit View");
      await expect(page.getByTestId("my-highlights-add")).toBeVisible();
    }

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
    const ateAdd = page.locator('[data-testid="what-im-eating"] [data-testid="status-compose-open"]');
    await ateAdd.scrollIntoViewIfNeeded();
    await ateAdd.click();
    await expect(page.getByTestId("status-compose-sheet")).toBeVisible();

    await page.getByTestId("eating-status-mode").getByRole("button", { name: "@home" }).click();
    await page.getByTestId("athome-free-text").fill("E2E CPD item A");
    await page.getByTestId("ate-add-item").click();
    await page.getByTestId("ate-extra-item-0").fill("E2E CPD item B");
    await expectPostButtonInViewport(page);
    await page.getByTestId("status-line-post").click();
    await expect.poll(() => mealPosts.length).toBe(1);
  });

  test("Edit View What I'm Eating Edit prefills all fields and PATCHes", async ({ page }) => {
    const uploadPosts = [];
    const mealPosts = [];
    const mealPatches = [];
    await mockDinerApis(page, { uploadPosts, mealPosts, mealPatches });

    await page.goto("/feed/profile");
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 20_000 });
    const row = page.getByTestId("diner-activity-scan-row");
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.click({ button: "right" });
    await page.getByTestId("diner-activity-scan-edit").click();
    await expect(page.getByTestId("status-compose-sheet")).toBeVisible();
    await expect(page.getByText("Edit What I'm Eating")).toBeVisible();
    await expect(page.getByTestId("athome-free-text")).toHaveValue("E2E leftover pasta");
    await expect(page.getByTestId("eating-meal-clock-edit")).toBeVisible();
    await page.getByTestId("athome-free-text").fill("E2E leftover pasta edited");
    await expectPostButtonInViewport(page);
    await page.getByTestId("status-line-post").click();
    await expect.poll(() => mealPatches.length).toBe(1);
    expect(mealPatches[0].url).toMatch(/\/api\/consumer\/what-i-ate-today\/70001/);
    expect(String(mealPatches[0].body?.food_name || "")).toContain("edited");
  });

  test("Edit View extra item PATCHes ensure_meal and POSTs meal_id", async ({ page }) => {
    const uploadPosts = [];
    const mealPosts = [];
    const mealPatches = [];
    const mealCreates = [];
    await mockDinerApis(page, { uploadPosts, mealPosts, mealPatches, mealCreates });

    await page.goto("/feed/profile");
    await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 20_000 });
    const row = page.getByTestId("diner-activity-scan-row");
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.click({ button: "right" });
    await page.getByTestId("diner-activity-scan-edit").click();
    await expect(page.getByTestId("status-compose-sheet")).toBeVisible();
    await page.getByTestId("ate-add-item").click();
    await page.getByTestId("ate-extra-item-0").fill("Chili");
    await expectPostButtonInViewport(page);
    await page.getByTestId("status-line-post").click();
    await expect.poll(() => mealPatches.length).toBe(1);
    expect(mealPatches[0].body?.ensure_meal).toBe(true);
    await expect.poll(() => mealCreates.length).toBe(1);
    expect(mealCreates[0].body?.food_name).toBe("Chili");
    expect(Number(mealCreates[0].body?.meal_id)).toBe(80002);
  });
});
