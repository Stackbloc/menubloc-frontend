/**
 * Make Me This — per-item opt-in; peer offer; owner time/place (no Accept).
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
  assert.match(api, /scheduleMakeMeThisMeetup/);
  assert.match(api, /responses\/.*schedule/);

  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.doesNotMatch(bits, /Add Make Me This to profile/);
  assert.doesNotMatch(bits, /want-mmt-request/);
  assert.match(bits, /want-mmt-view/);
  assert.match(bits, /want-mmt-peer/);
  assert.match(bits, /want-to-eat-peer-graphic|graphicOnly/);

  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.doesNotMatch(hub, /MakeMeThisInboxPanel/);
  assert.match(hub, /want-cravings-action-open/);
  assert.doesNotMatch(hub, /want-cravings-action-mmt/);
  assert.match(hub, /Join Me \/ Take Me Out/);
  assert.doesNotMatch(hub, /want-cravings-invite-open/);
  assert.doesNotMatch(hub, /Invite & Make Me This/);
  assert.doesNotMatch(hub, /Invite &amp; Make Me This/);
  assert.doesNotMatch(hub, /onRequestMmt/);
  assert.doesNotMatch(hub, /want-mmt-open-picker/);
  assert.match(hub, /onViewMmt=\{onViewMmt\}/);
  assert.match(hub, /onJoinMeFromCraving/);
  assert.match(hub, /onTakeMeOutFromCraving/);

  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /MakeMeThisOptInSheet/);
  assert.match(page, /MakeMeThisInboxPanel/);
  assert.match(page, /listMakeMeThisInbox/);
  assert.match(page, /pendingMmtWant/);
  assert.match(page, /menu_item_id/);
  assert.match(page, /CravingsInviteSheet/);
  assert.match(page, /MmtDetailSheet/);
  assert.doesNotMatch(page, /RequestMmtSheet/);
  assert.doesNotMatch(page, /onRequestMmt=/);

  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.doesNotMatch(peer, /RequestMmtSheet/);
  assert.doesNotMatch(peer, /CravingsInviteSheet/);
  assert.doesNotMatch(peer, /onRequestMmt/);
  assert.match(peer, /MmtDetailSheet/);
  assert.match(peer, /onViewMmt/);

  const picker = read("src/pages/consumer/myMenuply/MmtAudiencePicker.jsx");
  assert.match(picker, /mmt-audience-picker/);
  assert.match(picker, /Who can see this on your profile/);

  const optIn = read("src/pages/consumer/myMenuply/MakeMeThisOptInSheet.jsx");
  assert.match(optIn, /mmt-opt-in-sheet/);
  assert.match(optIn, /Make Me This\?/);
  assert.match(optIn, /mmt-opt-in-yes/);
  assert.match(optIn, /MmtAudiencePicker/);

  const detail = read("src/pages/consumer/myMenuply/MmtDetailSheet.jsx");
  assert.match(detail, /offered to make|Booked with/);
  assert.match(detail, /Specify a time and place|Confirm booking/);
  assert.match(detail, /mmt-offer-schedule/);
  assert.match(detail, /mmt-schedule-when/);
  assert.match(detail, /mmt-schedule-place/);
  assert.match(detail, /Make this for \$\{ownerName\}\?/);
  assert.match(detail, /no longer available/);
  assert.doesNotMatch(detail, /mmt-offer-accept/);
  assert.doesNotMatch(detail, /Accept\?/);
});
