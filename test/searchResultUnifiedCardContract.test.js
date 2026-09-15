/**
 * Unified search-result card grammar — one skeleton, variable enrichment modules.
 * Spec: Desktop menuply-unified-search-result-cursor-spec.pdf (2026-09-15)
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("SearchResultEnrichmentStack uses Video → Connect → Deal order", () => {
  const src = read("src/components/search/SearchResultEnrichmentStack.jsx");
  const videoIdx = src.indexOf("<SearchResultVideoStrip");
  const socialIdx = src.indexOf("<SearchResultSocialActivity");
  const dealIdx = src.indexOf("<SearchResultDealModule");
  assert.ok(videoIdx > 0, "VideoModule present");
  assert.ok(socialIdx > videoIdx, "Connect after Video");
  assert.ok(dealIdx > socialIdx, "Deal after Connect");
  assert.match(src, /data-testid="search-result-enrichment"/);
  assert.match(src, /isTemporallyValid/);
});

test("SearchResultDealModule omits expired deals and has no MKS/CK labels in UI copy", () => {
  const src = read("src/components/search/SearchResultDealModule.jsx");
  assert.match(src, /data-testid="search-result-deal-module"/);
  assert.match(src, /isTemporallyValid/);
  assert.match(src, /deal_expired/);
  // No user-facing system terminology in rendered strings
  assert.doesNotMatch(src, />\s*MKS\s*</);
  assert.doesNotMatch(src, />\s*CK ID\s*</);
  assert.doesNotMatch(src, /label:\s*"Purpose gate"/);
});

test("SearchResultCard mounts EnrichmentStack on dish + restaurant cards", () => {
  const card = read("src/components/SearchResultCard.jsx");
  assert.match(card, /SearchResultEnrichmentStack/);
  assert.match(card, /data-card-skeleton="unified"/);
  assert.match(card, /data-testid="search-result-card-footer"/);
  assert.match(card, /videos=\{row\?\.videos\}/);
  assert.match(card, /socialActivity=\{row\?\.social_activity\}/);
  assert.match(card, /videos=\{item\?\.videos\}/);
  assert.match(card, /socialActivity=\{item\?\.social_activity\}/);
  assert.doesNotMatch(card, /SearchBillboardBanner/);
  assert.doesNotMatch(card, /HomeNext|FoodInterestsPage|waiterApi/);
  assert.doesNotMatch(card, /OwnerVideoCuration|multipartUpload|putBlobWithProgress/);
});

test("SearchResultCard does not equalize heights or auto-play large video inline", () => {
  const card = read("src/components/SearchResultCard.jsx");
  const strip = read("src/components/search/SearchResultVideoCard.jsx");
  assert.doesNotMatch(card, /minHeight:\s*[3-9]\d{2}/);
  assert.doesNotMatch(card, /equalize|uniform.?height/i);
  assert.match(strip, /aspectRatio:\s*"9 \/ 16"/);
  assert.match(strip, /data-testid="search-result-video-strip"/);
  // Tap replaces strip with larger in-card player; no empty shell beside it; no fullscreen.
  assert.match(strip, /search-result-video-inline-expanded/);
  assert.match(strip, /isExpanded \? \(/);
  assert.doesNotMatch(strip, /requestFullscreen|search-result-video-fullscreen|createPortal|search-result-video-overlay/);
});
