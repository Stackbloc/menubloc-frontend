import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBillboardImageObjectPosition } from "../src/lib/billboardImageObjectPosition.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("In-N-Out building crops keep the neon logo in frame", () => {
  assert.equal(
    resolveBillboardImageObjectPosition({
      image_url: "https://menuply.com/billboards/in-n-out-building.jpg",
    }),
    "left center"
  );
  assert.equal(
    resolveBillboardImageObjectPosition({
      image_url: "https://menuply.com/billboards/in-n-out-building-splash.jpg",
    }),
    "center top"
  );
  assert.equal(
    resolveBillboardImageObjectPosition({
      image_url: "https://menuply.com/billboards/klaudettes-kitchen-banner.jpg",
    }),
    "center"
  );
  assert.equal(
    resolveBillboardImageObjectPosition({
      image_url: "https://example.com/x.jpg",
      image_position: "20% 30%",
    }),
    "20% 30%"
  );

  const splash = read("src/components/restaurant/ClaimedRestaurantBillboardSplash.jsx");
  assert.match(splash, /resolveBillboardImageObjectPosition/);
  assert.match(splash, /objectPosition: imageObjectPosition/);

  const windows = read("src/components/restaurant/publicProfile/ProfileBillboardBlock.jsx");
  assert.match(windows, /resolveBillboardImageObjectPosition/);

  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /data\?\.hero_image_url[\s\S]*firstBillboardImage/);
});
