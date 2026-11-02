import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Motion profile photos (Andre, 2026-10-25; menuply-mobile docs/12): small avatars play the diner's
 * muted loop only while on screen, still for reduced motion; search Connect lines and Diner QR use it.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DinerAvatar plays the motion clip muted, looping, inline, on screen only, never for reduced motion", () => {
  const src = read("src/components/social/DinerAvatar.jsx");
  assert.match(src, /avatarMotionUrl/);
  assert.match(src, /<video[\s\S]*muted[\s\S]*loop[\s\S]*autoPlay[\s\S]*playsInline/);
  assert.match(src, /aria-hidden="true"/);
  assert.match(src, /prefers-reduced-motion: reduce/);
  assert.match(src, /IntersectionObserver/);
  assert.match(src, /poster=\{url \|\| undefined\}/);
});

test("search Connect line passes the motion clip", () => {
  assert.match(read("src/components/search/SearchResultSocialActivity.jsx"), /avatarMotionUrl=\{row\.avatar_motion_url\}/);
});

test("Diner QR card plays the motion clip (respecting the show-photo setting)", () => {
  const src = read("src/pages/consumer/DinerQrPage.jsx");
  assert.match(src, /showAvatar \? payload\?\.card\?\.avatar_motion_url/);
  assert.match(src, /data-testid="diner-qr-avatar-motion"/);
});
