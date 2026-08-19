/**
 * Unified Eating hub — one section, one tap-to-open calendar, past/future markers.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("My Menuply and peer hub use unified Eating section", () => {
  const mine = read("src/pages/consumer/MyMenuplyPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const calendar = read("src/pages/consumer/myMenuply/EatingHubCalendar.jsx");
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");

  for (const page of [mine, peer]) {
    assert.match(page, /EatingHubSection/);
    assert.doesNotMatch(page, /data-testid="what-im-eating"/);
    assert.doesNotMatch(page, /data-testid="want-to-eat"/);
  }

  assert.match(section, /data-testid="eating"/);
  assert.match(section, /EatingCompose/);
  assert.match(section, /eating-filters/);
  assert.match(section, /eating-calendar/);
  assert.match(section, /DinerCalendarTrigger/);
  assert.match(section, /dayMarkers/);
  assert.match(section, /eating-ate-panel/);
  assert.match(section, /eating-want-panel/);
  assert.match(section, /eating-plans-panel/);
  assert.match(section, /future-plans-summary/);
  assert.match(section, /Invite Me/);
  assert.doesNotMatch(section, /future-plans-calendar/);
  assert.doesNotMatch(section, /eating-plans-calendar/);

  assert.match(calendar, /past_count/);
  assert.match(calendar, /future_count/);
  assert.match(calendar, /#007AFF/);
  assert.match(calendar, /#34C759/);

  assert.match(compose, /eating-compose-\$\{chip\.id\}/);
  assert.match(compose, /EATING_COMPOSE_CATEGORIES/);

  assert.match(peer, /readOnly/);
  assert.match(mine, /handleEatingCompose/);
  assert.ok(mine.indexOf("<DinerIdentityHero") < mine.indexOf("<EatingHubSection"));
  assert.ok(mine.indexOf("<EatingHubSection") < mine.indexOf('data-testid="dining-crews"'));
});
