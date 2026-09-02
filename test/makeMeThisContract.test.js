/**
 * Make Me This — profile-display on I Wanna Eat; independent audience from Join Me.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Make Me This API + profile-display want actions", () => {
  const api = read("src/lib/makeMeThisApi.js");
  assert.match(api, /\/api\/consumer\/make-me-this/);
  assert.match(api, /createMakeMeThisRequest/);

  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(bits, /Add Make Me This to profile/);
  assert.match(bits, /want-mmt-request/);
  assert.match(bits, /want-mmt-peer/);
  assert.match(bits, /onRequestMmt/);
  assert.match(bits, /!readOnly && \(onRequestMmt/);

  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.doesNotMatch(hub, /MakeMeThisInboxPanel/);
  assert.match(hub, /onViewMmt={onViewMmt}/);

  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /RequestMmtSheet/);
  assert.match(page, /MmtDetailSheet/);
  assert.doesNotMatch(page, /listMakeMeThisInbox/);

  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.doesNotMatch(peer, /RequestMmtSheet/);
  assert.doesNotMatch(peer, /onRequestMmt/);
  assert.match(peer, /MmtDetailSheet/);
  assert.match(peer, /onViewMmt/);

  const picker = read("src/pages/consumer/myMenuply/MmtAudiencePicker.jsx");
  assert.match(picker, /mmt-audience-picker/);
  assert.match(picker, /Who can see this on your profile/);
  assert.doesNotMatch(picker, /join_capacity/);

  const requestSheet = read("src/pages/consumer/myMenuply/RequestMmtSheet.jsx");
  assert.match(requestSheet, /not on the public Feed/);
  assert.match(requestSheet, /Add to profile/);
});
