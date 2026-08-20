/**
 * Menuply social media picker — Camera or Upload from library (no Photo/Video sheet, no getUserMedia UI).
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

test("MenuplyMediaPicker offers Camera and Upload from library without Photo/Video sheet", () => {
  const picker = read("src/components/social/MenuplyMediaPicker.jsx");
  assert.match(picker, /image\/\*,video\/\*/);
  assert.match(picker, /camera-input/);
  assert.match(picker, /library-input/);
  assert.match(picker, /Upload from library/);
  assert.match(picker, /option-camera/);
  assert.match(picker, /option-library/);
  assert.match(picker, /capture=\{captureAttr\(facingMode\)\}/);
  assert.doesNotMatch(picker, /Take Photo/);
  assert.doesNotMatch(picker, /Record Video/);
  assert.doesNotMatch(picker, /Choose Photo/);
  assert.doesNotMatch(picker, /Choose Video/);
  assert.doesNotMatch(picker, /getUserMedia/);
  assert.doesNotMatch(picker, /ConsumerCameraSheet/);
});

test("preferInlineCamera is disabled for social MVP native picker", () => {
  const lib = read("src/lib/consumerCameraCapture.js");
  assert.match(lib, /preferInlineCamera/);
  assert.match(lib, /return false/);
});

test("eating surfaces use MenuplyMediaPicker", () => {
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  const attach = read("src/components/foodActivity/EatingMediaAttach.jsx");
  const quick = read("src/pages/consumer/myMenuply/QuickCompose.jsx");
  const gallery = read("src/pages/consumer/myMenuply/ProfileMediaGallery.jsx");
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(compose, /MenuplyMediaPicker/);
  assert.match(attach, /MenuplyMediaPicker/);
  assert.match(quick, /MenuplyMediaPicker/);
  assert.match(gallery, /MenuplyMediaPicker/);
  assert.match(hero, /MenuplyMediaPicker/);
  assert.match(hero, /facingMode="user"/);
});

test("Eating compose copy and meal time chips", () => {
  const utils = read("src/pages/consumer/myMenuply/eatingHubUtils.js");
  assert.match(utils, /What did you eat today/);
  assert.match(utils, /want to eat in the future/);
  assert.match(utils, /Schedule future dining plans/);
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
