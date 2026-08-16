import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("Dining Crews Phase 3 social entity UI + API client", () => {
  const page = read("src/pages/consumer/DiningCrewsPage.jsx");
  assert.match(page, /CrewSettingsFields/);
  assert.match(page, /membership_approval/);
  assert.match(page, /View all \$\{crew\.member_count\} members/);
  assert.match(page, /Discover public crews/);
  assert.match(page, /Invite to Eat \(crew outing\)/);
  assert.match(page, /diningCrewId=\{Number\(crewId\)\}/);
  assert.match(page, /dining-crew-food-photo-input/);
  assert.match(page, /Share food photo/);
  assert.match(page, /postDiningCrewPhoto/);
  assert.match(page, /ShareModal/);
  assert.match(page, /Share invite/);
  assert.doesNotMatch(page, /crew_deal|createCrewDeal|CrewDealModal/);
  assert.doesNotMatch(page, /Share link:\s*<code/);
  assert.doesNotMatch(page, /Member id \(optional\)/);

  const api = read("src/lib/consumerApi.js");
  assert.match(api, /discoverPublicDiningCrews/);
  assert.match(api, /updateDiningCrew/);
  assert.match(api, /requestJoinDiningCrew/);
  assert.match(api, /voteDiningCrewJoinRequest/);
  assert.match(api, /setDiningCrewMemberRole/);
  assert.match(api, /postDiningCrewPhoto/);
  assert.match(api, /method: "PATCH"/);

  const modal = read("src/components/InviteToEatModal.jsx");
  assert.match(modal, /diningCrewId/);
  assert.match(modal, /dining_crew_id/);
});
