import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_CURRENT_VIBE,
  OPT_OUT_CURRENT_VIBE,
  coerceCurrentVibe,
  showsCurrentVibeBadge,
  getCurrentVibeEntry,
} from "../src/lib/currentVibeDisplay.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("default is open_for_suggestions; im_good shows no badge", () => {
  assert.equal(DEFAULT_CURRENT_VIBE, "open_for_suggestions");
  assert.equal(OPT_OUT_CURRENT_VIBE, "im_good");
  assert.equal(coerceCurrentVibe(null), DEFAULT_CURRENT_VIBE);
  assert.equal(showsCurrentVibeBadge("im_good"), false);
  assert.equal(showsCurrentVibeBadge("open_for_suggestions"), true);
  assert.equal(showsCurrentVibeBadge("hungry"), true);
  assert.equal(showsCurrentVibeBadge("me_time"), true);
  assert.equal(getCurrentVibeEntry("me_time").badgeTone, "muted");
  assert.equal(getCurrentVibeEntry("me_time").icon, "🌙");
  assert.equal(getCurrentVibeEntry("open_for_suggestions").searchEligible, true);
});

test("DinerIdentityHero mounts Current Vibe on avatar wrap", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(hero, /CurrentVibeAvatarControl/);
  assert.match(hero, /identityAvatarWrap/);
  assert.match(hero, /onCurrentVibeChange/);
  assert.match(hero, /currentVibe/);
});

test("picker retap on default opts out to I'm good; hint documents search", () => {
  const section = read("src/pages/consumer/myMenuply/CurrentVibeProfileSection.jsx");
  assert.match(section, /Current vibe/);
  assert.match(section, /DEFAULT_CURRENT_VIBE/);
  assert.match(section, /OPT_OUT_CURRENT_VIBE/);
  assert.match(section, /chip-grid/);
  assert.match(section, /I'm good/);
  assert.match(section, /Open for suggestions/);
  assert.match(section, /suggestion and invitation/);
});

test("profile mounts Current vibe under Favorite foods", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(hero, /CurrentVibeProfileSection/);
  assert.match(hero, /afterFavorites/);
  const editor = read("src/pages/consumer/myMenuply/DinerPersonalContextEditor.jsx");
  assert.match(editor, /afterFavorites/);
});

test("avatar badge is display-only; im_good has no badge", () => {
  const ctrl = read("src/pages/consumer/myMenuply/CurrentVibeAvatarControl.jsx");
  assert.match(ctrl, /showsCurrentVibeBadge/);
  assert.match(ctrl, /display only|Display only|selection lives/i);
  assert.doesNotMatch(ctrl, /set-affordance/);
  assert.doesNotMatch(ctrl, /createPortal/);
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
  assert.match(page, /open_for_suggestions/);
});
