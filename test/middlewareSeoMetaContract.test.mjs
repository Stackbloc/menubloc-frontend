/**
 * SEO Bot findings (2026-11-06), run against the real middleware with a mocked backend:
 *  - titles are escaped once ("McDonald&#39;s", never "McDonald&amp;#39;s");
 *  - chain-store titles carry city + state;
 *  - a restaurant / menu item the backend says doesn't exist answers 404 + noindex
 *    (not a 200 home shell with canonical "/" = Search Console soft 404);
 *  - the sitemap never lists a vercel.json redirect source;
 *  - a backend timeout still falls through (no 404 for a slow backend).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import middleware from "../middleware.js";
import { SITEMAP_PATH_REDIRECTS } from "../src/lib/sitemapConfig.js";

const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const realFetch = globalThis.fetch;

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const SHELL = `<!doctype html><html><head><title>Menuply | Discover Local Menus, Deals &amp; Nutrition</title>
<meta name="description" content="x"><meta property="og:title" content="x"><meta property="og:description" content="x">
<meta property="og:url" content="https://menuply.com/"><meta name="twitter:title" content="x"><meta name="twitter:description" content="x">
<link rel="canonical" href="https://menuply.com/">
</head><body><div id="root"></div></body></html>`;

function mockBackend(routes) {
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u === "https://menuply.com/") return new Response(SHELL, { status: 200 });
    for (const [needle, reply] of routes) if (u.includes(needle)) return typeof reply === "function" ? reply() : reply;
    return json(404, { ok: false, code: "NOT_FOUND" });
  };
}

async function get(path, ua = GOOGLEBOT) {
  return middleware(new Request(`https://menuply.com${path}`, { headers: { "user-agent": ua } }));
}

const mcd = { id: "71174", slug: "mcdonalds-roanoke-al-33-152-85-359", name: "McDonald's", city: "Roanoke", state: "AL", videos: [] };

test("restaurant profile title is escaped once and names the city", async () => {
  mockBackend([["/public/meta/restaurants/", () => json(200, { ok: true, data: mcd })]]);
  try {
    const res = await get(`/restaurants/alabama/roanoke/${mcd.slug}`);
    const html = await res.text();
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    assert.equal(title, "McDonald&#39;s — Roanoke, AL | Menuply");
    assert.ok(!html.includes("&amp;#39;"), "no double-escaped apostrophes anywhere");
  } finally { globalThis.fetch = realFetch; }
});

test("restaurant menu title is escaped once and names the city", async () => {
  mockBackend([
    ["/public/meta/restaurants/", () => json(200, { ok: true, data: mcd })],
    ["/public/restaurants/", () => json(200, { ok: true, sections: [] })],
  ]);
  try {
    const res = await get(`/restaurants/alabama/roanoke/${mcd.slug}/menu`);
    const html = await res.text();
    assert.equal(html.match(/<title>([^<]*)<\/title>/)[1], "McDonald&#39;s Menu — Roanoke, AL | Menuply");
    assert.ok(!html.includes("&amp;#39;"));
  } finally { globalThis.fetch = realFetch; }
});

test("missing restaurant answers 404 + noindex with no home canonical", async () => {
  mockBackend([]);
  try {
    for (const path of ["/restaurants/california/los-angeles/does-not-exist-xyz", "/restaurants/california/los-angeles/does-not-exist-xyz/menu", "/menu-items/1"]) {
      const res = await get(path);
      assert.ok(res, path);
      assert.equal(res.status, 404, path);
      const html = await res.text();
      assert.match(html, /<meta name="robots" content="noindex, follow">/, path);
      assert.ok(!/<link rel="canonical"/.test(html), `${path}: no canonical`);
    }
  } finally { globalThis.fetch = realFetch; }
});

test("backend timeout / 5xx still falls through (never a 404 for a slow backend)", async () => {
  mockBackend([["/public/meta/restaurants/", () => json(503, { ok: false })]]);
  try {
    const res = await get("/restaurants/california/los-angeles/in-n-out-burger");
    assert.equal(res, undefined);
  } finally { globalThis.fetch = realFetch; }
});

test("sitemap swaps redirect sources for their destination", async () => {
  mockBackend([["/public/sitemap-inventory", () => json(200, {
    ok: true, cities: [], restaurants: [], destination_venues: [], videos: [],
    clusters: [{ path: "/clusters/california/indio/coachella-2027" }, { path: "/clusters/california/los-angeles/usc" }],
  })]]);
  try {
    const res = await get("/sitemap.xml");
    const xml = await res.text();
    assert.ok(!xml.includes("coachella-2027"), "redirect source not listed");
    assert.ok(xml.includes("/clusters/california/indio/indio-festival-grounds"));
    assert.ok(xml.includes("/clusters/california/los-angeles/usc"));
  } finally { globalThis.fetch = realFetch; }
});

test("SITEMAP_PATH_REDIRECTS matches every path redirect in vercel.json", () => {
  const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const pathRedirects = (vercel.redirects || []).filter((r) => r.source.startsWith("/") && !r.source.includes("(") && !r.has);
  const expected = Object.fromEntries(pathRedirects.map((r) => [r.source, r.destination]));
  assert.deepEqual({ ...SITEMAP_PATH_REDIRECTS }, expected);
});
