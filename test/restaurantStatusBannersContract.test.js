/**
 * Restaurant status banners — operator profile settings + public strip contract.
 * Status toggles live only on /operator/profile (not duplicated on public owner chrome).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RESTAURANT_STATUS_BANNERS,
  normalizeStatusBannerIds,
  resolveStatusBanners,
} from "../src/lib/restaurantStatusBanners.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

assert.equal(RESTAURANT_STATUS_BANNERS.length, 8);
assert.equal(RESTAURANT_STATUS_BANNERS[0].id, "now_hiring");
assert.equal(RESTAURANT_STATUS_BANNERS[0].prominence, "primary");
assert.equal(RESTAURANT_STATUS_BANNERS.find((b) => b.id === "live_music")?.label, "Live Music");
assert.deepEqual(
  normalizeStatusBannerIds(["happy_hour", "now_hiring", "x", "happy_hour", "live_music_tonight"]),
  ["now_hiring", "happy_hour", "live_music"]
);
assert.equal(resolveStatusBanners(["now_hiring"])[0].emoji, "🟢");

const chrome = read("src/components/restaurant/PublicProfileOwnerChrome.jsx");
assert.match(chrome, /\/operator\/profile/);
assert.doesNotMatch(chrome, /RestaurantStatusSettingsPanel/);
assert.doesNotMatch(chrome, /updateStatusBanners/);
assert.doesNotMatch(chrome, /updateProfile/);
assert.doesNotMatch(chrome, /publishProfile/);

const panel = read("src/components/restaurant/RestaurantStatusSettingsPanel.jsx");
assert.match(panel, /updateStatusBanners/);
assert.match(panel, /RESTAURANT_STATUS_BANNERS/);
assert.match(panel, /StatusEventScheduleEditor/);

const page = read("src/pages/RestaurantPublicPage.jsx");
assert.match(page, /RestaurantStatusBannerStrip/);
assert.match(page, /status_banners/);
assert.match(page, /PUBLIC_PROFILE_IS_DARK/);
assert.doesNotMatch(page, /function readTheme/);
assert.doesNotMatch(page, /grubbid_theme/);

const editor = read("src/pages/operator/OperatorProfileEditor.jsx");
assert.match(editor, /RestaurantStatusSettingsPanel/);
assert.match(editor, /Protected listing identity/);

const strip = read("src/components/restaurant/RestaurantStatusBannerStrip.jsx");
assert.match(strip, /variant/);
assert.match(strip, /aside/);
assert.doesNotMatch(strip, /menuplyStatusBannerPulse/);
assert.match(strip, /role="complementary"/);

const api = read("src/lib/operatorApi.js");
assert.match(api, /updateStatusBanners/);
assert.match(api, /profile\/status-banners/);

console.log("restaurantStatusBannersContract: ok");
