import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageSrc = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");

test("ClusterPage keeps legal H1 via getClusterPageHeading", () => {
  assert.match(pageSrc, /getClusterPageHeading/);
  assert.match(pageSrc, /\{pageHeading\}/);
  assert.match(pageSrc, /<h1/);
});

test("ClusterPage mounts sticky product title + Food/Restaurants chrome", () => {
  assert.match(pageSrc, /getClusterProductTitle/);
  assert.match(pageSrc, /data-testid="cluster-sticky-chrome"/);
  assert.match(pageSrc, /data-testid="cluster-sticky-title"/);
  assert.match(pageSrc, /position:\s*"sticky"/);
  assert.match(pageSrc, /<ClusterViewToggle/);
  assert.match(pageSrc, /overflowX:\s*"clip"/);
});

test("Cluster Food search form mounts inside sticky chrome", () => {
  assert.match(pageSrc, /data-testid="cluster-sticky-search"/);
  assert.match(pageSrc, /data-testid="cluster-sticky-search-form"/);
  assert.match(pageSrc, /createPortal\(searchForm, searchHost\)/);
  assert.match(pageSrc, /searchSlotRef/);
  assert.match(pageSrc, /ClusterFoodSearchForm/);
});

test("sticky chrome is not the page-root overflow clip ancestor", () => {
  const stickyIdx = pageSrc.indexOf('data-testid="cluster-sticky-chrome"');
  const rootOpenIdx = pageSrc.indexOf("maxWidth: 900");
  const rootStyleSlice = pageSrc.slice(rootOpenIdx, rootOpenIdx + 280);
  assert.ok(stickyIdx > 0);
  assert.doesNotMatch(rootStyleSlice, /overflowX:\s*"clip"/);
});
