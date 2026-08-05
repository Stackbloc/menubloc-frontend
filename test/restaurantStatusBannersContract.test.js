/**
 * Restaurant status banners — operator profile settings + public strip contract.
 * Status toggles live on /operator/my-account (Restaurant Profile) — not duplicated on public owner chrome.
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
assert.match(chrome, /\/operator\/my-account/);
assert.doesNotMatch(chrome, /RestaurantStatusSettingsPanel/);
assert.doesNotMatch(chrome, /updateStatusBanners/);
assert.doesNotMatch(chrome, /updateProfile/);
assert.doesNotMatch(chrome, /publishProfile/);

const panel = read("src/components/restaurant/RestaurantStatusSettingsPanel.jsx");
assert.match(panel, /updateStatusBanners/);
assert.match(panel, /RESTAURANT_STATUS_BANNERS/);
assert.match(panel, /StatusEventScheduleEditor/);

const page = read("src/pages/RestaurantPublicPage.jsx");
const editorial = read("src/components/restaurant/RestaurantPublicEditorial.jsx");
const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
const nowHiring = read("src/components/restaurant/publicProfile/ProfileNowHiring.jsx");
const updates = read("src/components/restaurant/publicProfile/ProfileUpdates.jsx");
assert.match(page, /status_banners/);
assert.match(page, /PUBLIC_PROFILE_IS_DARK/);
assert.match(editorial, /PublicProfileShell/);
// Homepage redesign: Now Hiring module removed from shell; owners use Profile Updates.
assert.doesNotMatch(shell, /ProfileNowHiring/);
assert.match(shell, /ProfileUpdates/);
assert.match(updates, /profile-updates/);
assert.match(nowHiring, /profile-now-hiring/);
assert.doesNotMatch(page, /function readTheme/);
assert.doesNotMatch(page, /grubbid_theme/);

const editor = read("src/pages/operator/OperatorProfileEditor.jsx");
assert.match(editor, /RestaurantStatusSettingsPanel/);
assert.match(editor, /Protected listing identity/);

const strip = read("src/components/restaurant/RestaurantStatusBannerStrip.jsx");
assert.match(strip, /Restaurant announcements/);
assert.match(strip, /resolveStatusBanners/);
assert.doesNotMatch(strip, /menuplyStatusBannerPulse/);
assert.doesNotMatch(strip, /#1d4ed8/);

const api = read("src/lib/operatorApi.js");
assert.match(api, /updateStatusBanners/);
assert.match(api, /profile\/status-banners/);

console.log("restaurantStatusBannersContract: ok");
