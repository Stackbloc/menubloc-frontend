import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageSrc = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");
const themeSrc = readFileSync(join(root, "src/styles/clusterLaLiveTheme.css"), "utf8");

test("Food radio maps to menu view id; Restaurants maps to restaurants", () => {
  assert.match(pageSrc, /id:\s*CLUSTER_VIEW_MODES\.MENU,\s*label:\s*"Food"/);
  assert.match(pageSrc, /id:\s*CLUSTER_VIEW_MODES\.RESTAURANTS,\s*label:\s*"Restaurants"/);
  assert.match(pageSrc, /MENU:\s*"menu"/);
  assert.match(pageSrc, /RESTAURANTS:\s*"restaurants"/);
});

test("view=menu panel mounts ClusterMenuExplorerTab; restaurants panel mounts ClusterRestaurantsTab", () => {
  assert.match(pageSrc, /data-testid="cluster-view-panel-menu"/);
  assert.match(pageSrc, /data-testid="cluster-view-panel-restaurants"/);
  assert.match(pageSrc, /data-testid=\{`cluster-view-\$\{option\.id\}`\}/);

  const menuPanelIdx = pageSrc.indexOf('data-testid="cluster-view-panel-menu"');
  const restaurantsPanelIdx = pageSrc.indexOf('data-testid="cluster-view-panel-restaurants"');
  assert.ok(menuPanelIdx > 0 && restaurantsPanelIdx > menuPanelIdx);

  const menuSlice = pageSrc.slice(menuPanelIdx, restaurantsPanelIdx);
  assert.match(menuSlice, /ClusterMenuExplorerTab/);
  assert.doesNotMatch(menuSlice, /ClusterRestaurantsTab/);

  const restaurantsSlice = pageSrc.slice(restaurantsPanelIdx, restaurantsPanelIdx + 1200);
  assert.match(restaurantsSlice, /ClusterRestaurantsTab/);
  assert.doesNotMatch(restaurantsSlice, /ClusterMenuExplorerTab/);
});

test("Food and Restaurants panels stay mounted (hidden) so toggle is not destroyed mid-tap", () => {
  assert.match(pageSrc, /hidden=\{resolvedViewMode !== CLUSTER_VIEW_MODES\.MENU\}/);
  assert.match(pageSrc, /hidden=\{resolvedViewMode !== CLUSTER_VIEW_MODES\.RESTAURANTS\}/);
  assert.match(pageSrc, /onPointerDown=\{/);
  assert.match(pageSrc, /aria-pressed=\{selected\}/);
  assert.match(pageSrc, /className=\{`cluster-view-toggle/);
});

test("L.A. LIVE theme makes selected Food/Restaurants toggle gold (not invisible black)", () => {
  assert.match(themeSrc, /\.cluster-view-toggle\[aria-pressed="true"\]/);
  assert.match(themeSrc, /\.cluster-view-toggle\.is-selected/);
  assert.match(themeSrc, /selection looked inverted/);
  assert.match(themeSrc, /button\[style\*="background: #fff"\]:not\(\.cluster-view-toggle\)/);
});
