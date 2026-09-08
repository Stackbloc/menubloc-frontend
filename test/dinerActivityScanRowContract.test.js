/**
 * Activity-first scan row — identity + emoji line + optional ▶ / inline video.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatDinerActivityLine,
  formatDinerScanIdentity,
  resolveDinerAffiliation,
} from "../src/lib/dinerDiscoverySummary.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DinerActivityScanRow: play only when video; activity line expands video", () => {
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.match(row, /diner-activity-scan-row/);
  assert.match(row, /diner-activity-scan-line/);
  assert.match(row, /diner-activity-scan-play/);
  assert.match(row, /diner-activity-scan-video/);
  assert.match(row, /formatDinerScanIdentity/);
  assert.match(row, /formatDinerActivityLine/);
  assert.match(row, /hasVideo/);
  assert.doesNotMatch(row, /MenuplyMediaPicker|getUserMedia/);
  assert.doesNotMatch(row, /facingMode|capture=/);
});

test("scan surfaces mount DinerActivityScanRow", () => {
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  const social = read("src/pages/consumer/myMenuply/SocialFoodInfoSection.jsx");
  const activity = read("src/pages/consumer/myMenuply/DinerActivitySelectionLayer.jsx");
  assert.match(nearby, /DinerActivityScanRow/);
  assert.match(nearby, /videoUrl/);
  assert.match(social, /DinerActivityScanRow/);
  assert.match(activity, /DinerActivityScanRow/);
  assert.match(activity, /want\.video_url/);
});

test("affiliation is school, not geographic location", () => {
  assert.equal(resolveDinerAffiliation({ school_affiliation: "USC" }), "USC");
  assert.equal(
    resolveDinerAffiliation({
      edu_verified: true,
      edu_institution_name: "University of Southern California",
    }),
    "University of Southern California"
  );
  assert.equal(
    formatDinerScanIdentity({
      display_name: "AndreB",
      age_years: 24,
      school_affiliation: "UCLA",
    }),
    "AndreB, 24, UCLA"
  );
  assert.match(formatDinerActivityLine({ kind: "want", food_name: "Pizza" }), /🍕 Wanna Eat · Pizza/);
});

test("My Menuply sticky text+emoji composer has no camera", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const composer = read("src/pages/consumer/myMenuply/ActivityTextComposer.jsx");
  assert.match(page, /ActivityTextComposer/);
  assert.match(page, /postScanActivityText/);
  assert.match(page, /createWantToEat/);
  assert.match(composer, /activity-text-composer/);
  assert.match(composer, /activity-emoji-picker|activity-emoji-toggle/);
  assert.doesNotMatch(composer, /MenuplyMediaPicker|acceptVideo|getUserMedia|facingMode/);
});
