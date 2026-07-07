import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_DISCLAIMER,
  buildClusterShareDescription,
  buildClusterShareTitle,
  getClusterDisclaimer,
  getClusterPageHeading,
} from "../src/lib/clusterLegalCopy.js";
import { buildClusterShareData } from "../src/components/share/shareUtils.js";

const LA_LIVE = {
  name: "L.A. Live",
  slug: "la-live",
  city: "Los Angeles",
  state: "CA",
  restaurant_count: 16,
  area_name: "L.A. Live",
  page_heading: "L.A. Live area dining options",
  page_title: "L.A. Live Area Restaurants",
  share_title: "L.A. Live Area Restaurants | Menuply",
  share_description:
    "Browse menu information for restaurants around L.A. Live. Menuply is an independent menu discovery platform.",
  disclaimer: DEFAULT_DISCLAIMER,
};

test("buildClusterShareTitle uses area framing", () => {
  assert.equal(buildClusterShareTitle(LA_LIVE), "L.A. Live Area Restaurants | Menuply");
});

test("buildClusterShareDescription avoids official language", () => {
  const description = buildClusterShareDescription(LA_LIVE);
  assert.match(description, /independent menu discovery platform/);
  assert.doesNotMatch(description, /official|partner|sponsored|endorsed|affiliated/i);
});

test("getClusterDisclaimer returns legal disclaimer text", () => {
  assert.match(getClusterDisclaimer(LA_LIVE), /not affiliated with, endorsed by, or sponsored by/);
});

test("getClusterPageHeading uses area dining options framing", () => {
  assert.equal(getClusterPageHeading(LA_LIVE), "L.A. Live area dining options");
});

test("buildClusterShareData returns legal-safe cluster share payload", () => {
  const payload = buildClusterShareData({
    cluster: LA_LIVE,
    origin: "https://menuply.com",
  });

  assert.equal(payload.title, "L.A. Live Area Restaurants | Menuply");
  assert.equal(payload.url, "https://menuply.com/clusters/ca/los-angeles/la-live");
  assert.match(payload.description, /independent menu discovery platform/);
  assert.doesNotMatch(payload.title, /official|partner|sponsored|endorsed|affiliated/i);
  assert.doesNotMatch(payload.description, /official|partner|sponsored|endorsed|affiliated/i);
});
