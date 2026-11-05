import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MAX_CLIP_MANAGER_VIDEO_BYTES,
  MAX_UPLOAD_VIDEO_BYTES,
  formatBytes,
} from "../src/lib/consumerCameraCapture.js";
import {
  CLIP_MANAGER_UPLOAD_TIMEOUT_CAP_MS,
  clipManagerUploadTimeoutMs,
  videoUploadTimeoutMs,
} from "../src/lib/multipartUpload.js";

// Andre 2026-11-04: a 5-minute video from a computer hit "too large" in Clip Manager.
test("Clip Manager allows 1 GB; diner posts stay 287 MB", () => {
  assert.equal(MAX_CLIP_MANAGER_VIDEO_BYTES, 1024 * 1024 * 1024);
  assert.equal(MAX_UPLOAD_VIDEO_BYTES, 287 * 1024 * 1024);
  assert.equal(formatBytes(1.5 * 1024 * 1024 * 1024), "1.5 GB");
});

test("Clip Manager upload timeout gives a 1 GB file time on a slow connection", () => {
  const oneGb = 1024 * 1024 * 1024;
  assert.ok(clipManagerUploadTimeoutMs(oneGb) >= 60 * 60 * 1000);
  assert.ok(clipManagerUploadTimeoutMs(oneGb) <= CLIP_MANAGER_UPLOAD_TIMEOUT_CAP_MS);
  assert.ok(clipManagerUploadTimeoutMs(10 * 1024 * 1024) >= videoUploadTimeoutMs(10 * 1024 * 1024));
});

test("Clip Manager upload + replace checks use the 1 GB limit", () => {
  const page = readFileSync(new URL("../src/pages/owner/OwnerVideoCuration.jsx", import.meta.url), "utf8");
  assert.equal((page.match(/> MAX_CLIP_MANAGER_VIDEO_BYTES/g) || []).length, 2);
  const api = readFileSync(new URL("../src/lib/ownerApi.js", import.meta.url), "utf8");
  assert.equal((api.match(/clipManagerUploadTimeoutMs\(file\.size\)/g) || []).length, 2);
});
