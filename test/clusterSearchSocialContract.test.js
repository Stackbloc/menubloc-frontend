// 2026-11-19 — A cluster search gets Dishes · Social radios (Events folded into Social 2026-11-22), same as the Search page and
// the app (Andre 2026-11-19: "I see no signs of social search results on the cluster screen").
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (rel) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");

test("cluster search asks /search/social after the dishes, with the cluster's city and places", () => {
  const src = read("src/pages/ClusterPage.jsx");
  assert.match(src, /fetchSearchSocial\(\s*API_BASE,\s*submittedSearch\.trim\(\),\s*cluster\?\.city/);
  assert.match(src, /\(data\.menu_items \|\| \[\]\)\.map\(\(row\) => row\?\.restaurant_id\)/);
  // Extra: a failure never touches the dishes.
  assert.match(src, /setSearchSocialGroups\(g\);\s*\}\)\s*\.catch\(\(\) => undefined\)/);
});

test("Dishes · Social radios; Social = people, then plans + events; no Events radio (Andre 2026-11-22)", () => {
  const src = read("src/pages/ClusterPage.jsx");
  assert.match(src, /function ClusterSearchViewRadios/);
  assert.match(src, /`Social · \$\{socialCount\}`/);
  assert.doesNotMatch(src, /`Events · /);
  assert.match(src, /searchSocialGroups\.people\.length \+ searchSocialGroups\.plans\.length \+ searchSocialGroups\.events\.length/);
  // People first, then plans and events, in the one Social view.
  assert.match(src, /data-testid="cluster-social-view"[\s\S]{0,120}<SearchPeopleSection[\s\S]{0,120}<SearchPlansSection[\s\S]{0,120}<SearchEventsSection/);
  assert.doesNotMatch(src, /cluster-events-view/);
});

test("Search page: no Events radio; Social shows people, then events; Rest. beside Social (Andre 2026-11-22)", () => {
  const src = read("src/pages/GrubbidSearchResults.jsx");
  assert.doesNotMatch(src, /search-view-events/);
  assert.doesNotMatch(src, /`Events · /);
  assert.match(src, /socialViewCount\(socialSummary, socialGroups\) \+ eventsViewCount\(socialSummary, socialGroups\)/);
  assert.match(src, /showSocialView \? <SearchSocialSummary[\s\S]{0,160}showSocialView \? <SearchEventsView/);
  assert.match(src, /"Rest\."/);
});
