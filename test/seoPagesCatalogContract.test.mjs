/**
 * public/seo-pages.json is the SEO Bot's list of every page type on menuply.com
 * (what Google should get from each). This keeps it complete: a route added to
 * src/App.jsx without a line in the catalog fails here, so the bot never silently
 * skips a new page.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const catalog = JSON.parse(readFileSync(new URL("../public/seo-pages.json", import.meta.url), "utf8"));
const KINDS = new Set(["index", "private", "alias", "either", "skip"]);

// Top-level routes only; nested relative routes ("connects", "me", …) belong to their parent.
const appRoutes = [...new Set([...app.matchAll(/\bpath="(\/[^"]*|\*)"/g)].map((m) => m[1]))];

function covers(entry, route) {
  if (entry.route === route) return true;
  if (entry.route.endsWith("/*")) {
    const base = entry.route.slice(0, -2);
    return route === base || route.startsWith(`${base}/`);
  }
  return false;
}

test("every route in App.jsx has a line in public/seo-pages.json", () => {
  const missing = appRoutes.filter((r) => !catalog.pages.some((e) => covers(e, r)));
  assert.deepEqual(missing, [], `add these routes to public/seo-pages.json: ${missing.join(", ")}`);
});

test("catalog lines are well formed and not stale", () => {
  const seen = new Set();
  for (const e of catalog.pages) {
    assert.ok(KINDS.has(e.kind), `${e.route}: kind "${e.kind}"`);
    assert.ok(e.label, `${e.route}: label`);
    assert.ok(!seen.has(e.route), `${e.route} listed twice`);
    seen.add(e.route);
    if (!e.route.endsWith("/*")) assert.ok(appRoutes.includes(e.route), `${e.route} is not a route in App.jsx any more`);
    for (const p of e.check || []) assert.match(p, /^\/[^:]*$/, `${e.route}: check paths are real paths`);
  }
});
