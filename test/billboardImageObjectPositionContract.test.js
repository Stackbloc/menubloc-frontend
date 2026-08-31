import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveBillboardDisplayImageUrl,
  resolveBillboardImageObjectPosition,
} from "../src/lib/billboardImageObjectPosition.js";
import { resolveBillboardMediaUrl } from "../src/lib/billboardMediaUrl.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

const LANDSCAPE = "https://menuply.com/billboards/in-n-out-building.jpg";
const SPLASH = "https://menuply.com/billboards/in-n-out-building-splash.jpg";

test("resolveBillboardMediaUrl prefixes relative upload paths with API base", () => {
  assert.equal(
    resolveBillboardMediaUrl("/uploads/billboard-photos/x.jpg"),
    "https://menubloc-backend-production.up.railway.app/uploads/billboard-photos/x.jpg"
  );
  assert.equal(
    resolveBillboardMediaUrl("https://cdn.example.com/a.jpg"),
    "https://cdn.example.com/a.jpg"
  );

  const splash = read("src/components/restaurant/ClaimedRestaurantBillboardSplash.jsx");
  assert.match(splash, /resolveBillboardMediaUrl/);
  const panel = read("src/pages/owner/OwnerProfileBillboardsPanel.jsx");
  assert.match(panel, /resolveBillboardMediaUrl/);
  const operatorBillboards = read("src/pages/operator/OperatorBillboardsPage.jsx");
  assert.match(operatorBillboards, /resolveBillboardMediaUrl/);
  const operatorDeals = read("src/pages/operator/OperatorDealsEditor.jsx");
  assert.match(operatorDeals, /resolveBillboardMediaUrl/);
});

test("In-N-Out building crops keep the neon logo in frame", () => {
  assert.equal(
    resolveBillboardImageObjectPosition({ image_url: LANDSCAPE }),
    "left center"
  );
  assert.equal(
    resolveBillboardImageObjectPosition({ image_url: LANDSCAPE }, { narrow: true }),
    "center top"
  );
  assert.equal(
    resolveBillboardImageObjectPosition({ image_url: SPLASH }),
    "center top"
  );
  assert.equal(
    resolveBillboardImageObjectPosition({
      image_url: "https://menuply.com/billboards/klaudettes-kitchen-banner.jpg",
    }),
    "center center"
  );
  assert.equal(
    resolveBillboardImageObjectPosition(
      {
        image_url: "https://menuply.com/billboards/klaudettes-kitchen-banner.jpg",
      },
      { narrow: true }
    ),
    "center top"
  );
  assert.equal(
    resolveBillboardImageObjectPosition(
      {
        image_url: "https://menubloc-backend-production.up.railway.app/uploads/billboard-photos/restaurant-3684__deal-986__x.jpg",
      },
      { narrow: true }
    ),
    "center top"
  );
  assert.equal(
    resolveBillboardImageObjectPosition({
      image_url: "https://example.com/x.jpg",
      image_position: "20% 30%",
    }),
    "20% 30%"
  );

  const splash = read("src/components/restaurant/ClaimedRestaurantBillboardSplash.jsx");
  assert.match(splash, /resolveBillboardDisplayImageUrl/);
  assert.match(splash, /resolveBillboardImageObjectPosition/);
  assert.match(splash, /objectPosition: imageObjectPosition/);
  assert.match(splash, /narrow:\s*isNarrow/);

  const windows = read("src/components/restaurant/publicProfile/ProfileBillboardBlock.jsx");
  assert.match(windows, /resolveBillboardImageObjectPosition/);
  assert.match(windows, /narrow:\s*isMobile/);

  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  assert.match(hero, /resolveBillboardDisplayImageUrl/);
  assert.match(hero, /backgroundPosition: bannerObjectPosition/);

  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /data\?\.hero_image_url[\s\S]*firstBillboardImage/);
});

test("narrow viewports swap In-N-Out landscape building to portrait splash", () => {
  assert.equal(resolveBillboardDisplayImageUrl(LANDSCAPE, { narrow: false }), LANDSCAPE);
  assert.equal(resolveBillboardDisplayImageUrl(LANDSCAPE, { narrow: true }), SPLASH);
  assert.equal(resolveBillboardDisplayImageUrl(SPLASH, { narrow: true }), SPLASH);
  assert.equal(
    resolveBillboardDisplayImageUrl(
      "https://menuply.com/billboards/klaudettes-kitchen-banner.jpg",
      { narrow: true }
    ),
    "https://menuply.com/billboards/klaudettes-kitchen-banner.jpg"
  );
});
