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

test("hobbies appear as a labeled line after hometown", () => {
  assert.deepEqual(
    buildDinerPersonalContextLines({
      diner_occupation: "Software designer",
      diner_hobbies: "Hiking, live music",
    }),
    ["Software designer", "Hobbies · Hiking, live music"]
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

test("DinerIdentityHero renders personal context and unified profile settings", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const editor = read("src/pages/consumer/myMenuply/DinerPersonalContextEditor.jsx");
  assert.match(hero, /diner-personal-context/);
  assert.match(hero, /DinerPersonalContextEditor/);
  assert.match(hero, /buildDinerPersonalContextLines/);
  assert.match(hero, /personalContextLines\.map/);
  assert.match(hero, /onSaveProfileSettings/);
  assert.match(hero, /diner-school-affiliation/);
  assert.match(editor, /diner-personal-context-editor/);
  assert.match(editor, /diner-personal-context-toggle/);
  assert.match(editor, /Edit profile details|Add profile details/);
  assert.match(editor, /diner-profile-settings-save/);
  assert.match(editor, /diner-hobbies-input/);
  assert.match(editor, /diner-sex-input/);
  assert.match(editor, /diner-dob-input/);
  assert.match(editor, /diner-favorite-foods/);
  assert.match(editor, /diner_sex/);
  assert.doesNotMatch(editor, /Save birthday & favorites/);
  assert.doesNotMatch(editor, /FlashVideosEditorField/);
  assert.match(hero, /FlashVideosDisplay/);
  assert.match(hero, /dinerSex=/);
  assert.doesNotMatch(hero, /About Me essay|follower|following count/i);
  assert.doesNotMatch(hero, /onSaveProfileBasics|Save birthday/);
});

test("Profile tab exposes optional personal context fields", () => {
  const tab = read("src/pages/consumer/accountDashboard/ProfileTab.jsx");
  const profile = read("src/pages/consumer/ConsumerProfile.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(tab, /Personal context/);
  assert.match(tab, /id="personal-context"/);
  assert.match(tab, /dinerOccupation/);
  assert.match(tab, /dinerHobbies/);
  assert.match(profile, /handleSavePersonalContext/);
  assert.match(page, /onSaveProfileSettings/);
  assert.match(page, /diner_sex:/);
  assert.doesNotMatch(page, /onSaveProfileBasics/);
  assert.doesNotMatch(page, /onPersonalContextSave/);
});

test("Connection peer hub passes personal context to identity hero", () => {
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.match(peer, /personalContext=\{\{/);
  assert.match(peer, /diner_hometown/);
  assert.match(peer, /diner_hobbies/);
  assert.match(peer, /eduConsumer=\{peer\}/);
  assert.match(peer, /flashVideos=\{flashVideos\}/);
  assert.match(peer, /readOnly/);
  assert.doesNotMatch(peer, /onSaveProfileSettings/);
});

test("DinerIdentityHero only mounts profile settings editor for profile owner", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(hero, /!readOnly && onSaveProfileSettings/);
  assert.match(page, /onSaveProfileSettings=\{onSaveProfileSettings\}/);
});

test("summarizePersonalContext returns None added when empty", () => {
  assert.equal(summarizePersonalContext({}), "None added");
});
