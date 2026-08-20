import {
  mealPeriodLabel,
  normalizeWhatIAteMealPeriod,
  WHAT_I_ATE_MEAL_PERIODS,
} from "../../../lib/whatIAteTodayMealPeriod.js";

const MEAL_LABELS = new Set(WHAT_I_ATE_MEAL_PERIODS.map((p) => p.label.toLowerCase()));

export function planYmd(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return "";
}

export function compareYmd(ymd, today) {
  const day = planYmd(ymd);
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
