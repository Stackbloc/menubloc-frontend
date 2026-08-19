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

  for (const page of [mine, peer]) {
    assert.match(page, /DinerIdentityHero/);
    assert.match(page, /data-testid="what-im-eating"/);
    assert.match(page, /data-testid="want-to-eat"/);
    assert.match(page, /data-testid="dining-crews"/);
    assert.match(page, /data-testid="my-events"/);
    assert.match(page, /What I'm Eating/);
    assert.match(page, /Future plans/);
    assert.match(page, /What I Want to Eat/);
    assert.match(page, /My Crews/);
    assert.match(page, /My Events/);
    assert.match(page, /eating-plans-calendar/);
    assert.match(page, /DinerCalendarTrigger/);
    assert.match(page, /Invite Me/);
    assert.match(page, /Join Me/);
    assert.ok(page.indexOf("DinerIdentityHero") < page.indexOf("what-im-eating"));
    assert.ok(page.indexOf("what-im-eating") < page.indexOf("want-to-eat"));
    assert.ok(page.indexOf("want-to-eat") < page.indexOf("dining-crews"));
    assert.ok(page.indexOf("dining-crews") < page.indexOf("my-events"));
    assert.doesNotMatch(page, /People you interact with through Menuply meals/);
  }

  assert.match(peer, /readOnly/);
  assert.match(peer, /\/what-i-ate/);
  assert.doesNotMatch(peer, /QuickCompose/);
  assert.doesNotMatch(peer, /onAvatarFile/);
  assert.match(hero, /readOnly/);
  assert.match(hero, /About Me/);
  assert.match(hero, /My Connections/);

  const calendar = read("src/pages/consumer/myMenuply/DinerCalendarSheet.jsx");
  assert.match(calendar, /diner-calendar-open/);
});

test("Diner hub photos are casual snapshots with food info, not Instagram heroes", () => {
  const styles = read("src/pages/consumer/myMenuply/myMenuplyStyles.js");
  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(styles, /height: 168/);
  assert.doesNotMatch(styles, /58vw/);
  assert.doesNotMatch(styles, /340px/);
  assert.match(bits, /View dish/);
  assert.match(bits, /restaurant_name/);
  assert.match(bits, /Join Me/);
  assert.match(bits, /Add details/);
  assert.doesNotMatch(bits, /Stories/);
});
