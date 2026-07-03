import assert from "node:assert/strict";
import test from "node:test";
import middleware from "../middleware.js";
import { cityPath, restaurantMenuPath, restaurantPath } from "../src/lib/canonicalUrlCore.js";
import { INDEXABLE_STATIC_PAGES } from "../src/lib/sitemapConfig.js";

test("canonical URL core owns restaurant, menu, and existing city paths", () => {
  const entity = { slug: "the-old-mill", city: "Dothan", state: "AL" };
  assert.equal(restaurantPath(entity), "/restaurants/alabama/dothan/the-old-mill");
  assert.equal(restaurantMenuPath(entity), "/restaurants/alabama/dothan/the-old-mill/menu");
  assert.equal(cityPath(entity), "/restaurants/dothan-al");
  assert.equal(cityPath({ city: "Los Angeles", state: "California" }), "/restaurants/los-angeles-ca");
});

test("static sitemap allowlist excludes invalid and non-indexable routes", () => {
  const paths = INDEXABLE_STATIC_PAGES.map((entry) => entry.path);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(!paths.includes("/top-picks"));
  assert.ok(!paths.includes("/search"));
  assert.ok(!paths.some((path) => /^\/(operator|owner|admin|login|dashboard)(\/|$)/.test(path)));
});

test("sitemap middleware generates canonical entity URLs from inventory facts", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (url) => {
    assert.match(String(url), /\/public\/sitemap-inventory$/);
    return new Response(JSON.stringify({
      ok: true,
      cities: [{ city: "Dothan", state: "AL" }],
      restaurants: [{ id: 1, slug: "the-old-mill", city: "Dothan", state: "AL", updated_at: "2026-07-02T00:00:00Z" }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const response = await middleware(new Request("https://menuply.com/sitemap.xml"));
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.match(xml, /https:\/\/menuply\.com\/restaurants\/dothan-al/);
  assert.match(xml, /https:\/\/menuply\.com\/restaurants\/alabama\/dothan\/the-old-mill<\/loc>/);
  assert.match(xml, /https:\/\/menuply\.com\/restaurants\/alabama\/dothan\/the-old-mill\/menu/);
  assert.doesNotMatch(xml, /top-picks|\/search<\/loc>/);
});

test("sitemap middleware switches to a sitemap index before protocol limits", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const restaurants = Array.from({ length: 22500 }, (_, index) => ({
    id: index + 1,
    slug: `restaurant-${index + 1}`,
    city: "Dothan",
    state: "AL",
  }));
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    cities: [{ city: "Dothan", state: "AL" }],
    restaurants,
  }), { status: 200, headers: { "content-type": "application/json" } });

  const response = await middleware(new Request("https://menuply.com/sitemap.xml"));
  const xml = await response.text();
  assert.match(xml, /<sitemapindex/);
  assert.match(xml, /sitemaps\/sitemap-1\.xml/);
  assert.match(xml, /sitemaps\/sitemap-2\.xml/);
});
