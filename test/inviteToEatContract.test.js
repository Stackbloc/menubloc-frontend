import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("InviteToEatButton tooltip and no SMS send path", () => {
  const btn = read("src/components/InviteToEatButton.jsx");
  assert.match(btn, /Invite to Eat/);
  assert.match(btn, /InviteToEatModal/);
  assert.doesNotMatch(btn, /sendSms|twilio|contact.*sync/i);

  const modal = read("src/components/InviteToEatModal.jsx");
  assert.match(modal, /Create Invitation/);
  assert.match(modal, /Share \/ Send/);
  assert.match(modal, /ShareModal/);
  assert.match(modal, /does not send SMS/);
  // Share must not stack under Invite's higher z-index overlay.
  assert.match(modal, /shareOpen && shareData/);
  assert.match(modal, /While sharing/);
  assert.doesNotMatch(modal, /navigator\.contacts|getUserMedia/);
});

test("Eat invitation public page and App route exist", () => {
  const page = read("src/pages/EatInvitationPage.jsx");
  assert.match(page, /Accept/);
  assert.match(page, /Maybe/);
  assert.match(page, /Can&apos;t Make It|Can't Make It/);
  assert.match(page, /respondToEatInvitation/);

  const app = read("src/App.jsx");
  assert.match(app, /path=["']\/eat\/:token["']/);
  assert.match(app, /EatInvitationPage/);
});

test("Detail action rail order includes Invite after Share", () => {
  const src = read("src/components/menu/MenuItemDetailActionRail.jsx");
  const likeIdx = src.indexOf("LikeMenuItemButton");
  const shareIdx = src.indexOf("<ShareButton");
  const inviteIdx = src.indexOf("<InviteToEatButton");
  assert.ok(likeIdx > 0 && shareIdx > likeIdx && inviteIdx > shareIdx);
});
