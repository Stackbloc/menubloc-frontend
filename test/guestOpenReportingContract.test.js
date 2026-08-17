import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("Guest reporting is open; accounts unlock identity", () => {
  const session = read("src/lib/guestReporterSession.js");
  assert.match(session, /getOrCreateGuestReporterKey/);
  assert.match(session, /not a Menuply account/i);

  const foodApi = read("src/lib/foodActivityApi.js");
  assert.match(foodApi, /createPublicFoodActivity/);
  assert.match(foodApi, /\/public\/food-activity/);
  assert.match(foodApi, /apiPost/);

  const dinerApi = read("src/lib/dinerStatusApi.js");
  assert.match(dinerApi, /createPublicDinerStatus/);
  assert.match(dinerApi, /\/public\/diner-statuses/);

  const composer = read("src/components/dinerStatus/DinerStatusComposer.jsx");
  assert.doesNotMatch(composer, /Sign in/);
  assert.match(composer, /No account needed/);
  assert.match(composer, /wait_long/);
  assert.match(composer, /GuestContributeNextStep/);

  const panel = read("src/components/foodActivity/ImEatingAtPanel.jsx");
  assert.match(panel, /createPublicFoodActivity/);
  assert.match(panel, /GuestContributeNextStep/);
  assert.match(panel, /Join Me/);

  const eating = read("src/pages/consumer/ImEatingPage.jsx");
  assert.doesNotMatch(eating, /login\?next=.*im-eating/);

  const statusPage = read("src/pages/consumer/DinerStatusPage.jsx");
  assert.doesNotMatch(statusPage, /login\?next=.*diner-status/);

  const next = read("src/components/foodActivity/GuestContributeNextStep.jsx");
  assert.match(next, /Your report is live/);
  assert.match(next, /Anyone can contribute/);

  const saying = read("src/components/restaurant/WhatDinersAreSaying.jsx");
  assert.match(saying, /ImEatingAtPanel/);

  const joinMe = read("src/lib/consumerApi.js");
  assert.match(joinMe, /\/api\/consumer\/join-me/);

  assert.doesNotMatch(read("src/pages/FoodInterestsPage.jsx"), /GuestContributeNextStep/);
});
