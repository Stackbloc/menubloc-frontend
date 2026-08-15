/**
 * Operator Camera menu upload: batch select → upload & read all (one wait).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(
  path.join(ROOT, "src/pages/operator/OperatorMenuCameraUpload.jsx"),
  "utf8"
);

assert.match(src, /function mergeQueuedFiles/);
assert.match(src, /function cameraUploadFileKey/);
assert.match(src, /mergeQueuedFiles\(prev, picked\)/);
assert.match(src, /e\.target\.value = ""/);
assert.match(src, /\bmultiple\b/);
assert.doesNotMatch(src, /capture=["']environment["']/);
assert.match(src, /handleUploadAndReadAll/);
assert.match(src, /Upload & read all pages/);
assert.match(src, /Uploading \$\{/);
assert.match(src, /Reading \$\{/);
assert.match(src, /data-testid="operator-camera-upload-file-list"/);
assert.match(src, /data-testid="operator-camera-upload-clear-files"/);
assert.match(src, /data-testid="operator-camera-upload-remove-file"/);
assert.match(src, /data-testid="operator-camera-upload-and-read"/);
assert.match(src, /Confirm this page/);
assert.match(src, /handleFinalize/);
assert.match(src, /Finalize menu/);
assert.doesNotMatch(src, /handleCapturePage/);

console.log("operatorMenuCameraBatchUploadContract: ok");
