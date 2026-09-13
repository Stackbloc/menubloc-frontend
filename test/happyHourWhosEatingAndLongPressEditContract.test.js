/**
 * Happy Hour as Who's Eating activity + long-press Edit|Delete cluster.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatHappyHourActivityClause,
  isHappyHourActivity,
  resolveHappyHourIntent,
} from "../src/lib/happyHourActivity.js";
import { formatActivityProseClause } from "../src/lib/dinerSocialEmojiLanguage.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("Happy Hour detection + Edit/Profile clauses", () => {
  const going = {
    food_name: "I'm going to Happy Hour today",
    restaurant_name: "901 Bar & Grill",
  };
  const enjoying = {
    food_name: "I'm enjoying Happy Hour",
    restaurant_name: "901 Bar & Grill",
  };
  assert.equal(isHappyHourActivity(going), true);
  assert.equal(resolveHappyHourIntent(going), "going");
  assert.equal(resolveHappyHourIntent(enjoying), "enjoying");
  assert.equal(
    formatHappyHourActivityClause(going, { secondPerson: true }),
    "are going to Happy Hour at 901 Bar & Grill"
  );
  assert.equal(
    formatHappyHourActivityClause(going, { secondPerson: false }),
    "is going to Happy Hour at 901 Bar & Grill"
  );
  assert.equal(
    formatActivityProseClause({ ...going, second_person: true }),
    "are going to Happy Hour at 901 Bar & Grill"
  );
  assert.equal(
    formatActivityProseClause(going),
    "is going to Happy Hour at 901 Bar & Grill"
  );
  assert.equal(isHappyHourActivity({ food_name: "Double-Double" }), false);
});

test("Eating hub strips Happy Hour from meal timeline into Who's Eating", () => {
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(hub, /happyHourForDay/);
  assert.match(hub, /!isHappyHourActivity/);
  assert.match(hub, /subjectHappyHourEntries=\{happyHourForDay\}/);
  assert.match(hub, /subjectSecondPerson=\{canEdit\}/);
  assert.match(hub, /!isHappyHourActivity\(lastPost\)/);
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  assert.match(nearby, /whos-eating-happy-hour/);
  assert.match(nearby, /secondPerson=\{subjectSecondPerson\}/);
});

test("Long-press reveals Edit and Delete together", () => {
  const actions = read("src/pages/consumer/myMenuply/HubLongPressActions.jsx");
  assert.match(actions, /hub-card-actions|\$\{testIdPrefix\}-actions/);
  assert.match(actions, /\$\{testIdPrefix\}-edit/);
  assert.match(actions, /\$\{testIdPrefix\}-delete/);
  assert.match(actions, /Edit or delete/);

  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.match(row, /HubLongPressActions/);
  assert.match(row, /testIdPrefix="diner-activity-scan"/);
  assert.match(row, /onEdit/);

  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(bits, /HubLongPressActions/);
  assert.match(bits, /onEdit = null/);
  assert.match(bits, /function FuturePlanRow/);
  assert.match(bits, /testIdPrefix="future-plan"/);
  assert.match(bits, /onEdit=\{canEditRow \? \(\) => onEdit\(plan\) : null\}/);

  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(hub, /onPlanEdit/);
  assert.match(hub, /Edit eating plan/);
  assert.match(hub, /submitLabel=\{planPrefill\?\.editingKey \? "Save" : "Post"\}/);

  const home = read("src/pages/consumer/myMenuply/HomeAtHomeSection.jsx");
  assert.match(home, /HubLongPressActions/);
  assert.match(home, /testIdPrefix="home-at-home"/);

  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /onEdit=\{/);
  assert.match(page, /openSocialEventCompose\(ev\)/);
  assert.match(page, /openPlanEdit/);
  assert.match(page, /planToEditPrefill/);
  assert.match(page, /updateWhatWeDoingSession\(editingKey/);
  assert.match(page, /dining-crews\/\$\{crew\.id\}/);
});
