/**
 * UI Smoke Tests — menuply.com
 *
 * Verifies each protected route loads, is not blank, and contains
 * its expected primary element. No pixel comparison — load verification only.
 *
 * Run: npm run ui:smoke
 */

import { test, expect } from "@playwright/test";

const ROUTES = [
  {
    name: "homepage",
    path: "/",
    selector: 'input[placeholder], input[type="text"], input[type="search"]',
    description: "search input",
  },
  {
    name: "search",
    path: "/search?q=burger&city=Los+Angeles&state=CA",
    selector: "body",
    bodyContains: ["burger", "Burger", "result", "Result", "menu", "Menu", "Los Angeles"],
    description: "search results body",
  },
  {
    name: "waiter",
    path: "/waiter",
    selector: "body",
    bodyContains: ["Waiter", "waiter", "briefing", "Briefing", "food", "Food"],
    description: "waiter page body",
  },
  {
    name: "following",
    path: "/account/following",
    // unauthenticated → redirects to /account/login — either is acceptable
    allowedPaths: ["/account/following", "/account/login"],
    selector: "body",
    description: "following or login page",
  },
  {
    name: "checkout",
    path: "/checkout",
    selector: "body",
    bodyContains: ["Checkout", "checkout", "basket", "Basket", "cart", "Cart", "empty", "Empty"],
    description: "checkout page body",
  },
  {
    name: "signup",
    path: "/restaurant/signup",
    selector: "body",
    bodyContains: ["signup", "Signup", "sign up", "Sign Up", "restaurant", "Restaurant", "plan", "Plan"],
    description: "signup page body",
  },
  {
    name: "build-info",
    path: "/build-info",
    selector: "body",
    // Static heading is always present; table data loads async so don't check it here
    bodyContains: ["Menuply Build Info", "Build Info", "build-info"],
    description: "build info page heading",
  },
];

for (const route of ROUTES) {
  test(`smoke: ${route.name} — ${route.description}`, async ({ page, baseURL }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

    // Page must return a non-5xx status
    if (response) {
      expect(response.status(), `${route.name} returned HTTP error`).toBeLessThan(500);
    }

    // Allow redirects for auth-gated routes
    if (route.allowedPaths) {
      const currentPath = new URL(page.url()).pathname;
      const allowed = route.allowedPaths.some((p) => currentPath.startsWith(p));
      expect(allowed, `${route.name}: unexpected path ${currentPath}`).toBe(true);
    }

    // Page must not be blank — body must have visible text
    const bodyText = await page.locator("body").innerText().catch(() => "");
    expect(bodyText.trim().length, `${route.name}: page body is blank`).toBeGreaterThan(50);

    // Body must not contain React error boundary text
    expect(bodyText, `${route.name}: React crash detected`).not.toContain("Something went wrong");
    expect(bodyText, `${route.name}: React crash detected`).not.toContain("Cannot read properties");

    // Route-specific primary element check
    if (route.selector && route.selector !== "body") {
      await expect(
        page.locator(route.selector).first(),
        `${route.name}: expected element "${route.selector}" not found`
      ).toBeVisible({ timeout: 8000 });
    }

    // Body content check
    if (route.bodyContains) {
      const found = route.bodyContains.some((term) => bodyText.includes(term));
      expect(found, `${route.name}: none of [${route.bodyContains.join(", ")}] found in body`).toBe(true);
    }
  });
}

// Separate test: build-info.json must be served and parseable
test("smoke: build-info.json — static file served", async ({ page, baseURL }) => {
  const response = await page.goto("/build-info.json");
  expect(response?.status(), "build-info.json not found").toBe(200);

  const text = await page.locator("body").innerText().catch(() => "");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`build-info.json is not valid JSON: ${text.slice(0, 200)}`);
  }

  expect(parsed.app, "build-info.json missing app field").toBe("menuply-frontend");
  expect(parsed.gitSha, "build-info.json missing gitSha").toBeTruthy();
  expect(parsed.buildTime, "build-info.json missing buildTime").toBeTruthy();
});

// BottomNav presence check — only on routes that always mount it
// /checkout excluded: empty-basket early-return path does NOT mount BottomNav
const BOTTOM_NAV_ROUTES = ["/", "/search?q=burger&city=Los+Angeles&state=CA", "/waiter"];

for (const path of BOTTOM_NAV_ROUTES) {
  test(`smoke: bottom-nav present on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500); // allow React hydration

    const navCount = await page.locator("nav").count();
    expect(navCount, `BottomNav nav element missing on ${path}`).toBeGreaterThan(0);

    const navText = await page.locator("nav").first().innerText().catch(() => "");
    expect(navText, `BottomNav missing Home tab on ${path}`).toContain("Home");
    expect(navText, `BottomNav missing Waiter tab on ${path}`).toContain("Waiter");
    expect(navText, `BottomNav missing Following tab on ${path}`).toContain("Following");
    expect(navText, `BottomNav missing Basket tab on ${path}`).toContain("Basket");
  });
}
