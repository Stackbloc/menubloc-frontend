/**
 * Food truck signup wiring smoke — plan CTA + restaurant-parity verify-email handoff.
 * Run:
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5175 \
 *   npx playwright test tests/playwright/food-truck-signup-wiring.spec.js --project=desktop --timeout=90000
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5175";

test.describe("Food truck signup wiring", () => {
  test("plan Select CTA focuses account form", async ({ page }) => {
    await page.goto(`${BASE}/foodtruck/signup`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("food-truck-plan-card")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("food-truck-plan-signup-cta")).toHaveText(/Select Food Truck/i);
    await expect(page.locator("#food-truck-signup-form")).toBeVisible();
    await expect(page.getByText("$89/year")).toBeVisible();

    await page.getByTestId("food-truck-plan-signup-cta").click();
    await expect(page.locator("#email")).toBeFocused({ timeout: 3000 });
  });

  test("submit creates account and lands on verify-email with autoSend", async ({ page }) => {
    const stamp = Date.now();
    const email = `ft.wiring.${stamp}@mailinator.com`;

    await page.goto(`${BASE}/foodtruck/signup`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("food-truck-plan-signup-cta")).toBeVisible({ timeout: 15000 });

    await page.locator("#email").fill(email);
    await page.locator("#password").fill("TestPass1");
    await page.locator("#confirmPassword").fill("TestPass1");
    await page.locator("#truck_name").fill(`Wiring Truck ${stamp}`);
    await page.locator("#city").fill("Los Angeles");
    await page.locator("#state").fill("CA");
    await page.locator("#owner_name").fill("Wiring Owner");
    await page.locator("#phone").fill("3105550199");
    await page.locator('input[name="legalConsent"]').check();

    const profilePromise = page.waitForResponse(
      (res) => res.url().includes("/owner/profile") && res.request().method() === "POST",
      { timeout: 45000 }
    );
    const sendCodePromise = page.waitForResponse(
      (res) => res.url().includes("/restaurant-auth/send-email-code") && res.request().method() === "POST",
      { timeout: 45000 }
    );

    await page.getByRole("button", { name: /Sign up for Food Truck/i }).click();

    const profileRes = await profilePromise;
    expect(profileRes.ok(), `owner/profile status ${profileRes.status()}`).toBeTruthy();
    const profileJson = await profileRes.json();
    expect(profileJson.ok).toBeTruthy();
    expect(Number(profileJson.restaurant?.id || 0)).toBeGreaterThan(0);

    await expect(page).toHaveURL(/\/operator\/verify-email/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: /Verify your email/i })).toBeVisible();
    await expect(page.locator("#operator-verify-email")).toHaveValue(email);

    const sendRes = await sendCodePromise;
    // Wiring proof: autoSend hit the restaurant-auth route for the new account.
    // 404 = account missing (broken). 200 = delivered. Non-404 means operator exists.
    expect(sendRes.status(), `send-email-code status ${sendRes.status()}`).not.toBe(404);
    const sendJson = await sendRes.json().catch(() => ({}));
    if (sendRes.status() >= 500) {
      // Provider/mailer failure is outside signup wiring; still prove operator was found.
      expect(String(sendJson.error || "")).not.toMatch(/Operator account not found/i);
    }
  });
});
