/**
 * Claimed billboard entrance splash remains on restaurant profiles.
 * Public /billboard page and on-profile Billboard block stay removed.
 * Never show a black/empty full-screen shell — art must be ready or splash is skipped.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLAIMED_BILLBOARD_SPLASH_MS,
  CLAIMED_BILLBOARD_SPLASH_REDUCED_MS,
  CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS,
  CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES,
  CLAIMED_BILLBOARD_SPLASH_SHELL_BG,
  CLAIMED_BILLBOARD_SPLASH_MAX_HOLD_MS,
  pickClaimedBillboardSplashPost,
  pickClaimedBillboardSplashPosts,
  resolveSplashDurationMs,
} from "../src/lib/claimedRestaurantBillboardSplash.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const helper = read("src/lib/claimedRestaurantBillboardSplash.js");
assert.match(helper, /CLAIMED_BILLBOARD_SPLASH_MS\s*=\s*3500/);
assert.match(helper, /CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES\s*=\s*6/);
assert.match(helper, /pickClaimedBillboardSplashPosts/);
assert.match(helper, /waitForBillboardSplashImage/);
assert.match(helper, /CLAIMED_BILLBOARD_SPLASH_SHELL_BG/);

const splash = read("src/components/restaurant/ClaimedRestaurantBillboardSplash.jsx");
assert.match(splash, /pickClaimedBillboardSplashPosts/);
assert.match(splash, /objectFit:\s*imageFit/);
assert.match(splash, /cta_url/);
assert.match(splash, /Tap to continue/);
assert.match(splash, /position:\s*"fixed"/);
assert.match(splash, /zIndex:\s*12000/);
assert.match(splash, /imagePainted/);
assert.match(splash, /decoding="sync"/);
assert.match(splash, /CLAIMED_BILLBOARD_SPLASH_SHELL_BG/);
assert.match(helper, /\.decode\(/);
assert.doesNotMatch(splash, /opacity:\s*imageReady/);
assert.doesNotMatch(splash, /opacity:\s*0\.12/);
assert.doesNotMatch(splash, /#0b0b0f/);
// Dark scrim must not mount before the image has painted (reload black-flash regression).
assert.match(splash, /\{imagePainted \? \(/);

assert.equal(CLAIMED_BILLBOARD_SPLASH_MS, 3500);
assert.equal(CLAIMED_BILLBOARD_SPLASH_REDUCED_MS, 600);
assert.equal(CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS, 1500);
assert.equal(CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES, 6);
assert.equal(CLAIMED_BILLBOARD_SPLASH_SHELL_BG, "#f2f1ec");
assert.equal(CLAIMED_BILLBOARD_SPLASH_MAX_HOLD_MS, 5000);

const ordered = pickClaimedBillboardSplashPosts([
  { id: 2, status: "current", display_order: 2, title: "B", image_url: "https://example.com/b.jpg" },
  { id: 1, status: "current", display_order: 0, title: "A", image_url: "https://example.com/a.jpg" },
  { id: 3, status: "past", display_order: 1, title: "C", image_url: "https://example.com/c.jpg" },
  { id: 4, status: "current", billboard_status: "paused", display_order: 1, title: "P", image_url: "https://example.com/p.jpg" },
]);
assert.equal(ordered.length, 2);
assert.equal(ordered[0].id, 1);
assert.equal(ordered[1].id, 2);

assert.equal(
  pickClaimedBillboardSplashPost([
    { status: "current", image_url: "https://example.com/now.png", title: "Now" },
  ])?.image_url,
  "https://example.com/now.png"
);

assert.equal(resolveSplashDurationMs({ display_duration_ms: 5000 }), 5000);
assert.equal(resolveSplashDurationMs({ display_duration_ms: 15000 }), 5000);
assert.equal(resolveSplashDurationMs({ display_duration_ms: 5000 }, { reducedMotion: true }), 600);

const page = read("src/pages/RestaurantPublicPage.jsx");
assert.match(page, /ClaimedRestaurantBillboardSplash/);
assert.match(page, /pickClaimedBillboardSplashPosts/);
assert.match(page, /waitForBillboardSplashImage/);
assert.match(page, /billboardSplashReady/);
assert.match(page, /claimedBillboardSplashPosts|billboardSplashPosts/);
assert.match(page, /posts=\{/);
assert.doesNotMatch(page, /billboardHref/);
assert.doesNotMatch(page, /billboardSplashConsumed/);
// Food-truck entrance splash is FoodTruckPage-only (no double empty+photo splash).
assert.match(page, /if \(isFoodTruckListing\(data\)\) return \[\];/);

// Food trucks redirect off RestaurantPublicPage before splash — entrance lives on FoodTruckPage.
const foodTruckPage = read("src/pages/FoodTruckPage.jsx");
assert.match(foodTruckPage, /ClaimedRestaurantBillboardSplash/);
assert.match(foodTruckPage, /pickClaimedBillboardSplashPosts/);
assert.match(foodTruckPage, /waitForBillboardSplashImage/);
assert.match(foodTruckPage, /billboardSplashReady/);
assert.match(foodTruckPage, /billboardSplashDone/);
assert.match(foodTruckPage, /isActiveBillboardSplashPost/);
assert.match(foodTruckPage, /posts=\{splashPosts\}/);
assert.doesNotMatch(foodTruckPage, /zIndex:\s*11900/);
assert.doesNotMatch(foodTruckPage, /billboardSplashConsumed/);
assert.doesNotMatch(foodTruckPage, /#0b0b0f/);

const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
assert.doesNotMatch(shell, /ProfileBillboardFeature/);

const app = read("src/App.jsx");
assert.doesNotMatch(app, /RestaurantBillboard/);
assert.match(app, /path="\/restaurants\/:slugOrId\/billboard"/);
assert.match(app, /RestaurantSingularRedirect/);

const op = read("src/pages/operator/OperatorBillboardsPage.jsx");
assert.match(op, /display_duration_ms/);
assert.match(op, /display_order/);
assert.match(op, /image_fit/);
assert.match(op, /billboard-slide-order/);
assert.match(op, /Contain \(recommended mobile\)/);

console.log("claimedRestaurantBillboardSplashContract: ok");
