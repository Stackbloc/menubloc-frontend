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

test("preferInlineCamera prefers live camera when getUserMedia exists", () => {
  const lib = read("src/lib/consumerCameraCapture.js");
  assert.match(lib, /export function preferInlineCamera/);
  assert.match(lib, /return inlineCameraSupported\(\)/);
});

test("Post about Upload from library opens compose with media=library", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /Upload from library/);
  assert.match(sheet, /compose=ate&media=library/);
  assert.match(sheet, /id: "upload-media"/);
});

test("What I Ate meal board is presentation-only (no empty cameras)", () => {
  const board = read("src/pages/consumer/myMenuply/WhatIAteMealBoard.jsx");
  assert.match(board, /showEmptyHolders = false/);
  assert.match(board, /visibleWhatIAteMealPeriods/);
  assert.match(board, /mealHeroCard|restaurant_logo_url/);
  assert.match(board, /No entries/);
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
  assert.match(attach, /MenuplyMediaPicker/);
  assert.match(quick, /MenuplyMediaPicker/);
  assert.doesNotMatch(gallery, /MenuplyMediaPicker/);
  assert.match(hero, /MenuplyMediaPicker/);
  assert.match(hero, /facingMode="user"/);
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

test("Site footer Events routes to browse page not clusters", () => {
  const footer = read("src/components/SiteFooter.jsx");
  assert.match(footer, /to="\/events".*Events/s);
});

test("social design tokens exist", () => {
  assert.match(read("src/lib/socialDesignTokens.js"), /heroMediaHeight: 280/);
});
