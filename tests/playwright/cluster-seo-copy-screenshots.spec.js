/**
 * One-off Cluster SEO verification screenshots.
 * Run: npx playwright test tests/playwright/cluster-seo-copy-screenshots.spec.js --reporter=list
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLUSTER_SEO_CONTENT } from "../../src/lib/clusterSeoContent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../../verification-output/cluster-seo-copy");

function mockCluster(slug) {
  const seo = CLUSTER_SEO_CONTENT[slug];
  return {
    ok: true,
    cluster: {
      id: 1,
      name: seo.displayName,
      area_name: seo.displayName,
      slug,
      type: seo.clusterType,
      city: seo.city,
      state: seo.state,
      short_description: "API short description should not show when SEO exists.",
      page_heading: seo.displayName,
      coverage_status: slug === "lax" || slug === "atl-airport" ? "growing" : "complete",
      progressive_listing: slug === "lax" || slug === "atl-airport",
    },
  };
}

const EMPTY_FOOD = {
  ok: true,
  mks_categories: [{ code: "BURGERS", label: "Burgers", description: "Discover food" }],
  pagination: { has_more: false },
};

const EMPTY_RESTAURANTS = {
  ok: true,
  restaurants: [],
  placeholders: [],
  drinks_placeholders: [],
  pagination: { has_more: false },
};

async function mockDetailApis(page, slug) {
  const payload = mockCluster(slug);
  await page.route(`**/public/clusters/${slug}**`, async (route) => {
    const url = route.request().url();
    if (url.includes("/restaurants")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_RESTAURANTS) });
    }
    if (url.includes("/menu-items")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_FOOD) });
    }
    if (url.includes("/search")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, menu_items: [] }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
  });
}

async function mockDirectory(page) {
  const clusters = Object.values(CLUSTER_SEO_CONTENT).map((seo, index) => ({
    id: index + 1,
    name: seo.displayName,
    area_name: seo.displayName,
    slug: seo.slug,
    type: seo.clusterType,
    city: seo.city,
    state: seo.state,
    short_description: "API blurb",
    coverage_status: "complete",
  }));
  await page.route("**/public/clusters**", async (route) => {
    const url = route.request().url();
    if (/\/public\/clusters\/[^/?]+/.test(new URL(url).pathname) && !url.includes("limit=")) {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, clusters, total: clusters.length }),
    });
  });
}

test.describe("Cluster SEO copy screenshots", () => {
  test.use({ baseURL: process.env.CLUSTER_SEO_BASE_URL || "http://127.0.0.1:4177" });

  test("directory desktop", async ({ page }) => {
    await mockDirectory(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/clusters");
    await expect(page.getByRole("heading", { name: "Clusters", level: 1 })).toBeVisible();
    await expect(page.getByText(/organizes available restaurants and menu information/i)).toBeVisible();
    await expect(page.getByText(CLUSTER_SEO_CONTENT["la-live"].cardDescription)).toBeVisible();
    const title = await page.title();
    expect(title).toMatch(/Clusters/i);
    await page.screenshot({ path: path.join(OUT_DIR, "clusters-directory-desktop.png"), fullPage: true });
  });

  test("L.A. Live desktop + meta", async ({ page }) => {
    await mockDetailApis(page, "la-live");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/clusters/california/los-angeles/la-live");
    await expect(page.getByRole("heading", { name: "L.A. Live", level: 1 })).toBeVisible();
    await expect(page.getByText(/downtown Los Angeles/i).first()).toBeVisible();
    await expect(page.getByText("You're here. Now let's find something great to eat.")).toHaveCount(0);
    await expect(page.getByPlaceholder("Search L.A. Live menus")).toBeVisible();
    expect(await page.title()).toBe(CLUSTER_SEO_CONTENT["la-live"].seoTitle);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBe(CLUSTER_SEO_CONTENT["la-live"].metaDescription);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/\/clusters\/california\/los-angeles\/la-live$/);
    await page.screenshot({ path: path.join(OUT_DIR, "la-live-desktop.png"), fullPage: true });
  });

  test("LAX airport mobile", async ({ page }) => {
    await mockDetailApis(page, "lax");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/clusters/california/los-angeles/lax");
    await expect(page.getByText(/Los Angeles International Airport/i).first()).toBeVisible();
    await expect(page.getByPlaceholder("Search Dining Options at LAX")).toBeVisible();
    expect(await page.title()).toBe(CLUSTER_SEO_CONTENT.lax.seoTitle);
    await page.screenshot({ path: path.join(OUT_DIR, "lax-mobile.png"), fullPage: true });
  });

  test("UCLA university desktop", async ({ page }) => {
    await mockDetailApis(page, "ucla");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/clusters/california/los-angeles/ucla");
    await expect(page.getByText(/near UCLA in Westwood/i).first()).toBeVisible();
    await expect(page.getByPlaceholder("Search Dining Options near UCLA")).toBeVisible();
    expect(await page.title()).toBe(CLUSTER_SEO_CONTENT.ucla.seoTitle);
    await page.screenshot({ path: path.join(OUT_DIR, "ucla-desktop.png"), fullPage: true });
  });

  test("American Airlines Center arena desktop", async ({ page }) => {
    await mockDetailApis(page, "american-airlines-center");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/clusters/texas/dallas/american-airlines-center");
    await expect(page.getByText(/American Airlines Center in Dallas/i).first()).toBeVisible();
    await expect(page.getByPlaceholder("Search food at American Airlines Center")).toBeVisible();
    expect(await page.title()).toBe(CLUSTER_SEO_CONTENT["american-airlines-center"].seoTitle);
    await page.screenshot({ path: path.join(OUT_DIR, "aac-desktop.png"), fullPage: true });
  });
});
