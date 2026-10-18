/**
 * Endless Feed wrap + reshuffle — unit tests.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  feedListKeepsPosition,
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

test("wrapEndlessFeedNext keeps the last half of a pass out of the next pass's first half", () => {
  const list = Array.from({ length: 10 }, (_, i) => ({ id: `v${i}` }));
  const recent = new Set(list.slice(5).map((r) => r.id));
  for (let n = 0; n < 200; n += 1) {
    const next = wrapEndlessFeedNext(list, 9);
    assert.equal(next.items.length, 10);
    assert.equal(new Set(next.items.map((r) => r.id)).size, 10);
    for (const row of next.items.slice(0, 5)) assert.ok(!recent.has(row.id), row.id);
  }
});

test("feedListKeepsPosition: Load More append / removal / same list keep place; new list does not", () => {
  const a = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.equal(feedListKeepsPosition(a, [...a, { id: 4 }, { id: 5 }]), true);
  assert.equal(feedListKeepsPosition(a, [{ id: 1 }, { id: 3 }]), true);
  assert.equal(feedListKeepsPosition(a, [{ id: 1 }, { id: 2 }, { id: 3 }]), true);
  assert.equal(feedListKeepsPosition(a, [{ id: 3 }, { id: 1 }, { id: 2 }]), false);
  assert.equal(feedListKeepsPosition(a, [{ id: 9 }, { id: 1 }, { id: 2 }, { id: 3 }]), false);
  assert.equal(feedListKeepsPosition([], a), false);
});
