/**
 * Contract: Campus cluster live Phase 1 FE — glance, chips, Update sheet.
 * No parallel report system; uses public cluster live API via api.js.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("clusterApi exposes campus live helpers on Railway API base", () => {
  const api = read("src/lib/clusterApi.js");
  assert.match(api, /fetchClusterCampusLive/);
  assert.match(api, /postClusterCampusLiveReport/);
  assert.match(api, /\/public\/clusters\/\$\{encodeURIComponent\(clusterSlug\)\}\/live/);
  assert.match(api, /from "\.\/api\.js"/);
  assert.doesNotMatch(api, /fetch\(["']\/public\/clusters/);
});

test("Update sheet is one-tap Line/Food with guest open reporting", () => {
  const sheet = read("src/components/cluster/CampusLiveUpdateSheet.jsx");
  assert.match(sheet, /No line/);
  assert.match(sheet, /Short line/);
  assert.match(sheet, /Long line/);
  assert.match(sheet, /Good today/);
  assert.match(sheet, /Skip it/);
  assert.match(sheet, /getOrCreateGuestReporterKey/);
  assert.match(sheet, /GuestContributeNextStep/);
  assert.match(sheet, /postClusterCampusLiveReport/);
  assert.doesNotMatch(sheet, /\bActivity\b|\bFeed\b/);
});

test("On Campus rows render Line/Food chips and Update entry", () => {
  const section = read("src/components/cluster/CampusDiningSection.jsx");
  assert.match(section, /campus-live-update-link/);
  assert.match(section, /No recent reports/);
  assert.match(section, /Line ·/);
  assert.match(section, /Food ·/);
  assert.doesNotMatch(section, /Today.?s Menu|View Menu/);
});
