/**
 * Dining Crew invite share — ShareModal replaces prototype raw-URL dump.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDiningCrewInviteShareData,
  buildMenuplyPathShareData,
  menuplyDiningCrewInviteUrl,
} from "../src/lib/diningCrewInviteShare.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("dining crew invite share locks menuply.com URL", () => {
  const data = buildDiningCrewInviteShareData(
    "https://menubloc-frontend-preview.vercel.app/account/dining-crews/invite/abc123"
  );
  assert.ok(data);
  assert.equal(data.url, "https://menuply.com/account/dining-crews/invite/abc123");
  assert.match(data.title, /Dining Crew/i);
  assert.match(data.text, /Join my Dining Crew/i);

  assert.equal(
    menuplyDiningCrewInviteUrl("/account/dining-crews/invite/xyz"),
    "https://menuply.com/account/dining-crews/invite/xyz"
  );
  assert.equal(buildDiningCrewInviteShareData(""), null);
});

test("event and event-group share paths lock to menuply.com", () => {
  const eventShare = buildMenuplyPathShareData("/events/coachella-saturday", {
    title: "Coachella Saturday",
    text: "Join me at Coachella Saturday on Menuply.",
  });
  assert.equal(eventShare.url, "https://menuply.com/events/coachella-saturday");
  assert.equal(eventShare.title, "Coachella Saturday");
  const groupInvite = buildMenuplyPathShareData(
    "https://preview.vercel.app/events/groups/invite/tok123"
  );
  assert.equal(groupInvite.url, "https://menuply.com/events/groups/invite/tok123");
});

test("Dining Crew detail uses ShareModal invite share — not prototype code dump", () => {
  const page = read("src/pages/consumer/DiningCrewsPage.jsx");
  assert.match(page, /ShareModal/);
  assert.match(page, /buildDiningCrewInviteShareData/);
  assert.match(page, /Share invite/);
  assert.match(page, /dining-crew-share-invite/);
  assert.doesNotMatch(page, /Share link:\s*<code/);
  assert.doesNotMatch(page, /Member id \(optional\)/);
  assert.doesNotMatch(page, /Create invite link/);
});

test("social onboarding optional Share invite uses ShareModal", () => {
  const page = read("src/pages/consumer/SocialOnboardingPage.jsx");
  assert.match(page, /ShareModal/);
  assert.match(page, /buildDiningCrewInviteShareData/);
  assert.match(page, /inviteToDiningCrew/);
  assert.match(page, /dining-crew-share-invite/);
  assert.match(page, /Sharing an invite is optional/);
  assert.match(page, /Continue/);
  assert.doesNotMatch(page, /navigator\.contacts|ContactsManager/);
});

test("My Menuply crew and event names share via ShareModal menuply.com URLs", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /ShareModal/);
  assert.match(page, /buildDiningCrewInviteShareData/);
  assert.match(page, /buildMenuplyPathShareData/);
  assert.match(page, /inviteToDiningCrew/);
  assert.match(page, /inviteToVenueEventGroup/);
  assert.match(page, /NamedShareCard/);
  assert.doesNotMatch(page, /navigator\.share/);
});
