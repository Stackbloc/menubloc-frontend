/**
 * Invite Me Out — want picker + diner audience eligibility + Invite to Eat date/time.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Invite Me Out flow uses want picker then InviteToEatModal schedule", () => {
  const flow = read("src/pages/consumer/myMenuply/InviteMeOutFlow.jsx");
  assert.match(flow, /Invite Me Out/);
  assert.match(flow, /invite-me-out-sheet/);
  assert.match(flow, /invite-me-out-options/);
  assert.match(flow, /InviteToEatModal/);
  assert.match(flow, /initialInviteKind="private"/);
  assert.match(flow, /lockInviteKind/);
  assert.match(flow, /flowTitle="Invite Me Out"/);

  const modal = read("src/components/InviteToEatModal.jsx");
  assert.match(modal, /initialInviteKind/);
  assert.match(modal, /lockInviteKind/);
  assert.match(modal, /invite-date/);
  assert.match(modal, /invite-time/);
  assert.match(modal, /invite-schedule-mode/);
});

test("Diner chooses Invite Me Out audience in X → What I Want to Eat compose", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.doesNotMatch(section, /invite-me-out-save/);
  assert.doesNotMatch(section, /want-invite-me-out-settings/);
  assert.match(section, /viewerMayInviteMeOut/);
  assert.match(section, /want-invite-me-out/);
  assert.match(section, /want-invite-me-out-toggle/);
  assert.match(section, /Invite Me Out is on/);
  assert.match(section, /Invite Me Out is off/);
  assert.match(section, /invite-me-out-settings-sheet/);
  assert.match(section, /InviteMeOutAudiencePicker/);
  assert.match(section, /onInviteMeOutSave/);
  assert.doesNotMatch(section, />Invite Me</);

  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(compose, /InviteMeOutAudiencePicker/);
  assert.match(compose, /want-invite-me-out-settings/);
  assert.match(compose, /inviteMeOutOpen/);
  assert.match(compose, /inviteMeOutAudience/);
  assert.match(compose, /inviteMeOutSelectedIds/);

  const picker = read("src/pages/consumer/myMenuply/InviteMeOutAudiencePicker.jsx");
  assert.match(picker, /Open to Invite Me Out/);
  assert.match(picker, /Anyone Connect/);
  assert.match(picker, /Select specific/);
  assert.match(picker, /invite-me-out-select-list/);

  const mine = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(mine, /saveInviteMeOutSettings/);
  assert.match(mine, /onInviteMeOutSave=\{saveInviteMeOutSettings\}/);
  assert.match(mine, /invite_me_out_audience/);
  assert.match(mine, /async function postWant/);
});

test("Connection peer hub gates Invite Me Out by viewer eligibility", () => {
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.match(peer, /InviteMeOutFlow/);
  assert.match(peer, /viewerMayInviteMeOut/);
  assert.match(peer, /invite_me_out\?\.viewer_may_invite/);
  assert.match(peer, /onInviteMeOut=\{\(\) => setInviteMeOutOpen\(true\)\}/);
});

test("Backend stores Invite Me Out audience on consumer profile", () => {
  const migration = read(
    "../menubloc-backend-main/sql/migrations/20260824_0286_invite_me_out_audience.sql"
  );
  assert.match(migration, /invite_me_out_audience/);
  assert.match(migration, /invite_me_out_allowed_user_ids/);

  const eligibility = read(
    "../menubloc-backend-main/src/services/wantToEat/inviteMeOutEligibility.js"
  );
  assert.match(eligibility, /viewerMayInviteMeOut/);
  assert.match(eligibility, /normalizeInviteMeOutPayload/);

  const wants = read("../menubloc-backend-main/src/services/wantToEat/wantToEatService.js");
  assert.match(wants, /viewer_may_invite/);
  assert.match(wants, /invite_me_out/);

  const profile = read("../menubloc-backend-main/src/routes/consumer/profile.js");
  assert.match(profile, /invite_me_out_audience/);
  assert.match(profile, /invite_me_out_allowed_user_ids/);
});
