/**
 * Local E2E: food trucks use custom FoodTruckPage profile (ProfileHeaderCard),
 * not restaurant editorial. /restaurants/:slug redirects to /foodtrucks/:slug.
 *
 * Run against local Vite (baseURL override):
 *   npx playwright test tests/playwright/food-truck-custom-profile.spec.js --project=desktop --config=playwright.local-foodtruck.config.js
 */
import { test, expect } from "@playwright/test";

const SLUG = "bachi-yaki-japanese-grill";

test.describe("custom food truck profile", () => {
  test("food truck route shows ProfileHeaderCard chrome and claim CTA", async ({ page }) => {
    await page.goto(`/foodtrucks/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Bachi Yaki/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    // Custom truck schedule affordance (ProfileHeaderCard)
    await expect(page.getByText(/Upcoming Locations \/ Events|View Full Schedule/i).first()).toBeVisible({
      timeout: 15_000,
    });
    // Sales-demo claim CTA on full_claimable
    await expect(page.getByRole("link", { name: /Claim this profile/i })).toBeVisible();
    // Display-only ordering notice for demo trucks
    await expect(page.getByText(/ordering unavailable|Checkout and payment are disabled/i).first()).toBeVisible();
    // Must NOT be restaurant editorial "Restaurant details" section
    await expect(page.getByText(/^Restaurant details$/i)).toHaveCount(0);
  });

  test("restaurants URL redirects to foodtrucks custom profile", async ({ page }) => {
    await page.goto(`/restaurants/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/foodtrucks/${SLUG}`), { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /Bachi Yaki/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Upcoming Locations \/ Events|View Full Schedule/i).first()).toBeVisible();
  });

  test("schedule page loads from food truck profile link", async ({ page }) => {
    await page.goto(`/foodtrucks/${SLUG}`, { waitUntil: "domcontentloaded" });
    const scheduleLink = page.getByRole("link", {
      name: /Upcoming Locations \/ Events|View Full Schedule/i,
    }).first();
    await expect(scheduleLink).toBeVisible({ timeout: 20_000 });
    await scheduleLink.click();
    await expect(page).toHaveURL(new RegExp(`/foodtrucks/${SLUG}/schedule`));
  });
});
