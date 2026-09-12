/**
 * Past My Events must not stay inviteable (Lincoln inauguration class).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

test("diner social event past invite contract", () => {
  const detail = read("src/pages/consumer/DinerSocialEventDetailPage.jsx");
  assert.match(detail, /is_past/);
  assert.match(detail, /event-ended-notice/);
  assert.match(detail, /This event has already ended/);
  assert.match(detail, /timeZone: "UTC"/);
  assert.match(detail, /isPast \? \(/);

  const hub = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(hub, /ev\.is_past \? "Ended" : "Yours"/);
  assert.match(hub, /timeZone: "UTC"/);

  const join = read("src/pages/SocialEventJoinPage.jsx");
  assert.match(join, /is_past/);
  assert.match(join, /already ended/);
  assert.match(join, /social-event-ended/);
});
