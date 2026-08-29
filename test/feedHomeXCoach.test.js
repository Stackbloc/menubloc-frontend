import test from "node:test";
import assert from "node:assert/strict";
import {
  FEED_HOME_X_COACH_COPY,
  FEED_HOME_X_COACH_DURATION_MS,
} from "../src/lib/feedHomeXCoach.js";

test("feed home X coach copy and duration", () => {
  assert.match(
    FEED_HOME_X_COACH_COPY,
    /Press the 'x' below to share your food related video content\./
  );
  assert.equal(FEED_HOME_X_COACH_DURATION_MS, 10_000);
});
