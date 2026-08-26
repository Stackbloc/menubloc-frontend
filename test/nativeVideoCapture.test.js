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

test("validateNativeVideoFile accepts empty mime with video extension", () => {
  const file = new File([new Uint8Array(9000)], "clip.mov", { type: "" });
  assert.equal(validateNativeVideoFile(file), file);
});

test("normalizeNativeVideoFile soft-accepts when probe cannot decode", async () => {
  const { normalizeNativeVideoFile } = await import("../src/lib/nativeVideoCapture.js");
  // Tiny non-decodable bytes with video mime — probe fails; normalize must still return a File.
  const raw = new File([new Uint8Array(9000)], "phone-clip.mov", { type: "video/quicktime" });
  const out = await normalizeNativeVideoFile(raw);
  assert.ok(out instanceof File);
  assert.ok(Number(out.size) > 0);
});

test("captureAttrForFacing maps user vs environment", () => {
  assert.equal(captureAttrForFacing("user"), "user");
  assert.equal(captureAttrForFacing("environment"), "environment");
});

test("MenuplyMediaPicker opens ConsumerCameraSheet with optional native video mode", () => {
  const picker = read("src/components/social/MenuplyMediaPicker.jsx");
  assert.match(picker, /ConsumerCameraSheet/);
  assert.match(picker, /allowVideo=\{allowVideo\}/);
  assert.match(picker, /allowPhoto=\{allowPhoto\}/);
  assert.doesNotMatch(picker, /createCameraMediaRecorder/);
});

test("ConsumerCameraSheet: desktop MediaRecorder + phone OS native capture", () => {
  const sheet = read("src/components/consumer/ConsumerCameraSheet.jsx");
  assert.match(sheet, /Photo → live getUserMedia/);
  assert.match(sheet, /preferDesktopInlineVideoRecord/);
  assert.match(sheet, /preferNativeOsVideoCapture/);
  assert.match(sheet, /createCameraMediaRecorder/);
  assert.match(sheet, /validateRecordedVideoBlob/);
  assert.match(sheet, /consumer-camera-record/);
  assert.match(sheet, /consumer-camera-record-native/);
  assert.match(sheet, /normalizeNativeVideoFile/);
  assert.match(sheet, /htmlFor=\{busy \? undefined : nativeVideoInputId\}/);
  assert.match(sheet, /initialMode = "video"/);
  assert.match(sheet, /consumer-camera-mode-video/);
  // Quarantined: button→input.click() opens file picker instead of camera on phones
  assert.doesNotMatch(sheet, /inputRef\.current\?\.click/);
  assert.doesNotMatch(sheet, /nativeVideoInputRef\.current\?\.click/);
});

test("preferNativeOsVideoCapture / preferDesktopInlineVideoRecord helpers exist", () => {
  const cap = read("src/lib/consumerCameraCapture.js");
  assert.match(cap, /export function preferNativeOsVideoCapture/);
  assert.match(cap, /export function preferDesktopInlineVideoRecord/);
  assert.match(cap, /iPhone|Android/);
});

test("native video normalize soft-probes decode (does not hard-block Post)", () => {
  const lib = read("src/lib/nativeVideoCapture.js");
  assert.match(lib, /Soft-probes decode|soft-accept|Soft:/i);
  assert.match(lib, /looksLikeVideoFile/);
  assert.match(lib, /too long/i);
});

test("native video max record seconds is TikTok-like (10 minutes)", () => {
  assert.equal(SOCIAL_VIDEO_MAX_RECORD_SECONDS, 600);
});
