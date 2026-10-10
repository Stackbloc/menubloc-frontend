/**
 * Video Manager "play muted" is honored on the watch page and the menu-page video
 * (Feed home, Feed Deals, profile and search cards already honor it).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("watch page plays play_muted videos muted and undoes unmute", () => {
  const src = read("src/pages/VideoWatchPage.jsx");
  assert.match(src, /muted=\{data\.play_muted === true\}/);
  assert.match(src, /if \(el && data\.play_muted === true\) el\.muted = true;/);
  assert.match(src, /onVolumeChange=\{\(e\) => \{\s*if \(data\.play_muted === true && !e\.currentTarget\.muted\) e\.currentTarget\.muted = true;/);
  assert.match(src, /This video plays without sound\./);
});

test("menu-page video keeps play_muted videos muted with a locked button", () => {
  const src = read("src/components/menu/MenuRestaurantContextualVideo.jsx");
  assert.match(src, /const forcedMute = clip\?\.play_muted === true;/);
  assert.match(src, /const effectiveMuted = forcedMute \|\| muted;/);
  assert.match(src, /el\.muted = effectiveMuted;/);
  assert.match(src, /muted=\{effectiveMuted\}/);
  assert.match(src, /if \(forcedMute\) return;/);
  assert.match(src, /disabled=\{forcedMute\}/);
});
