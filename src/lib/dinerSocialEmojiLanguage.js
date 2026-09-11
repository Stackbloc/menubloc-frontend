/**
 * Diner social emoji language — presentation contract.
 * Action emotes = food state / social verbs.
 * Food emoji = derived from item/category/text (never a user emoji picker).
 */

import { iconForFoodInterest, iconForFoodText } from "./foodInterestIcons.js";
import { calendarDayYmd, localDateYmd } from "./calendarDayYmd.js";

/** Profile / scan action emotes (communicate without creating content). */
export const DINER_ACTION_EMOTES = Object.freeze({
  ate: { id: "ate", emoji: "🍽️", label: "Ate" },
  want: { id: "want", emoji: "😋", label: "Wanna Eat" },
  plan: { id: "plan", emoji: "📅", label: "Plan" },
  invite: { id: "invite", emoji: "🤝", label: "Invite" },
  like: { id: "like", emoji: "❤️", label: "Like" },
  bookmark: { id: "bookmark", emoji: "🔖", label: "Bookmark" },
  connect: { id: "connect", emoji: "👋", label: "Connect" },
  menu: { id: "menu", emoji: "🍴", label: "Menu" },
  share: { id: "share", emoji: "📤", label: "Share" },
});

/** Quick-status actions shown on My Menuply (keep tiny). */
export const QUICK_STATUS_ACTIONS = Object.freeze([
  DINER_ACTION_EMOTES.ate,
  DINER_ACTION_EMOTES.want,
]);

export function resolveActionEmote(kind) {
  const key = String(kind || "ate")
    .trim()
    .toLowerCase();
  if (key === "wanna_eat" || key === "want_to_eat") return DINER_ACTION_EMOTES.want;
  return DINER_ACTION_EMOTES[key] || DINER_ACTION_EMOTES.ate;
}

/**
 * Derive food emoji from CK interest key, restaurant/item text, or category-ish words.
 * Users do not pick this.
 */
export function deriveFoodEmoji(row = {}) {
  if (row.icon) return String(row.icon);
  if (row.food_interest_key) return iconForFoodInterest(row.food_interest_key);
  const blob = [
    row.food_name,
    row.item_name,
    row.menu_item_name,
    row.restaurant_name,
    row.category,
    row.canonical_category,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" ");
  return iconForFoodText(blob);
}

