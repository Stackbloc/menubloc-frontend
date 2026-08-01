import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/components/cluster/ClusterMenuExplorer.jsx"), "utf8");

test("ClusterDishChip renders restaurant_name on each dish row", () => {
  assert.match(src, /function ClusterDishChip\b/);
  assert.match(src, /item\?\.restaurant_name/);
  assert.match(src, /data-testid="cluster-dish-restaurant"/);
  assert.match(src, /data-testid="cluster-dish-name"/);
});

test("ClusterDishChip avoids full-width green wash fill", () => {
  assert.match(src, /CLUSTER_DISH_CHIP_STYLE/);
  assert.match(src, /borderLeft:\s*"3px solid #16a34a"/);
  assert.match(src, /background:\s*"#ffffff"/);
  assert.doesNotMatch(src, /background:\s*"#f0fdf4"/);
  assert.doesNotMatch(src, /border:\s*"2px solid #22c55e"/);
});

test("ClusterDishList still mounts ClusterDishChip for category items", () => {
  assert.match(src, /export function ClusterDishList/);
  assert.match(src, /<ClusterDishChip/);
});
