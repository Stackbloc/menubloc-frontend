/**
 * public/seo-pages.json is the SEO Bot's list of every page type on menuply.com
 * (what Google should get from each). A route added to src/App.jsx without a line
 * here is NOT skipped: the build publishes it as kind "new" (scripts/buildSeoPages.mjs)
 * and the bot flags it for a decision. These tests keep both halves honest.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appRoutes, covers, unlistedRoutes, withNewRoutes } from "../src/lib/seo/seoPagesCatalog.mjs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const catalog = JSON.parse(readFileSync(new URL("../public/seo-pages.json", import.meta.url), "utf8"));
const KINDS = new Set(["index", "private", "alias", "either", "skip"]);
const routes = appRoutes(app);

test("today every route in App.jsx is classified in public/seo-pages.json", () => {
  assert.deepEqual(unlistedRoutes(catalog, routes), [], "classify these in public/seo-pages.json (until then they ship as \"new\")");
});

test("a route nobody classified is published as kind \"new\", never dropped", () => {
  const published = withNewRoutes(catalog, [...routes, "/brand-new-page", "/account/new-thing"]);
  const added = published.pages.filter((p) => p.kind === "new");
  assert.deepEqual(added.map((p) => p.route), ["/brand-new-page"], "/account/new-thing is already covered by /account/*");
  assert.ok(routes.every((r) => published.pages.some((e) => covers(e, r))));
});

test("the build publishes the catalog (package.json build runs buildSeoPages)", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(pkg.scripts.build, /node scripts\/buildSeoPages\.mjs/);
});

test("catalog lines are well formed and not stale", () => {
  const seen = new Set();
  for (const e of catalog.pages) {
    assert.ok(KINDS.has(e.kind), `${e.route}: kind "${e.kind}" (hand-written lines can't be "new")`);
    assert.ok(e.label, `${e.route}: label`);
    assert.ok(!seen.has(e.route), `${e.route} listed twice`);
    seen.add(e.route);
    if (!e.route.endsWith("/*")) assert.ok(routes.includes(e.route), `${e.route} is not a route in App.jsx any more`);
    for (const p of e.check || []) assert.match(p, /^\/[^:]*$/, `${e.route}: check paths are real paths`);
  }
});
