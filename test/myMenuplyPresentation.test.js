import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDinerStats,
  buildFollowedRestaurantRails,
  buildTopHighlights,
  buildWantSuggestions,
} from "../src/pages/consumer/myMenuply/myMenuplyPresentation.js";

test("buildTopHighlights prefers user diary then liked then follows", () => {
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

  const cards = buildTopHighlights({ eating, liked, followed });
  assert.equal(cards.length, 3);
  assert.equal(cards[0].source, "user");
  assert.equal(cards[0].badge, "Your meal");
  assert.equal(cards[0].deleteKind, "diary");
  assert.ok(cards[0].deleteItem);
  assert.ok(cards[0].image);
  assert.equal(cards[0].videoUrl, undefined);
  assert.match(cards[1].badge, /Saved dish/i);
  assert.equal(cards[1].deleteKind, "like");
  assert.match(cards[2].badge, /places you follow/i);
  assert.equal(cards[2].deleteKind, "follow");
});

test("buildTopHighlights skips video-only diary rows (no recycled videos)", () => {
  const eating = [
    {
      id: 10,
      entry_id: 10,
      food_name: "Starbucks",
      video_url: "https://example.com/clip.mp4",
      restaurant_name: "Starbucks",
    },
    {
      id: 11,
      entry_id: 11,
      food_name: "Photo meal",
      photo_url: "/uploads/meal.jpg",
      restaurant_name: "Cafe",
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

  const cards = buildTopHighlights({ eating, liked, followed });
  assert.equal(cards.length, 3);
  assert.equal(cards[0].badge, "Your meal");
  assert.equal(cards[0].label, "Photo meal");
  assert.ok(cards[0].image);
  assert.equal(cards[0].videoUrl, undefined);
  assert.equal(
    cards.some((c) => /Starbucks/i.test(c.label)),
    false
  );
  assert.match(cards[1].badge, /Saved dish/i);
  assert.match(cards[2].badge, /places you follow/i);
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
