/**
 * The official Menuply brick on the Wall (backend wallHouseBlock.js, mig 0395).
 * It goes after a few community posts, at a random spot per visit (never first), and only once.
 */

export const HOUSE_SLOT_MIN = 3;
export const HOUSE_SLOT_MAX = 12;

/** Index the Menuply brick goes in front of among `count` posts (count = after the last post). */
export function houseSlot(count, rand = Math.random()) {
  const n = Math.max(0, Number(count) || 0);
  if (n <= HOUSE_SLOT_MIN) return n;
  const hi = Math.min(HOUSE_SLOT_MAX, n);
  return Math.min(hi, HOUSE_SLOT_MIN + Math.floor(rand * (hi - HOUSE_SLOT_MIN + 1)));
}
