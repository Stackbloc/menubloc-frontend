/**
 * Unclaimed brand splash: name + billboard preview line, timed handoff to claim profile.
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
assert.match(page, /UNCLAIMED_BRAND_SPLASH_MS/);
assert.match(page, /showBrandSplash/);
assert.match(page, /!isClaimedRestaurant\(localizedData\) && !isOwner/);

console.log("unclaimedRestaurantBrandSplashContract: ok");
