import assert from "node:assert/strict";
import test from "node:test";
import { houseSlot, HOUSE_SLOT_MAX, HOUSE_SLOT_MIN } from "../src/lib/clusterWallHouse.js";

test("Menuply brick: never first, once, between post 3 and 12, after the last on a short Wall", () => {
  assert.equal(houseSlot(0, 0.5), 0);
  assert.equal(houseSlot(2, 0.9), 2);
  assert.equal(houseSlot(3, 0.9), 3);
  for (const count of [4, 8, 40, 200]) {
    for (const r of [0, 0.25, 0.5, 0.999999]) {
      const at = houseSlot(count, r);
      assert.ok(at >= HOUSE_SLOT_MIN && at <= Math.min(HOUSE_SLOT_MAX, count), `${count}/${r} → ${at}`);
    }
  }
  assert.equal(houseSlot(40, 0), HOUSE_SLOT_MIN);
  assert.equal(houseSlot(40, 0.999999), HOUSE_SLOT_MAX);
});
