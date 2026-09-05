/**
 * Make Me This — one profile picker link; badges only on opted-in wants; Accept? for owner offers.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Make Me This API + single picker + profile badges", () => {
  const api = read("src/lib/makeMeThisApi.js");
  assert.match(api, /\/api\/consumer\/make-me-this/);
  assert.match(api, /createMakeMeThisRequest/);

  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.doesNotMatch(bits, /Add Make Me This to profile/);
  assert.doesNotMatch(bits, /want-mmt-request/);
  assert.match(bits, /want-mmt-view/);
  assert.match(bits, /want-mmt-peer/);
  assert.match(bits, /want-to-eat-peer-graphic|graphicOnly/);

  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.doesNotMatch(hub, /MakeMeThisInboxPanel/);
  assert.match(hub, /want-mmt-open-picker/);
  assert.match(hub, /onViewMmt=\{onViewMmt\}/);
  assert.match(hub, /what-im-eating-camera/);

  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /RequestMmtSheet/);
  assert.match(page, /MmtDetailSheet/);
  assert.match(page, /onOpenAteCamera/);
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
  assert.match(requestSheet, /mmt-want-checklist/);
  assert.match(requestSheet, /mmt-request-submit/);

  const detail = read("src/pages/consumer/myMenuply/MmtDetailSheet.jsx");
  assert.match(detail, /has offered to make you/);
  assert.match(detail, /mmt-offer-accept/);
});
