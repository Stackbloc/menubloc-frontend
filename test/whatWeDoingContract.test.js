/**
 * What We Doing? Phase 1 FE contract.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatWhatWeDoingTitle,
  menuplyWhatWeDoingUrl,
} from "../src/lib/whatWeDoingTitle.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("formatWhatWeDoingTitle matches product chrome", () => {
  assert.equal(formatWhatWeDoingTitle("2026-06-12"), "What we doing Friday, June 12th?");
  assert.equal(
    menuplyWhatWeDoingUrl("11111111-1111-4111-8111-111111111111"),
    "https://menuply.com/account/what-we-doing/11111111-1111-4111-8111-111111111111"
  );
});

test("routes and profile entry exist; HomeNext and Waiter untouched", () => {
  const app = read("src/App.jsx");
  assert.match(app, /WhatWeDoingPage/);
  assert.match(app, /WhatWeDoingSessionPage/);
  assert.match(app, /ConsumerNotificationsPage/);
  assert.match(app, /\/account\/what-we-doing/);
  assert.match(app, /\/account\/notifications/);

  const profile = read("src/pages/consumer/accountDashboard/SocialCrewTab.jsx");
  assert.match(profile, /What We Doing\?/);
  assert.match(profile, /\/account\/what-we-doing/);
  assert.match(profile, /\/account\/notifications/);

  const planPage = read("src/pages/consumer/WhatWeDoingPage.jsx");
  assert.match(planPage, /searchParams\.get\("with"\)/);

  const api = read("src/lib/consumerApi.js");
  assert.match(api, /createWhatWeDoingSession/);
  assert.match(api, /joinWhatWeDoingSession/);
  assert.match(api, /makeWhatWeDoingPlan/);
  assert.match(api, /listConsumerNotifications/);

  const session = read("src/pages/consumer/WhatWeDoingSessionPage.jsx");
  assert.match(session, /Make It a Plan/);
  assert.match(session, /Join this plan/);
  assert.match(session, /My vote/);
  assert.match(session, /Leading/);

  // Guardrails: this feature must not rewrite Waiter or HomeNext
  assert.doesNotMatch(read("src/pages/FoodInterestsPage.jsx").slice(0, 200), /what-we-doing/i);
});
