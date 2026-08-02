import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");

test("Cluster Food category list supports price sort Low-High and High-Low", () => {
  assert.match(src, /const \[priceSort, setPriceSort\] = useState\("default"\)/);
  assert.match(src, /getConsumerDisplayPrice/);
  assert.match(src, /displayItems/);
  assert.match(src, /data-testid="cluster-food-price-sort-asc"/);
  assert.match(src, /data-testid="cluster-food-price-sort-desc"/);
  assert.match(src, /Price: Low–High/);
  assert.match(src, /High–Low/);
  assert.match(src, /items=\{displayItems\}/);
  assert.match(src, /setPriceSort\("default"\)/);
});
