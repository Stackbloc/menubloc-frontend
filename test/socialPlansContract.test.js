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

test("Phase C: My Menuply Connects section — owner only, GET only, every row has a button", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /\{previewAsConnect \? null : <ConnectsNowSection \/>\}/);
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /export const getConnectsNow = \(\) => get\("\/api\/consumer\/social-plans\/connects"\);/);
  const section = read("src/pages/consumer/myMenuply/ConnectsNowSection.jsx");
  for (const label of ['"Pending connect requests"', '"Needs your answer"', '"Right now"', '"Coming up"', 'Accept', 'Decline', 'button="Join"', 'button="Invite"', '"On your Wish List"']) {
    assert.ok(section.includes(label), label);
  }
  // Connect requests are answered on the Profile itself (Andre 2026-10-30), not by a link away.
  assert.match(section, /\(approve \? acceptConnection : declineConnection\)\(a\.connection_id\)/);
  assert.doesNotMatch(section, /button="Answer"/);
});

test("Phase B: calendar setting, plan sharing, Can I come?, answer — website calls and placement", () => {
  const api = read("src/lib/consumerApi.js");
  for (const re of [
    /put\("\/api\/consumer\/social-plans\/settings", body\)/,
    /patch\(socialPlanPath\(source, ref\), body\)/,
    /post\(`\$\{socialPlanPath\(source, ref\)\}\/join-requests`/,
    /del\(`\$\{socialPlanPath\(source, ref\)\}\/join-requests\/mine`\)/,
    /social-plans\/join-requests\/\$\{encodeURIComponent\(String\(requestId\)\)\}\/\$\{approve \? "approve" : "decline"\}/,
    /get\(`\/api\/consumer\/social-plans\/connections\/\$\{encodeURIComponent\(String\(peerId\)\)\}`\)/,
  ]) {
    assert.match(api, re);
  }
  const page = read("src/pages/consumer/SocialPlansPage.jsx");
  assert.match(page, /<CalendarWhoCard \/>/);
  assert.match(page, /<PlanPanel\n\s+plan=\{p\}\n\s+onSaved=\{replacePlan\}/);
  const sharing = read("src/pages/consumer/myMenuply/SocialPlanSharing.jsx");
  for (const label of ['"All my Connects"', '"Only some Connects"', '"Just me"', '"Only people I invite"', '"Let my Connects ask"', "You’ll say yes or no to each one."]) {
    assert.ok(sharing.includes(label), label);
  }
  assert.match(sharing, /Only your Connects, never anyone else\./);
  const button = read("src/pages/consumer/myMenuply/SocialPlanActionButton.jsx");
  assert.match(button, /ask: "Can I come\?", asked: "Asked ✓", going: "Going ✓"/);
  const section = read("src/pages/consumer/myMenuply/ConnectsNowSection.jsx");
  assert.match(section, /Can I come\? · \$\{a\.plan_title\}/);
  assert.match(read("src/pages/consumer/ConsumerConnectionPeerPage.jsx"), /<PeerPlansSection peerId=\{peerId\} name=\{name\} \/>/);
});

test("tags + pick a day & time", async () => {
  const { planTag } = await import("../src/lib/socialPlanTags.js");
  assert.equal(planTag({ kind: "dine", time: "12:30" }).label, "Lunch");
  assert.equal(planTag({ kind: "dine", time: "19:00" }).label, "Dinner");
  assert.equal(planTag({ kind: "dine", time: null }).label, "Meal");
  assert.equal(planTag({ source: "my_event", time: null }).label, "Event");
  const page = read("src/pages/consumer/SocialPlansPage.jsx");
  assert.match(page, /\} else if \(p\.time_open\) \{\n\s+e\.preventDefault\(\);/);
  assert.match(page, /"Pick a day & time ›"/);
  const pick = read("src/pages/consumer/myMenuply/PickPlanTime.jsx");
  assert.match(pick, /saveSocialPlanSharing\(plan\.source, plan\.id, \{ date, time: needsTime \? time : null \}\)/);
  assert.match(pick, /respondToEatInvitation\(plan\.id, "accepted", \{ proposedDate: date, proposedTime: time \}\)/);
});

test("My Social Calendar: month grid on the page, week strip on My Menuply (owner only)", async () => {
  const { plansByDay, ymdOf } = await import("../src/lib/socialPlanTags.js");
  assert.equal(ymdOf(new Date(2026, 9, 5)), "2026-10-05");
  const m = plansByDay([{ key: "a", date: "2026-10-30" }, { key: "b", date: "2026-10-30" }, { key: "c", date: null }]);
  assert.equal(m.get("2026-10-30").length, 2);
  assert.equal(m.size, 1);
  const page = read("src/pages/consumer/SocialPlansPage.jsx");
  assert.match(page, /<MonthGrid\n\s+month=\{month\}\n\s+plans=\{calPlans\}/);
  assert.match(page, /searchParams\.get\("day"\)/);
  assert.match(page, /const shown = day \? calPlans\.filter\(\(p\) => p\.date === day\) : data\.plans;/);
  const mm = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(mm, /\{previewAsConnect \? null : <SocialCalendarCard \/>\}/);
  const card = read("src/pages/consumer/myMenuply/SocialCalendarCard.jsx");
  assert.match(card, /My Social Calendar/);
  assert.match(card, /navigate\(`\/account\/social-plans\?day=\$\{day\}`\)/);
});

test("simpler calendar (Andre 2026-10-28): calendar first, + New plan adds to the calendar, two choices", () => {
  const page = read("src/pages/consumer/SocialPlansPage.jsx");
  assert.doesNotMatch(page, /compose: "plan"|Plan a meal/);
  assert.ok(page.indexOf("social-plans-add") < page.indexOf("<MonthGrid"));
  assert.match(page, /\{settingsOpen \? <CalendarWhoCard \/> : null\}/);
  assert.match(page, /searchParams\.get\("new"\)/);
  const form = read("src/pages/consumer/myMenuply/NewPlanPanel.jsx");
  assert.match(form, /createSocialPlan\(\{\n\s+kind,\n\s+date,\n\s+time,/);
  assert.match(form, /"Add to calendar"/);
  assert.match(form, /"Invite people"/);
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /createSocialPlan = \(body\) => post\("\/api\/consumer\/social-plans", body\)/);
  const sharing = read("src/pages/consumer/myMenuply/SocialPlanSharing.jsx");
  assert.doesNotMatch(sharing, /"Ask to join"|"Invite only"|"Open"\]/);
});

test("a Connect's profile follows the app's Connect screen (Andre 2026-10-30)", () => {
  const page = read("src/pages/consumer/ConnectProfilePage.jsx");
  for (const label of ['"Wish List"', '"No vibe set right now"', 'Social Calendar']) {
    assert.ok(page.includes(label.replace(/^"|"$/g, "")), label);
  }
  assert.match(page, /<PeerPlansSection peerId=\{peerId\} name=\{name\} \/>/);
  assert.ok(page.indexOf('data-testid="connect-profile-clips"') < page.indexOf("<PeerPlansSection peerId"), "calendar last");
  assert.match(page, /listConnectionsEating\(12, peerId\)/);
  assert.match(page, /listPeerWantToEat\(peerId\)/);
  const section = read("src/pages/consumer/myMenuply/ConnectsNowSection.jsx");
  assert.match(section, /No pending connect requests\./);
});

test("Connect View = the app's Connect screen with your own data (Andre 2026-10-30)", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /previewAsConnect \? \(\n\s+<SelfConnectView /);
  assert.match(page, /!appLayout && !previewAsConnect && !subView \?/);
  const screen = read("src/pages/consumer/ConnectProfilePage.jsx");
  assert.match(screen, /export function SelfConnectView/);
  assert.match(screen, /This is how your Connects see you\./);
  assert.match(screen, /<ConnectScreenBody peer=\{peer\} name=\{displayName \|\| "You"\}/);
});
