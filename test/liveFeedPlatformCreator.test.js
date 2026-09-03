import assert from "node:assert/strict";
import test from "node:test";
import {
  isLiveFeedGuestCreator,
  isLiveFeedPlatformCreator,
  liveFeedPosterDisplayName,
  liveFeedPosterLabel,
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
