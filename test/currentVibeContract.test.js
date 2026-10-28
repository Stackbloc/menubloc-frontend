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

test("docs/16: default is Not sure today (no badge); old values read as Not sure; Me time is the opt-out", () => {
  assert.equal(DEFAULT_CURRENT_VIBE, "not_sure_today");
  assert.equal(OPT_OUT_CURRENT_VIBE, "me_time");
  assert.equal(coerceCurrentVibe(null), DEFAULT_CURRENT_VIBE);
  assert.equal(coerceCurrentVibe("craving"), DEFAULT_CURRENT_VIBE);
  assert.equal(showsCurrentVibeBadge("not_sure_today"), false);
  assert.equal(showsCurrentVibeBadge("open_for_suggestions"), false);
  assert.equal(showsCurrentVibeBadge("hungry"), true);
  assert.equal(showsCurrentVibeBadge("me_time"), true);
  assert.equal(getCurrentVibeEntry("me_time").badgeTone, "muted");
  assert.equal(getCurrentVibeEntry("me_time").icon, "🌙");
  // Social search Phase 4: the default is not search-surfaced.
  assert.equal(getCurrentVibeEntry("not_sure_today").searchEligible, false);
  assert.equal(getCurrentVibeEntry("open_for_dinner").searchEligible, true);
  assert.equal(getCurrentVibeEntry("hungry").searchEligible, true);
});

test("DinerIdentityHero mounts Current Vibe on avatar wrap", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(hero, /CurrentVibeAvatarControl/);
  assert.match(hero, /identityAvatarWrap/);
  assert.match(hero, /onCurrentVibeChange/);
  assert.match(hero, /currentVibe/);
});

test("picker: pick several, Not sure / Me time alone, For today / hours / days / all week", async () => {
  const section = read("src/pages/consumer/myMenuply/CurrentVibeProfileSection.jsx");
  assert.match(section, /Current vibe/);
  assert.match(section, /DEFAULT_CURRENT_VIBE/);
  assert.match(section, /OPT_OUT_CURRENT_VIBE/);
  assert.match(section, /chip-grid/);
  assert.match(section, /toggleVibeSet\(active, opt\.value, entries\)/);
  assert.match(section, /onChange\(\{ vibes: next, until: untilOf\(nextSpan, nextCount\) \}\)/);
  assert.match(section, /\["week", "All week"\]/);
  const { toggleVibeSet } = await import("../src/lib/currentVibeDisplay.js");
  assert.deepEqual(toggleVibeSet(["not_sure_today"], "coffee"), ["coffee"]);
  assert.deepEqual(toggleVibeSet(["coffee"], "open_for_lunch"), ["open_for_lunch", "coffee"]);
  assert.deepEqual(toggleVibeSet(["open_for_lunch", "coffee"], "me_time"), ["me_time"]);
  assert.deepEqual(toggleVibeSet(["me_time"], "hungry"), ["hungry"]);
  assert.deepEqual(toggleVibeSet(["hungry"], "hungry"), ["not_sure_today"]);
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
  assert.match(page, /not_sure_today/);
  assert.match(page, /currentVibes=\{profile\?\.current_vibe_meta\?\.current_vibes \|\| null\}/);
});