export function resolveFoodSubject(row = {}) {
  const food = String(
    row.food_name || row.item_name || row.menu_item_name || ""
  ).trim();
  const restaurant = String(row.restaurant_name || "").trim();
  if (food && restaurant) return `${food}`;
  if (food) return food;
  if (restaurant) return restaurant;
  if (row.food_interest_key) {
    return String(row.food_interest_key)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Food";
}

/**
 * Relative / meal when-label for the detail line ("Tonight", "Yesterday", "Lunch").
 */
export function formatActivityWhen(row = {}, { todayYmd = null } = {}) {
  const eaten = calendarDayYmd(row.eaten_on || row.want_on || row.activity_on);
  const today = calendarDayYmd(todayYmd) || localDateYmd();
  if (eaten && today) {
    if (eaten === today) {
      const meal = String(row.meal_period || "")
        .trim()
        .toLowerCase()
        .replace(/[ -]+/g, "_");
      if (meal === "dinner" || meal === "late_night") return "Tonight";
      if (meal === "breakfast") return "Breakfast";
      if (meal === "lunch") return "Lunch";
      return "Today";
    }
    const t = Date.parse(`${today}T12:00:00`);
    const e = Date.parse(`${eaten}T12:00:00`);
    if (Number.isFinite(t) && Number.isFinite(e) && t - e === 86400000) return "Yesterday";
  }
  const meal = String(row.meal_period || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  if (meal === "breakfast") return "Breakfast";
  if (meal === "lunch") return "Lunch";
  if (meal === "dinner" || meal === "late_night") return "Tonight";
  return null;
}

/**
 * Lowercase meal word for discovery reporting ("lunch", "late night").
 */
export function mealPeriodProseWord(mealPeriod) {
  const mealRaw = String(mealPeriod || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  if (mealRaw === "breakfast") return "breakfast";
  if (mealRaw === "brunch") return "brunch";
  if (mealRaw === "lunch") return "lunch";
  if (mealRaw === "dinner") return "dinner";
  if (mealRaw === "late_night") return "late night";
  if (mealRaw === "snack") return "snack";
  if (mealRaw === "other") return "a meal";
  return "";
}

/**
 * Prose activity clause — no decorative emoji.
 * Discovery reporting (Who's Eating / peer feeds):
 * "is eating lunch at ABC Restaurant, Chicken Sandwich"
 * Owner hub timeline uses a separate ownerCompact layout — not this clause.
 */
export function formatActivityProseClause(row = {}) {
  const kind = String(row.kind || row.signal_kind || "ate")
    .trim()
    .toLowerCase();
  const isWant = kind === "want" || kind === "wanna_eat" || kind === "want_to_eat";
  const foodRaw = String(
    row.food_name || row.item_name || row.menu_item_name || ""
  ).trim() || (row.food_interest_key ? resolveFoodSubject(row) : "");
  // Discovery / prose: one dish only (first of multi-item · joins).
  const foodPrimary = String(foodRaw || "")
    .split(/\s*·\s*/)
    .map((part) => part.trim())
    .filter(Boolean)[0] || "";
  const foodLabel = foodPrimary && foodPrimary !== "Food" ? foodPrimary : "";
  const restaurant = String(row.restaurant_name || "").trim();
  const homemade = row.homemade === true || row.cooking === true;
  const second = row.second_person === true;
  const mealProse = mealPeriodProseWord(row.meal_period || row.mealPeriod);

  if (isWant) {
    const wantVerb = second ? "want" : "wants";
    if (foodLabel && restaurant) return `${wantVerb} ${foodLabel} at ${restaurant}`;
    if (restaurant && !foodLabel) return `${wantVerb} to eat at ${restaurant}`;
    if (foodLabel) return `${wantVerb} ${foodLabel}`;
    return second ? "want something to eat" : "wants something to eat";
  }

  const eatVerb = second ? "are eating" : "is eating";
  const place = homemade ? "@home" : restaurant;

  // Discovery order: meal → place → dish
  // "is eating lunch at ABC Restaurant, Chicken Sandwich"
  if (place && foodLabel && mealProse) {
    return `${eatVerb} ${mealProse} at ${place}, ${foodLabel}`;
  }
  if (place && foodLabel) {
    return `${eatVerb} at ${place}, ${foodLabel}`;
  }
  if (place && mealProse) {
    return `${eatVerb} ${mealProse} at ${place}`;
  }
  if (place) {
    return `${eatVerb} at ${place}`;
  }
  if (foodLabel && mealProse) {
    return `${eatVerb} ${mealProse}, ${foodLabel}`;
  }
  if (foodLabel) {
    return `${eatVerb} ${foodLabel}`;
  }
  if (mealProse) {
    return `${eatVerb} ${mealProse}`;
  }
  return eatVerb;
}

/**
 * Scan activity parts (legacy + prose):
 * Prefer proseClause for display; actionLine kept for older callers.
 */
export function formatActivityScanParts(row = {}, opts = {}) {
  const action = resolveActionEmote(row.kind || row.signal_kind || "ate");
  const foodEmoji = deriveFoodEmoji(row);
  const subject = resolveFoodSubject(row);
  const restaurant = String(row.restaurant_name || "").trim();
  const when = formatActivityWhen(row, opts);
  const proseClause = formatActivityProseClause(row);
  const detailBits = [];
  if (restaurant && subject && !subject.toLowerCase().includes(restaurant.toLowerCase())) {
    detailBits.push(subject);
    detailBits.push(`at ${restaurant}`);
  } else if (restaurant && (!subject || subject === "Food")) {
    detailBits.push(restaurant);
  } else {
    detailBits.push(subject);
  }
  if (when) detailBits.push(when);
  return {
    foodEmoji,
    actionEmoji: action.emoji,
    actionLabel: action.label,
    /** @deprecated decorative — prefer proseClause */
    actionLine: proseClause,
    detailLine: "",
    proseClause,
  };
}
