import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageSrc = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");
const explorerSrc = readFileSync(join(root, "src/components/cluster/ClusterMenuExplorer.jsx"), "utf8");

test("Cluster Food category list supports zone filter before price sort", () => {
  assert.match(pageSrc, /from ["'].*clusterZoneBrowse\.js["']/);
  assert.match(pageSrc, /const \[selectedZone, setSelectedZone\] = useState\(null\)/);
  assert.match(pageSrc, /collectClusterZones/);
  assert.match(pageSrc, /applyClusterZoneAndPriceSort/);
  assert.match(pageSrc, /data-testid="cluster-food-zone-filter"/);
  assert.match(pageSrc, /data-testid="cluster-food-zone-all"/);
  assert.match(pageSrc, /setSelectedZone\(null\)/);
  assert.match(pageSrc, /items=\{displayItems\}/);
  assert.match(pageSrc, /data-testid="cluster-food-price-sort-asc"/);
  assert.match(pageSrc, /data-testid="cluster-food-price-sort-desc"/);
});

test("Restaurants directory heading is type-aware (not hardcoded terminal-only)", () => {
  assert.match(pageSrc, /getClusterDiningByZoneHeading/);
  assert.match(pageSrc, /data-testid="cluster-dining-by-zone-heading"/);
  assert.doesNotMatch(
    pageSrc,
    /<h3 style=\{\{ margin: 0, fontSize: "1\.05rem", color: "#111827" \}\}>Dining by terminal<\/h3>/,
  );
});

test("Cluster dish chips surface area when present", () => {
  assert.match(explorerSrc, /data-testid="cluster-dish-area"/);
  assert.match(explorerSrc, /item\?\.area|item\.area/);
});
