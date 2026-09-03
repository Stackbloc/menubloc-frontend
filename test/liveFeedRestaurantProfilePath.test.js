import test from "node:test";
import assert from "node:assert/strict";
import {
  liveFeedRestaurantProfilePath,
  resolveFeedPlaceCaption,
} from "../src/lib/liveFeedCategory.js";

test("liveFeedRestaurantProfilePath uses /restaurants/ not /r/", () => {
  const href = liveFeedRestaurantProfilePath({
    restaurant_slug: "fixins-soul-kitchen",
    restaurant_city: "Los Angeles",
    restaurant_state: "CA",
  });
  assert.match(href, /^\/restaurants\//);
  assert.doesNotMatch(href, /^\/r\//);
});

test("resolveFeedPlaceCaption links restaurant name to profile", () => {
  const caption = resolveFeedPlaceCaption({
    restaurant_name: "Fixins Soul Kitchen",
    restaurant_slug: "fixins-soul-kitchen",
    restaurant_city: "Los Angeles",
    restaurant_state: "CA",
  });
  assert.equal(caption.restaurant?.label, "Fixins Soul Kitchen");
  assert.match(caption.restaurant?.href, /^\/restaurants\//);
});
