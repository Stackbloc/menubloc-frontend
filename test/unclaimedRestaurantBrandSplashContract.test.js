/**
 * Unclaimed brand splash: name + billboard preview line, timed handoff to public profile.
 * Claimed billboard entrance splash is no longer mounted on restaurant profiles.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const splash = read("src/components/restaurant/UnclaimedRestaurantBrandSplash.jsx");
assert.match(splash, /UNCLAIMED_BRAND_SPLASH_MS\s*=\s*2000/);
assert.match(splash, /Your Billboard Goes Here/);
assert.match(splash, /prefers-reduced-motion/);
assert.doesNotMatch(splash, /Claim This Profile/);
assert.doesNotMatch(splash, /subscription/i);
assert.doesNotMatch(splash, /StickyPageHeader/);
assert.doesNotMatch(splash, /BottomNav/);
assert.doesNotMatch(splash, /billboard.?artwork|placeholder.*image/i);

const page = read("src/pages/RestaurantPublicPage.jsx");
assert.match(page, /UnclaimedRestaurantBrandSplash/);
assert.doesNotMatch(page, /ClaimedRestaurantBillboardSplash/);
assert.match(page, /UNCLAIMED_BRAND_SPLASH_MS/);
assert.match(page, /unclaimedSplashDone/);
assert.match(page, /isOrdinaryUnclaimed/);
assert.match(page, /ClaimProfilePanel/);
assert.match(page, /Your Billboard Goes Here/);
assert.doesNotMatch(page, /Your information appears here with/);

console.log("unclaimedRestaurantBrandSplashContract: ok");
