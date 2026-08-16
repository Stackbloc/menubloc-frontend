/**
 * FE contract: Phase 7 Meet Me Here page + routing.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("Meet Me Here page uses contextual create API and same-origin QR image", () => {
  const page = read("src/pages/consumer/MeetMeHerePage.jsx");
  assert.match(page, /createMeetMeHere/);
  assert.match(page, /\/d\/\$\{encodeURIComponent/);
  assert.match(page, /DiningCrewFoodEntityPicker/);
  assert.doesNotMatch(page, /navigator\.share\(/);
});

test("App mounts /account/meet-me-here; account links to Meet Me Here", () => {
  const app = read("src/App.jsx");
  assert.match(app, /MeetMeHerePage/);
  assert.match(app, /\/account\/meet-me-here/);
  const profile = read("src/pages/consumer/ConsumerProfile.jsx");
  assert.match(profile, /\/account\/meet-me-here/);
});

test("consumerApi exposes createMeetMeHere", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /\/api\/consumer\/meet-me-here/);
});
