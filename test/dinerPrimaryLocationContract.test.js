/**
 * Diner primary location + Find Diners contract tests (no network).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

test("PrimaryLocationPicker uses canonical location reference API", () => {
  const picker = read("src/components/consumer/PrimaryLocationPicker.jsx");
  assert.match(picker, /searchUsCities/);
  assert.match(picker, /fetchUsStates/);
});

test("Find Diners page integrates search + connections", () => {
  const findPage = read("src/pages/consumer/FindDinersPage.jsx");
  assert.match(findPage, /Find Diners/);
  assert.match(findPage, /searchDiners/);
  assert.match(findPage, /requestConnection/);
  assert.match(findPage, /mutual/);
  assert.match(findPage, /location_label/);
  assert.match(findPage, /phone/i);
  assert.match(findPage, /email/i);
  assert.match(findPage, /Connect/);
  assert.doesNotMatch(findPage, /navigator\.share/);
});

test("Profile tab exposes location + discoverability", () => {
  const profileTab = read("src/pages/consumer/accountDashboard/ProfileTab.jsx");
  const styles = read("src/pages/consumer/accountDashboard/accountDashboardStyles.js");
  assert.match(profileTab, /Who can find me/);
  assert.match(profileTab, /name, phone number, or email/);
  assert.match(profileTab, /PrimaryLocationPicker/);
  assert.match(profileTab, /styles\.choiceRow/);
  assert.match(styles, /choiceRow:[\s\S]*color: "#0f172a"/);
  assert.match(styles, /pageInner:[\s\S]*color: "#0f172a"/);
});

test("Social & Crew Find Diners entry mentions contact search + Connect", () => {
  const social = read("src/pages/consumer/accountDashboard/SocialCrewTab.jsx");
  assert.match(social, /find-diners/);
  assert.match(social, /phone/);
  assert.match(social, /email/);
  assert.match(social, /Connect/);
});

test("Routes and API client wired", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /updatePrimaryLocation/);
  assert.match(api, /searchDiners/);
  const app = read("src/App.jsx");
  assert.match(app, /FindDinersPage/);
  assert.match(app, /\/account\/find-diners/);
});

test("Onboarding and identity surfaces include primary location", () => {
  const welcome = read("src/pages/consumer/AccountWelcome.jsx");
  assert.match(welcome, /PrimaryLocationPicker/);
  assert.match(welcome, /updatePrimaryLocation/);
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(hero, /locationLabel/);
});
