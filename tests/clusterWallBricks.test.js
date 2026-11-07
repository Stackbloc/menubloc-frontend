import test from "node:test";
import assert from "node:assert/strict";
import { WALL_MATERIALS, WALL_THEMES, cleanWallEmoji, randomWallTilt, wallAgo, wallStyle } from "../src/lib/clusterWallStyles.js";

// 2026-11-06 Wall redesign: subtle ages, one emoji, ±3° tilt, six author-picked materials.
test("wallAgo: now / m / h / d / w / mo / y", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  const ago = (s) => wallAgo(new Date(now - s * 1000).toISOString(), now);
  assert.equal(ago(20), "now");
  assert.equal(ago(5 * 60), "5m");
  assert.equal(ago(3 * 3600), "3h");
  assert.equal(ago(2 * 86400), "2d");
  assert.equal(ago(15 * 86400), "2w");
  assert.equal(ago(100 * 86400), "3mo");
  assert.equal(ago(800 * 86400), "2y");
  assert.equal(wallAgo("nope", now), "");
});

test("one emoji only; tilt stays within ±3; materials all have textures", () => {
  assert.equal(cleanWallEmoji("🔥"), "🔥");
  assert.equal(cleanWallEmoji("👍🏽"), "👍🏽");
  assert.equal(cleanWallEmoji("🔥🔥"), null);
  assert.equal(cleanWallEmoji("hi"), null);
  for (let i = 0; i < 200; i += 1) {
    const t = randomWallTilt();
    assert.ok(Number.isInteger(t) && t !== 0 && Math.abs(t) <= 3);
  }
  assert.deepEqual(WALL_MATERIALS, ["brick", "marble", "chalkboard", "stucco", "teal", "wood"]);
  for (const m of WALL_MATERIALS) assert.ok(WALL_THEMES[m]?.texture);
  const s = wallStyle({ theme: "stucco", tilt: 9, underline: "blue", emoji: "<b>" });
  assert.deepEqual([s.theme, s.tilt, s.underline, s.emoji], ["stucco", 0, "none", null]);
});
