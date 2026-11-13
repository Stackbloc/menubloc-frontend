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
  assert.match(src, /Pick what you&apos;re up for — several at once/);
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

test("no vibe (the old Not sure today) is not search-surfaced and not a chip (2026-11-13)", () => {
  const src = read("src/lib/currentVibeDisplay.js");
  assert.match(src, /value: DEFAULT_CURRENT_VIBE, label: "No vibe", icon: null, badgeTone: "none", searchEligible: false/);
  assert.doesNotMatch(src, /value: "not_sure_today"/);
});

test("vibe catalog: 5 vibes in Andre's order; Me time and Not sure today dropped (2026-11-13); chips have hover", () => {
  const src = read("src/lib/currentVibeDisplay.js");
  const order = ["open_for_lunch", "coffee", "open_for_dinner", "hungry", "eating_at_home"].map((v) => src.indexOf(`value: "${v}"`));
  assert.ok(order.every((n) => n > 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.doesNotMatch(src, /Me time \(not available\)|value: "me_time"/);
  assert.doesNotMatch(src, /value: "(drinks|craving|looking_for_company|im_good|open_for_suggestions)"/);
  assert.doesNotMatch(src, /going_out|cheap_eats|treat_myself/);
  const section = read("src/pages/consumer/myMenuply/CurrentVibeProfileSection.jsx");
  assert.match(section, /title=\{opt\.label\}/);
});
