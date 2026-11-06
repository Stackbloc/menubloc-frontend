import assert from "node:assert/strict";
import test from "node:test";
import middleware from "../middleware.js";

// menuply.com/clusters/walls/usc (Andre 2026-11-06): its own title/description, lowercase canonical,
// never read as a /clusters/:state/:city page.
const SHELL = `<!doctype html><html><head>
<title>Menuply</title>
<link rel="canonical" href="https://menuply.com/" />
<meta name="description" content="Browse restaurant menus near you.">
<meta property="og:title" content="Menuply">
<meta property="og:description" content="Browse restaurant menus near you.">
<meta property="og:url" content="https://menuply.com/" />
<meta name="twitter:title" content="Menuply">
<meta name="twitter:description" content="Browse restaurant menus near you.">
</head><body><div id="root"></div></body></html>`;

function mockFetch(t) {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url) =>
    String(url) === "https://menuply.com/" ? new Response(SHELL, { status: 200 }) : new Response("not found", { status: 404 });
}

const meta = (html, attr, name) => new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(html)?.[1];

test("/clusters/walls/usc gets the USC Wall title, description and canonical", async (t) => {
  mockFetch(t);
  const res = await middleware(new Request("https://menuply.com/clusters/walls/usc"));
  const html = await res.text();
  assert.equal(res.headers.get("X-SEO-Middleware"), "injected");
  assert.match(html, /<title>USC Wall \| Menuply<\/title>/);
  assert.equal(meta(html, "property", "og:title"), "USC Wall | Menuply");
  assert.equal(
    meta(html, "name", "description"),
    "See what&#39;s happening around USC. Read messages, discover campus activities, and leave your mark on the USC Wall."
  );
  assert.equal(meta(html, "property", "og:url"), "https://menuply.com/clusters/walls/usc");
  assert.match(html, /<link rel="canonical" href="https:\/\/menuply.com\/clusters\/walls\/usc">/);
  assert.doesNotMatch(html, /Restaurant Clusters/);
});

test("other capitalisation 301s to the lowercase Wall URL (query kept)", async (t) => {
  mockFetch(t);
  const res = await middleware(new Request("https://menuply.com/clusters/Walls/USC?src=qr"));
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), "https://menuply.com/clusters/walls/usc?src=qr");
});

test("unknown Wall slugs fall through to the SPA (no fake meta)", async (t) => {
  mockFetch(t);
  const res = await middleware(new Request("https://menuply.com/clusters/walls/nowhere"));
  assert.equal(res, undefined);
});
