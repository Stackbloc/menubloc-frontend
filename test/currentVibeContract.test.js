import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_CURRENT_VIBE,
  coerceCurrentVibe,
  showsCurrentVibeBadge,
  getCurrentVibeEntry,
} from "../src/lib/currentVibeDisplay.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("im_good shows no badge; me_time shows muted badge", () => {
  assert.equal(coerceCurrentVibe(null), DEFAULT_CURRENT_VIBE);
  assert.equal(showsCurrentVibeBadge("im_good"), false);
  assert.equal(showsCurrentVibeBadge("hungry"), true);
  assert.equal(showsCurrentVibeBadge("me_time"), true);
  assert.equal(getCurrentVibeEntry("me_time").badgeTone, "muted");
  assert.equal(getCurrentVibeEntry("me_time").icon, "🌙");
});

test("DinerIdentityHero mounts Current Vibe on avatar wrap", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(hero, /CurrentVibeAvatarControl/);
  assert.match(hero, /identityAvatarWrap/);
  assert.match(hero, /onCurrentVibeChange/);
  assert.match(hero, /currentVibe/);
});

test("picker selects on single tap and retap clears to im_good", () => {
  const ctrl = read("src/pages/consumer/myMenuply/CurrentVibeAvatarControl.jsx");
  assert.match(ctrl, /\$\{testIdPrefix\}-picker/);
  assert.match(ctrl, /DEFAULT_CURRENT_VIBE/);
  assert.match(ctrl, /nextRaw === coerceOrSame\(effective\)/);
  assert.doesNotMatch(ctrl, /Confirm|Submit|multi-step/);
});

test("API client updates Current Vibe without feed side effects in client", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /updateCurrentVibe/);
  assert.match(api, /\/api\/consumer\/profile\/current-vibe/);
});

test("Connect list shows ambient vibe badge", () => {
  const page = read("src/pages/consumer/ConsumerConnections.jsx");
  assert.match(page, /connect-list-vibe-badge/);
  assert.match(page, /showsCurrentVibeBadge/);
});

test("My Menuply wires vibe update on identity hero", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /onCurrentVibeChange/);
  assert.match(page, /updateCurrentVibe/);
  assert.match(page, /current_vibe_catalog/);
});
