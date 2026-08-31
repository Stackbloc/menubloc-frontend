import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  clusterShowsDishExcerpt,
  formatClusterDishExcerpt,
} from "../src/lib/clusterDishExcerpt.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageSrc = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");
const explorerSrc = readFileSync(join(root, "src/components/cluster/ClusterMenuExplorer.jsx"), "utf8");
const beExplorerSrc = readFileSync(
  join(root, "../menubloc-backend-main/src/services/clusters/clusterMenuExplorerService.js"),
  "utf8"
);

test("dish excerpts enabled for all Place cluster slugs", () => {
  assert.equal(clusterShowsDishExcerpt("indio-festival-grounds"), true);
  assert.equal(clusterShowsDishExcerpt("la-live"), true);
  assert.equal(clusterShowsDishExcerpt("lacc"), true);
  assert.equal(clusterShowsDishExcerpt(""), false);
  assert.equal(clusterShowsDishExcerpt(null), false);
});

test("formatClusterDishExcerpt strips seed disclaimer and truncates", () => {
  assert.equal(
    formatClusterDishExcerpt(
      "Classic al pastor taco. Reference item — not a 2027 festival confirmation."
    ),
    "Classic al pastor taco."
  );
  const long = "A ".repeat(80);
  const out = formatClusterDishExcerpt(long, { maxLength: 60 });
  assert.ok(out.endsWith("…"));
  assert.ok(out.length <= 60);
});

test("ClusterPage and dish chips wire Coachella excerpt trial", () => {
  assert.match(pageSrc, /clusterShowsDishExcerpt/);
  assert.match(pageSrc, /showExcerpt=\{clusterShowsDishExcerpt\(clusterSlug\)\}/);
  assert.match(explorerSrc, /cluster-dish-excerpt/);
  assert.match(explorerSrc, /formatClusterDishExcerpt/);
});

test("BE cluster menu explorer selects CK description", () => {
  assert.match(beExplorerSrc, /mi\.description/);
  assert.match(beExplorerSrc, /description,/);
});
