/**
 * Capture Cluster City page screenshots (desktop + mobile) with mocked API.
 * Run: npx playwright test tests/playwright/cluster-city-la.spec.js --reporter=list
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../../verification-output/cluster-city-la");

const MOCK_CITY_PAGE = {
  ok: true,
  city: "Los Angeles",
  state: "CA",
  state_slug: "california",
  city_slug: "los-angeles",
  cluster_city: true,
  live_clusters: [
    {
      name: "L.A. Live",
      slug: "la-live",
      type: "entertainment_complex",
      city: "Los Angeles",
      state: "CA",
      short_description: "Dining and entertainment around LA Live and Crypto.com Arena.",
      coverage_status: "complete",
      lifecycle: "live",
    },
    {
      name: "USC",
      slug: "usc",
      type: "university",
      city: "Los Angeles",
      state: "CA",
      short_description: "Campus dining around University Park.",
      coverage_status: "complete",
      lifecycle: "live",
    },
  ],
  starter_clusters: [
    {
      name: "LAX",
      slug: "lax",
      type: "airport",
      city: "Los Angeles",
      state: "CA",
      short_description: "Airport terminals and nearby dining.",
      coverage_status: "growing",
      progressive_listing: true,
      lifecycle: "starter",
      starter_checklist: [
        { id: "boundary", label: "Geographic boundary defined", complete: true },
        { id: "menus", label: "Additional menus welcome", pending: true },
      ],
    },
    {
      name: "UCLA",
      slug: "ucla",
      type: "university",
      city: "Los Angeles",
      state: "CA",
      short_description: "Westwood campus destinations.",
      coverage_status: "growing",
      progressive_listing: true,
      lifecycle: "starter",
    },
  ],
  all_clusters: [
    {
      name: "L.A. Live",
      slug: "la-live",
      type: "entertainment_complex",
      city: "Los Angeles",
      state: "CA",
      short_description: "Dining and entertainment around LA Live and Crypto.com Arena.",
      coverage_status: "complete",
    },
    {
      name: "USC",
      slug: "usc",
      type: "university",
      city: "Los Angeles",
      state: "CA",
      short_description: "Campus dining around University Park.",
      coverage_status: "complete",
    },
    {
      name: "LAX",
      slug: "lax",
      type: "airport",
      city: "Los Angeles",
      state: "CA",
      short_description: "Airport terminals and nearby dining.",
      coverage_status: "growing",
      progressive_listing: true,
    },
    {
      name: "UCLA",
      slug: "ucla",
      type: "university",
      city: "Los Angeles",
      state: "CA",
      short_description: "Westwood campus destinations.",
      coverage_status: "growing",
      progressive_listing: true,
    },
  ],
  type_groups: [
    {
      type: "airport",
      type_label: "Airports",
      clusters: [
        {
          name: "LAX",
          slug: "lax",
          type: "airport",
          city: "Los Angeles",
          state: "CA",
          short_description: "Airport terminals and nearby dining.",
          coverage_status: "growing",
          progressive_listing: true,
        },
      ],
    },
    {
      type: "entertainment_complex",
      type_label: "Entertainment Districts",
      clusters: [
        {
          name: "L.A. Live",
          slug: "la-live",
          type: "entertainment_complex",
          city: "Los Angeles",
          state: "CA",
          short_description: "Dining and entertainment around LA Live.",
          coverage_status: "complete",
        },
      ],
    },
    {
      type: "university",
      type_label: "Universities",
      clusters: [
        {
          name: "USC",
          slug: "usc",
          type: "university",
          city: "Los Angeles",
          state: "CA",
          short_description: "Campus dining around University Park.",
          coverage_status: "complete",
        },
        {
          name: "UCLA",
          slug: "ucla",
          type: "university",
          city: "Los Angeles",
          state: "CA",
          short_description: "Westwood campus destinations.",
          coverage_status: "growing",
          progressive_listing: true,
        },
      ],
    },
  ],
};

async function mockClusterCityApi(page) {
  await page.route("**/public/clusters/cities/california/los-angeles**", async (route) => {
    const url = route.request().url();
    if (url.includes("/search?")) {
      const q = new URL(url).searchParams.get("q") || "";
      const needle = q.toLowerCase();
      const matches = MOCK_CITY_PAGE.all_clusters.filter((cluster) =>
        [cluster.name, cluster.slug, cluster.type, cluster.short_description]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, clusters: matches, query: { q } }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CITY_PAGE),
    });
  });
}

test.describe("Cluster City LA screenshots", () => {
  test.use({ baseURL: process.env.CLUSTER_CITY_BASE_URL || "http://127.0.0.1:4173" });

  test.beforeEach(async ({ page }) => {
    await mockClusterCityApi(page);
    await page.addInitScript(() => {
      window.sessionStorage.setItem("grubbid.discovery.location", "Los Angeles, CA");
    });
  });

  test("desktop directory view", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/clusters/california/los-angeles");
    await expect(page.getByRole("heading", { name: "Los Angeles", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Live Clusters", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Starter Clusters", level: 2 })).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-directory.png"), fullPage: true });
  });

  test("mobile directory view", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/clusters/california/los-angeles");
    await expect(page.getByText("Where should I explore?")).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "mobile-directory.png"), fullPage: true });
  });

  test("desktop cluster search results", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/clusters/california/los-angeles");
    await page.getByRole("searchbox", { name: `Search clusters in Los Angeles` }).fill("airport");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("LAX")).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-search-airport.png"), fullPage: true });
  });
});
