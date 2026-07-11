import test from "node:test";
import assert from "node:assert/strict";
import { clusterLifecycleLabel, groupClustersForCitySections } from "../src/lib/clusterCityPresentation.js";

test("clusterLifecycleLabel marks starter clusters subtly", () => {
  const starter = clusterLifecycleLabel({ coverage_status: "growing" });
  assert.equal(starter.statusLabel, "Starter");
  assert.equal(starter.statusTitle, "Community contributions welcome");

  const live = clusterLifecycleLabel({ coverage_status: "complete" });
  assert.equal(live.statusLabel, null);
  assert.equal(live.statusTitle, null);
});

test("groupClustersForCitySections returns empty arrays for no input", () => {
  const { live, starter } = groupClustersForCitySections([]);
  assert.equal(live.length, 0);
  assert.equal(starter.length, 0);
});

test("groupClustersForCitySections splits live and starter clusters", () => {
  const clusters = [
    { slug: "la-live", coverage_status: "complete" },
    { slug: "lax", coverage_status: "growing" },
  ];
  const { live, starter } = groupClustersForCitySections(clusters);
  assert.equal(live.length, 1);
  assert.equal(starter.length, 1);
  assert.equal(live[0].slug, "la-live");
  assert.equal(starter[0].slug, "lax");
});
