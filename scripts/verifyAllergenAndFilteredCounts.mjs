#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const repoRoot = path.join(frontendRoot, "..");

const files = {
  browseMenus: path.join(frontendRoot, "src/pages/BrowseMenus.jsx"),
  discovery: path.join(frontendRoot, "src/pages/GrubbidDiscovery.jsx"),
  searchResults: path.join(frontendRoot, "src/pages/GrubbidSearchResults.jsx"),
  discoveryDrawer: path.join(frontendRoot, "src/components/grubbid/DiscoveryDrawer.jsx"),
  discoveryCard: path.join(frontendRoot, "src/components/discovery/DiscoveryCard.jsx"),
  featuredDiscoveryCard: path.join(frontendRoot, "src/components/discovery/FeaturedDiscoveryCard.jsx"),
  menuPreviewCard: path.join(frontendRoot, "src/components/browse/MenuPreviewCard.jsx"),
  searchResultCard: path.join(frontendRoot, "src/components/SearchResultCard.jsx"),
  countHelper: path.join(frontendRoot, "src/lib/publicCardCounts.js"),
  liveVerifier: path.join(frontendRoot, "scripts/verifyAllergenAndFilteredCountsLive.mjs"),
  backendDiscoveryService: path.join(repoRoot, "menubloc-backend/src/services/discovery/discoveryService.js"),
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [key, fs.readFileSync(filePath, "utf8")])
);

function assertNoBroadAllergenBanner(name, contents) {
  assert.doesNotMatch(
    contents,
    /AllergenFilterStatusBanner/,
    `${name} must not import or render the broad allergen status banner.`
  );
}

function assertUsesCountHelper(name, contents) {
  assert.match(
    contents,
    /getDisplayItemCount/,
    `${name} must use the shared filtered-count helper.`
  );
  assert.doesNotMatch(
    contents,
    /menu\?\.menu_item_count\s*\|\|\s*0/,
    `${name} must not read menu_item_count directly for public card display.`
  );
}

assert.match(
  source.countHelper,
  /GUARDRAIL:[\s\S]*Discovery\/browse\/search card surfaces are protected UI architecture\./,
  "publicCardCounts.js must include the protected public-card architecture guardrail."
);
assert.match(
  source.countHelper,
  /Shared public card behavior[\s\S]*centralized\./,
  "publicCardCounts.js must centralize protected public-card behavior."
);
assert.match(
  source.countHelper,
  /Do not introduce page-specific overrides or duplicate display logic\./,
  "publicCardCounts.js must forbid page-specific public-card overrides."
);
assert.match(
  source.countHelper,
  /Do not redesign search\/browse\/discovery hierarchy without explicit user approval\./,
  "publicCardCounts.js must forbid hierarchy redesign without approval."
);
assert.match(
  source.countHelper,
  /GUARDRAIL:[\s\S]*Public restaurant\/menu cards must display counts from the current filtered[\s\S]*result set\./,
  "publicCardCounts.js must include the filtered-count guardrail."
);
assert.match(
  source.browseMenus,
  /GUARDRAIL:[\s\S]*Do not render broad allergen warning blocks on public discovery\/browse\/menu-list cards\./,
  "BrowseMenus.jsx must include the allergen-display guardrail."
);
assert.match(
  source.discovery,
  /GUARDRAIL:[\s\S]*Do not render broad allergen warning blocks on public discovery\/browse\/menu-list cards\./,
  "GrubbidDiscovery.jsx must include the allergen-display guardrail."
);

assertNoBroadAllergenBanner("BrowseMenus.jsx", source.browseMenus);
assertNoBroadAllergenBanner("GrubbidDiscovery.jsx", source.discovery);
assertNoBroadAllergenBanner("GrubbidSearchResults.jsx", source.searchResults);
assertNoBroadAllergenBanner("DiscoveryCard.jsx", source.discoveryCard);
assertNoBroadAllergenBanner("FeaturedDiscoveryCard.jsx", source.featuredDiscoveryCard);
assertNoBroadAllergenBanner("MenuPreviewCard.jsx", source.menuPreviewCard);
assertNoBroadAllergenBanner("SearchResultCard.jsx", source.searchResultCard);

