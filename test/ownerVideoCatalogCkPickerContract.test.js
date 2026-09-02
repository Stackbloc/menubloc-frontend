/**
 * Owner Video Manager — CK-backed pickers, upload, date filters.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

test("CkRestaurantMenuPicker uses CK place search — name lookup, no manual ID entry", () => {
  const picker = read("src/components/ck/CkRestaurantMenuPicker.jsx");
  assert.match(picker, /searchReportPlaces/);
  assert.match(picker, /type: "restaurant"/);
  assert.match(picker, /type: "menu_item"/);
  assert.match(picker, /asRestaurantPlace/);
  assert.match(picker, /asDishPlace/);
  assert.match(picker, /Search restaurant name/i);
  assert.match(picker, /You never type an ID/i);
  assert.doesNotMatch(picker, /searchMenuConsoleRestaurants/);
  assert.doesNotMatch(picker, /searchMenuConsoleItems/);
  assert.doesNotMatch(picker, /type="number".*restaurant_id|restaurant_id.*type="number"/);
});

test("Owner Video Manager wires CK picker — no restaurant_id text/number inputs", () => {
  const page = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(page, /CkRestaurantMenuPicker/);
  assert.match(page, /useCkPlaceFromVideoIds/);
  assert.match(page, /restaurant\?\.restaurant_id/);
  assert.doesNotMatch(page, /searchMenuConsoleRestaurants/);
  assert.doesNotMatch(page, /searchMenuConsoleItems/);
  assert.doesNotMatch(page, /setRestaurantId|restaurantId.*useState/);
  assert.doesNotMatch(page, /placeholder=.*restaurant id/i);
});

test("Owner Video Manager supports upload panel and date filters", () => {
  const page = read("src/pages/owner/OwnerVideoCuration.jsx");
  const api = read("src/lib/ownerApi.js");
  assert.match(page, /Video Manager/);
  assert.match(page, /VideoUploadPanel/);
  assert.match(page, /uploadOwnerVideo/);
  assert.match(page, /owner-video-upload-panel/);
  assert.match(api, /uploadOwnerVideo/);
  assert.match(api, /\/api\/owner\/videos\/upload/);
  assert.match(page, /type="date"/);
  assert.match(page, /dateFromFilter/);
  assert.match(page, /dateToFilter/);
  assert.match(page, /date_from: dateFromFilter/);
  assert.match(page, /date_to: dateToFilter/);
  assert.match(api, /date_from/);
  assert.match(api, /date_to/);
  const layout = read("src/pages/owner/OwnerLayout.jsx");
  assert.match(layout, /Video Manager/);
});

test("Owner Video Manager includes cluster dropdown for platform uploads", () => {
  const page = read("src/pages/owner/OwnerVideoCuration.jsx");
  const api = read("src/lib/ownerApi.js");
  assert.match(page, /OwnerClusterSelect/);
  assert.match(page, /listOwnerVideoClusters/);
  assert.match(page, /cluster_id/);
  assert.match(page, /owner-video-upload-cluster/);
  assert.match(api, /listOwnerVideoClusters/);
  assert.match(api, /\/api\/owner\/videos\/clusters/);
});

test("Owner Video Manager supports post-upload metadata edit", () => {
  const page = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(page, /VideoEditor/);
  assert.match(page, /Edit video metadata/);
  assert.match(page, /patchOwnerVideoMetadata/);
  assert.match(page, /owner-video-editor/);
  assert.match(page, /resolveVideoEditorTitle/);
  assert.match(page, /add or change them anytime after upload/i);
  assert.match(page, /owner-video-edit-/);
  assert.match(page, /key=\{selected\.video_id\}/);
});
