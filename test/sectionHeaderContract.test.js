/**
 * Profile SectionHeader — reusable eyebrow + serif title + accent bar.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("SectionHeader maps Tabler icons and keeps serif title + short accent bar", () => {
  const src = read("src/pages/consumer/myMenuply/SectionHeader.jsx");
  assert.match(src, /@tabler\/icons-react/);
  assert.match(src, /ti-id-badge/);
  assert.match(src, /ti-photo/);
  assert.match(src, /ti-building-store/);
  assert.match(src, /ti-tools-kitchen-2/);
  assert.match(src, /ti-flame/);
  assert.match(src, /ti-calendar-event/);
  assert.match(src, /ti-users/);
  assert.match(src, /ti-calendar-star/);
  assert.match(src, /Georgia/);
  assert.match(src, /fontSize: 22/);
  assert.match(src, /width: 32/);
  assert.match(src, /height: 2/);
  assert.match(src, /PROFILE_SECTION_HEADERS/);
  // Count uses eyebrowColor (first stop), bar uses accentColor (second).
  assert.match(src, /styles\.count, color: eyebrowColor/);
  assert.match(src, /accentBar, background: accentColor/);
});

test("Eight profile sections mount shared SectionHeader configs", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const grid = read("src/pages/consumer/myMenuply/MyHighlightsGrid.jsx");
  const rails = read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx");
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");

  assert.match(hero, /PROFILE_SECTION_HEADERS\.about/);
  assert.match(grid, /PROFILE_SECTION_HEADERS\.highlights/);
  assert.match(rails, /PROFILE_SECTION_HEADERS\.favs/);
  assert.match(hub, /PROFILE_SECTION_HEADERS\.eating/);
  assert.match(hub, /PROFILE_SECTION_HEADERS\.wannaEat/);
  assert.match(hub, /PROFILE_SECTION_HEADERS\.plans/);
  assert.match(page, /PROFILE_SECTION_HEADERS\.crews/);
  assert.match(page, /PROFILE_SECTION_HEADERS\.events/);

  const headers = read("src/pages/consumer/myMenuply/SectionHeader.jsx");
  assert.match(headers, /title: "About me"/);
  assert.match(headers, /title: "My reel"/);
  assert.match(headers, /title: "My Favs"/);
  assert.doesNotMatch(rails, /Restaurants I Follow/);
});
