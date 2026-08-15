/**
 * Social onboarding guided-activation contract tests (no network).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SOCIAL_ONBOARDING_STEPS,
  SOCIAL_ONBOARDING_ROUTE,
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

test("social onboarding step order matches product questions", () => {
  assert.deepEqual(SOCIAL_ONBOARDING_STEPS, [
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

test("food camera step frames community food photography", () => {
  const page = read("src/pages/consumer/SocialOnboardingPage.jsx");
  assert.match(page, /food_camera/);
  assert.match(page, /take photos of food and share them with the\s+Menuply community/);
  assert.match(page, /not just a profile picture/i);
  assert.match(page, /social-onboarding-food-camera/);
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
  let state = markSocialOnboardingStep(emptySocialOnboardingState(), "dining_crew", "done");
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
});

test("onboarding page reuses existing social surfaces and skippable copy", () => {
  const page = read("src/pages/consumer/SocialOnboardingPage.jsx");
  assert.match(page, /Who do you eat with\?/);
  assert.match(page, /This is your Dining Crew/);
  assert.match(page, /Want to expand your Dining Crew by meeting new people\?/);
  assert.match(page, /Are you a student\?/);
  assert.match(page, /Not a student\? No problem/);
  assert.match(page, /What are people eating\?/);
  assert.match(page, /What are you eating\?/);
  assert.match(page, /Ask Waiter/);
  assert.match(page, /Skip this step/);
  assert.match(page, /WhatPeopleAreEating/);
  assert.match(page, /ImEatingComposer/);
  assert.match(page, /createDiningCrew/);
  assert.match(page, /inviteToDiningCrew/);
  assert.match(page, /Text an invite/);
  assert.match(page, /buildShareLinks/);
  assert.match(page, /Messages app/);
  assert.match(page, /normalizeConsumerShareUrl/);
  assert.match(page, /sendEduVerification/);
  assert.match(page, /createImEating/);
  assert.match(page, /fetchWaiterPeopleEating/);
  assert.match(page, /people shared|user-reported|does not claim verified purchases/i);
  assert.doesNotMatch(page, /navigator\.contacts|ContactsManager|requestPermission/);
  assert.doesNotMatch(page, /Create Dining Crew/);
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

test("backend social-onboarding route exists and is mounted", () => {
  const beRoot = path.join(root, "..", "menubloc-backend-main");
  const route = fs.readFileSync(
    path.join(beRoot, "src/routes/consumer/socialOnboarding.js"),
    "utf8"
  );
  const index = fs.readFileSync(path.join(beRoot, "src/routes/consumer/index.js"), "utf8");
  assert.match(route, /\/social-onboarding/);
  assert.match(route, /social_onboarding/);
  assert.match(route, /food_camera/);
  assert.match(index, /socialOnboarding/);
  const migration = fs.readFileSync(
    path.join(beRoot, "sql/migrations/20260814_0247_consumer_social_onboarding.sql"),
    "utf8"
  );
  assert.match(migration, /social_onboarding JSONB/);
});
