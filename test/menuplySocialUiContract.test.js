/**
 * Menuply social media picker — live getUserMedia camera sheet; library via Post about.
 * No Take Photo / Choose Photo file chooser for camera icons.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("MenuplyMediaPicker opens ConsumerCameraSheet for camera (not file-first)", () => {
  const picker = read("src/components/social/MenuplyMediaPicker.jsx");
  assert.match(picker, /ConsumerCameraSheet/);
  assert.match(picker, /preferInlineCamera/);
  assert.match(picker, /inlineCameraSupported/);
  assert.match(picker, /source = "camera"/);
  assert.match(picker, /source === "library"/);
  assert.match(picker, /camera-input/);
  assert.match(picker, /library-input/);
  assert.doesNotMatch(picker, /Take Photo/);
  assert.doesNotMatch(picker, /Choose Photo/);
  assert.doesNotMatch(picker, /Choose Video/);
  assert.doesNotMatch(picker, /option-camera/);
  assert.doesNotMatch(picker, /option-library/);
});

test("ConsumerCameraSheet supports photo video and front rear flip", () => {
  const sheet = read("src/components/consumer/ConsumerCameraSheet.jsx");
  assert.match(sheet, /consumer-camera-switch/);
  assert.match(sheet, /consumer-camera-mode-photo/);
  assert.match(sheet, /consumer-camera-mode-video/);
  assert.match(sheet, /openVideoCaptureStreamWithFallback/);
  assert.match(sheet, /openCameraStreamWithFallback/);
  assert.doesNotMatch(sheet, /openVideoStreamWithFallback/);
  assert.match(sheet, /countVideoInputDevices/);
  assert.match(sheet, /createCameraMediaRecorder/);
  assert.match(sheet, /recorder\.start\(250\)/);
  assert.match(sheet, /requestData/);
  assert.match(sheet, /MIN_RECORDED_VIDEO_BYTES/);
  assert.match(sheet, /MAX_RECORD_SECONDS/);
  assert.match(sheet, /consumer-camera-recording-badge/);
  assert.match(sheet, /consumer-camera-recording-timer/);
  assert.match(sheet, /consumer-camera-stop/);
  assert.match(sheet, /consumer-camera-review-video/);
  assert.match(sheet, /consumer-camera-use-video/);
  assert.match(sheet, /consumer-camera-retake/);
});

test("preferInlineCamera and deviceId-based facing switch", () => {
  const lib = read("src/lib/consumerCameraCapture.js");
  assert.match(lib, /export function preferInlineCamera/);
  assert.match(lib, /return inlineCameraSupported\(\)/);
  assert.match(lib, /resolveCameraDeviceId/);
  assert.match(lib, /enumerateDevices/);
  assert.match(lib, /deviceId: \{ exact: deviceId \}/);
  assert.match(lib, /openMediaStreamForFacing/);
  assert.match(lib, /openVideoCaptureStreamWithFallback/);
  assert.match(lib, /createCameraMediaRecorder/);
  assert.match(lib, /videoBitsPerSecond/);
  assert.match(lib, /prefersMp4Recorder/);
  assert.match(lib, /withSilentAudioForRecording/);
  assert.match(lib, /withVideoPreviewSeek/);
  assert.match(lib, /raw\.startsWith\("blob:"\)/);
  assert.match(lib, /"video\/mp4"/);
  assert.match(lib, /MIN_RECORDED_VIDEO_BYTES/);
  assert.match(lib, /MAX_UPLOAD_VIDEO_BYTES/);
  assert.match(lib, /aspectRatio: \{ ideal: 9 \/ 16 \}/);
  assert.match(lib, /SOCIAL_VIDEO_IDEAL_HEIGHT/);
  assert.match(lib, /SOCIAL_VIDEO_MAX_RECORD_SECONDS/);
  assert.match(lib, /MAX_RECORD_SECONDS/);
});

test("ConsumerCameraSheet keeps unified 3:4 preview for photo and video", () => {
  const sheet = read("src/components/consumer/ConsumerCameraSheet.jsx");
  assert.match(sheet, /aspectRatio: "3 \/ 4"/);
  assert.doesNotMatch(sheet, /previewWrapVideo/);
});

test("eating media utils define portrait capture (not oversized UI frames)", () => {
  const utils = read("src/lib/eatingMediaUtils.js");
  assert.match(utils, /SOCIAL_VIDEO_IDEAL_WIDTH/);
  assert.match(utils, /SOCIAL_VIDEO_MAX_RECORD_SECONDS = 15/);
  const styles = read("src/pages/consumer/myMenuply/myMenuplyStyles.js");
  assert.doesNotMatch(styles, /mealHolderVideo/);
  assert.match(styles, /socialVideoMedia/);
});

test("ConsumerCameraSheet reuses one video element for live and review", () => {
  const sheet = read("src/components/consumer/ConsumerCameraSheet.jsx");
  assert.match(sheet, /showBlobReview/);
  assert.match(sheet, /srcObject = null/);
  assert.match(sheet, /capturePosterFromVideoElement/);
  assert.match(sheet, /withVideoPreviewSeek/);
  assert.match(sheet, /consumer-camera-review-video/);
});

test("diner eating media upload maps Failed to fetch for video", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /postDinerMediaMultipart/);
  assert.match(api, /MAX_UPLOAD_VIDEO_BYTES/);
  assert.match(api, /Video upload failed \(connection dropped\)/);
  assert.match(api, /uploadWhatIAteTodayPhoto/);
  assert.match(api, /uploadWantToEatPhoto/);
});

test("X ate/want auto-opens camera sheet from compose", () => {
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(compose, /mediaSource === "camera"/);
  assert.match(compose, /openOnMount=\{/);
  assert.match(page, /COMPOSE_LOGIN_ACTIONS/);
  assert.match(page, /account\/login\?next=/);
  assert.match(page, /setComposeOpen\(true\)/);
  assert.match(page, /composeMediaSource/);
});

test("Post about no longer lists Upload from library in X sheet", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.doesNotMatch(sheet, /id: "upload-media"/);
  assert.doesNotMatch(sheet, /Upload from library/);
  assert.doesNotMatch(sheet, /compose=ate&media=library/);
});

test("What I Ate meal board is presentation-only (no empty cameras)", () => {
  const board = read("src/pages/consumer/myMenuply/WhatIAteMealBoard.jsx");
  assert.match(board, /showEmptyHolders = false/);
  assert.match(board, /visibleWhatIAteMealPeriods/);
  assert.match(board, /mealHolder|restaurant_logo_url|resolveEatingDishVisual/);
  assert.match(board, /No entries/);
  assert.match(board, /im_eating/);
  assert.match(board, /what-i-ate-meal-delete/);
  assert.doesNotMatch(board, /mealHeroCard/);
  assert.doesNotMatch(board, /meal-holder-add-media/);
  assert.doesNotMatch(board, /what-i-ate-meal-camera-/);
  assert.doesNotMatch(board, /onLogMeal/);
});

test("eating surfaces use MenuplyMediaPicker", () => {
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  const attach = read("src/components/foodActivity/EatingMediaAttach.jsx");
  const quick = read("src/pages/consumer/myMenuply/QuickCompose.jsx");
  const gallery = read("src/pages/consumer/myMenuply/ProfileMediaGallery.jsx");
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(compose, /MenuplyMediaPicker/);
  assert.match(compose, /mediaSource/);
  assert.match(compose, /openLibraryOnMount/);
  assert.doesNotMatch(compose, /useNativeCamera/);
  assert.match(attach, /MenuplyMediaPicker/);
  assert.match(quick, /MenuplyMediaPicker/);
  assert.doesNotMatch(gallery, /MenuplyMediaPicker/);
  // Avatar uses native capture=user; eating media uses MenuplyMediaPicker sheet.
  assert.match(hero, /diner-avatar-native-camera-input/);
  assert.match(hero, /capture="user"/);
  assert.doesNotMatch(hero, /MenuplyMediaPicker/);
});

test("Dining crew food photo uses MenuplyMediaPicker (not raw file input)", () => {
  const page = read("src/pages/consumer/DiningCrewsPage.jsx");
  assert.match(page, /MenuplyMediaPicker/);
  assert.doesNotMatch(page, /dining-crew-food-photo-input/);
});

test("Eating compose copy and meal time chips", () => {
  const utils = read("src/pages/consumer/myMenuply/eatingHubUtils.js");
  assert.match(utils, /What I'm Eating/);
  assert.match(utils, /Want to Eat/);
  assert.match(utils, /Eating Plan/);
  assert.match(utils, /Schedule a future meal/);
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(compose, /WHAT_I_ATE_MEAL_PERIODS/);
  assert.match(compose, /eating-meal-\$\{slot\.id\}/);
});

test("Site footer has no Discover column (Events/Waiter/Menus removed)", () => {
  const footer = read("src/components/SiteFooter.jsx");
  assert.doesNotMatch(footer, />Discover</);
  assert.doesNotMatch(footer, /to="\/events"/);
  assert.doesNotMatch(footer, /to="\/waiter"/);
  assert.doesNotMatch(footer, /to="\/browse-menus"/);
  assert.doesNotMatch(footer, /to="\/deals"/);
  assert.match(footer, />For Businesses</);
  assert.match(footer, /to="\/restaurant\/onboarding"/);
});

test("social design tokens exist", () => {
  assert.match(read("src/lib/socialDesignTokens.js"), /heroMediaHeight: 280/);
});
