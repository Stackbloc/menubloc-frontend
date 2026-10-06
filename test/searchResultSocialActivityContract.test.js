/**
 * Search result Connect social activity — omit when empty; payload-only.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("SearchResultSocialActivity omits empty payload and does not fetch", () => {
  const src = read("src/components/search/SearchResultSocialActivity.jsx");
  assert.match(src, /data-testid="search-result-social-activity"/);
  assert.match(src, /if \(!list\.length\) return null/);
  assert.doesNotMatch(src, /fetch\(/);
  assert.doesNotMatch(src, /listMyDiningIntents|listWantToEat/);
  assert.doesNotMatch(src, /HomeNext|FoodInterestsPage|waiterApi/);
});

test("SearchResultSocialActivity shows Invite CTA only when projection supplies cta_label + cta_href", () => {
  const src = read("src/components/search/SearchResultSocialActivity.jsx");
  assert.match(src, /cta_label/);
  assert.match(src, /cta_href/);
  assert.match(src, /search-result-social-cta/);
  assert.match(src, /showCta = Boolean\(ctaLabel && ctaHref\)/);
});

test("SearchResultCard mounts Connect lines via EnrichmentStack on dish and restaurant cards", () => {
  const card = read("src/components/SearchResultCard.jsx");
  assert.match(card, /SearchResultEnrichmentStack/);
  assert.match(card, /socialActivity=\{row\?\.social_activity\}/);
  assert.match(card, /socialActivity=\{item\?\.social_activity\}/);
  assert.doesNotMatch(card, /listRestaurantProfileVideos/);
  assert.doesNotMatch(card, /HomeNext/);
  assert.doesNotMatch(card, /FoodInterestsPage/);
});

test("protected Waiter, Home, and video-upload files were not used as the social source", () => {
  const card = read("src/components/SearchResultCard.jsx");
  const social = read("src/components/search/SearchResultSocialActivity.jsx");
  for (const src of [card, social]) {
    assert.doesNotMatch(src, /OwnerVideoCuration/);
    assert.doesNotMatch(src, /multipartUpload/);
    assert.doesNotMatch(src, /putBlobWithProgress/);
    assert.doesNotMatch(src, /waiterApi/);
  }
});

test("one primary social line per card, rendered with the shared Diner avatar", () => {
  const src = read("src/components/search/SearchResultSocialActivity.jsx");
  assert.match(src, /\.slice\(0, 1\)/);
  assert.match(src, /import DinerAvatar from "\.\.\/social\/DinerAvatar\.jsx"/);
  assert.match(src, /avatarUrl=\{row\.avatar_url\}/);
  assert.match(src, /displayName=\{row\.display_name\}/);
  const proof = read("src/components/social/ConnectionSocialProof.jsx");
  assert.match(proof, /import DinerAvatar from "\.\/DinerAvatar\.jsx"/);
});

test("social search adds no chip or filter row for social content", () => {
  const stack = read("src/components/search/SearchResultEnrichmentStack.jsx");
  const src = read("src/components/search/SearchResultSocialActivity.jsx");
  for (const s of [stack, src]) {
    assert.doesNotMatch(s, /Your people|Recommended by Connects/);
  }
});
