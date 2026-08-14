/**
 * Windows section: temporary In-N-Out-only visibility; no auto-fill for others.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isInNOutWindowsException,
  isWindowsOfferPost,
  pickWindowsPosts,
} from "../src/lib/profileWindows.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

const general = {
  id: 1,
  status: "current",
  billboard_status: "active",
  content_type: "general",
  image_url: "https://menuply.com/billboards/banner.jpg",
};
const deal = {
  id: 2,
  status: "current",
  billboard_status: "active",
  content_type: "deal",
  image_url: "https://menuply.com/deals/offer.jpg",
  title: "2 for $5",
};
const windowPost = {
  id: 3,
  status: "current",
  billboard_status: "active",
  content_type: "window",
  image_url: "https://menuply.com/windows/lunch.jpg",
};

test("Non–In-N-Out profiles never get Windows (even with deal/window/general)", () => {
  assert.equal(isWindowsOfferPost(general), false);
  assert.equal(isWindowsOfferPost(deal), false);
  assert.equal(isWindowsOfferPost(windowPost), true);

  assert.deepEqual(pickWindowsPosts([general, deal, windowPost], { slug: "fixins" }), []);
  assert.deepEqual(pickWindowsPosts([general, deal, windowPost], { slug: "klaudettes-kitchen" }), []);
  assert.deepEqual(pickWindowsPosts([deal], { restaurant_name: "LA Wings" }), []);
});

test("In-N-Out exception is the only public Windows source", () => {
  assert.equal(isInNOutWindowsException({ chain_id: 59 }), true);
  assert.equal(isInNOutWindowsException({ slug: "in-n-out-burger" }), true);
  assert.equal(isInNOutWindowsException({ restaurant_name: "In-N-Out Burger" }), true);
  assert.equal(isInNOutWindowsException({ slug: "klaudettes-kitchen-los-angeles" }), false);

  const picked = pickWindowsPosts([general, deal], { chain_id: 59 });
  assert.equal(picked.length, 2);
  assert.ok(picked.some((p) => p.id === 1));
  assert.ok(picked.some((p) => p.id === 2));
});

test("Empty Windows means no section (no blank placeholder)", () => {
  assert.deepEqual(pickWindowsPosts([general], { slug: "fixins" }), []);

  const lib = read("src/lib/profileWindows.js");
  assert.match(lib, /only In-N-Out/);
  assert.match(lib, /if \(!isInNOutWindowsException\(profile\)\) return \[\]/);

  const block = read("src/components/restaurant/publicProfile/ProfileBillboardBlock.jsx");
  assert.match(block, /pickWindowsPosts/);
  assert.match(block, /frameMaxWidth/);
  assert.match(block, /isMobile \? 88 : 104/);
  assert.doesNotMatch(block, /No Windows yet/);
  assert.doesNotMatch(block, /ProfileSectionBlank/);
  assert.doesNotMatch(block, /showClaimInvites/);
  assert.doesNotMatch(block, /postBody|postTitle/);

  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  assert.match(shell, /windowsPosts\.length > 0/);
  assert.match(shell, /profile=\{profile\}/);

  const splash = read("src/lib/claimedRestaurantBillboardSplash.js");
  assert.match(splash, /contentType === ["']window["']/);
});