assertUsesCountHelper("DiscoveryCard.jsx", source.discoveryCard);
assertUsesCountHelper("FeaturedDiscoveryCard.jsx", source.featuredDiscoveryCard);
assertUsesCountHelper("MenuPreviewCard.jsx", source.menuPreviewCard);
assert.doesNotMatch(
  source.searchResults,
  /menu\?\.menu_item_count\s*\|\|\s*0|restaurant\?\.menu_item_count\s*\|\|\s*0/,
  "GrubbidSearchResults.jsx must not recreate public-card count logic."
);
assert.doesNotMatch(
  source.searchResultCard,
  /menu_item_count\s*\|\|\s*0|matching_item_count\s*\|\|\s*0|total_item_count\s*\|\|\s*0/,
  "SearchResultCard.jsx must not recreate public-card count helper logic."
);
assert.doesNotMatch(
  source.searchResultCard,
  /allergenFilter\.title_text|advisory_text|Set Allergen Preferences/,
  "SearchResultCard.jsx must not recreate the broad allergen status display."
);

assert.match(
  source.browseMenus,
  /<DiscoveryCard[\s\S]*hasActiveFilters=\{hasActiveFilters\(filters\)\}/,
  "BrowseMenus.jsx must pass active filter state into the shared card count helper path."
);
assert.match(
  source.discovery,
  /const hasActivePublicFilters =[\s\S]*activeExcludedAllergens\.length > 0;/,
  "GrubbidDiscovery.jsx must derive a single public filter-state flag for card counts."
);
assert.match(
  source.discovery,
  /<FeaturedDiscoveryCard[\s\S]*hasActiveFilters=\{hasActivePublicFilters\}/,
  "GrubbidDiscovery.jsx must pass active filter state to FeaturedDiscoveryCard."
);
assert.match(
  source.discovery,
  /<DiscoveryCard[\s\S]*hasActiveFilters=\{hasActivePublicFilters\}/,
  "GrubbidDiscovery.jsx must pass active filter state to DiscoveryCard."
);
assert.match(
  source.discoveryDrawer,
  /testId="discovery-filter-dairy_free"/,
  "DiscoveryDrawer.jsx must expose a stable dairy_free test id."
);
assert.match(
  source.discoveryDrawer,
  /testId="discovery-filter-gluten_free"/,
  "DiscoveryDrawer.jsx must expose a stable gluten_free test id."
);
assert.match(
  source.discoveryDrawer,
  /testId="discovery-filter-vegan"/,
  "DiscoveryDrawer.jsx must expose a stable vegan test id."
);
assert.match(
  source.liveVerifier,
  /for \(const filterKey of \["dairy_free", "gluten_free", "vegan"\]\)/,
  "The live verifier must explicitly verify dairy_free, gluten_free, and vegan."
);
assert.match(
  source.liveVerifier,
  /page\.getByTestId\(`discovery-filter-\$\{filterKey\}`\)\.click\(\)/,
  "The live verifier must use stable data-testid filter controls."
);
assert.match(
  source.liveVerifier,
  /parsedUrl\.searchParams\.get\(filterKey\), "1"/,
  "The live verifier must prove the outgoing browse URL includes the intended filter param."
);

assert.match(
  source.backendDiscoveryService,
  /matching_item_count:\s*matchingItemCount/,
  "discoveryService.js must expose a matching_item_count field for filtered browse payloads."
);
assert.match(
  source.backendDiscoveryService,
  /menu_item_count:\s*matchingItemCount/,
  "discoveryService.js must publish filtered item counts as menu_item_count."
);
assert.doesNotMatch(
  source.backendDiscoveryService,
  /menu_item_count:\s*rest\.total_item_count\s*\?\?\s*_items\.length/,
  "discoveryService.js must not reuse unfiltered totals as menu_item_count."
);

const { getDisplayItemCount } = await import(pathToFileURL(files.countHelper).href);

assert.equal(
  getDisplayItemCount({
    restaurant: { menu_item_count: 37, total_item_count: 37, matching_item_count: 8 },
    hasActiveFilters: false,
  }),
  37,
  "Without active filters, cards should show the full visible item count."
);
assert.equal(
  getDisplayItemCount({
    restaurant: { menu_item_count: 37, total_item_count: 37, matching_item_count: 8 },
    hasActiveFilters: true,
  }),
  8,
  "With active filters, cards must prefer matching_item_count."
);
assert.equal(
  getDisplayItemCount({
    restaurant: { menu_item_count: 8, total_item_count: 37 },
    hasActiveFilters: true,
  }),
  8,
  "With active filters, cards may use menu_item_count only when it already differs from the unfiltered total."
);
assert.equal(
  getDisplayItemCount({
    restaurant: { menu_item_count: 37, total_item_count: 37 },
    hasActiveFilters: true,
  }),
  null,
  "With active filters, cards must hide counts when only an unfiltered total is available."
);

console.log("verify:allergen-and-filtered-counts — public allergen guardrails and filtered counts passed.");
