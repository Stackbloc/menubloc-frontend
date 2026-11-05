import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageSrc = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");
const themeSrc = readFileSync(join(root, "src/styles/clusterLaLiveTheme.css"), "utf8");

// 2026-11-05 (Andre): the website cluster page follows the app — one page, no Food/Restaurants toggle.
test("one page in the app's order: clips → Food by type → Restaurants A–Z → folded cluster info", () => {
  assert.doesNotMatch(pageSrc, /function ClusterViewToggle/);
  assert.doesNotMatch(pageSrc, /data-testid="cluster-view-panel-restaurants"/);
  const body = pageSrc.slice(pageSrc.indexOf('data-testid="cluster-view-panel-menu"'));
  const food = body.indexOf("preContent={clusterFoodHero}");
  const restaurants = body.indexOf("{clusterRestaurantsSection}");
  const extras = body.indexOf("{clusterExtras}");
  assert.ok(food > 0 && restaurants > food && extras > restaurants);
  assert.match(pageSrc, /<h2 style=\{CLUSTER_SECTION_TITLE_STYLE\}>Restaurants A–Z<\/h2>/);
  assert.match(pageSrc, /<h2 style=\{CLUSTER_SECTION_TITLE_STYLE\}>Food by type<\/h2>/);
});

test("restaurants are A–Z, 8 then Show all", () => {
  assert.match(pageSrc, /const RESTAURANTS_PREVIEW_COUNT = 8/);
  assert.match(pageSrc, /localeCompare/);
  assert.match(pageSrc, /`Show all \$\{sorted\.length\}`/);
  assert.doesNotMatch(pageSrc, /groupClusterRestaurantsByCuisine/);
});

test("dining halls, today's reports and events are folded at the bottom", () => {
  const extras = pageSrc.slice(pageSrc.indexOf("const clusterExtras = ("), pageSrc.indexOf("const clusterRestaurantsSection = ("));
  assert.match(extras, /<CampusDiningSection/);
  assert.match(extras, /<ClusterFold title=\{`Today at \$\{clusterLabel\}`\}/);
  assert.match(extras, /<ClusterFold\s+title="Events nearby"/);
  assert.match(extras, /hidden=\{!eventCount\}/, "no events = no fold line");
  const header = pageSrc.slice(pageSrc.indexOf("<header"), pageSrc.indexOf("</header>"));
  assert.doesNotMatch(header, /ClusterPublicFeed|CampusDiningSection|ClusterNearbyEvents/);
});

test("old ?view=restaurants links open at Restaurants A–Z", () => {
  assert.match(pageSrc, /wantsRestaurants/);
  assert.match(pageSrc, /getElementById\("cluster-restaurants"\)/);
});

test("open food type: back circle + floating All types pill", () => {
  assert.match(pageSrc, /data-testid="cluster-types-back"/);
  assert.match(pageSrc, /data-testid="cluster-types-float-back"/);
  assert.match(pageSrc, /All types/);
});

test("L.A. LIVE theme makes selected Food/Restaurants toggle gold (not invisible black)", () => {
  assert.match(themeSrc, /\.cluster-view-toggle\[aria-pressed="true"\]/);
  assert.match(themeSrc, /\.cluster-view-toggle\.is-selected/);
  assert.match(themeSrc, /selection looked inverted/);
  assert.match(themeSrc, /button\[style\*="background: #fff"\]:not\(\.cluster-view-toggle\)/);
});
