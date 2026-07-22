/**
 * Food truck personality profile: no inline menu; View menu icon; story sections.
 *
 *   npx playwright test --config=playwright.local-foodtruck.config.js --project=desktop
 */
import { test, expect } from "@playwright/test";

const SLUG = "bachi-yaki-japanese-grill";

test.describe("food truck personality profile", () => {
  test("food truck route shows personality sections and View menu icon", async ({ page }) => {
    await page.goto(`/foodtrucks/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Bachi Yaki/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("food-truck-public-editorial")).toBeVisible();
    await expect(page.getByTestId("food-truck-current-location")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Current Location:/i).first()).toBeVisible();
    await expect(page.getByTestId("food-truck-contact")).toBeVisible();
    await expect(page.getByTestId("food-truck-view-menu")).toBeVisible();
    await expect(page.getByTestId("food-truck-save-contact")).toBeVisible();
    await expect(page.getByTestId("food-truck-upcoming")).toBeVisible();
    await expect(page.getByTestId("food-truck-hours")).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Bio$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Featured dish/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Today's special/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Full menu/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Claim this profile/i })).toBeVisible();
    await expect(
      page.getByText(/ordering unavailable|Checkout and payment are disabled/i).first()
    ).toBeVisible();
  });

  test("restaurants URL redirects to foodtrucks personality profile", async ({ page }) => {
    await page.goto(`/restaurants/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/foodtrucks/${SLUG}`), { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /Bachi Yaki/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("food-truck-view-menu")).toBeVisible();
  });

  test("schedule page remains readable with light editorial colors", async ({ page }) => {
    await page.goto(`/foodtrucks/${SLUG}/schedule`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("food-truck-schedule-page")).toBeVisible({ timeout: 20_000 });
    const title = page.getByRole("heading", { name: /Bachi Yaki/i }).first();
    await expect(title).toBeVisible();
    const color = await title.evaluate((el) => getComputedStyle(el).color);
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(m).toBeTruthy();
    const [, r, g, b] = m.map(Number);
    expect(r).toBeLessThan(80);
    expect(g).toBeLessThan(80);
    expect(b).toBeLessThan(80);
  });
});
