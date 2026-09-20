/**
 * Owner Video Manager — replace playable video file on an existing curated row.
 * Cause 2 sign→PUT→complete via replace-media routes (does not create a new asset).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("OwnerVideoCuration exposes replace video file controls", () => {
  const src = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(src, /replaceOwnerVideoMedia/);
  assert.match(src, /data-testid="owner-video-replace-panel"/);
  assert.match(src, /data-testid="owner-video-replace-upload"/);
  assert.match(src, /data-testid="owner-video-replace-file"/);
  assert.match(src, /applyReplaceVideoFile/);
  assert.match(src, /setPhotoUrl\(null\)/);
  assert.match(src, /Capture or upload a new Search \/ Feed thumbnail/);
});

test("ownerApi replace helper uses Cause 2 replace-media sign→PUT→complete", () => {
  const api = read("src/lib/ownerApi.js");
  assert.match(api, /replaceOwnerVideoMedia/);
  assert.match(api, /\/replace-media/);
  assert.match(api, /\$\{base\}\/sign/);
  assert.match(api, /\$\{base\}\/complete/);
  assert.match(api, /putBlobWithProgress/);
});
