/**
 * My Menuply four questions + connections eat-together conversion.
 * Settings remain at /account. Allergies not on the social hub.
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

test("My Menuply exposes the four food questions as distinct sections", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /data-testid="what-im-eating"/);
  assert.match(page, /data-testid="connections-eating"/);
  assert.match(page, /data-testid="eating-plans"/);
  assert.match(page, /data-testid="connections-planning"/);
  assert.match(page, /What I'm Eating/);
  assert.match(page, /What My Connections Are Eating/);
  assert.match(page, /Eating Plans/);
  assert.match(page, /What My Connections Are Planning/);
  assert.match(page, /Where I Eat/);
  assert.match(page, /Want to Eat/);
  assert.match(page, /Dining Crews/);
  assert.match(page, /DinerIdentityHero/);
  assert.doesNotMatch(page, /allergen/i);
  assert.doesNotMatch(page, /dietary_preferences/);
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(hero, /Settings/);
  assert.match(hero, /About Me/);
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
  const activity = read("src/pages/ActivityPage.jsx");
  assert.match(activity, /not what your connections are eating/i);
  assert.match(activity, /\/my-menuply/);
  assert.match(activity, /What People Are Eating/);
  assert.doesNotMatch(activity, /What My Connections Are Eating/);
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
