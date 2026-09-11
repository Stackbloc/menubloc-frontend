import {
  calendarDayYmd,
  localDateYmd,
  planYmd,
} from "../../../lib/calendarDayYmd.js";

export { calendarDayYmd, localDateYmd, planYmd };

/** Past diary browsing window on My Menuply Eating hub. Future plans are not capped. */
export const EATING_HISTORY_DAYS = 90;

/** Calendar day for a venue event RSVP (`event_date` or `starts_at`). */
export function venueEventYmd(ev) {
  return calendarDayYmd(ev?.event_date) || calendarDayYmd(ev?.starts_at);
}

export function compareYmd(ymd, today = localDateYmd()) {
  const day = calendarDayYmd(ymd);
  if (!day) return 0;
  if (day > today) return 1;
  if (day < today) return -1;
  return 0;
}

export function shiftYmd(ymd, deltaDays, today = localDateYmd()) {
  const base = calendarDayYmd(ymd) || today;
  const d = new Date(`${base}T12:00:00`);
  if (Number.isNaN(d.getTime())) return today;
  d.setDate(d.getDate() + (Number(deltaDays) || 0));
  return localDateYmd(d);
}

export function eatingHistoryStart(today = localDateYmd()) {
  return shiftYmd(today, -EATING_HISTORY_DAYS, today);
}

/** Diary look-back only. Do not use this to cap future plan dates. */
export function clampEatingLookbackDate(ymd, today = localDateYmd()) {
  const day = calendarDayYmd(ymd) || today;
  const start = eatingHistoryStart(today);
  if (day < start) return start;
  if (day > today) return today;
  return day;
}

export function isLookbackYmd(ymd, today = localDateYmd()) {
  const day = calendarDayYmd(ymd);
  if (!day) return false;
  return day >= eatingHistoryStart(today) && day <= today;
}

/** Merge diary days (past/ate) and plan days (future) for one calendar. */
export function buildEatingDayMarkers({ eatingRows = [], planRows = [] } = {}) {
  const map = new Map();
  function bump(ymd, field) {
    if (!ymd) return;
    const row = map.get(ymd) || { ymd, past_count: 0, future_count: 0 };
    row[field] += 1;
    map.set(ymd, row);
  }
  for (const row of eatingRows) {
    // Prefer explicit journal day; timestamps use local calendar day.
    bump(calendarDayYmd(row.eaten_on) || calendarDayYmd(row.created_at), "past_count");
  }
  for (const row of planRows) {
    bump(calendarDayYmd(row.plan_date), "future_count");
  }
  return [...map.values()];
}

export function buildEatingDayMarkersFromCalendar(calendarDays = [], planRows = [], venueEvents = []) {
  const map = new Map();
  for (const day of calendarDays) {
    const ymd = calendarDayYmd(day.eaten_on || day.ymd);
    if (!ymd) continue;
    const row = map.get(ymd) || { ymd, past_count: 0, future_count: 0 };
    const count = Number(day.entry_count || day.past_count);
    row.past_count += Number.isFinite(count) && count > 0 ? count : 1;
    map.set(ymd, row);
  }
  for (const plan of planRows) {
    const ymd = calendarDayYmd(plan.plan_date);
    if (!ymd) continue;
    const row = map.get(ymd) || { ymd, past_count: 0, future_count: 0 };
    row.future_count += 1;
    map.set(ymd, row);
  }
  for (const ev of venueEvents) {
    const ymd = venueEventYmd(ev);
    if (!ymd) continue;
    const row = map.get(ymd) || { ymd, past_count: 0, future_count: 0 };

    row.future_count += 1;
    map.set(ymd, row);
  }
  return [...map.values()];
}

export const EATING_FILTERS = [
  { id: "all", label: "All" },
  { id: "ate", label: "Ate" },
  { id: "want", label: "Want" },
  { id: "plans", label: "Plans" },
];

export const EATING_COMPOSE_CATEGORIES = [
  {
    id: "ate",
    label: "What I'm Eating",
    placeholder: "Anything to say? (optional)",
    description:
      "Current eating signal — cuisine, food type, restaurant, or dish. Video is core for Feed discovery.",
  },
  {
    id: "want",
    label: "What I Wanna Eat",
    placeholder: "What do you want?",
    description: "Cuisine, restaurant, menu item, or a general food craving.",
  },
  {
    id: "plan",
    label: "My Eating Plans",
    placeholder: "Where are you going?",
    description: "Photo or video, then schedule — Join Me stays on the plan form.",
  },
  {
    id: "reviews",
    label: "Reviews",
    placeholder: "Anything to say about this dish? (optional)",
    description: "Record a video review of a specific menu item.",
  },
  {
    id: "cooking",
    label: "What's Cooking @home",
    placeholder: "What are you cooking? (optional)",
    description: "Video of a home-cooked meal — posts to Feed; photos on profile @home use + Add.",
  },
];

/** What I Want to Eat intent levels — order is product Selection Structure. */
export const WANT_INTENT_KINDS = [
  { id: "cuisine", label: "Cuisine", placeholder: "Select a cuisine", icon: "🌍" },
  { id: "food_item", label: "Food Type", placeholder: "e.g. Burgers", icon: "🍔" },
  { id: "restaurant", label: "Restaurant", placeholder: "Search restaurant", icon: "🏪" },
  { id: "menu_item", label: "Menu item", placeholder: "Restaurant → dish", icon: "🍽️" },
];

/** What I'm Eating signal levels — same taxonomy as Wanna Eat (behavior ≠ desire). */
export const ATE_SIGNAL_KINDS = WANT_INTENT_KINDS;

/** Happy Hour intents — restaurant/venue + state only (no clock / schedule). */
export const HAPPY_HOUR_INTENTS = [
  { id: "enjoying", label: "I'm enjoying Happy Hour", foodName: "I'm enjoying Happy Hour" },
  { id: "going", label: "I'm going to Happy Hour today", foodName: "I'm going to Happy Hour today" },
];

export function happyHourFoodName(intentId) {
  const row = HAPPY_HOUR_INTENTS.find((p) => p.id === intentId);
  return row?.foodName || "";
}
