import test from "node:test";
import assert from "node:assert/strict";
import {
  clusterDestinationCategoryLabel,
  clusterMembershipAction,
  clusterMembershipHeading,
  clusterTypeLabel,
  clusterVerificationBadge,
  clusterCoverageBadge,
  isClusterGrowing,
  groupClustersByStateAndType,
  groupClustersByStateCity,
  resolveFeaturedClusters,
  stateDisplayName,
} from "../src/lib/clusterUrl.js";

test("stateDisplayName formats abbreviations", () => {
  assert.equal(stateDisplayName("CA"), "California");
  assert.equal(stateDisplayName("GA"), "Georgia");
});

test("groupClustersByStateCity groups clusters for directory rendering", () => {
  const grouped = groupClustersByStateCity([
    { name: "USC", slug: "usc", city: "Los Angeles", state: "CA" },
    { name: "L.A. Live", slug: "la-live", city: "Los Angeles", state: "CA" },
    { name: "Atlanta Airport", slug: "atl-airport", city: "Atlanta", state: "GA" },
  ]);

  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].stateLabel, "California");
  assert.equal(grouped[0].cities[0].clusters.length, 2);
  assert.equal(grouped[1].stateLabel, "Georgia");
});

test("cluster membership copy varies by cluster type", () => {
  assert.equal(clusterMembershipHeading("university"), "Part of");
  assert.equal(clusterMembershipHeading("entertainment_complex"), "Located in");
  assert.equal(clusterMembershipAction("university"), "View cluster →");
  assert.equal(clusterMembershipAction("mall"), "Explore cluster →");
});

test("cluster type and verification labels include community discovery types", () => {
  assert.equal(clusterTypeLabel("downtown"), "Downtown");
  assert.equal(clusterTypeLabel("tourist_destination"), "Tourist destination");
  assert.equal(clusterDestinationCategoryLabel("university"), "Universities");
  assert.equal(clusterVerificationBadge("community"), "🟡 Community Cluster");
  assert.equal(clusterVerificationBadge("verified"), "🟢 Verified Cluster");
});

test("groupClustersByStateAndType keeps a consistent destination taxonomy per state", () => {
  const grouped = groupClustersByStateAndType([
    { name: "USC", slug: "usc", type: "university", city: "Los Angeles", state: "CA" },
    { name: "L.A. Live", slug: "la-live", type: "entertainment_complex", city: "Los Angeles", state: "CA" },
  ]);

  const california = grouped.find((entry) => entry.state === "CA");
  assert.ok(california);
  assert.equal(california.destinationTypes.length, 12);
  const universities = california.destinationTypes.find((entry) => entry.type === "university");
  assert.equal(universities.clusters.length, 1);
  const airports = california.destinationTypes.find((entry) => entry.type === "airport");
  assert.equal(airports.clusters.length, 0);
});

test("resolveFeaturedClusters falls back to known showcase slugs", () => {
  const clusters = [
    { slug: "usc", name: "USC" },
    { slug: "la-live", name: "L.A. Live" },
    { slug: "other", name: "Other" },
  ];
  const featured = resolveFeaturedClusters([], clusters);
  assert.equal(featured.length, 2);
  assert.equal(featured[0].slug, "usc");
});

test("growing coverage badge replaces pending public state", () => {
  assert.equal(clusterCoverageBadge({ coverage_status: "growing" }), "🟡 Growing");
  assert.equal(clusterCoverageBadge({ coverage_status: "complete" }), null);
  assert.equal(isClusterGrowing({ progressive_listing: true }), true);
  assert.equal(isClusterGrowing({ coverage_status: "complete" }), false);
});
