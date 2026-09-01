/**
 * Diner personal context — optional structured profile header lines.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDinerPersonalContextLines,
  summarizePersonalContext,
} from "../src/lib/dinerPersonalContext.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("buildDinerPersonalContextLines supports student, professional, and hometown-only cases", () => {
  assert.deepEqual(
    buildDinerPersonalContextLines({
      diner_education_status: "Freshman",
      diner_field_of_study: "Biology",
      diner_hometown: "Houston, TX",
    }),
    ["Freshman · Biology", "From Houston, TX"]
  );
  assert.deepEqual(
    buildDinerPersonalContextLines({ diner_occupation: "Software designer" }),
    ["Software designer"]
  );
  assert.deepEqual(
    buildDinerPersonalContextLines({ diner_hometown: "Houston, TX" }),
    ["From Houston, TX"]
  );
  assert.deepEqual(buildDinerPersonalContextLines({}), []);
});

test("occupation takes precedence over education fields", () => {
  assert.deepEqual(
    buildDinerPersonalContextLines({
      diner_occupation: "Chef",
      diner_education_status: "Freshman",
      diner_field_of_study: "Biology",
    }),
    ["Chef"]
  );
});

test("DinerIdentityHero renders personal context beneath name without empty placeholders", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(hero, /diner-personal-context/);
  assert.match(hero, /buildDinerPersonalContextLines/);
  assert.match(hero, /personalContextLines\.map/);
  assert.doesNotMatch(hero, /About Me essay|follower|following count/i);
});

test("Profile tab exposes optional personal context fields", () => {
  const tab = read("src/pages/consumer/accountDashboard/ProfileTab.jsx");
  const profile = read("src/pages/consumer/ConsumerProfile.jsx");
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(hero, /profile-detail-links/);
  assert.match(hero, /personal-context/);
  assert.match(tab, /Personal context/);
  assert.match(tab, /id="personal-context"/);
  assert.match(tab, /dinerOccupation/);
  assert.match(tab, /dinerEducationStatus/);
  assert.match(tab, /dinerFieldOfStudy/);
  assert.match(tab, /dinerHometown/);
  assert.match(profile, /handleSavePersonalContext/);
  assert.match(profile, /diner_education_status/);
});

test("Connection peer hub passes personal context to identity hero", () => {
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.match(peer, /personalContext=\{\{/);
  assert.match(peer, /diner_hometown/);
});

test("summarizePersonalContext returns None added when empty", () => {
  assert.equal(summarizePersonalContext({}), "None added");
});
