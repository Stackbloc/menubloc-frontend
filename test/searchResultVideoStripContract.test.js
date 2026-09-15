/**
 * Search result video strip — omit when empty; payload-only (no restaurant-wide fetch).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("SearchResultVideoStrip omits empty payload and does not fetch profile videos", () => {
  const src = read("src/components/search/SearchResultVideoCard.jsx");
  assert.match(src, /data-testid="search-result-video-strip"/);
  assert.match(src, /aspectRatio:\s*"9 \/ 16"/);
  assert.match(src, /if \(!list\.length\) return null/);
  assert.doesNotMatch(src, /listRestaurantProfileVideos/);
  assert.doesNotMatch(src, /MenuRestaurantContextualVideo/);
  assert.doesNotMatch(src, /SeeWhosEatingFullscreen/);
  assert.doesNotMatch(src, /MKS|CK ID/);
});

test("SearchResultCard mounts strip on dish ItemRow and restaurant-only card from row.videos", () => {
  const card = read("src/components/SearchResultCard.jsx");
  assert.match(card, /SearchResultVideoStrip/);
  assert.match(card, /videos=\{row\?\.videos\}/);
  assert.match(card, /videos=\{item\?\.videos\}/);
  assert.doesNotMatch(card, /listRestaurantProfileVideos/);
  assert.doesNotMatch(card, /FoodInterestsPage/);
  assert.doesNotMatch(card, /HomeNext/);
});

test("protected video-upload and Waiter files were not used as the strip source", () => {
  const card = read("src/components/SearchResultCard.jsx");
  const strip = read("src/components/search/SearchResultVideoCard.jsx");
  for (const src of [card, strip]) {
    assert.doesNotMatch(src, /OwnerVideoCuration/);
    assert.doesNotMatch(src, /multipartUpload/);
    assert.doesNotMatch(src, /putBlobWithProgress/);
    assert.doesNotMatch(src, /waiterApi/);
  }
});
