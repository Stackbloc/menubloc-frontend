/**
 * What I Ate Today — optional identity-social profile log.
 * Lookup never blocks posting. Not public /search. Not dining-hall menus.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("What I Ate Today is optional, fail-open, and not a search engine", () => {
  const section = read("src/components/consumer/WhatIAteTodaySection.jsx");
  const add = read("src/components/consumer/WhatIAteTodayAddButton.jsx");
  const api = read("src/lib/consumerApi.js");
  const detail = read("src/pages/MenuItemDetailPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");

  assert.match(section, /Show this section on my profile/);
  assert.match(section, /Lookup never blocks posting/);
  assert.match(section, /createWhatIAteToday/);
  assert.match(add, /Add to What I Ate Today/);
  assert.match(add, /\/account\/login\?next=/);
  assert.match(add, /createWhatIAteToday/);
  assert.match(api, /\/api\/consumer\/what-i-ate-today\/suggestions/);
  assert.doesNotMatch(api, /what-i-ate-today[\s\S]{0,200}\/search/);
  assert.doesNotMatch(section, /\/search\?/);
  assert.doesNotMatch(add, /navigator\.share/);
  assert.match(detail, /WhatIAteTodayAddButton/);
  assert.match(detail, /<VerdictBlock[\s\S]*compact/);
  assert.doesNotMatch(detail, /<StickyVerdictRail/);
  assert.match(peer, /mode="viewer"/);
});
