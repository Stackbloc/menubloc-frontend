/**
 * Per-instance Join Me — plans + events (not section-wide presets).
 * Edit View: JoinMeStatusLine (eligibility). Connect View: JoinMeButton / Ended.
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

test("Edit View uses JoinMeStatusLine; Connect View uses JoinMeButton", () => {
  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  const btn = read("src/pages/consumer/myMenuply/JoinMeButton.jsx");
  const line = read("src/pages/consumer/myMenuply/JoinMeStatusLine.jsx");
  const styles = read("src/pages/consumer/myMenuply/myMenuplyStyles.js");
  assert.match(bits, /joinMeSurface/);
  assert.match(bits, /JoinMeStatusLine/);
  assert.match(bits, /plan-row-join-me-status/);
  assert.match(bits, /named-share-join-me-status/);
  assert.match(bits, /JoinMeButton/);
  assert.match(bits, /plan-row-join-me/);
  assert.match(bits, /named-share-join-me/);
  assert.match(btn, /#166534|GREEN_MID/);
  assert.doesNotMatch(btn, /#173404/);
  assert.match(line, /Join Me is \{state\}/);
  assert.match(line, /click to turn/);
  assert.doesNotMatch(bits, /planRowJoinBtn/);
  assert.doesNotMatch(bits, /named-share-edit-join-me/);
  assert.doesNotMatch(styles, /planRowJoinBtn/);
  assert.match(styles, /joinMeTitleRow/);
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
  assert.match(peer, /joinMeSurface="connect"/);
});
