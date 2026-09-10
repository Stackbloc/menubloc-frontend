import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDinerStats,
  buildFollowedRestaurantRails,
  buildTopHighlights,
  buildWantSuggestions,
} from "../src/pages/consumer/myMenuply/myMenuplyPresentation.js";

test("buildTopHighlights uses only diner-pinned profile photos", () => {
  const eating = [
    {
      id: 1,
      entry_id: 1,
      food_name: "Ramen",
      photo_url: "/uploads/a.jpg",
      restaurant_name: "Daikoku",
    },
  ];
  const liked = [{ menu_item_id: 9, item_name: "Burger", restaurant_name: "Shake Shack" }];
  const followed = [
    {
      restaurant_id: 3,
      restaurant_name: "KazuNori",
      city: "LA",
      state: "CA",
      billboard_preview: [{ title: "Hand Roll", image_url: "/uploads/b.jpg" }],
    },
  ];
  const pinned = [
    { id: 101, media_kind: "photo", media_url: "/uploads/pin1.jpg", is_highlight: true },
    { id: 102, media_kind: "photo", media_url: "/uploads/pin2.jpg", is_highlight: true },
  ];

  const cards = buildTopHighlights({
    eating,
    liked,
    followed,
    profileHighlightPhotos: pinned,
  });
  assert.equal(cards.length, 2);
  assert.equal(cards[0].deleteKind, "profile_media");
  assert.equal(cards[0].badge, "Highlight");
  assert.equal(cards[0].label, "My Highlight");
  assert.ok(cards[0].image);
  assert.equal(cards[0].videoUrl, undefined);
  assert.equal(
    cards.some((c) => /Ramen|Burger|KazuNori/i.test(c.label)),
    false
  );
});

test("buildTopHighlights returns empty when diner has no pinned photos", () => {
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

test("buildTopHighlights skips non-photo profile media", () => {
  const cards = buildTopHighlights({
    profileHighlightPhotos: [
      { id: 1, media_kind: "video", media_url: "https://example.com/clip.mp4" },
      { id: 2, media_kind: "photo", media_url: "/uploads/meal.jpg" },
    ],
  });
  assert.equal(cards.length, 1);
  assert.equal(cards[0].media_id, 2);
  assert.equal(cards[0].videoUrl, undefined);
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
