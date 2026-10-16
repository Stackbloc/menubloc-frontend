import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import middleware from "../middleware.js";

// Guards the Oct 2026 Vercel usage fixes: legacy restaurant URLs must not pull the
// 2.3 MB sitemap inventory, and city lookups reuse one cached copy.

const SHELL = `<!doctype html><html><head>
<title>Menuply</title>
<link rel="canonical" href="https://menuply.com/" />
<meta name="description" content="Browse restaurant menus near you.">
<meta property="og:title" content="Menuply">
<meta property="og:description" content="Browse restaurant menus near you.">
<meta property="og:url" content="https://menuply.com/" />
</head><body><div id="root"></div></body></html>`;

const INVENTORY = {
  ok: true,
  cities: [{ city: "Pasadena", state: "CA" }],
  restaurants: [{ slug: "copper-rye", city: "Pasadena", state: "CA" }],
  clusters: [],
};

function mockFetch(t) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (url) => {
    const href = String(url);
    calls.push(href);
    if (href === "https://menuply.com/") return new Response(SHELL, { status: 200 });
    if (href.endsWith("/public/sitemap-inventory")) {
      return new Response(JSON.stringify(INVENTORY), { status: 200 });
    }
    if (href.includes("/public/meta/restaurants/copper-rye")) {
      return new Response(
        JSON.stringify({ ok: true, data: { id: 7, slug: "copper-rye", name: "Copper Rye", city: "Pasadena", state: "CA" } }),
        { status: 200 }
      );
    }
    return new Response("not found", { status: 404 });
  };
  return calls;
}

test("legacy restaurant slug redirects without fetching the sitemap inventory", async (t) => {
  const calls = mockFetch(t);
  const response = await middleware(new Request("https://menuply.com/restaurants/copper-rye"));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://menuply.com/restaurants/california/pasadena/copper-rye");
  assert.ok(!calls.some((href) => href.endsWith("/public/sitemap-inventory")), calls.join("\n"));
});

test("legacy city page still renders, and repeat hits reuse the cached inventory", async (t) => {
  const calls = mockFetch(t);
  for (let i = 0; i < 3; i += 1) {
    const response = await middleware(new Request("https://menuply.com/restaurants/pasadena-ca"));
    const html = await response.text();
    assert.equal(response.headers.get("X-SEO-Middleware"), "injected");
    assert.match(html, /<title>Restaurants in Pasadena, CA \| Menuply<\/title>/);
    assert.match(html, /restaurants\/california\/pasadena\/copper-rye/);
  }
  assert.ok(calls.filter((href) => href.endsWith("/public/sitemap-inventory")).length <= 1, calls.join("\n"));
});

test("committed shell placeholder is null so dev and tests fall back to fetching /", () => {
  const src = readFileSync(new URL("../src/lib/seo/seoShell.generated.js", import.meta.url), "utf8");
  assert.match(src, /export const SEO_SHELL_HTML = null;/);
});
