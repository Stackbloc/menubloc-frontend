import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");

test("Cluster Food search shows Showing N results count", () => {
  assert.match(src, /data-testid="cluster-food-search-result-count"/);
  assert.match(src, /Showing \{searchMenuItems\.length\}/);
  assert.match(src, /searchMenuItems\.length === 1 \? "result" : "results"/);
  assert.match(src, /aria-live="polite"/);
});
