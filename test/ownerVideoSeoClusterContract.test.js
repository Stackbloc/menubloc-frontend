/**
 * Search & web metadata — Cluster is a dropdown (not free-text Neighborhood).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Search & web metadata uses Cluster select instead of Neighborhood text", () => {
  const src = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(src, /data-testid="owner-video-seo-cluster"/);
  assert.match(src, /<span>Cluster<\/span>/);
  assert.doesNotMatch(src, /<span>Neighborhood<\/span>/);
  assert.match(src, /location_neighborhood/);
  assert.match(src, /No cluster/);
});
