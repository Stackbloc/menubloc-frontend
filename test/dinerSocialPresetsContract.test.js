/**
 * Edit View social presets — Take Me Out (Wanna Eat) vs Join Me (plans/events) vs Join Crew.
 * Vocabulary must stay separate.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DinerSocialPresetsPanel scopes Take Me Out / Join Me / Join Crew", () => {
  const panel = read("src/pages/consumer/myMenuply/DinerSocialPresetsPanel.jsx");
  assert.match(panel, /data-testid="diner-social-presets"/);
  assert.match(panel, /data-testid="preset-wanna-eat"/);
  assert.match(panel, /data-testid="preset-plans"/);
  assert.match(panel, /data-testid="preset-events"/);
  assert.match(panel, /data-testid="preset-crews"/);
  assert.match(panel, /featureLabel="Take Me Out"/);
  assert.match(panel, /featureLabel="Join Me"/);
  assert.match(panel, /featureLabel="Join Crew"/);
  assert.match(panel, /events_join_me/);
  assert.match(panel, /plans_join_me/);
  assert.match(panel, /crews_join_me/);
  assert.match(panel, /activeScope === "wanna-eat"/);
  assert.match(panel, /activeScope === "events"/);
  assert.match(panel, /activeScope === "crews"/);
  assert.match(panel, /variant="preset"/);
});

test("Edit View audience pickers use quiet preset variant", () => {
  const invite = read("src/pages/consumer/myMenuply/InviteMeOutAudiencePicker.jsx");
  const join = read("src/pages/consumer/myMenuply/JoinMeAudiencePicker.jsx");
  assert.match(invite, /variant === "preset"/);
  assert.match(join, /variant === "preset"/);
  assert.match(invite, /All Connects/);
  assert.match(join, /All Connects/);
});

test("EatingHubSection places presets in Wanna Eat + Plans; Connect-only craving CTA", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(section, /DinerSocialPresetsPanel/);
  assert.match(section, /scope="wanna-eat"/);
  assert.match(section, /scope="plans"/);
  assert.match(section, /isConnectPreview && typeof onJoinMeFromCraving/);
  assert.doesNotMatch(section, /canEdit \|\| isConnectPreview/);
  assert.match(section, /initialJoinable=\{planJoinablePrefill\}/);
});

test("MyMenuplyPage mounts Events Join Me + Crews Join Crew presets", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /scope="events"/);
  assert.match(page, /scope="crews"/);
  assert.match(page, /events_join_me/);
  assert.match(page, /saveDinerSocialDefaults/);
  assert.match(page, /initialJoinMeOpen=\{Boolean\(dinerSocialDefaults\?\.events_join_me\?\.open\)\}/);
  assert.doesNotMatch(
    page,
    /initialJoinMeOpen=\{Boolean\(dinerSocialDefaults\?\.crews_join_me\?\.open\)\}/
  );
});

test("EventComposeSheet prefills Join Me from events default", () => {
  const sheet = read("src/pages/consumer/myMenuply/EventComposeSheet.jsx");
  assert.match(sheet, /initialJoinMeOpen/);
  assert.match(sheet, /setJoinMeOpen\(Boolean\(initialJoinMeOpen\)\)/);
});
