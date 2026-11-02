import assert from "node:assert/strict";
import test from "node:test";
import {
  isLiveFeedGuestCreator,
  isLiveFeedPlatformCreator,
  liveFeedPosterDisplayName,
  liveFeedPosterLabel,
  resolveFeedPlaceCaption,
} from "../src/lib/liveFeedCategory.js";

test("managed platform feed item is not a guest creator", () => {
  const item = {
    kind: "managed",
    creator_type: "platform",
    poster_type: "platform",
    diner: { id: null, display_name: "Platform video" },
  };
  assert.equal(isLiveFeedPlatformCreator(item), true);
  assert.equal(isLiveFeedGuestCreator(item), false);
  assert.equal(liveFeedPosterLabel(item), "Platform video");
  assert.equal(liveFeedPosterDisplayName(item), "Platform video");
});

test("guest ate feed item remains Guest Diner", () => {
  const item = {
    kind: "ate",
    creator_type: "guest",
    diner: { id: null, display_name: "Guest Diner" },
  };
  assert.equal(isLiveFeedPlatformCreator(item), false);
  assert.equal(isLiveFeedGuestCreator(item), true);
  assert.equal(liveFeedPosterLabel(item), "Guest Diner");
});

test("platform video food_name matching poster is not repeated in place caption", () => {
  const item = {
    kind: "managed",
    creator_type: "platform",
    poster_type: "platform",
    diner: { id: null, display_name: "Platform video" },
    food_name: "Platform video",
    item_name: null,
    restaurant_name: null,
  };
  const caption = resolveFeedPlaceCaption(item);
  assert.equal(caption.restaurant, null);
  assert.equal(caption.menuItem, null);
});

test("platform video still shows real dish title under poster", () => {
  const item = {
    kind: "managed",
    creator_type: "platform",
    poster_type: "platform",
    diner: { id: null, display_name: "Platform video" },
    food_name: "Stewed oxtail",
    item_name: null,
    restaurant_name: null,
  };
  const caption = resolveFeedPlaceCaption(item);
  assert.equal(caption.menuItem?.label, "Stewed oxtail");
});

test("sponsored clip: advertiser name, Sponsored badge, restaurant link (2026-10-31)", async () => {
  const { isLiveFeedSponsored, liveFeedSponsoredBadge, liveFeedCreatorProfilePath } = await import(
    "../src/lib/liveFeedCategory.js"
  );
  const item = {
    id: "sponsored:3#s0",
    kind: "sponsored",
    poster_type: "sponsor",
    creator: null,
    diner: null,
    restaurant_id: 7,
    restaurant_slug: "cafe-one",
    restaurant_city: "Los Angeles",
    restaurant_state: "CA",
    sponsored: { advertiser_name: "Cafe One", badge: "Sponsored · Deal · 20% off" },
  };
  assert.equal(isLiveFeedSponsored(item), true);
  assert.equal(isLiveFeedGuestCreator(item), false);
  assert.equal(liveFeedPosterDisplayName(item), "Cafe One");
  assert.equal(liveFeedSponsoredBadge(item), "Sponsored · Deal · 20% off");
  assert.ok(liveFeedCreatorProfilePath(item));
  assert.equal(liveFeedSponsoredBadge({ kind: "managed" }), null);
});

test("feed shuffle leaves sponsored clips in place (2026-10-31)", async () => {
  const { shuffleFeedVideos } = await import("../src/lib/shuffleProfileVideos.js");
  const rows = Array.from({ length: 13 }, (_, i) => ({ id: `ate:${i}`, kind: "ate" }));
  rows.splice(12, 0, { id: "sponsored:1#s0", kind: "sponsored" });
  for (let n = 0; n < 20; n += 1) {
    const out = shuffleFeedVideos(rows);
    assert.equal(out.length, rows.length);
    assert.equal(out[12].id, "sponsored:1#s0");
    assert.deepEqual(new Set(out.map((r) => r.id)), new Set(rows.map((r) => r.id)));
  }
});
