/**
 * Make Me This — owner-only Request MMT on I Wanna Eat; independent audience from Join Me.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Make Me This API + owner-only want actions", () => {
  const api = read("src/lib/makeMeThisApi.js");
  assert.match(api, /\/api\/consumer\/make-me-this/);
  assert.match(api, /createMakeMeThisRequest/);
  assert.match(api, /listMakeMeThisInbox/);

  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(bits, /Request Make Me This/);
  assert.match(bits, /want-mmt-request/);
  assert.match(bits, /onRequestMmt/);
  assert.match(bits, /readOnly && \(onRequestMmt/);

  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(hub, /MakeMeThisInboxPanel/);
  assert.match(hub, /onRequestMmt={readOnly \? undefined : onRequestMmt}/);

  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /RequestMmtSheet/);
  assert.match(page, /MmtDetailSheet/);
  assert.match(page, /listMakeMeThisInbox/);

  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.doesNotMatch(peer, /RequestMmtSheet/);
  assert.doesNotMatch(peer, /onRequestMmt/);
  assert.doesNotMatch(peer, /MakeMeThisInboxPanel/);

  const picker = read("src/pages/consumer/myMenuply/MmtAudiencePicker.jsx");
  assert.match(picker, /mmt-audience-picker/);
  assert.doesNotMatch(picker, /join_capacity/);

  const requestSheet = read("src/pages/consumer/myMenuply/RequestMmtSheet.jsx");
  assert.match(requestSheet, /not on the public Feed/);
});
