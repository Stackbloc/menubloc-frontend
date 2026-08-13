import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("InviteToEatButton tooltip and Invitation Ready confirmation", () => {
  const btn = read("src/components/InviteToEatButton.jsx");
  assert.match(btn, /Invite to Eat/);
  assert.match(btn, /InviteToEatModal/);
  assert.doesNotMatch(btn, /sendSms|twilio|contact.*sync/i);

  const modal = read("src/components/InviteToEatModal.jsx");
  assert.match(modal, /Create Invitation/);
  assert.match(modal, /Invitation Ready/);
  assert.match(modal, /Share \/ Send/);
  assert.match(modal, /ShareModal/);
  assert.match(modal, /does not send SMS/);
  assert.match(modal, /Ready to Send/);
  assert.doesNotMatch(modal, /Invitation Sent/);
  assert.doesNotMatch(modal, /navigator\.share/);
  assert.match(modal, /shareOpen && shareData/);
  assert.match(modal, /While sharing/);
  assert.doesNotMatch(modal, /navigator\.contacts|getUserMedia/);
});

test("Eat invitation public page and App routes exist", () => {
  const page = read("src/pages/EatInvitationPage.jsx");
  assert.match(page, /You've Been Invited to Eat/);
  assert.match(page, /Accept/);
  assert.match(page, /Maybe/);
  assert.match(page, /Can&apos;t Make It|Can't Make It/);
  assert.match(page, /respondToEatInvitation/);
  assert.match(page, /View Menu/);
  assert.match(page, /Create a free Menuply account to respond/);
  assert.match(page, /formatDateLabel/);
  assert.match(page, /\\d\{4\}-\\d\{2\}-\\d\{2\}/);
  assert.match(page, /Open in Maps/);
  assert.match(page, /invite-restaurant-address/);
  assert.match(page, /buildGoogleMapsDirectionsUrl|buildGoogleMapsUrlForRestaurant/);
  assert.match(page, /formatHoursRows/);
  assert.match(page, /Restaurant information/);
  assert.match(page, /invited you to eat at/);
  assert.match(page, /invite-organizer-status/);
  assert.doesNotMatch(page, /Join Menuply because/);

  const app = read("src/App.jsx");
  assert.match(app, /path=["']\/eat\/:token["']/);
  assert.match(app, /path=["']\/invite\/:token["']/);
  assert.match(app, /EatInvitationPage/);
});

test("Detail action rail order includes Invite after Share", () => {
  const src = read("src/components/menu/MenuItemDetailActionRail.jsx");
  const likeIdx = src.indexOf("LikeMenuItemButton");
  const shareIdx = src.indexOf("<ShareButton");
  const inviteIdx = src.indexOf("<InviteToEatButton");
  assert.ok(likeIdx > 0 && shareIdx > likeIdx && inviteIdx > shareIdx);
});
