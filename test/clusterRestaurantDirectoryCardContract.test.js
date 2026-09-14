import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatClusterListingNoteForDisplay } from "../src/lib/clusterListingNoteDisplay.js";
import {
  CLUSTER_RESTAURANT_BILLBOARD_HEIGHT_PX,
  resolveClusterRestaurantBillboardUrl,
} from "../src/lib/clusterRestaurantDisplay.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardPath = path.join(
  __dirname,
  "../src/components/cluster/ClusterRestaurantDirectoryCard.jsx"
);
const src = fs.readFileSync(cardPath, "utf8");

test("cluster restaurant card renders listing_note below name (not inline garble)", () => {
  assert.match(src, /listing_note/);
  assert.match(src, /listingNote/);
  assert.match(src, /formatClusterListingNoteForDisplay/);
  assert.match(src, /cluster-restaurant-listing-note/);
});

test("cluster restaurant card uses a compact My Favs-style billboard strip", () => {
  assert.match(src, /resolveClusterRestaurantBillboardUrl/);
  assert.match(src, /cluster-restaurant-billboard/);
  assert.match(src, /CLUSTER_RESTAURANT_BILLBOARD_HEIGHT_PX/);
});

test("cluster restaurant card avoids webkit-box name clamp garble", () => {
  assert.doesNotMatch(src, /WebkitLineClamp/);
  assert.match(src, /fontSynthesis:\s*"none"/);
});

test("cluster restaurant card exposes themeable title class for dark place themes", () => {
  assert.match(src, /cluster-card-title/);
  assert.match(src, /cluster-restaurant-directory-card/);
  assert.match(src, /cluster-themed-card/);
});

test("formatClusterListingNoteForDisplay drops SOURCE STATUS seed text", () => {
  assert.equal(
    formatClusterListingNoteForDisplay("SOURCE STATUS: historical_reference — long audit text"),
    null
  );
  assert.equal(formatClusterListingNoteForDisplay("catering orders only"), "catering orders only");
});

test("formatClusterListingNoteForDisplay drops seed JSON and data_origin blobs", () => {
  assert.equal(
    formatClusterListingNoteForDisplay(
      '{"data_origin":"mcdonalds_simplemaps_seed_2026","source":"simplemaps"}'
    ),
    null
  );
  assert.equal(
    formatClusterListingNoteForDisplay("USC local restaurant seed from cached OSM candidate set."),
    null
  );
});

test("resolveClusterRestaurantBillboardUrl prefers billboard then logo", () => {
  assert.equal(
    resolveClusterRestaurantBillboardUrl({
      billboard_preview: [{ image_url: "https://cdn.example/billboard.jpg" }],
      logo_url: "https://cdn.example/logo.png",
    }),
    "https://cdn.example/billboard.jpg"
  );
  assert.equal(
    resolveClusterRestaurantBillboardUrl({
      logo_url: "https://cdn.example/logo.png",
    }),
    "https://cdn.example/logo.png"
  );
  assert.equal(resolveClusterRestaurantBillboardUrl({}), null);
  assert.equal(CLUSTER_RESTAURANT_BILLBOARD_HEIGHT_PX, 72);
});
