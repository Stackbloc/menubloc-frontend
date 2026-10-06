/**
 * Social search Phase 4 — vibe picker search-audience toggle (default Connects only).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("vibe picker has the Connects-of-Connects toggle, unchecked unless chosen", () => {
  const src = read("src/pages/consumer/myMenuply/CurrentVibeProfileSection.jsx");
  assert.match(src, /searchVibeAudience = "connects"/);
  assert.match(src, /checked=\{searchVibeAudience === "connects_of_connects"\}/);
  assert.match(src, /first name and initial only/);
  assert.match(src, /Pick a food vibe like Hungry or Coffee/);
  assert.doesNotMatch(src, /Default is Open for suggestions — Connects can see you in search/);
});

test("profile page saves the audience through the current-vibe endpoint", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /updateSearchVibeAudience = \(audience\) =>\n  put\("\/api\/consumer\/profile\/current-vibe", \{ search_vibe_audience: audience \}\)/);
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /onSearchVibeAudienceChange=\{previewAsConnect \? undefined : onSearchVibeAudienceChange\}/);
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.equal((hero.match(/onSearchVibeAudienceChange=\{onSearchVibeAudienceChange\}/g) || []).length, 2);
});

test("default vibe is not search-surfaced in the FE mirror", () => {
  const src = read("src/lib/currentVibeDisplay.js");
  assert.match(src, /value: "open_for_suggestions",\n    label: "Open for suggestions",\n    icon: "💬",\n    badgeTone: "inviting",\n    searchEligible: false,/);
});

test("vibe catalog 2026-10-06: Open for Coffee / Drinks / Company / Lunch; three removed; chips have hover", () => {
  const src = read("src/lib/currentVibeDisplay.js");
  assert.match(src, /value: "coffee", label: "Open for Coffee", icon: "☕"/);
  assert.match(src, /value: "drinks", label: "Open for Drinks", icon: "🍹"/);
  assert.match(src, /label: "Open for Company"/);
  assert.match(src, /value: "open_for_lunch", label: "Open for Lunch"/);
  assert.doesNotMatch(src, /going_out|cheap_eats|treat_myself/);
  const section = read("src/pages/consumer/myMenuply/CurrentVibeProfileSection.jsx");
  assert.match(section, /title=\{opt\.label\}/);
});
