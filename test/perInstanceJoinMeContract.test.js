/**
 * Per-instance Join Me — plans + events (not section-wide presets).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Plans and events do not mount section-wide Join Me presets", () => {
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.doesNotMatch(hub, /scope="plans"/);
  assert.doesNotMatch(page, /scope="events"/);
  assert.match(hub, /EatingPlanDayForm|JoinMeAudiencePicker|initialJoinable/);
  assert.match(page, /JoinMeAudiencePicker|EventComposeSheet/);
});

test("Event create posts per-event join_audience", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const api = read("src/lib/consumerApi.js");
  assert.match(page, /join_audience/);
  assert.match(page, /join_allowed_user_ids/);
  assert.match(page, /createDinerSocialEvent/);
  assert.match(page, /updateDinerSocialEvent/);
  assert.match(api, /updateDinerSocialEvent/);
  assert.match(api, /method: "PATCH"/);
});

test("Peer hub loads eligible social events for Join Me", () => {
  const api = read("src/lib/consumerApi.js");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.match(api, /listPeerDinerSocialEvents/);
  assert.match(api, /connections\/\$\{encodeURIComponent\(String\(peerId\)\)\}\/social-events/);
  assert.match(peer, /listPeerDinerSocialEvents/);
  assert.match(peer, /joinMeHref/);
});
