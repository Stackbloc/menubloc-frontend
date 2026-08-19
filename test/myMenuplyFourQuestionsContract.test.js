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
  assert.doesNotMatch(page, /data-testid="eating-plans"/);
  assert.match(page, /data-testid="want-to-eat"/);
  assert.match(page, /data-testid="dining-crews"/);
  assert.match(page, /data-testid="my-events"/);
  assert.match(page, /What I'm Eating/);
  assert.doesNotMatch(page, /title="My Eating Plans"/);
  assert.match(page, /eating-plans-calendar/);
  assert.match(page, /DinerCalendarTrigger/);
  assert.match(page, /PostAfterActions/);
  assert.match(page, /Invite Me/);
  assert.match(page, /Join Me/);
  assert.match(page, /EatingPlanDayForm/);
  assert.match(page, /joinCandidates/);
  assert.match(page, /listPendingEatInvitePeople/);
  assert.match(page, /future-plans-calendar/);
  assert.ok(page.indexOf("compose-eating") < page.indexOf("<PhotoGrid"));
  assert.ok(page.indexOf("<PhotoGrid") < page.indexOf("eating-plans-calendar"));
  assert.ok(page.indexOf("eating-plans-calendar") < page.indexOf("Future plans"));
  assert.ok(page.indexOf("eating-plans-calendar") < page.indexOf("Invite Me"));
  assert.match(page, /Click to Schedule Future Plans/);
  assert.match(page, /No Plans Scheduled/);
  assert.doesNotMatch(page, /^\s*Plans Scheduled\s*$/m);
  assert.match(page, /isScheduledEatingPlan/);
  assert.match(page, /FuturePlanRow/);
  assert.match(page, /onSelectEvent/);
  assert.doesNotMatch(page, /empty="Nothing yet."/);
  assert.match(page, /What I Want to Eat/);
  assert.match(page, /My Crews/);
  assert.match(page, /My Events/);
  assert.match(page, /NamedShareCard/);
  assert.match(page, /Invite people to join/);
  assert.match(page, /inviteToDiningCrew/);
  assert.match(page, /inviteToVenueEventGroup/);
  assert.match(page, /ShareModal/);
  assert.match(page, /buildDiningCrewInviteShareData/);
  assert.match(page, /buildMenuplyPathShareData/);
  assert.match(page, /visibility: "public"/);
  assert.doesNotMatch(page, /navigator\.share/);
  assert.match(page, /QuickCompose/);
  assert.match(page, /createWhatIAteToday/);
  assert.match(page, /createWhatWeDoingSession/);
  assert.match(page, /createDiningCrew/);
  assert.match(page, /createWantToEat/);
  assert.match(page, /compose-want/);
  const after = read("src/pages/consumer/myMenuply/PostAfterActions.jsx");
  assert.match(after, /People can join/);
  assert.match(after, /How many can join/);
  assert.match(after, /searchReportPlaces/);
  assert.match(after, /Tag a dish/);
  assert.match(after, /Recipe/);
  assert.match(after, /WHAT_I_ATE_MEAL_PERIODS/);
  assert.match(after, /updateWantToEat/);
  assert.match(after, /suggestWhatIAteTodayMenuItems/);
  assert.match(after, /want-link-menu-item/);
  assert.match(after, /updateWhatWeDoingSession/);
  assert.match(after, /updateWhatIAteToday/);
  assert.match(bits, /EatingPlanCard/);
  assert.match(bits, /Add details/);
  assert.match(bits, /View dish/);
  assert.match(bits, /restaurant_name/);
  assert.match(bits, /Restaurant/);
  assert.match(bits, /Click to add photo of meal/);
  assert.match(bits, /Request to join/);
  assert.match(bits, /isScheduledEatingPlan/);
  const form = read("src/pages/consumer/myMenuply/EatingPlanDayForm.jsx");
  assert.match(form, /asRestaurantPlace/);
  assert.match(form, /restaurantLabel/);
  assert.match(form, /selectedName/);
  assert.match(form, /JoinMeAudiencePicker/);
  assert.match(form, /joinAllowedUserIds/);
  const picker = read("src/pages/consumer/myMenuply/JoinMeAudiencePicker.jsx");
  assert.match(picker, /Anyone Connect/);
  assert.match(picker, /Select specific/);
  assert.match(picker, /Pending Invite/);
  const candidates = read("src/pages/consumer/myMenuply/joinMeCandidates.js");
  assert.match(candidates, /pendingInvites/);
  assert.match(candidates, /"invite"/);
  assert.match(bits, /NamedShareCard/);
  assert.match(bits, /Invite people to join/);
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /joinWhatWeDoingSession/);
  assert.match(api, /listPendingEatInvitePeople/);
  assert.match(api, /\/api\/consumer\/want-to-eat/);
  assert.match(hero, /About Me/);
  assert.match(hero, /My Connections/);
  assert.match(hero, /viewerUserId/);
  assert.match(hero, /\/my-menuply\/connections-eating/);
  assert.match(eatingPage, /StickyPageHeader title="My Connections"/);
  assert.match(compose, /acceptPhoto/);
  const calendar = read("src/pages/consumer/myMenuply/DinerCalendarSheet.jsx");
  assert.match(calendar, /diner-calendar-open/);
  assert.match(calendar, /calendar-event/);
  assert.ok(page.indexOf("DinerIdentityHero") < page.indexOf("what-im-eating"));
  assert.ok(page.indexOf("what-im-eating") < page.indexOf("want-to-eat"));
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
