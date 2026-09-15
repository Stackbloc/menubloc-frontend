/**
 * Owner Video Manager — per-video thumbnail selection (upload image + capture frame).
 * Must not alter Cause 2 video sign→PUT→complete path.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("OwnerVideoCuration exposes thumbnail upload and capture controls", () => {
  const src = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(src, /uploadOwnerVideoThumbnail/);
  assert.match(src, /data-testid="owner-video-thumbnail-panel"/);
  assert.match(src, /data-testid="owner-video-thumbnail-upload"/);
  assert.match(src, /data-testid="owner-video-thumbnail-capture"/);
  assert.match(src, /data-testid="owner-video-thumbnail-clear"/);
  assert.match(src, /handleCaptureFrame/);
  assert.match(src, /canvas\.toBlob/);
});

test("ownerApi thumbnail helper posts multipart photo and leaves Cause 2 video PUT intact", () => {
  const api = read("src/lib/ownerApi.js");
  assert.match(api, /uploadOwnerVideoThumbnail/);
  assert.match(api, /\/thumbnail/);
  assert.match(api, /form\.append\("photo"/);
  assert.match(api, /\/api\/owner\/videos\/upload\/sign/);
  assert.match(api, /putBlobWithProgress/);
  assert.match(api, /\/api\/owner\/videos\/upload\/complete/);
});

test("Cause 2 video upload wiring is still present on OwnerVideoCuration", () => {
  const src = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(src, /uploadOwnerVideo/);
  assert.match(src, /data-testid="owner-video-upload-panel"/);
  assert.doesNotMatch(src, /MENU_CAPTURE_JOB_WORKER/);
});
