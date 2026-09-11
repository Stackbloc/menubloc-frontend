/**
 * Edit View social presets — Take Me Out (Wanna Eat) vs Join Me (plans/crews).
 * Vocabulary must stay separate.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DinerSocialPresetsPanel exists with separate Join Me and Take Me Out rows", () => {
  const panel = read("src/pages/consumer/myMenuply/DinerSocialPresetsPanel.jsx");
  assert.match(panel, /data-testid="diner-social-presets"/);
  assert.match(panel, /data-testid="preset-wanna-eat"/);
  assert.match(panel, /data-testid="preset-plans"/);
  assert.match(panel, /data-testid="preset-crews"/);
  assert.match(panel, /Take Me Out/);
  assert.match(panel, /Join Me/);
  assert.match(panel, /What I Wanna Eat/);
  assert.match(panel, /My Eating Plans/);
  assert.match(panel, /My Crews/);
  assert.match(panel, /InviteMeOutAudiencePicker/);
  assert.match(panel, /JoinMeAudiencePicker/);
  assert.match(panel, /plans_join_me/);
  assert.match(panel, /crews_join_me/);
  assert.match(panel, /showCapacity=\{false\}/);
  assert.match(panel, /is Off — click to turn On|click to turn On/);
  // Vocabulary must not conflate Join Me picker with Invite Me Out allow-list
  assert.doesNotMatch(panel, /Invite Me OutAudiencePicker|joinMeOut/);
  assert.ok(panel.includes("InviteMeOutAudiencePicker"));
  assert.ok(panel.includes("JoinMeAudiencePicker"));
  assert.notEqual(
    panel.indexOf("InviteMeOutAudiencePicker"),
    panel.indexOf("JoinMeAudiencePicker")
  );
});

test("EatingHubSection imports DinerSocialPresetsPanel in edit hub", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(section, /DinerSocialPresetsPanel/);
  assert.match(section, /dinerSocialDefaults/);
  assert.match(section, /onDinerSocialDefaultsSave/);
  assert.match(section, /plansJoinDefaults|plans_join_me/);
  assert.match(section, /initialJoinable=\{planJoinablePrefill\}/);
  // Panel owns InviteMeOutAudiencePicker — hub must not inline it
  assert.doesNotMatch(section, /InviteMeOutAudiencePicker/);
});

test("MyMenuplyPage loads and saves diner_social_defaults", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /parseDinerSocialDefaults/);
  assert.match(page, /diner_social_defaults/);
  assert.match(page, /saveDinerSocialDefaults/);
  assert.match(page, /updateConsumerProfile\(\{\s*diner_social_defaults/);
  assert.match(page, /dinerSocialDefaults=\{dinerSocialDefaults\}/);
  assert.match(page, /onDinerSocialDefaultsSave=\{saveDinerSocialDefaults\}/);
  assert.match(page, /initialJoinMeOpen=\{Boolean\(dinerSocialDefaults\?\.crews_join_me\?\.open\)\}/);
});

test("EventComposeSheet prefills Join Me from crews default", () => {
  const sheet = read("src/pages/consumer/myMenuply/EventComposeSheet.jsx");
  assert.match(sheet, /initialJoinMeOpen/);
  assert.match(sheet, /setJoinMeOpen\(Boolean\(initialJoinMeOpen\)\)/);
});
