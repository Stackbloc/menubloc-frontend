function localDateYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Past diary browsing window on My Menuply Eating hub. Future plans are not capped. */
export const EATING_HISTORY_DAYS = 90;

export function planYmd(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return "";
}

/** Calendar day for a venue event RSVP (`event_date` or `starts_at`). */
export function venueEventYmd(ev) {
  return planYmd(ev?.event_date) || planYmd(ev?.starts_at);
}

export function compareYmd(ymd, today = localDateYmd()) {
  const day = planYmd(ymd);
  if (!day) return 0;
  if (day > today) return 1;
  if (day < today) return -1;
  return 0;
}

export function shiftYmd(ymd, deltaDays, today = localDateYmd()) {
  const base = planYmd(ymd) || today;
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
  const day = planYmd(ymd) || today;
  const start = eatingHistoryStart(today);
  if (day < start) return start;
  if (day > today) return today;
  return day;
}

export function isLookbackYmd(ymd, today = localDateYmd()) {
  const day = planYmd(ymd);
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
    bump(planYmd(row.eaten_on || row.created_at), "past_count");
  }
  for (const row of planRows) {
    bump(planYmd(row.plan_date), "future_count");
  }
  return [...map.values()];
}

export function buildEatingDayMarkersFromCalendar(calendarDays = [], planRows = [], venueEvents = []) {
  const map = new Map();
  for (const day of calendarDays) {
    const ymd = planYmd(day.eaten_on || day.ymd);
    if (!ymd) continue;
    const row = map.get(ymd) || { ymd, past_count: 0, future_count: 0 };
    const count = Number(day.entry_count || day.past_count);
    row.past_count += Number.isFinite(count) && count > 0 ? count : 1;
    map.set(ymd, row);
  }
  for (const plan of planRows) {
    const ymd = planYmd(plan.plan_date);
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
    description: "Photo or video, restaurant or homemade, meal time, then post.",
  },
  {
    id: "want",
    label: "Want to Eat",
    placeholder: "What do you want?",
    description: "Cuisine, restaurant, menu item, or a general food craving.",
  },
  {
    id: "plan",
    label: "Eating Plan",
    placeholder: "Where are you going?",
    description: "Schedule a future meal — Join Me stays on the plan form.",
  },
];

/** What I Want to Eat intent levels (not forced to restaurant). */
export const WANT_INTENT_KINDS = [
  { id: "cuisine", label: "Cuisine", placeholder: "e.g. Korean" },
  { id: "restaurant", label: "Restaurant", placeholder: "Search restaurant" },
  { id: "menu_item", label: "Menu item", placeholder: "Restaurant → dish" },
  { id: "food_item", label: "Food item", placeholder: "e.g. Sushi" },
];
