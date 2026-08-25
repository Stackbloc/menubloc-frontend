import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

import {
  captureAttrForFacing,
  validateNativeVideoFile,
  SOCIAL_VIDEO_MAX_RECORD_SECONDS,
} from "../src/lib/nativeVideoCapture.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("validateNativeVideoFile rejects non-video", () => {
  assert.throws(
    () => validateNativeVideoFile(new File(["x"], "a.txt", { type: "text/plain" })),
    /not a video/
  );
});

test("validateNativeVideoFile accepts video mime", () => {
  const file = new File([new Uint8Array(9000)], "clip.mp4", { type: "video/mp4" });
  assert.equal(validateNativeVideoFile(file), file);
});

test("captureAttrForFacing maps user vs environment", () => {
  assert.equal(captureAttrForFacing("user"), "user");
  assert.equal(captureAttrForFacing("environment"), "environment");
});

test("MenuplyMediaPicker opens ConsumerCameraSheet with optional native video mode", () => {
  const picker = read("src/components/social/MenuplyMediaPicker.jsx");
  assert.match(picker, /ConsumerCameraSheet/);
  assert.match(picker, /allowVideo=\{allowVideo\}/);
  assert.doesNotMatch(picker, /createCameraMediaRecorder/);
});

test("ConsumerCameraSheet Video mode uses OS native capture (no MediaRecorder)", () => {
  const sheet = read("src/components/consumer/ConsumerCameraSheet.jsx");
  assert.match(sheet, /photo snap via getUserMedia|Photo → live getUserMedia/);
  assert.match(sheet, /normalizeNativeVideoFile/);
  assert.match(sheet, /consumer-camera-mode-video/);
  assert.match(sheet, /consumer-camera-record-native/);
  assert.doesNotMatch(sheet, /createCameraMediaRecorder/);
  assert.doesNotMatch(sheet, /validateRecordedVideoBlob/);
});

test("native video max record seconds is TikTok-like (10 minutes)", () => {
  assert.equal(SOCIAL_VIDEO_MAX_RECORD_SECONDS, 600);
});
