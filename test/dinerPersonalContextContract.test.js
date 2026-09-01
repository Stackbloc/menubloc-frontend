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

test("hobbies appear as their own line after hometown", () => {
  assert.deepEqual(
    buildDinerPersonalContextLines({
      diner_occupation: "Software designer",
      diner_hobbies: "Hiking, live music",
    }),
    ["Software designer", "Hiking, live music"]
  );
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
  const editor = read("src/pages/consumer/myMenuply/DinerPersonalContextEditor.jsx");
  assert.match(hero, /diner-personal-context/);
  assert.match(hero, /DinerPersonalContextEditor/);
  assert.match(hero, /buildDinerPersonalContextLines/);
  assert.match(hero, /personalContextLines\.map/);
  assert.match(editor, /diner-personal-context-editor/);
  assert.match(editor, /diner-personal-context-toggle/);
  assert.match(editor, /Add personal details/);
  assert.match(editor, /diner-personal-context-done/);
  assert.match(editor, /diner-occupation-input/);
  assert.match(editor, /diner-hometown-input/);
  assert.match(editor, /diner-hobbies-input/);
  assert.doesNotMatch(hero, /About Me essay|follower|following count/i);
});

test("Profile tab exposes optional personal context fields", () => {
  const tab = read("src/pages/consumer/accountDashboard/ProfileTab.jsx");
  const profile = read("src/pages/consumer/ConsumerProfile.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(tab, /Personal context/);
  assert.match(tab, /id="personal-context"/);
  assert.match(tab, /dinerOccupation/);
  assert.match(tab, /dinerEducationStatus/);
  assert.match(tab, /dinerFieldOfStudy/);
  assert.match(tab, /dinerHometown/);
  assert.match(tab, /dinerHobbies/);
  assert.match(profile, /handleSavePersonalContext/);
  assert.match(profile, /diner_education_status/);
  assert.match(page, /onPersonalContextSave/);
});

test("Connection peer hub passes personal context to identity hero", () => {
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.match(peer, /personalContext=\{\{/);
  assert.match(peer, /diner_hometown/);
  assert.match(peer, /diner_hobbies/);
  assert.match(peer, /readOnly/);
  assert.doesNotMatch(peer, /onPersonalContextSave/);
});

test("DinerIdentityHero only mounts personal context editor for profile owner", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(hero, /!readOnly && onPersonalContextSave/);
  assert.match(page, /onPersonalContextSave=\{onPersonalContextSave\}/);
  assert.doesNotMatch(page, /readOnly/);
});

test("summarizePersonalContext returns None added when empty", () => {
  assert.equal(summarizePersonalContext({}), "None added");
});
