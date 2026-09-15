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

test("SearchResultCard mounts EnrichmentStack (Video→Connect→Deal) on dish and restaurant cards", () => {
  const card = read("src/components/SearchResultCard.jsx");
  assert.match(card, /SearchResultEnrichmentStack/);
  assert.match(card, /videos=\{row\?\.videos\}/);
  assert.match(card, /socialActivity=\{row\?\.social_activity\}/);
  assert.match(card, /videos=\{item\?\.videos\}/);
  assert.match(card, /socialActivity=\{item\?\.social_activity\}/);
  assert.doesNotMatch(card, /listRestaurantProfileVideos/);
  assert.doesNotMatch(card, /HomeNext/);
  assert.doesNotMatch(card, /FoodInterestsPage/);
});

test("protected video-upload and Waiter files were not used as the strip source", () => {
  const card = read("src/components/SearchResultCard.jsx");
  const strip = read("src/components/search/SearchResultVideoCard.jsx");
  const stack = read("src/components/search/SearchResultEnrichmentStack.jsx");
  for (const src of [card, strip, stack]) {
    assert.doesNotMatch(src, /OwnerVideoCuration/);
    assert.doesNotMatch(src, /multipartUpload/);
    assert.doesNotMatch(src, /putBlobWithProgress/);
    assert.doesNotMatch(src, /waiterApi/);
  }
});
