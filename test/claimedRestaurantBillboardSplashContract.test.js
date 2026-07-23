/**
 * Claimed billboard splash: active creative before editorial profile handoff.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLAIMED_BILLBOARD_SPLASH_MS,
  CLAIMED_BILLBOARD_SPLASH_REDUCED_MS,
  pickClaimedBillboardSplashPost,
} from "../src/lib/claimedRestaurantBillboardSplash.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const helper = read("src/lib/claimedRestaurantBillboardSplash.js");
assert.match(helper, /CLAIMED_BILLBOARD_SPLASH_MS\s*=\s*2000/);
assert.match(helper, /CLAIMED_BILLBOARD_SPLASH_REDUCED_MS\s*=\s*400/);
assert.match(helper, /pickClaimedBillboardSplashPost/);

const splash = read("src/components/restaurant/ClaimedRestaurantBillboardSplash.jsx");
assert.match(splash, /claimedRestaurantBillboardSplash\.js/);
assert.match(splash, /prefers-reduced-motion/);
assert.match(splash, /onDismiss/);
assert.match(splash, /Tap to continue/);
assert.doesNotMatch(splash, /StickyPageHeader/);
assert.doesNotMatch(splash, /BottomNav/);
assert.doesNotMatch(splash, /Claim This Profile/);

assert.equal(CLAIMED_BILLBOARD_SPLASH_MS, 2000);
assert.equal(CLAIMED_BILLBOARD_SPLASH_REDUCED_MS, 400);

assert.equal(
  pickClaimedBillboardSplashPost([
    { status: "past", image_url: "https://example.com/old.png", title: "Old" },
    { status: "current", image_url: "https://example.com/now.png", title: "Now" },
  ])?.image_url,
  "https://example.com/now.png"
);
assert.equal(
  pickClaimedBillboardSplashPost([
    { status: "upcoming", headline_override: "Soon", image_url: "https://example.com/soon.png" },
  ]),
  null
);
assert.equal(
  pickClaimedBillboardSplashPost([{ status: "current", title: "Headline only" }])?.title,
  "Headline only"
);
assert.equal(pickClaimedBillboardSplashPost([]), null);
assert.equal(pickClaimedBillboardSplashPost(null), null);

const page = read("src/pages/RestaurantPublicPage.jsx");
assert.match(page, /ClaimedRestaurantBillboardSplash/);
assert.match(page, /CLAIMED_BILLBOARD_SPLASH_MS/);
assert.match(page, /pickClaimedBillboardSplashPost/);
assert.match(page, /claimedBillboardSplashPost/);
assert.match(page, /billboardSplashDone/);
assert.match(page, /UnclaimedRestaurantBrandSplash/);
assert.match(page, /UNCLAIMED_BRAND_SPLASH_MS/);

console.log("claimedRestaurantBillboardSplashContract: ok");
