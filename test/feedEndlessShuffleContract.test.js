/**
 * Endless Feed wrap + reshuffle — unit tests.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  shuffleFeedVideos,
  wrapEndlessFeedNext,
} from "../src/lib/shuffleProfileVideos.js";

test("wrapEndlessFeedNext advances within the list without reshuffling length", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const next = wrapEndlessFeedNext(list, 0);
  assert.equal(next.index, 1);
  assert.deepEqual(
    next.items.map((r) => r.id),
    ["a", "b", "c"]
  );
});

test("wrapEndlessFeedNext at last clip reshuffles and restarts at 0", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const next = wrapEndlessFeedNext(list, 3);
  assert.equal(next.index, 0);
  assert.equal(next.items.length, 4);
  assert.deepEqual(
    [...next.items.map((r) => r.id)].sort(),
    ["a", "b", "c", "d"]
  );
  assert.notEqual(String(next.items[0].id), "d");
});

test("wrapEndlessFeedNext with one clip stays on that clip", () => {
  const list = [{ id: "only" }];
  const next = wrapEndlessFeedNext(list, 0);
  assert.equal(next.index, 0);
  assert.equal(next.items[0].id, "only");
});

test("shuffleFeedVideos returns same membership", () => {
  const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const out = shuffleFeedVideos(list);
  assert.deepEqual(
    [...out.map((r) => r.id)].sort(),
    [1, 2, 3]
  );
});
