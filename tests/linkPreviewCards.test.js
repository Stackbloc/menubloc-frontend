import assert from "node:assert/strict";
import test from "node:test";
import middleware from "../middleware.js";

// Minimal prerendered "/" shell — same tags the real dist/index.html carries.
const SHELL = `<!doctype html><html><head>
<title>Menuply | Discover Local Menus, Deals &amp; Nutrition</title>
<link rel="canonical" href="https://menuply.com/" />
<meta name="description" content="Browse restaurant menus near you.">
<meta property="og:title" content="Menuply">
<meta property="og:description" content="Browse restaurant menus near you.">
<meta property="og:url" content="https://menuply.com/" />
<meta property="og:image" content="https://menuply.com/menuply-share-default.png">
<meta name="twitter:title" content="Menuply">
<meta name="twitter:description" content="Browse restaurant menus near you.">
<meta name="twitter:image" content="https://menuply.com/menuply-share-default.png">
</head><body><div id="root"></div></body></html>`;

const CLUSTER = {
  id: 1,
  name: "L.A. Live",
  area_name: "L.A. Live",
  slug: "la-live",
  city: "Los Angeles",
  state: "CA",
  og_image_url: "https://menubloc-backend-production.up.railway.app/public/clusters/la-live/og-image",
};

function mockFetch(t) {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href === "https://menuply.com/") return new Response(SHELL, { status: 200 });
    if (href.includes("/public/clusters/la-live")) {
      return new Response(JSON.stringify({ ok: true, cluster: CLUSTER }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("not found", { status: 404 });
  };
}

function meta(html, attr, name) {
  const re = new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`);
  return re.exec(html)?.[1];
}

test("shared /search link previews name the query and the sharer's area", async (t) => {
  mockFetch(t);
  const url =
    "https://menuply.com/search?q=pasta&lat=34.05&lng=-118.24&radius_miles=8&location_label=Los+Angeles%2C+CA";
  const response = await middleware(new Request(url));
  const html = await response.text();
  assert.equal(response.headers.get("X-SEO-Middleware"), "injected");
  assert.equal(meta(html, "property", "og:title"), "“pasta” near Los Angeles, CA | Menuply");
  assert.match(meta(html, "property", "og:description"), /pasta dishes and restaurants near Los Angeles, CA/);
  assert.equal(meta(html, "property", "og:url"), url.replace(/&/g, "&amp;"));
  assert.equal(meta(html, "name", "twitter:title"), "“pasta” near Los Angeles, CA | Menuply");
  // Raster fallback image (SVG previews are dropped by iMessage/Facebook/Slack).
  assert.equal(meta(html, "property", "og:image"), "https://menuply.com/menuply-share-default.png");
  // No SEO change: search pages keep the shell canonical.
  assert.match(html, /<link rel="canonical" href="https:\/\/menuply\.com\/" \/>/);
});

test("/search preview includes dietary filters and escapes user text", async (t) => {
  mockFetch(t);
  const response = await middleware(
    new Request("https://menuply.com/search?q=%3Cb%3Etacos%3C%2Fb%3E&vegan=1&city=Austin&state=TX")
  );
  const html = await response.text();
  assert.equal(meta(html, "property", "og:title"), "“vegan &lt;b&gt;tacos&lt;/b&gt;” near Austin, TX | Menuply");
  assert.doesNotMatch(html, /<b>tacos/);
});

test("/search without a query passes through untouched", async (t) => {
  mockFetch(t);
  assert.equal(await middleware(new Request("https://menuply.com/search")), undefined);
});

test("cluster search links get a query card; canonical stays on the cluster", async (t) => {
  mockFetch(t);
  const response = await middleware(
    new Request("https://menuply.com/clusters/california/los-angeles/la-live?q=pasta")
  );
  const html = await response.text();
  assert.equal(meta(html, "property", "og:title"), "“pasta” at L.A. Live | Menuply");
  assert.equal(
    meta(html, "property", "og:url"),
    "https://menuply.com/clusters/california/los-angeles/la-live?q=pasta"
  );
  assert.equal(meta(html, "property", "og:image"), CLUSTER.og_image_url);
  assert.match(html, /<link rel="canonical" href="https:\/\/menuply\.com\/clusters\/california\/los-angeles\/la-live">/);
});

test("plain cluster links keep the cluster card", async (t) => {
  mockFetch(t);
  const response = await middleware(
    new Request("https://menuply.com/clusters/california/los-angeles/la-live")
  );
  const html = await response.text();
  assert.equal(meta(html, "property", "og:url"), "https://menuply.com/clusters/california/los-angeles/la-live");
  assert.doesNotMatch(meta(html, "property", "og:title"), /“/);
});

test("non-canonical cluster paths keep ?q= through the redirect", async (t) => {
  mockFetch(t);
  const response = await middleware(
    new Request("https://menuply.com/clusters/ca/los-angeles/la-live?q=pasta")
  );
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("Location"),
    "https://menuply.com/clusters/california/los-angeles/la-live?q=pasta"
  );
});
