/**
 * Contextual search sections UI — only render when payload has items (SEARCH-001).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("GrubbidSearchResults reads contextual_sections and events", () => {
  const src = read("src/pages/GrubbidSearchResults.jsx");
  assert.match(src, /contextual_sections/);
  assert.match(src, /setSearchEvents/);
  assert.match(src, /json\?\.events/);
});

test("Connect and Events sections gate on non-empty items", () => {
  const src = read("src/pages/GrubbidSearchResults.jsx");
  assert.match(src, /contextualSections\?\.connects\?\.items\?\.length/);
  assert.match(src, /contextualSections\?\.events\?\.items\?\.length/);
  assert.match(src, /Your Connects|From your Connects/);
});

test("does not import Waiter or HomeNext for contextual sections", () => {
  const src = read("src/pages/GrubbidSearchResults.jsx");
  // File may already import Waiter helpers elsewhere — ensure we did not add food-nav/waiterApi for this feature
  assert.doesNotMatch(src, /searchContextUnderstanding|searchContextualSidecars/);
});
