/**
 * Menuply social media picker — photo via getUserMedia sheet; video via OS native capture.
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

test("MenuplyMediaPicker uses photo sheet + native video (not MediaRecorder sheet)", () => {
  const picker = read("src/components/social/MenuplyMediaPicker.jsx");
  assert.match(picker, /ConsumerCameraSheet/);
  assert.match(picker, /allowVideo=\{allowVideo\}/);
  assert.match(picker, /source = "camera"/);
  assert.match(picker, /source === "library"/);
  assert.match(picker, /camera-input/);
  assert.match(picker, /library-input/);
  assert.doesNotMatch(picker, /createCameraMediaRecorder/);
  assert.doesNotMatch(picker, /onNativeFallback/);
  assert.doesNotMatch(picker, /Take Photo/);
  assert.doesNotMatch(picker, /Choose Photo/);
});

test("ConsumerCameraSheet photo snap + Video mode launches OS native capture", () => {
  const sheet = read("src/components/consumer/ConsumerCameraSheet.jsx");
  assert.match(sheet, /consumer-camera-switch/);
  assert.match(sheet, /openCameraStreamWithFallback/);
  assert.match(sheet, /consumer-camera-live/);
  assert.match(sheet, /consumer-camera-mode-video/);
  assert.match(sheet, /consumer-camera-record-native/);
  assert.match(sheet, /normalizeNativeVideoFile/);
  assert.match(sheet, /accept="video\/\*"/);
  assert.match(sheet, /Record video \(up to/);
  assert.match(sheet, /\n\s+Record video\n/);
  assert.doesNotMatch(sheet, />\s*Upload video\s*</);
  assert.doesNotMatch(sheet, /createCameraMediaRecorder/);
  assert.doesNotMatch(sheet, /validateRecordedVideoBlob/);
  assert.doesNotMatch(sheet, /consumer-camera-record(?!-native)/);
});

test("nativeVideoCapture module validates OS clips", () => {
  const lib = read("src/lib/nativeVideoCapture.js");
  assert.match(lib, /probeNativeVideoFile/);
  assert.match(lib, /validateNativeVideoFile/);
  assert.match(lib, /video\.src = url/);
  assert.doesNotMatch(lib, /withVideoPreviewSeek/);
});

test("preferInlineCamera and photo capture helpers remain", () => {
  const lib = read("src/lib/consumerCameraCapture.js");
  assert.match(lib, /export function preferInlineCamera/);
  assert.match(lib, /photoFileFromVideoElement/);
  assert.match(lib, /withVideoPreviewSeek/);
  assert.match(lib, /raw\.startsWith\("blob:"\)/);
});

test("ConsumerCameraSheet keeps unified 3:4 photo preview", () => {
  const sheet = read("src/components/consumer/ConsumerCameraSheet.jsx");
  assert.match(sheet, /aspectRatio: "3 \/ 4"/);
});

test("eating media utils define TikTok-like video duration (10 minutes)", () => {
  const utils = read("src/lib/eatingMediaUtils.js");
  assert.match(utils, /SOCIAL_VIDEO_IDEAL_WIDTH/);
  assert.match(utils, /SOCIAL_VIDEO_MAX_RECORD_SECONDS = 600/);
  assert.match(utils, /formatVideoMaxDurationLabel/);
  const styles = read("src/pages/consumer/myMenuply/myMenuplyStyles.js");
  assert.doesNotMatch(styles, /mealHolderVideo/);
  assert.match(styles, /socialVideoMedia/);
});

test("diner avatar stays photo-only", () => {
  const avatarSheet = read("src/pages/consumer/myMenuply/AvatarComposeSheet.jsx");
  assert.match(avatarSheet, /allowVideo=\{false\}/);
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
  assert.match(compose, /MenuplyMediaPicker/);
  assert.match(compose, /openOnMount=\{/);
  assert.match(page, /COMPOSE_LOGIN_ACTIONS/);
  assert.match(page, /account\/login\?next=/);
  assert.match(page, /setComposeOpen\(true\)/);
  assert.match(page, /composeMediaSource/);
});

test("X sheet lists Upload media (library) separate from camera What I'm Eating", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /id: "upload-media"/);
  assert.match(sheet, /Upload media/);
  assert.match(sheet, /compose=ate&media=library/);
  assert.match(sheet, /"ate", "want", "profile-gallery", "upload-media"/);
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
  const avatarSheet = read("src/pages/consumer/myMenuply/AvatarComposeSheet.jsx");
  assert.match(hero, /AvatarComposeSheet/);
  assert.match(avatarSheet, /diner-avatar-compose-sheet/);
  assert.match(avatarSheet, /MenuplyMediaPicker/);
  assert.match(avatarSheet, /facingMode="user"/);
  assert.doesNotMatch(hero, /capture="user"/);
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
