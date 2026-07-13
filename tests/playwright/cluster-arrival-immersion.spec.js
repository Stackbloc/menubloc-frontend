/**
 * Cluster arrival immersion screenshots — desktop, tablet, mobile.
 * Run: npx playwright test tests/playwright/cluster-arrival-immersion.spec.js --reporter=list
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../../verification-output/cluster-immersion");

const MOCK_LA_LIVE = {
  ok: true,
  cluster: {
    id: 1,
    name: "L.A. Live",
    area_name: "L.A. Live",
    slug: "la-live",
    type: "entertainment_complex",
    city: "Los Angeles",
    state: "CA",
    short_description:
      "Dining and drinks around LA Live, Crypto.com Arena, and the convention center.",
    coverage_status: "complete",
    page_heading: "L.A. Live",
  },
};

const MOCK_LAX_STARTER = {
  ok: true,
  cluster: {
    id: 2,
    name: "LAX",
    area_name: "Los Angeles International Airport",
    slug: "lax",
    type: "airport",
    city: "Los Angeles",
    state: "CA",
    short_description: "Food across LAX terminals and nearby dining.",
    coverage_status: "growing",
    progressive_listing: true,
    page_heading: "LAX",
  },
};

const MOCK_FOOD_CATEGORIES = {
  ok: true,
  mks_categories: [
    { code: "BURGERS", label: "Burgers", description: "Discover food" },
    { code: "SALADS", label: "Salads", description: "Discover food" },
    { code: "BEVERAGES", label: "Beverages", description: "Discover food" },
  ],
  pagination: { has_more: false },
};

const MOCK_RESTAURANTS = {
  ok: true,
  restaurants: [
    {
      restaurant_id: 1,
      restaurant_name: "Dave & Buster's",
      cuisine: "American",
      menu_ready: true,
    },
  ],
  placeholders: [],
  drinks_placeholders: [],
  pagination: { has_more: false },
};

async function mockClusterApis(page, clusterPayload) {
  const slug = clusterPayload.cluster.slug;
  await page.route(`**/public/clusters/${slug}**`, async (route) => {
    const url = route.request().url();
    if (url.includes("/restaurants")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_RESTAURANTS) });
    }
    if (url.includes("/menu-items")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FOOD_CATEGORIES),
      });
    }
    if (url.includes("/search")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, menu_items: [] }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(clusterPayload) });
  });
}

test.describe("Cluster arrival immersion", () => {
  test.use({ baseURL: process.env.CLUSTER_CITY_BASE_URL || "http://127.0.0.1:4173" });

  test("L.A. Live desktop food arrival", async ({ page }) => {
    await mockClusterApis(page, MOCK_LA_LIVE);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/clusters/california/los-angeles/la-live");
    await expect(page.getByRole("heading", { name: "L.A. Live", level: 1 })).toBeVisible();
    await expect(page.getByText(/L\.A\. Live in downtown Los Angeles/i)).toBeVisible();
    await expect(page.getByText("You're here. Now let's find something great to eat.")).toHaveCount(0);
    await page.screenshot({ path: path.join(OUT_DIR, "la-live-desktop-food.png"), fullPage: true });
  });

  test("L.A. Live tablet food arrival", async ({ page }) => {
    await mockClusterApis(page, MOCK_LA_LIVE);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/clusters/california/los-angeles/la-live");
    await expect(page.getByRole("radio", { name: "Food" })).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "la-live-tablet-food.png"), fullPage: true });
  });

  test("L.A. Live mobile restaurants", async ({ page }) => {
    await mockClusterApis(page, MOCK_LA_LIVE);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/clusters/california/los-angeles/la-live?view=restaurants");
    await expect(page.getByRole("radio", { name: "Restaurants" })).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "la-live-mobile-restaurants.png"), fullPage: true });
  });

  test("LAX starter mobile food", async ({ page }) => {
    await mockClusterApis(page, MOCK_LAX_STARTER);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/clusters/california/los-angeles/lax");
    await expect(page.getByText("Growing Cluster")).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "lax-mobile-starter-food.png"), fullPage: true });
  });
});
