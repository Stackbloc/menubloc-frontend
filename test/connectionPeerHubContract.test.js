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
    assert.doesNotMatch(page, /data-testid="what-im-eating"/);
    assert.doesNotMatch(page, /data-testid="want-to-eat"/);
    assert.ok(page.indexOf("<DinerIdentityHero") < page.indexOf("<EatingHubSection"));
    assert.ok(page.indexOf("<EatingHubSection") < page.indexOf("dining-crews"));
    assert.ok(page.indexOf("dining-crews") < page.indexOf("my-events"));
    assert.doesNotMatch(page, /People you interact with through Menuply meals/);
  }

  assert.match(section, /data-testid="eating"/);
  assert.match(section, /eating-calendar/);
  assert.match(section, /DinerCalendarTrigger/);
  assert.match(section, /Invite Me/);
  assert.match(section, /future-plans-summary/);
  assert.match(section, /FuturePlanRow/);

  assert.match(section, /eating-want-panel/);
  assert.match(section, /WantToEatList/);

  assert.match(peer, /readOnly/);
  assert.match(peer, /\/what-i-ate/);
  assert.match(peer, /mergeEatingFeedForHub/);
  assert.doesNotMatch(peer, /EatingCompose/);
  assert.doesNotMatch(peer, /onAvatarFile/);
  assert.match(hero, /readOnly/);
  assert.match(hero, /About Me/);
  assert.match(hero, /My Connections/);
  assert.match(hero, /viewerUserId/);
  assert.doesNotMatch(peer, /connections=\{\[\]\}/);
  assert.match(peer, /listConnections\("accepted", peerId\)/);
  assert.match(peer, /listDinerDiningCrews/);
  assert.match(peer, /Request to join/);
  assert.match(peer, /DiningCrewHubCard/);
  assert.doesNotMatch(peer, /NamedShareCard/);
  assert.match(peer, /peerConnections/);
  assert.match(peer, /backTo="\/my-menuply"/);
  assert.match(peer, /backLabel="My Menuply"/);

  const calendar = read("src/pages/consumer/myMenuply/DinerCalendarSheet.jsx");
  assert.match(calendar, /diner-calendar-open/);
  assert.match(calendar, /calendar-event/);
  assert.match(calendar, /EatingHubCalendar/);
});

test("Diner hub photos are casual snapshots with food info, not Instagram heroes", () => {
  const styles = read("src/pages/consumer/myMenuply/myMenuplyStyles.js");
  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(styles, /height: 280/);
  assert.doesNotMatch(styles, /58vw/);
  assert.doesNotMatch(styles, /340px/);
  assert.match(bits, /View dish/);
  assert.match(bits, /restaurant_name/);
  assert.match(bits, /Join Me/);
  assert.match(bits, /Add details/);
  assert.doesNotMatch(bits, /Stories/);
});
