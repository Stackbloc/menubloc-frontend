import {
  mealPeriodLabel,
  normalizeWhatIAteMealPeriod,
  WHAT_I_ATE_MEAL_PERIODS,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import { calendarDayYmd, planYmd } from "../../../lib/calendarDayYmd.js";

const MEAL_LABELS = new Set(WHAT_I_ATE_MEAL_PERIODS.map((p) => p.label.toLowerCase()));

export { planYmd, calendarDayYmd };

export function compareYmd(ymd, today) {
  const day = calendarDayYmd(ymd);
  if (!day) return 0;
  if (day > today) return 1;
  if (day < today) return -1;
  return 0;
}

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

/** "Mon., June 2nd. Breakfast. Hashbrowns" */
export function formatEatingCaption(item) {
  const ymd = planYmd(item?.eaten_on);
  const d = ymd ? new Date(`${ymd}T12:00:00`) : null;
  let datePart = "";
  if (d && !Number.isNaN(d.getTime())) {
    const wk = d.toLocaleDateString(undefined, { weekday: "short" });
    const month = d.toLocaleDateString(undefined, { month: "long" });
    datePart = `${wk}., ${month} ${ordinal(d.getDate())}`;
  }
  const meal = mealPeriodLabel(normalizeWhatIAteMealPeriod(item?.meal_period));
  const dish = item?.food_name || item?.item_name || item?.itemName || "Food";
  return [datePart, meal, dish].filter(Boolean).join(". ");
}

/**
 * Meal-period accent colors — Claude / Anthropic-inspired meal timeline.
 * Soft terracotta family + sage lunch + violet late night (not Menuply forest green).
 */
export const MEAL_PERIOD_ACCENT = {
  breakfast: "#C4A35A",
  brunch: "#DA7756",
  lunch: "#6A9B78",
  dinner: "#5B7C8D",
  late_night: "#8B7BB5",
  snack: "#A67C6D",
  other: "#8A8780",
};

/** Timeline typography tokens (Claude presentation). */
export const MEAL_TIMELINE_INK = {
  dish: "#1F1E1D",
  clock: "#8A8780",
  at: "#A3A09A",
  place: "#4A6FA5",
  secondary: "#8A8780",
  rail: "#E8E6DC",
};

export function mealPeriodAccentColor(mealPeriod) {
  const id = normalizeWhatIAteMealPeriod(mealPeriod);
  return MEAL_PERIOD_ACCENT[id] || MEAL_PERIOD_ACCENT.other;
}

/** "Monday, January 1, 2026." for What I'm Eating date heading. */
export function formatEatingHubDateHeading(ymd) {
  const day = planYmd(ymd) || calendarDayYmd(ymd);
  if (!day) return "";
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const label = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${label}.`;
}

/** Clock for meal rows — timeline meta uses "12:30 PM". */
export function formatMealClockTime(eatenAt) {
  if (eatenAt == null || eatenAt === "") return "";
  const d = eatenAt instanceof Date ? eatenAt : new Date(String(eatenAt));
  if (Number.isNaN(d.getTime())) return "";
  const raw = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return String(raw).replace(/\s+/g, " ").trim();
}

/**
 * Timeline meta parts: meal label + optional clock.
 * Presentation lead: "LUNCH 12:30 PM" (or "LUNCH" when omitClock / no stamp).
 */
export function mealPeriodClockParts(mealPeriod, eatenAt, { omitClock = false } = {}) {
  const meal = mealPeriodLabel(normalizeWhatIAteMealPeriod(mealPeriod)) || "";
  const clock = omitClock ? "" : formatMealClockTime(eatenAt);
  return {
    meal,
    mealUpper: meal ? meal.toUpperCase() : "",
    clock,
    accent: mealPeriodAccentColor(mealPeriod),
  };
}

export function formatMealPeriodClockLead(mealPeriod, eatenAt, { omitClock = false } = {}) {
  const { mealUpper, meal, clock } = mealPeriodClockParts(mealPeriod, eatenAt, { omitClock });
  const label = mealUpper || meal;
  if (label && clock) return `${label} ${clock}`;
  return label || clock || "";
}

/**
 * Dish leads; secondary items fold under place line.
 * "Chicken and waffles" + "ham, iced tea"
 */
export function splitMealFoodLead(mealOrItems) {
  const items = Array.isArray(mealOrItems)
    ? mealOrItems
    : Array.isArray(mealOrItems?.items)
      ? mealOrItems.items
      : [];
  const names = items
    .map((item) => String(item?.food_name || item?.item_name || "").trim())
    .filter(Boolean);
  if (names.length === 0) {
    const fallback = String(
      mealOrItems?.food_name || mealOrItems?.item_name || ""
    ).trim();
    if (!fallback) return { primary: "", secondary: "" };
    const parts = fallback.split(/\s*[·,]\s*/).map((p) => p.trim()).filter(Boolean);
    return {
      primary: parts[0] || fallback,
      secondary: parts.slice(1).join(", "),
    };
  }
  return {
    primary: names[0],
    secondary: names.slice(1).join(", "),
  };
}

/** HH:MM for <input type="time"> from ISO / Date. */
export function isoToTimeInputValue(eatenAt) {
  if (eatenAt == null || eatenAt === "") return "";
  const d = eatenAt instanceof Date ? eatenAt : new Date(String(eatenAt));
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Merge HH:MM into an existing ISO (or today) → ISO string. */
export function timeInputToIso(hhmm, baseEatenAtOrDay) {
  const m = String(hhmm || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return null;
  let d =
    baseEatenAtOrDay instanceof Date
      ? new Date(baseEatenAtOrDay.getTime())
      : baseEatenAtOrDay
        ? new Date(String(baseEatenAtOrDay))
        : new Date();
  if (Number.isNaN(d.getTime())) {
    // YYYY-MM-DD day only
    const day = String(baseEatenAtOrDay || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) d = new Date(`${day}T12:00:00`);
    else d = new Date();
  }
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function ymdInMonth(ymd, viewMonth) {
  const day = planYmd(ymd);
  if (!day || !viewMonth) return false;
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
}

export function formatPlanBracketDate(ymd) {
  const day = planYmd(ymd);
  if (!day) return "";
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function futurePlanKey(plan) {
  return String(plan?.token || plan?.id || "");
}

export function futurePlanRestaurantName(plan) {
  const named = String(plan?.restaurant_name || "").trim();
  if (named) return named;
  const place = String(plan?.place_label || "").trim();
  if (!place) return "Restaurant";
  const parts = place.split(" · ").map((part) => part.trim()).filter(Boolean);
  const rest = parts.find((part) => !MEAL_LABELS.has(part.toLowerCase()));
  return rest || place;
}

export function formatFuturePlanRowLabel(plan) {
  const name = futurePlanRestaurantName(plan);
  const date = formatPlanBracketDate(plan?.plan_date);
  return date ? `${name} [${date}]` : name;
}

export function futurePlanDetailParts(plan) {
  const restaurant = futurePlanRestaurantName(plan);
  const place = String(plan?.place_label || "").trim();
  const parts = place.split(" · ").map((part) => part.trim()).filter(Boolean);
  const meal = parts.find((part) => MEAL_LABELS.has(part.toLowerCase())) || "";
  const notes = parts
    .filter((part) => part !== restaurant && !MEAL_LABELS.has(part.toLowerCase()))
    .join(" · ");
  return { restaurant, meal, notes };
}

/** Calendar day primary label (restaurant). Meal period is shown via event.timeLabel. */
export function formatCalendarPlanLabel(plan) {
  return futurePlanRestaurantName(plan);
}

export function planJoinHref(plan) {
  if (plan?.join_me_href) return plan.join_me_href;
  if (plan?.joinable && plan?.token) return `/account/what-we-doing/${plan.token}`;
  return null;
}
