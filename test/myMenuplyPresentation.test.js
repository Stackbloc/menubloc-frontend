import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDinerStats,
  buildFollowedRestaurantRails,
  buildTopHighlights,
  buildWantSuggestions,
  MY_HIGHLIGHTS_PREVIEW_COUNT,
} from "../src/pages/consumer/myMenuply/myMenuplyPresentation.js";

test("buildTopHighlights includes diner-pinned photos and videos", () => {
  const pinned = [
    { id: 101, media_kind: "photo", media_url: "/uploads/pin1.jpg", is_highlight: true },
    { id: 102, media_kind: "video", media_url: "https://example.com/clip.mp4", is_highlight: true },
  ];

  const cards = buildTopHighlights({
    profileHighlightMedia: pinned,
  });
  assert.equal(cards.length, 2);
  assert.equal(cards[0].deleteKind, "profile_media");
  assert.equal(cards[0].media_kind, "photo");
  assert.ok(cards[0].image);
  assert.equal(cards[0].videoUrl, undefined);
  assert.equal(cards[1].media_kind, "video");
  assert.equal(cards[1].videoUrl, "https://example.com/clip.mp4");
  assert.equal(cards[1].image, null);
});

test("buildTopHighlights returns empty when diner has no pinned media", () => {
  const cards = buildTopHighlights({
    eating: [
      {
        id: 1,
        food_name: "Ramen",
        photo_url: "/uploads/a.jpg",
        restaurant_name: "Daikoku",
      },
    ],
    liked: [{ menu_item_id: 9, item_name: "Burger", restaurant_name: "Shake Shack" }],
    followed: [
      {
        restaurant_id: 3,
        restaurant_name: "KazuNori",
        city: "LA",
        state: "CA",
        billboard_preview: [{ title: "Hand Roll", image_url: "/uploads/b.jpg" }],
      },
    ],
  });
  assert.equal(cards.length, 0);
});

test("buildTopHighlights has no pin cap (preview count is separate)", () => {
  assert.equal(MY_HIGHLIGHTS_PREVIEW_COUNT, 9);
  const pinned = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    media_kind: "photo",
    media_url: `/uploads/p${i}.jpg`,
    is_highlight: true,
  }));
  const cards = buildTopHighlights({ profileHighlightMedia: pinned });
  assert.equal(cards.length, 12);
});

test("buildFollowedRestaurantRails maps restaurant visit cards", () => {
  const rows = buildFollowedRestaurantRails([
    {
      restaurant_id: 5,
      restaurant_name: "Northern Cafe",
      city: "Arcadia",
      state: "CA",
      slug: "northern-cafe",
      billboard_preview: [{ image_url: "/uploads/c.jpg", title: "Special" }],
    },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Northern Cafe");
  assert.ok(rows[0].href);
});

test("buildWantSuggestions and stats helpers", () => {
  assert.equal(buildWantSuggestions([{ menu_item_id: 1, item_name: "Taco" }]).length, 1);
  const stats = buildDinerStats({
    connections: [{ id: 1 }],
    followed: [{ restaurant_id: 1 }, { restaurant_id: 2 }],
    liked: [{ menu_item_id: 1 }],
    eating: [],
    homeDishes: [{ id: 9, name: "Tacos" }],
    events: [{ id: 1 }],
    eventGroups: [],
  });
  assert.deepEqual(
    stats.map((row) => row.label),
    ["Connects", "Restaurants", "Dishes", "Events"]
  );
  assert.deepEqual(stats.map((row) => row.id), ["connects", "restaurants", "dishes", "events"]);
  assert.deepEqual(stats.map((row) => row.value), [1, 2, 2, 1]);
});
