/**
 * Every diner hub uses the My Menuply layout.
 * Owner can edit; a Connection is read-only. Hidden bits follow that diner's visibility.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Connection diner page uses the same hub layout as My Menuply", () => {
  const mine = read("src/pages/consumer/MyMenuplyPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");

  for (const page of [mine, peer]) {
    assert.match(page, /DinerIdentityHero/);
    assert.match(page, /EatingHubSection/);
    assert.match(page, /data-testid="dining-crews"/);
    assert.match(page, /data-testid="my-events"/);
    assert.match(page, /My Crews/);
    assert.match(page, /My Events/);
    assert.ok(page.indexOf("<DinerIdentityHero") < page.indexOf("<EatingHubSection"));
    assert.ok(page.indexOf("<EatingHubSection") < page.lastIndexOf('data-testid="dining-crews"'));
    assert.ok(
      page.lastIndexOf('data-testid="dining-crews"') < page.lastIndexOf('data-testid="my-events"')
    );
    assert.doesNotMatch(page, /People you interact with through Menuply meals/);
    assert.doesNotMatch(page, /inviteLabel=/);
    assert.doesNotMatch(page, /onInvite=\{\(\) => share/);
  }

  assert.match(section, /data-testid="eating"/);
  assert.match(section, /data-testid="what-im-eating"/);
  assert.match(section, /data-testid="want-to-eat"/);
  assert.match(section, /eating-calendar/);
  assert.match(section, /DinerCalendarTrigger/);
  assert.match(section, /Invite Me Out/);
  assert.doesNotMatch(section, /InviteMeOutAudiencePicker/);
  assert.match(section, /future-plans-summary/);
  assert.match(section, /FuturePlanRow/);
  assert.match(section, /SectionEmptyState/);

  assert.match(section, /eating-want-panel/);
  assert.match(section, /WantToEatList/);

  assert.match(peer, /InviteMeOutFlow/);
  assert.match(peer, /viewerMayInviteMeOut/);
  assert.match(peer, /\/what-i-ate/);
  assert.match(peer, /mergeEatingFeedForHub/);
  assert.doesNotMatch(peer, /EatingCompose/);
  assert.doesNotMatch(peer, /onAvatarFile/);
  assert.match(hero, /readOnly/);
  assert.match(hero, /About Me/);
  assert.match(hero, /viewerUserId|connections/);
  assert.doesNotMatch(peer, /connections=\{\[\]\}/);
  assert.match(peer, /listConnections\("accepted", peerId\)/);
  assert.match(peer, /listDinerDiningCrews/);
  assert.match(peer, /Request to join/);
  assert.match(peer, /DiningCrewHubCard/);
  assert.doesNotMatch(peer, /NamedShareCard/);
  assert.match(peer, /peerConnections/);
  assert.match(peer, /backTo=\{MY_MENUPLY_PROFILE_PATH\}/);
  assert.match(peer, /backLabel="My Menuply"/);
  assert.doesNotMatch(peer, /<h1 style=\{s\.h1\}/);
  assert.doesNotMatch(peer, /s\.kicker/);

  const calendar = read("src/pages/consumer/myMenuply/DinerCalendarSheet.jsx");
  assert.match(calendar, /diner-calendar-open/);
  assert.match(calendar, /calendar-event/);
  assert.match(calendar, /EatingHubCalendar/);
});

test("Diner hub photos are casual snapshots with food info, not Instagram heroes", () => {
  const styles = read("src/pages/consumer/myMenuply/myMenuplyStyles.js");
  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  const mealBoard = read("src/pages/consumer/myMenuply/WhatIAteMealBoard.jsx");
  assert.match(styles, /height: 168/);
  assert.match(styles, /mealHolder/);
  assert.doesNotMatch(styles, /58vw/);
  assert.doesNotMatch(styles, /340px/);
  assert.match(mealBoard, /what-i-ate-meal-board/);
  assert.match(mealBoard, /video_url/);
  // Presentation-only: no empty camera boxes (owner + peer).
  assert.match(mealBoard, /showEmptyHolders = false/);
  assert.doesNotMatch(mealBoard, /Nothing here/);
  assert.doesNotMatch(mealBoard, /Nothing logged for this day\./);
  assert.match(bits, /View dish/);
  assert.match(bits, /restaurant_name/);
  assert.match(bits, /Join Me/);
  assert.match(bits, /Add details/);
  assert.doesNotMatch(bits, /Stories/);
});
