import assert from "node:assert/strict";
import test from "node:test";
import middleware from "../middleware.js";

// Shared slugs (227 in-n-out-burger stores): each canonical URL must keep its own city
// instead of 301ing to whichever store a slug-only lookup returns first.

const SHELL = `<!doctype html><html><head>
<title>Menuply</title>
<link rel="canonical" href="https://menuply.com/" />
<meta name="description" content="Browse restaurant menus near you.">
</head><body><div id="root"></div></body></html>`;

const STORES = [
  { id: "1995", slug: "in-n-out-burger", name: "In-N-Out Burger", city: "Los Angeles", state: "CA", stateSlug: "california", citySlug: "los-angeles" },
  { id: "3951", slug: "in-n-out-burger", name: "In-N-Out Burger", city: "Riverton", state: "UT", stateSlug: "utah", citySlug: "riverton" },
];

// Mimics GET /public/meta/restaurants/:slug: exact route_state/route_city first, else first row.
function mockBackend(t) {
  const metaRequests = [];
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.origin === "https://menuply.com" && url.pathname === "/") return new Response(SHELL, { status: 200 });
    const m = /^\/public\/meta\/restaurants\/([^/]+)$/.exec(url.pathname);
    if (!m) return new Response("not found", { status: 404 });
    metaRequests.push(url);
    const rows = STORES.filter((s) => s.slug === decodeURIComponent(m[1]));
    const exact = rows.find(
      (s) => s.stateSlug === url.searchParams.get("route_state") && s.citySlug === url.searchParams.get("route_city")
    );
    const row = exact || rows[0];
    if (!row) return new Response(JSON.stringify({ ok: false }), { status: 404 });
    const { stateSlug, citySlug, ...data } = row;
    return new Response(JSON.stringify({ ok: true, data: { ...data, videos: [] } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return metaRequests;
}

function canonicalOf(html) {
  return /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
}

for (const suffix of ["/menu", ""]) {
  const kind = suffix ? "menu" : "profile";

  test(`shared-slug ${kind} URL in another city returns 200 with its own canonical`, async (t) => {
    const metaRequests = mockBackend(t);
    const url = `https://menuply.com/restaurants/utah/riverton/in-n-out-burger${suffix}`;
    const response = await middleware(new Request(url));
    assert.equal(response.status, 200);
    assert.equal(canonicalOf(await response.text()), url);
    assert.equal(metaRequests.length, 1);
    assert.equal(metaRequests[0].searchParams.get("route_state"), "utah");
    assert.equal(metaRequests[0].searchParams.get("route_city"), "riverton");
  });

  test(`shared-slug ${kind} URL with a wrong city still 301s to the resolved store`, async (t) => {
    mockBackend(t);
    const response = await middleware(
      new Request(`https://menuply.com/restaurants/texas/austin/in-n-out-burger${suffix}`)
    );
    assert.equal(response.status, 301);
    assert.equal(
      response.headers.get("location"),
      `https://menuply.com/restaurants/california/los-angeles/in-n-out-burger${suffix}`
    );
  });
}
