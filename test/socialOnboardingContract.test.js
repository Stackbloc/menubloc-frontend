/**
 * Social onboarding guided-introduction contract tests (no network).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SOCIAL_ONBOARDING_STEPS,
  SOCIAL_ONBOARDING_ROUTE,
  defaultDiningCrewNameFromProfile,
  emptySocialOnboardingState,
  isSocialOnboardingComplete,
  markSocialOnboardingStep,
  nextPendingStep,
  normalizeSocialOnboardingState,
} from "../src/lib/socialOnboardingState.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("social onboarding step order is guided introduction sequence", () => {
  assert.deepEqual(SOCIAL_ONBOARDING_STEPS, [
    "welcome",
    "dining_crew",
    "expand_crew",
    "food_camera",
    "student_edu",
    "people_eating",
    "im_eating",
    "waiter",
  ]);
  assert.equal(SOCIAL_ONBOARDING_ROUTE, "/account/social-onboarding");
});

test("default Dining Crew name uses diner identity possessive", () => {
  assert.equal(
    defaultDiningCrewNameFromProfile({ first_name: "Andre" }),
    "Andre's Dining Crew"
  );
  assert.equal(
    defaultDiningCrewNameFromProfile({ first_name: "James" }),
    "James' Dining Crew"
  );
  assert.equal(defaultDiningCrewNameFromProfile({}), "My Dining Crew");
});

test("welcome soft-migrates completed legacy progress", () => {
  const state = normalizeSocialOnboardingState({
    status: "completed",
    steps: {
      dining_crew: "done",
      expand_crew: "skipped",
      food_camera: "done",
      student_edu: "skipped",
      people_eating: "done",
      im_eating: "skipped",
      waiter: "done",
    },
  });
  assert.equal(state.steps.welcome, "done");
  assert.equal(state.status, "completed");
});

test("share food step frames photos and comments without forced camera jargon", () => {
  const page = read("src/pages/consumer/SocialOnboardingPage.jsx");
  assert.match(page, /food_camera/);
  assert.match(page, /Food is worth sharing/);
  assert.match(page, /Share photos or comments/);
  assert.match(page, /social-onboarding-food-camera/);
  assert.doesNotMatch(page, /not just a profile picture/i);
});

test("skip-all settles to completed without errors", () => {
  let state = emptySocialOnboardingState();
  for (const step of SOCIAL_ONBOARDING_STEPS) {
    state = markSocialOnboardingStep(state, step, "skipped");
  }
  assert.equal(isSocialOnboardingComplete(state), true);
  assert.equal(nextPendingStep(state), null);
  assert.equal(state.status, "completed");
});

test("partial progress leaves next pending step", () => {
  let state = markSocialOnboardingStep(emptySocialOnboardingState(), "welcome", "done");
  state = markSocialOnboardingStep(state, "dining_crew", "done");
  state = markSocialOnboardingStep(state, "expand_crew", "skipped");
  assert.equal(nextPendingStep(state), "food_camera");
  assert.equal(isSocialOnboardingComplete(state), false);
});

test("normalize rejects unknown step values", () => {
  const state = normalizeSocialOnboardingState({
    status: "weird",
    steps: { dining_crew: "DONE", expand_crew: "nope" },
  });
  assert.equal(state.steps.dining_crew, "done");
  assert.equal(state.steps.expand_crew, "pending");
  assert.equal(state.steps.welcome, "pending");
});

test("onboarding page is educational with optional actions — not forced tasks", () => {
  const page = read("src/pages/consumer/SocialOnboardingPage.jsx");
  assert.match(page, /Welcome to Menuply/);
  assert.match(page, /Eating is social/);
  assert.match(page, /Who do you eat with\?/);
  assert.match(page, /Create Dining Crew/);
  assert.match(page, /Share invite/);
  assert.match(page, /buildDiningCrewInviteShareData/);
  assert.match(page, /ShareModal/);
  assert.match(page, /Want to expand your Dining Crew\?/);
  assert.match(page, /Meet people through food/);
  assert.match(page, /Are you a student\?/);
  assert.match(page, /What are people eating\?/);
  assert.match(page, /What are you eating\?/);
  assert.match(page, /Ask Waiter/);
  assert.match(page, /guided introduction to Menuply/);
  assert.match(page, /Skip introduction/);
  assert.match(page, /Nothing is required/);
  assert.match(page, /Cluster → Subscribe → Food activity → Waiter updates/);
  assert.match(page, /WhatPeopleAreEating/);
  assert.match(page, /ImEatingComposer/);
  assert.match(page, /createDiningCrew/);
  assert.match(page, /updateDiningCrew/);
  assert.match(page, /inviteToDiningCrew/);
  assert.match(page, /defaultDiningCrewNameFromProfile/);
  assert.match(page, /sendEduVerification/);
  assert.match(page, /createImEating/);
  assert.match(page, /fetchWaiterPeopleEating/);
  assert.match(page, /user-reported/);
  assert.doesNotMatch(page, /Step \{?stepIndex\}? of/);
  assert.doesNotMatch(page, /Step \$\{stepIndex\} of/);
  assert.doesNotMatch(page, /navigator\.contacts|ContactsManager|requestPermission/);
  assert.doesNotMatch(page, /Text an invite/);
  assert.doesNotMatch(page, /notification permission|enable push/i);
  assert.doesNotMatch(page, /Menuply user id|invitee_user_id|recipient_user_id/);
});

test("App route and account entry points wired", () => {
  const app = read("src/App.jsx");
  assert.match(app, /SocialOnboardingPage/);
  assert.match(app, /\/account\/social-onboarding/);
  const welcome = read("src/pages/consumer/AccountWelcome.jsx");
  assert.match(welcome, /\/account\/social-onboarding/);
  const profile = read("src/pages/consumer/ConsumerProfile.jsx");
  assert.match(profile, /\/account\/social-onboarding/);
});

test("backend social-onboarding route includes welcome step", () => {
  const beRoot = path.join(root, "..", "menubloc-backend-main");
  const route = fs.readFileSync(
    path.join(beRoot, "src/routes/consumer/socialOnboarding.js"),
    "utf8"
  );
  const index = fs.readFileSync(path.join(beRoot, "src/routes/consumer/index.js"), "utf8");
  assert.match(route, /\/social-onboarding/);
  assert.match(route, /social_onboarding/);
  assert.match(route, /"welcome"/);
  assert.match(route, /food_camera/);
  assert.match(route, /applyWelcomeSoftMigrate/);
  assert.match(index, /socialOnboarding/);
  const migration = fs.readFileSync(
    path.join(beRoot, "sql/migrations/20260814_0247_consumer_social_onboarding.sql"),
    "utf8"
  );
  assert.match(migration, /social_onboarding JSONB/);
});
