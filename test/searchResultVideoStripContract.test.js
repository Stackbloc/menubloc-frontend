/**
 * Search result video strip — omit when empty; payload-only (no restaurant-wide fetch).
 * Play: thumbnail → larger in-card player → full-screen (expand icon); empty shell hidden while playing.
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
  assert.match(src, /aspectRatio:\s*"4 \/ 5"/);
  assert.match(src, /if \(!list\.length\) return null/);
  assert.match(src, /thumbnail_url \|\| video\.photo_url/);
  assert.match(src, /data-testid="search-result-video-thumb-placeholder"/);
  assert.match(src, /#F3F4F6|#E5E7EB/);
  assert.match(src, /data-testid="search-result-video-connect-badge"/);
  assert.match(src, /data-testid="search-result-video-connects-label"/);
  assert.match(src, /Your Connects/);
  assert.doesNotMatch(src, /listRestaurantProfileVideos/);
  assert.doesNotMatch(src, /MenuRestaurantContextualVideo/);
  assert.doesNotMatch(src, /SeeWhosEatingFullscreen/);
  assert.doesNotMatch(src, /MKS|CK ID/);
});

test("SearchResultVideoCard prefers thumbnail_url and uses neutral placeholder not black shell", () => {
  const src = read("src/components/search/SearchResultVideoCard.jsx");
  assert.match(src, /thumbnail_url \|\| video\.photo_url|thumbnail_url \|\| video\?\.photo_url/);
  assert.match(src, /search-result-video-thumb-placeholder/);
  assert.doesNotMatch(src, /linear-gradient\(180deg,#1f2937,#111827\)/);
  assert.doesNotMatch(src, /OwnerVideoCuration|multipartUpload|putBlobWithProgress/);
});

test("playing video replaces thumbnail strip — no empty shell; expand icon gives full-screen", () => {
  const src = read("src/components/search/SearchResultVideoCard.jsx");
  assert.match(src, /data-testid="search-result-video-inline-expanded"/);
  assert.match(src, /data-testid="search-result-video-inline-player"/);
  assert.match(src, /data-testid="search-result-video-collapse"/);
  assert.match(src, /isExpanded \? \(/);
  // Third play state: explicit secondary action from the inline player.
  assert.match(src, /data-testid="search-result-video-fullscreen"/);
  assert.match(src, /requestFullscreen/);
  assert.match(src, /webkitEnterFullscreen/);
  // Exiting full-screen returns to inline expanded — Escape must not collapse while full-screen.
  assert.match(src, /if \(currentFullscreenElement\(\)\) return;/);
  // No portal/overlay player outside the card.
  assert.doesNotMatch(src, /createPortal/);
  assert.doesNotMatch(src, /search-result-video-overlay/);
});

test("collapsed strip shows all thumbnails (no slice / see-all)", () => {
  const src = read("src/components/search/SearchResultVideoCard.jsx");
  assert.match(src, /\{list\.map\(\(video\) =>/);
  assert.doesNotMatch(src, /list\.slice\(/);
  assert.doesNotMatch(src, /search-result-video-see-all/);
});

test("Part 4: 2+ videos use in-player next/prev while strip stays hidden", () => {
  const src = read("src/components/search/SearchResultVideoCard.jsx");
  assert.match(src, /data-testid="search-result-video-prev"/);
  assert.match(src, /data-testid="search-result-video-next"/);
  assert.match(src, /playlist\.length > 1/);
  assert.match(src, /thumbnails to choose, arrows to continue/);
  assert.match(src, /playlist=\{playlist\}/);
  // Expanded mode must not remount the thumbnail strip alongside the player.
  assert.match(src, /While playing: larger player only/);
});

test("SearchResultCard mounts EnrichmentStack (Connect→Video→Deal) on dish and restaurant cards", () => {
  const card = read("src/components/SearchResultCard.jsx");
  assert.match(card, /SearchResultEnrichmentStack/);
  assert.match(card, /videos=\{row\?\.videos\}/);
  assert.match(card, /socialActivity=\{row\?\.social_activity\}/);
  assert.match(card, /videos=\{item\?\.videos\}/);
  assert.match(card, /socialActivity=\{isRestaurantLevelS \? null : item\?\.social_activity\}/);
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

test("strip thumbnails are small 4:5 tiles captioned with the creator name on one line", () => {
  const src = read("src/components/search/SearchResultVideoCard.jsx");
  assert.match(src, /const THUMB_WIDTH = 60;/);
  assert.match(src, /data-testid="search-result-video-creator"/);
  assert.match(src, /video\?\.creator_label/);
  const creatorBlock = src.slice(src.indexOf('data-testid="search-result-video-creator"'));
  assert.match(creatorBlock.slice(0, 400), /textOverflow: "ellipsis"/);
  assert.match(creatorBlock.slice(0, 400), /whiteSpace: "nowrap"/);
  assert.doesNotMatch(src, /WebkitLineClamp: 2/);
});
