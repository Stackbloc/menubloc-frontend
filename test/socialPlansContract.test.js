/**
 * Contract: Social Plans on menuply.com (Andre approved 2026-10-28, menuply-mobile docs/15, Phase A).
 * "Event" / "My Eating Plans" are now Social Plans; /account/social-plans lists every plan read-only.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("X sheet: one Social Plans section with the calendar first", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /title: "Social Plans",/);
  assert.doesNotMatch(sheet, /Plan & Invite/);
  assert.match(sheet, /actionIds: \["social-calendar", "plan", "event", "invite"/);
  assert.match(sheet, /to: "\/account\/social-plans"/);
  assert.doesNotMatch(sheet, /title: "My Events"|title: "My Eating Plans"/);
});

test("Feed: plans and events share the Social Plans label", async () => {
  const { liveFeedCategoryLabel, liveFeedFullCategoryLabel, LIVE_FEED_CHANNELS } = await import(
    "../src/lib/liveFeedCategory.js"
  );
  assert.equal(liveFeedCategoryLabel("plan"), "Social Plans");
  assert.equal(liveFeedCategoryLabel("event"), "Social Plans");
  assert.equal(liveFeedFullCategoryLabel("event"), "Social Plans");
  assert.equal(LIVE_FEED_CHANNELS.filter((c) => c.label === "Social Plans").length, 1);
});

test("Social Calendar page: signed-in, GET only, Coming up / Past", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/account\/social-plans" element=\{crmHost \? <HostRouteRedirect to="\/crm" \/> : <SocialPlansPage \/>\}/);
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /export const listMySocialPlans = \(scope = "upcoming"\) =>\n  get\(`\/api\/consumer\/social-plans\?scope=/);
  const page = read("src/pages/consumer/SocialPlansPage.jsx");
  assert.match(page, /account\/login\?next=/);
  assert.match(page, /"Coming up"/);
  assert.match(page, /"Past"/);
  assert.doesNotMatch(page, /\b(post|put|patch|del)\(/);
});

test("My Menuply copy: calendars say Social Plans", () => {
  for (const p of [
    "src/pages/consumer/MyMenuplyPage.jsx",
    "src/pages/consumer/myMenuply/EatingHubSection.jsx",
    "src/pages/consumer/myMenuply/DinerCalendarSheet.jsx",
  ]) {
    const s = read(p);
    assert.doesNotMatch(s, /"My Events"|"My Eating Plans"/, p);
  }
  assert.match(read("src/pages/consumer/myMenuply/EventComposeSheet.jsx"), /Add to Social Plans/);
});
