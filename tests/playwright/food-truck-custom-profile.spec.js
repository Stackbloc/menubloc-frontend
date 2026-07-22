/**
 * Food trucks use editorial FoodTruckPublicEditorial + Where & when panel.
 * /restaurants/:slug redirects to /foodtrucks/:slug.
 *
 *   npx playwright test --config=playwright.local-foodtruck.config.js --project=desktop
 */
import { test, expect } from "@playwright/test";

const SLUG = "bachi-yaki-japanese-grill";

test.describe("food truck editorial profile", () => {
  test("food truck route shows editorial Where & when and claim CTA", async ({ page }) => {
    await page.goto(`/foodtrucks/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Bachi Yaki/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("food-truck-public-editorial")).toBeVisible();
    await expect(page.getByTestId("where-and-when-panel")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Where & when/i).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Upcoming locations \/ events|View full schedule/i }).first()
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Claim this profile/i })).toBeVisible();
    await expect(
      page.getByText(/ordering unavailable|Checkout and payment are disabled/i).first()
    ).toBeVisible();
  });

  test("restaurants URL redirects to foodtrucks editorial profile", async ({ page }) => {
    await page.goto(`/restaurants/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/foodtrucks/${SLUG}`), { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /Bachi Yaki/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("where-and-when-panel")).toBeVisible();
  });

  test("schedule page loads from Where & when link", async ({ page }) => {
    await page.goto(`/foodtrucks/${SLUG}`, { waitUntil: "domcontentloaded" });
    const scheduleLink = page
      .getByRole("link", { name: /Upcoming locations \/ events|View full schedule/i })
      .first();
    await expect(scheduleLink).toBeVisible({ timeout: 20_000 });
    await scheduleLink.click();
    await expect(page).toHaveURL(new RegExp(`/foodtrucks/${SLUG}/schedule`));
  });
});
