/**
 * My Menuply four questions + connections eat-together conversion.
 * Settings and Share stay on /account, not on My Menuply. Allergies not on the hub.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("My Menuply is the diner's personal home", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const compose = read("src/pages/consumer/myMenuply/QuickCompose.jsx");
  const eatingPage = read("src/pages/consumer/ConnectionsEatingPage.jsx");
  assert.match(page, /DinerIdentityHero/);
  assert.match(page, /data-testid="what-im-eating"/);
  assert.match(page, /data-testid="eating-plans"/);
  assert.match(page, /data-testid="want-to-eat"/);
  assert.match(page, /data-testid="dining-crews"/);
  assert.match(page, /data-testid="my-events"/);
  assert.match(page, /What I'm Eating/);
  assert.match(page, /title="My Eating Plans"/);
  assert.match(page, /eating-plans-calendar/);
  assert.match(page, /EatingPlanDayForm/);
  assert.match(page, /Invite Me/);
  assert.match(page, /Join Me/);
  assert.ok(page.indexOf("eating-plans-calendar") < page.indexOf("Invite Me"));
  assert.match(page, /What I Want to Eat/);
  assert.match(page, /My Crews/);
  assert.match(page, /My Events/);
  assert.match(page, /QuickCompose/);
  assert.match(page, /createWhatIAteToday/);
  assert.match(page, /createWhatWeDoingSession/);
  assert.match(page, /createDiningCrew/);
  const form = read("src/pages/consumer/myMenuply/EatingPlanDayForm.jsx");
  assert.match(form, /People can join/);
  assert.match(form, /How many can join/);
  assert.match(form, /searchReportPlaces/);
  assert.match(form, /eating-plan-selected-restaurant/);
  assert.match(bits, /EatingPlanCard/);
  assert.match(bits, /Restaurant/);
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /joinWhatWeDoingSession/);
  assert.match(hero, /About Me/);
  assert.match(hero, /My Connections/);
  assert.match(hero, /\/my-menuply\/connections-eating/);
  assert.match(eatingPage, /StickyPageHeader title="My Connections"/);
  assert.match(compose, /acceptPhoto/);
  assert.ok(page.indexOf("DinerIdentityHero") < page.indexOf("what-im-eating"));
  assert.ok(page.indexOf("what-im-eating") < page.indexOf("eating-plans"));
  assert.doesNotMatch(page, /What My Connections Are Eating/);
  assert.doesNotMatch(page, /What My Connections Are Planning/);
  assert.doesNotMatch(page, /Where I Eat/);
  assert.doesNotMatch(page, /Dining Crews/);
  assert.doesNotMatch(page, /actionLabel/);
  assert.doesNotMatch(page, /See all/);
  assert.doesNotMatch(page, /What's happening/);
  assert.doesNotMatch(page, /public-activity/);
  assert.doesNotMatch(page, /\/waiter#activity/);
  assert.doesNotMatch(page, /allergen/i);
  assert.doesNotMatch(page, /dietary_preferences/);
  assert.doesNotMatch(bits, /actionLabel/);
  assert.doesNotMatch(hero, /Share My Menuply/);
  assert.doesNotMatch(hero, /Settings/);
  assert.doesNotMatch(hero, /\/account\/diner-qr/);
});

test("Connections eating cards link to menu items and Join Me / Invite to Eat", () => {
  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(bits, /View Menu Item/);
  assert.match(bits, /Join Me/);
  assert.match(bits, /InviteToEatButton/);
  assert.match(bits, /\/menu-items\//);
  assert.doesNotMatch(bits, /follower/);
});

test("Activity is broader happening and does not replace connections eating", () => {
  const activity = read("src/components/WaiterPublicActivity.jsx");
  const redirect = read("src/pages/ActivityPage.jsx");
  const waiter = read("src/pages/FoodInterestsPage.jsx");
  assert.match(activity, /not what your connections are eating/i);
  assert.match(activity, /\/my-menuply/);
  assert.match(activity, /What People Are Eating/);
  assert.doesNotMatch(activity, /What My Connections Are Eating/);
  assert.match(redirect, /\/waiter#activity/);
  assert.match(waiter, /WaiterPublicActivity/);
});

test("Settings dashboard stays at /account and points to My Menuply", () => {
  const profile = read("src/pages/consumer/ConsumerProfile.jsx");
  const social = read("src/pages/consumer/accountDashboard/SocialCrewTab.jsx");
  assert.match(profile, /Settings/);
  assert.match(social, /\/my-menuply/);
  assert.match(social, /Open My Menuply/);
});

test("Consumer API calls connections eating/planning aggregators", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /\/api\/consumer\/connections\/eating/);
  assert.match(api, /\/api\/consumer\/connections\/planning/);
});
