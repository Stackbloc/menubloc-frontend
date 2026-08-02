import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardPath = path.join(
  __dirname,
  "../src/components/cluster/ClusterRestaurantDirectoryCard.jsx"
);
const src = fs.readFileSync(cardPath, "utf8");

test("cluster restaurant card renders listing_note next to name", () => {
  assert.match(src, /listing_note/);
  assert.match(src, /listingNote/);
  assert.match(src, /\(catering orders only\)|listingNote \?/);
});

test("cluster restaurant card avoids webkit-box name clamp garble", () => {
  assert.doesNotMatch(src, /WebkitLineClamp/);
  assert.match(src, /fontSynthesis:\s*"none"/);
});
