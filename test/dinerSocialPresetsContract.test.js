/**
 * Edit View social presets — Take Me Out (Wanna Eat) vs Join Crew.
 * Join Me for plans/events is per instance only (vocabulary contract).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DinerSocialPresetsPanel scopes Take Me Out / Join Crew (not section Join Me)", () => {
  const panel = read("src/pages/consumer/myMenuply/DinerSocialPresetsPanel.jsx");
  assert.match(panel, /data-testid="diner-social-presets"/);
  assert.match(panel, /data-testid="preset-wanna-eat"/);
  assert.match(panel, /data-testid="preset-crews"/);
  assert.doesNotMatch(panel, /data-testid="preset-plans"/);
  assert.doesNotMatch(panel, /data-testid="preset-events"/);
  assert.match(panel, /featureLabel="Take Me Out"/);
  assert.match(panel, /featureLabel="Join Crew"/);
  assert.match(panel, /crews_join_me/);
  assert.match(panel, /activeScope === "wanna-eat"/);
  assert.match(panel, /activeScope === "crews"/);
  assert.match(panel, /variant="preset"/);
  assert.match(panel, /per instance/);
});

test("DinerSocialPresetsPanel uses stable empty defaults (Edit View max-update-depth)", () => {
  const panel = read("src/pages/consumer/myMenuply/DinerSocialPresetsPanel.jsx");
  assert.match(panel, /EMPTY_ID_LIST = Object\.freeze\(\[\]\)/);
  assert.match(panel, /inviteMeOutSelectedIds = EMPTY_ID_LIST/);
  assert.match(panel, /selectedIdsKey/);
  assert.doesNotMatch(panel, /inviteMeOutSelectedIds = \[\]/);
});

test("Edit View audience pickers use quiet preset variant", () => {
  const invite = read("src/pages/consumer/myMenuply/InviteMeOutAudiencePicker.jsx");
  const join = read("src/pages/consumer/myMenuply/JoinMeAudiencePicker.jsx");
  assert.match(invite, /variant === "preset"/);
  assert.match(join, /variant === "preset"/);
  assert.match(invite, /All Connects/);
  assert.match(join, /All Connects/);
});

test("EatingHubSection places Invite Me preset on Wanna Eat only; plans use per-instance Join Me", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(section, /DinerSocialPresetsPanel/);
  assert.match(section, /scope="wanna-eat"/);
  assert.doesNotMatch(section, /scope="plans"/);
  assert.match(section, /isConnectPreview && typeof onJoinMeFromCraving/);
  assert.doesNotMatch(section, /canEdit \|\| isConnectPreview/);
  assert.match(section, /initialJoinable=\{planJoinablePrefill\}/);
  assert.match(section, /Join Me is per plan instance/);
  assert.match(section, /planJoinablePrefill[\s\S]*false/);
});

test("MyMenuplyPage mounts Crews Join Crew preset; Events Join Me is per event", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.doesNotMatch(page, /scope="events"/);
  assert.match(page, /scope="crews"/);
  assert.match(page, /saveDinerSocialDefaults/);
  assert.doesNotMatch(page, /events_join_me\?\.open/);
  assert.match(page, /shareDinerSocialEventInvite|EventComposeSheet/);
});

test("EventComposeSheet sets Join Me per event with audience picker", () => {
  const sheet = read("src/pages/consumer/myMenuply/EventComposeSheet.jsx");
  assert.match(sheet, /JoinMeAudiencePicker/);
  assert.match(sheet, /joinAudience/);
  assert.match(sheet, /joinAllowedUserIds/);
  assert.match(sheet, /initialEvent/);
  assert.match(sheet, /Open to Join Me|joinable=\{joinMeOpen\}/);
  assert.match(sheet, /Save event/);
});

test("My events cards: Edit status line vs Connect JoinMeButton", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  const btn = read("src/pages/consumer/myMenuply/JoinMeButton.jsx");
  const line = read("src/pages/consumer/myMenuply/JoinMeStatusLine.jsx");
  assert.match(page, /onSocialEventJoinMeToggle/);
  assert.match(page, /onJoinMeToggle/);
  assert.match(page, /joinMeSurface=\{previewAsConnect \? "connect" : "edit"\}/);
  assert.doesNotMatch(page, /Join Me open/);
  assert.match(bits, /JoinMeStatusLine/);
  assert.match(bits, /named-share-join-me-status/);
  assert.match(bits, /named-share-join-me/);
  assert.match(btn, /#166534|GREEN_MID/);
  assert.doesNotMatch(btn, /#173404/);
  assert.match(line, /Join Me is \{state\}/);
  assert.doesNotMatch(bits, /Turn on Join Me/);
  assert.doesNotMatch(bits, /editJoinMeLabel/);
});
