/**
 * E2E — Feed X sheet: Upload media replaces Share My Menuply; category picker → library compose.
 *
 * Run (dev server must be up on :5173):
 *   npx playwright test tests/playwright/feedXUploadMedia.e2e.spec.js --config=playwright.local.config.js --project=desktop
 */

import { test, expect } from "@playwright/test";

const MOCK_SESSION = {
  consumer: { id: "e2e-diner-1", email: "e2e@menuply.test", email_verified: true },
  profile: { display_name: "E2E Diner" },
};

async function mockConsumerApis(page) {
  await page.route("**/api/consumer-auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SESSION),
    })
  );
  await page.route("**/api/consumer/preferences**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        dietary_preferences: [],
        allergen_preferences: [],
        allergen_filter: null,
      }),
    })
  );
  await page.route("**/api/consumer/foods-to-avoid**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ foods_to_avoid: [] }),
    })
  );
  await page.route("**/api/see-whos-eating**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], public_video_count: 0 }),
    })
  );
}

async function openFeedXSheet(page) {
  await page.goto("/feed");
  await expect(page.getByTestId("feed-shell")).toBeVisible({ timeout: 15_000 });
  const xButton = page.getByTestId("feed-nav-create-x-desktop");
  await expect(xButton).toBeVisible();
  await xButton.click();
  await expect(page.getByTestId("feed-video-create-sheet")).toBeVisible();
}

test.describe("Feed X upload media E2E", () => {
  test("desktop X sheet shows Upload media, not Share My Menuply", async ({ page }) => {
    await mockConsumerApis(page);
    await openFeedXSheet(page);

    await expect(page.getByTestId("feed-x-upload-media")).toBeVisible();
    await expect(page.getByTestId("feed-x-share-my-menuply")).toHaveCount(0);
    await expect(page.getByTestId("feed-video-create-ate")).toBeVisible();
    await expect(page.getByTestId("feed-video-create-want")).toBeVisible();
    await expect(page.getByTestId("feed-video-create-reviews")).toBeVisible();
  });

  test("Upload media → category step → compose sheet (library)", async ({ page }) => {
    await mockConsumerApis(page);
    await openFeedXSheet(page);

    await page.getByTestId("feed-x-upload-media").click();
    await expect(page.locator('[data-upload-step="category"]')).toBeVisible();
    await expect(page.getByText("What is this video for?")).toBeVisible();
    await expect(page.getByTestId("feed-upload-media-ate")).toBeVisible();

    await page.getByTestId("feed-upload-media-ate").click();
    await expect(page.getByTestId("eating-compose-sheet")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("eating-compose-media")).toBeVisible();
    await expect(page.getByText("Record video")).toBeVisible();
  });

  test("record path still opens camera compose for ate", async ({ page }) => {
    await mockConsumerApis(page);
    await openFeedXSheet(page);

    await page.getByTestId("feed-video-create-ate").click();
    await expect(page.getByTestId("eating-compose-sheet")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("consumer-camera-sheet")).toBeVisible();
  });

  test("My Menu Stack has no Add menu entry", async ({ page }) => {
    await mockConsumerApis(page);
    await page.goto("/feed/menus");
    await expect(page.getByTestId("feed-menus-empty")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("feed-menus-add-menu")).toHaveCount(0);
    await expect(page.getByTestId("feed-menus-add-menu-header")).toHaveCount(0);
  });

  test("guest Upload media prompts signup", async ({ page }) => {
    await page.route("**/api/consumer-auth/me", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: "{}" })
    );
    await page.route("**/api/see-whos-eating**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], public_video_count: 0 }),
      })
    );
    await openFeedXSheet(page);
    await page.getByTestId("feed-x-upload-media").click();
    await expect(page).toHaveURL(/\/account\/signup/, { timeout: 10_000 });
  });
});
