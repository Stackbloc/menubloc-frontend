/**
 * Cluster "Food by type" client helpers (2026-10-28).
 * Chip ids, labels and thresholds come from the backend (src/config/clusterFoodByType.js) —
 * this file never re-defines them. Active chips last for the browser session only.
 */

export const FOOD_BY_TYPE_DEBOUNCE_MS = 200;
export const FOOD_BY_TYPE_PAGE_SIZE = 40;

/** Tile emoji. Tints reuse the Food tab's MKS_ACCENTS where it has one. */
export const FOOD_BY_TYPE_EMOJI = Object.freeze({
  SPECIALS: "⭐",
  BREAKFAST: "🥞",
  BRUNCH: "🍳",
  APPETIZERS: "🥟",
  SOUPS: "🍲",
  SALADS: "🥗",
  BURGERS: "🍔",
  SANDWICHES: "🥪",
  TACOS: "🌮",
  PIZZA: "🍕",
  PASTA: "🍝",
  BOWLS: "🍚",
  CHICKEN_ENTREES: "🍗",
  BEEF_STEAK: "🥩",
  PORK: "🍖",
  SEAFOOD: "🦞",
  CURRIES: "🍛",
  COMBOS: "🍱",
  SIDES: "🍟",
  KIDS: "🧒",
  DESSERTS: "🍰",
  OTHER: "🍽️",
  BEVERAGES: "🍹",
});

const SESSION_KEY_PREFIX = "menuply.foodByType.chips.";

/** Toggle one chip; result is sorted so the same set always makes the same request. */
export function toggleChip(chips, id) {
  const set = new Set(Array.isArray(chips) ? chips : []);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return [...set].sort();
}

export function chipsKey(chips) {
  return [...(chips || [])].sort().join(",");
}

/** Session-only persistence: survives reloads in this tab, not new launches. */
export function readSessionChips(clusterSlug, storage = globalThis.sessionStorage) {
  try {
    const raw = storage?.getItem(`${SESSION_KEY_PREFIX}${clusterSlug}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string").sort() : [];
  } catch {
    return [];
  }
}

export function writeSessionChips(clusterSlug, chips, storage = globalThis.sessionStorage) {
  try {
    storage?.setItem(`${SESSION_KEY_PREFIX}${clusterSlug}`, JSON.stringify(chips || []));
  } catch {
    // Private mode / blocked storage: chips still work for this page view.
  }
}

/** Drop chip ids the server no longer offers (e.g. a stale session value). */
export function keepKnownChips(chips, availableChips) {
  if (!Array.isArray(availableChips) || availableChips.length === 0) return chips;
  const known = new Set(availableChips.map((chip) => chip.id));
  return chips.filter((id) => known.has(id));
}

export function formatDishCount(count) {
  const n = Number(count) || 0;
  return `${n.toLocaleString("en-US")} ${n === 1 ? "dish" : "dishes"}`;
}

/**
 * Nutrition facts for a dish row, in display order. Each part carries `estimated` so the row can
 * show "est." beside the value (restaurant estimates); verified values (chains, dining halls) show none.
 */
export function dishNutritionParts(item) {
  const estimated = item?.nutrition_label === "est." || item?.data_source === "estimated";
  const parts = [];
  const add = (value, unit) => {
    if (value == null || !Number.isFinite(Number(value))) return;
    parts.push({ text: `${Math.round(Number(value)).toLocaleString("en-US")}${unit}`, estimated });
  };
  add(item?.calories, " cal");
  add(item?.protein_g, "g protein");
  add(item?.carbs_g, "g carbs");
  add(item?.sodium_mg, "mg sodium");
  return parts;
}

/**
 * Trailing debounce + abort: each call cancels the pending timer and aborts the in-flight
 * request, so only the newest chip state reaches the server and only its answer lands.
 */
export function createLatestRequestRunner({ delayMs = FOOD_BY_TYPE_DEBOUNCE_MS, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let timer = null;
  let controller = null;
  function cancel() {
    if (timer != null) clearTimer(timer);
    timer = null;
    if (controller) controller.abort();
    controller = null;
  }
  function run(task, { immediate = false } = {}) {
    cancel();
    const current = new AbortController();
    controller = current;
    const start = () => {
      timer = null;
      task(current.signal);
    };
    if (immediate) start();
    else timer = setTimer(start, delayMs);
    return current;
  }
  return { run, cancel };
}
