/**
 * Diner profile About + photos on My Menuply.
 * Person identity, not restaurant/venue/dining-hall about, not a questionnaire.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("My Menuply identity hero is prominent with photo upload and short bio", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(page, /DinerIdentityHero/);
  assert.match(page, /uploadDinerAvatar/);
  assert.match(page, /diner_about/);
  assert.ok(page.indexOf("DinerIdentityHero") < page.indexOf("what-im-eating"));
  assert.match(hero, /Change profile photo/);
  assert.match(hero, /type="file"/);
  assert.match(hero, /diner-about-input/);
  assert.match(hero, /maxLength=\{ABOUT_MAX\}/);
  assert.match(hero, /LA food explorer/);
  assert.match(hero, /Add a dining photo/);
  assert.match(hero, /\/account\/im-eating/);
  assert.match(hero, /\/account\/what-i-ate/);
  assert.doesNotMatch(hero, /vegetarian|gluten_free|allergen/i);
  assert.doesNotMatch(hero, /questionnaire|favorite cuisine|hometown/i);
});

test("Diner About is not restaurant, dining-hall, or venue about", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(hero, /Diner profile/);
  assert.doesNotMatch(hero, /restaurant about|venue about|dining hall about/i);
  assert.doesNotMatch(page, /restaurant_about/);
});
