import test from "node:test";
import assert from "node:assert/strict";
import { buildClusterShareData } from "../src/components/share/shareUtils.js";

test("buildClusterShareData returns canonical cluster share payload with OG image", () => {
  const payload = buildClusterShareData({
    cluster: {
      name: "L.A. Live",
      slug: "la-live",
      type: "entertainment_complex",
      city: "Los Angeles",
      state: "CA",
      restaurant_count: 16,
      area_name: "L.A. Live",
      page_title: "L.A. Live Area Restaurants",
      share_title: "L.A. Live Area Restaurants | Menuply",
      share_description:
        "Browse menu information for restaurants around L.A. Live. Menuply is an independent menu discovery platform.",
      og_image_url: "https://menubloc-backend-production.up.railway.app/public/clusters/la-live/og-image",
    },
    origin: "https://menuply.com",
  });

  assert.equal(payload.title, "L.A. Live Restaurants, Menus & Food | Menuply");
  assert.equal(payload.url, "https://menuply.com/clusters/california/los-angeles/la-live");
  assert.equal(
    payload.image,
    "https://menubloc-backend-production.up.railway.app/public/clusters/la-live/og-image"
  );
  assert.match(payload.description, /L\.A\. Live in Los Angeles/);
  assert.doesNotMatch(payload.description, /official|partner|sponsored|endorsed|affiliated/i);
});

test("buildClusterShareData carries an active food search so the link reopens on the same results", () => {
  const cluster = { name: "Little Tokyo", area_name: "Little Tokyo", slug: "little-tokyo", city: "Los Angeles", state: "CA" };
  const payload = buildClusterShareData({ cluster, origin: "https://menuply.com", searchQuery: "pasta & salad" });
  assert.equal(
    payload.url,
    "https://menuply.com/clusters/california/los-angeles/little-tokyo?q=pasta%20%26%20salad"
  );
  assert.match(payload.title, /pasta & salad/);
  assert.match(payload.description, /Little Tokyo/);

  const base = buildClusterShareData({ cluster, origin: "https://menuply.com", searchQuery: "  " });
  assert.equal(base.url, "https://menuply.com/clusters/california/los-angeles/little-tokyo");
});

test("ClusterPage keeps the food search in ?q= and shares it from the Share button only", async () => {
  const { readFileSync } = await import("node:fs");
  const page = readFileSync(new URL("../src/pages/ClusterPage.jsx", import.meta.url), "utf8");
  assert.match(page, /searchParams\.get\(CLUSTER_SEARCH_QUERY_KEY\)/);
  assert.match(page, /params\.set\(CLUSTER_SEARCH_QUERY_KEY, trimmed\)/);
  assert.match(page, /shareData=\{shareButtonData\}/);
  // Canonical / OG metadata must stay on the base cluster URL.
  assert.match(page, /applyDocumentSocialMetadata\(\{\s*title: shareData\.title/);
});

test("buildClusterShareData carries a tapped food category (?category=)", async () => {
  const { readClusterShareFilters } = await import("../src/lib/clusterShareFilters.js");
  const cluster = { name: "L.A. Live", area_name: "L.A. Live", slug: "la-live", city: "Los Angeles", state: "CA" };
  const filters = readClusterShareFilters(new URLSearchParams("category=PASTA"));
  const payload = buildClusterShareData({ cluster, origin: "https://menuply.com", filters });
  assert.equal(payload.url, "https://menuply.com/clusters/california/los-angeles/la-live?category=PASTA");
  assert.equal(payload.title, "Pasta at L.A. Live | Menuply");

  const drinks = readClusterShareFilters(new URLSearchParams("category=BEVERAGES&drink=coffee"));
  assert.equal(drinks.label, "Coffee");
  assert.equal(
    buildClusterShareData({ cluster, origin: "https://menuply.com", filters: drinks }).url,
    "https://menuply.com/clusters/california/los-angeles/la-live?category=BEVERAGES&drink=coffee"
  );
  // Junk codes are ignored rather than echoed into links.
  assert.equal(readClusterShareFilters(new URLSearchParams("category=<x>")).label, "");
});

test("ClusterPage keeps the tapped category in ?category= and restores it", async () => {
  const { readFileSync } = await import("node:fs");
  const page = readFileSync(new URL("../src/pages/ClusterPage.jsx", import.meta.url), "utf8");
  assert.match(page, /params\.set\(CLUSTER_CATEGORY_QUERY_KEY, category\.code\)/);
  assert.match(page, /onSelect=\{\(category\) => selectCategory\(category\)\}/);
  assert.match(page, /if \(match\) setSelectedCategory\(match\)/);
  assert.match(page, /filters: shareFilters/);
});
