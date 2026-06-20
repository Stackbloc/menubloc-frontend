#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDiscoveryFeedScopeKey,
  buildDiscoveryLocationKey,
  dedupeDiscoveryMenus,
  createInitialDiscoveryFeedState,
  reduceDiscoveryFeedState,
} from "../src/lib/discoveryFeedGuardrails.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const files = {
  discovery: path.join(root, "src/pages/GrubbidDiscovery.jsx"),
  searchResults: path.join(root, "src/pages/GrubbidSearchResults.jsx"),
  activeFilterChips: path.join(root, "src/components/discovery/ActiveFilterChips.jsx"),
  chipRail: path.join(root, "src/components/chips/ChipRail.jsx"),
  css: path.join(root, "src/index.css"),
  classicTemplate: path.join(root, "src/components/menu-templates/ClassicMenuTemplate.jsx"),
  takeoutTemplate: path.join(root, "src/components/menu-templates/TakeoutMenuTemplate.jsx"),
  boldCasualTemplate: path.join(root, "src/components/menu-templates/BoldCasualMenuTemplate.jsx"),
  cinematicTemplate: path.join(root, "src/components/menu-templates/CinematicMenuTemplate.jsx"),
  refinedEditorialTemplate: path.join(root, "src/components/menu-templates/RefinedEditorialMenuTemplate.jsx"),
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [key, fs.readFileSync(filePath, "utf8")])
);

function assertProtectedRailUsage(name, contents) {
  assert.match(contents, /ChipRail/, `${name} must use the shared ChipRail component.`);
}

function assertNoAdHocRail(name, contents) {
  assert.doesNotMatch(
    contents,
    /overflowX:\s*["']auto["']/,
    `${name} must not use ad hoc overflowX:auto chip rails.`
  );
}

const losAngelesKey = buildDiscoveryLocationKey({
  appliedLocation: "Los Angeles, CA",
});
const dothanKey = buildDiscoveryLocationKey({
  appliedLocation: "Dothan, AL",
});
assert.notEqual(losAngelesKey, dothanKey, "Location keys must differ across markets.");

const losAngelesScope = buildDiscoveryFeedScopeKey({
  locationKey: losAngelesKey,
  filters: {},
});
const dothanScope = buildDiscoveryFeedScopeKey({
  locationKey: dothanKey,
  filters: {},
});
assert.notEqual(losAngelesScope, dothanScope, "Feed scope keys must differ across markets.");

const laMenus = [
  { menu_id: "la-1", restaurant_name: "A" },
  { menu_id: "la-2", restaurant_name: "B" },
];
const dothanMenus = [
  { menu_id: "do-1", restaurant_name: "C" },
  { menu_id: "do-2", restaurant_name: "D" },
];

let state = createInitialDiscoveryFeedState();
state = reduceDiscoveryFeedState(state, {
  type: "start",
  scopeKey: losAngelesScope,
  requestId: 1,
  cachedMenus: [],
});
state = reduceDiscoveryFeedState(state, {
  type: "start",
  scopeKey: dothanScope,
  requestId: 2,
  cachedMenus: [],
});
state = reduceDiscoveryFeedState(state, {
  type: "success",
  scopeKey: losAngelesScope,
  requestId: 1,
  menus: laMenus,
});
assert.equal(state.menus.length, 0, "Stale LA response must not overwrite a newer market request.");

state = reduceDiscoveryFeedState(state, {
  type: "success",
  scopeKey: dothanScope,
  requestId: 2,
  menus: dothanMenus,
});
assert.deepEqual(
  state.menus.map((menu) => menu.menu_id),
  ["do-1", "do-2"],
  "Current market results must replace prior results."
);

state = reduceDiscoveryFeedState(state, {
  type: "start",
  scopeKey: losAngelesScope,
  requestId: 3,
  cachedMenus: state.cache[losAngelesScope] || [],
});
state = reduceDiscoveryFeedState(state, {
  type: "success",
  scopeKey: losAngelesScope,
  requestId: 3,
  menus: [...laMenus, { menu_id: "la-2", restaurant_name: "B duplicate" }],
});
assert.deepEqual(
  state.menus.map((menu) => menu.menu_id),
  ["la-1", "la-2"],
  "Switching back must restore LA-only results without duplicates."
);
assert.equal(
  state.menus.length,
  dedupeDiscoveryMenus([...laMenus, { menu_id: "la-2" }]).length,
  "Visible count must match the current location-scoped result set."
);

assert.match(
  source.discovery,
  /GUARDRAIL:[\s\S]*Menu\/discovery results are location-scoped\./,
  "GrubbidDiscovery must include the location-scope guardrail comment."
);
assert.match(
  source.discovery,
  /AbortController/,
  "GrubbidDiscovery must protect against stale async responses."
);
assert.match(
  source.activeFilterChips,
  /ChipRail/,
  "ActiveFilterChips must use the shared ChipRail component."
);
assert.match(
  source.searchResults,
  /ActiveFilterChips/,
  "GrubbidSearchResults must use the shared ActiveFilterChips rail."
);
assert.match(
  source.chipRail,
  /GUARDRAIL:[\s\S]*All horizontal chip\/filter\/category rails must use this component\./,
  "ChipRail must include the shared rail guardrail comment."
);
assert.match(
  source.css,
  /\.gb-chip-rail[\s\S]*display:\s*flex;[\s\S]*flex-wrap:\s*nowrap;[\s\S]*overflow-x:\s*auto;/,
  "index.css must define the shared chip rail contract."
);
assert.match(
  source.css,
  /\.gb-chip-rail > \*[\s\S]*flex:\s*0 0 auto;[\s\S]*white-space:\s*nowrap;/,
  "index.css must prevent chip shrink/wrap inside the shared rail."
);

assertProtectedRailUsage("GrubbidDiscovery", source.discovery);
assertProtectedRailUsage("ActiveFilterChips", source.activeFilterChips);
assertNoAdHocRail("GrubbidDiscovery", source.discovery);
assertNoAdHocRail("ActiveFilterChips", source.activeFilterChips);
assertProtectedRailUsage("ClassicMenuTemplate", source.classicTemplate);
assertProtectedRailUsage("TakeoutMenuTemplate", source.takeoutTemplate);
assertProtectedRailUsage("BoldCasualMenuTemplate", source.boldCasualTemplate);
assertProtectedRailUsage("CinematicMenuTemplate", source.cinematicTemplate);
assertProtectedRailUsage("RefinedEditorialMenuTemplate", source.refinedEditorialTemplate);

console.log("verify:discovery-state-and-chip-rails — location scoping and chip rail guardrails passed.");
