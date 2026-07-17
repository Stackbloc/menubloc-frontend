/**
 * Schedule-driven Happy Hour / Live Music contracts.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RESTAURANT_STATUS_BANNERS,
  normalizeStatusBannerIds,
} from "../src/lib/restaurantStatusBanners.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

assert.equal(RESTAURANT_STATUS_BANNERS.find((b) => b.id === "live_music")?.label, "Live Music");
assert.equal(RESTAURANT_STATUS_BANNERS.find((b) => b.id === "happy_hour")?.scheduled, true);
assert.deepEqual(normalizeStatusBannerIds(["live_music_tonight"]), ["live_music"]);
assert.equal(RESTAURANT_STATUS_BANNERS.some((b) => b.id === "live_music_tonight"), false);

const chrome = read("src/components/restaurant/PublicProfileOwnerChrome.jsx");
assert.match(chrome, /StatusEventScheduleEditor/);
assert.match(chrome, /happy_hour/);
assert.match(chrome, /live_music/);

const editor = read("src/components/restaurant/StatusEventScheduleEditor.jsx");
assert.match(editor, /Days of the week/);
assert.match(editor, /Musical act/);
assert.match(editor, /Public banner preview/);
assert.match(editor, /restaurant location timezone/);

const strip = read("src/components/restaurant/RestaurantStatusBannerStrip.jsx");
assert.match(strip, /statusEventPresentations/);
assert.match(strip, /HAPPY HOUR|presentation\.headline/);

const api = read("src/lib/operatorApi.js");
assert.match(api, /replaceStatusEvents/);
assert.match(api, /profile\/status-events/);

const page = read("src/pages/RestaurantPublicPage.jsx");
assert.match(page, /status_event_presentations/);

console.log("restaurantStatusEventsContract: ok");
