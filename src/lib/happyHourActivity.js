/**
 * Happy Hour diner activity — not a meal journal row.
 * Persisted as what-i-ate with food_name intent markers + restaurant where_type.
 */

export const HAPPY_HOUR_INTENTS = [
  { id: "enjoying", label: "I'm enjoying Happy Hour", foodName: "I'm enjoying Happy Hour" },
  { id: "going", label: "I'm going to Happy Hour today", foodName: "I'm going to Happy Hour today" },
];

export function happyHourFoodName(intentId) {
  const row = HAPPY_HOUR_INTENTS.find((p) => p.id === intentId);
  return row?.foodName || "";
}

export function isHappyHourActivity(row = {}) {
  const food = String(row.food_name || row.item_name || row.menu_item_name || "").trim();
  if (!food) return false;
  if (HAPPY_HOUR_INTENTS.some((intent) => intent.foodName === food)) return true;
  return /^i['’]?m\s+(enjoying|going to)\s+happy hour/i.test(food);
}

/** @returns {"enjoying"|"going"} */
export function resolveHappyHourIntent(row = {}) {
  const food = String(row.food_name || row.item_name || row.menu_item_name || "")
    .trim()
    .toLowerCase();
  if (food.includes("enjoying")) return "enjoying";
  return "going";
}

/**
 * Activity clause only (no identity).
 * Edit / second person: "are going to Happy Hour at Place"
 * Profile / third person: "is going to Happy Hour at Place"
 */
export function formatHappyHourActivityClause(row = {}, { secondPerson = false } = {}) {
  const intent = resolveHappyHourIntent(row);
  const verb =
    intent === "enjoying"
      ? secondPerson
        ? "are enjoying"
        : "is enjoying"
      : secondPerson
        ? "are going to"
        : "is going to";
  const place = String(row.restaurant_name || "").trim();
  return place ? `${verb} Happy Hour at ${place}` : `${verb} Happy Hour`;
}
