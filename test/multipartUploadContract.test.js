/**
 * Diner/guest multipart upload — adaptive timeout + diagnostic errors + progress XHR.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  mapMultipartUploadNetworkError,
  videoUploadTimeoutMs,
  VIDEO_UPLOAD_TIMEOUT_CAP_MS,
  VIDEO_UPLOAD_TIMEOUT_FLOOR_MS,
} from "../src/lib/multipartUpload.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("videoUploadTimeoutMs floors at 5m and caps at 15m", () => {
  assert.equal(VIDEO_UPLOAD_TIMEOUT_FLOOR_MS, 5 * 60 * 1000);
  assert.equal(VIDEO_UPLOAD_TIMEOUT_CAP_MS, 15 * 60 * 1000);
  assert.equal(videoUploadTimeoutMs(0), VIDEO_UPLOAD_TIMEOUT_FLOOR_MS);
  assert.equal(videoUploadTimeoutMs(1024), VIDEO_UPLOAD_TIMEOUT_FLOOR_MS);
  assert.equal(videoUploadTimeoutMs(200 * 1024 * 1024), VIDEO_UPLOAD_TIMEOUT_CAP_MS);
});

test("mapMultipartUploadNetworkError distinguishes timeout / offline / interrupt", () => {
  const timeout = mapMultipartUploadNetworkError(
    { name: "AbortError", code: "UPLOAD_CLIENT_TIMEOUT" },
    { isVideo: true, timedOutByClient: true }
  );
  assert.match(timeout.message, /taking too long/i);
  assert.match(timeout.message, /not a length limit/i);

  const offline = mapMultipartUploadNetworkError(
    { code: "UPLOAD_OFFLINE", message: "offline" },
    { isVideo: true }
  );
  assert.match(offline.message, /offline/i);

  const net = mapMultipartUploadNetworkError(
    { code: "UPLOAD_NETWORK", message: "network" },
    { isVideo: true }
  );
  assert.match(net.message, /weak cellular/i);
  assert.doesNotMatch(net.message, /connection dropped/i);
});

test("compose surfaces stay-on-screen upload progress", () => {
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  const overlay = read("src/components/consumer/feed/FeedVideoComposeOverlay.jsx");
  assert.match(compose, /eating-compose-upload-progress/);
  assert.match(compose, /stay on this screen/);
  assert.match(overlay, /onUploadProgress/);
  assert.match(overlay, /uploadPercent/);
});

test("diner videos use signed direct-to-Supabase path", () => {
  const multipart = read("src/lib/multipartUpload.js");
  assert.match(multipart, /putBlobWithProgress/);
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /putBlobWithProgress/);
  assert.match(api, /\$\{path\}\/sign/);
  assert.match(api, /\$\{path\}\/complete/);
  assert.match(api, /signed_url/);
  assert.match(api, /storage_key/);
});

