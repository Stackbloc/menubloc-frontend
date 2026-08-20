/** Meal slots for the What I Ate Today food diary — not Waiter, not nutrition. */

export const WHAT_I_ATE_MEAL_PERIODS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "brunch", label: "Brunch" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late Night" },
];

const ORDER = WHAT_I_ATE_MEAL_PERIODS.map((p) => p.id);

/**
 * Local hour when an empty meal row becomes available on today's board.
 * Aligns with defaultWhatIAteMealPeriod windows (brunch is mid-afternoon).
 */
export const WHAT_I_ATE_MEAL_PERIOD_START_HOUR = {
  breakfast: 5,
  lunch: 11,
  brunch: 15,
  dinner: 17,
  late_night: 22,
};

export function normalizeWhatIAteMealPeriod(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  return ORDER.includes(key) ? key : null;
}

export function mealPeriodLabel(id) {
  return WHAT_I_ATE_MEAL_PERIODS.find((p) => p.id === id)?.label || "Other";
}

export function compareMealPeriod(a, b) {
  const ai = ORDER.indexOf(a);
  const bi = ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return 0;
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

/** Local device hour → default meal slot when posting. */
export function defaultWhatIAteMealPeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 17) return "brunch";
  if (hour >= 17 && hour < 22) return "dinner";
  return "late_night";
}

/**
 * Which meal rows to show on the day board.
 * - Today: periods whose window has started (earlier empty rows stay for backfill;
 *   future empty rows stay hidden). Any period with user entries always shows.
 * - Past hub day: full set (day is complete; backfill any meal).
 * - Future hub day: only periods that already have entries.
 */
export function visibleWhatIAteMealPeriods({
  now = new Date(),
  hubDateYmd = null,
  todayYmd = null,
  filledPeriodIds = [],
} = {}) {
  const filled = new Set(
    (filledPeriodIds || []).map(normalizeWhatIAteMealPeriod).filter(Boolean)
  );

  if (hubDateYmd && todayYmd) {
    if (hubDateYmd > todayYmd) {
      return WHAT_I_ATE_MEAL_PERIODS.filter((p) => filled.has(p.id));
    }
    if (hubDateYmd < todayYmd) {
      return WHAT_I_ATE_MEAL_PERIODS.slice();
    }
  }

  const hour = now.getHours();
  return WHAT_I_ATE_MEAL_PERIODS.filter((period) => {
    if (filled.has(period.id)) return true;
    if (period.id === "late_night") {
      return hour >= WHAT_I_ATE_MEAL_PERIOD_START_HOUR.late_night || hour < 5;
    }
    const start = WHAT_I_ATE_MEAL_PERIOD_START_HOUR[period.id];
    return typeof start === "number" && hour >= start;
  });
}

export function groupEntriesByMealPeriod(entries) {
  const buckets = Object.fromEntries(ORDER.map((id) => [id, []]));
  const other = [];
  for (const entry of entries || []) {
    const slot = normalizeWhatIAteMealPeriod(entry?.meal_period);
    if (slot) buckets[slot].push(entry);
    else other.push(entry);
  }
  return { buckets, other };
}

/** Latest diary row for a meal chip, or null when that slot is empty. */
export function pickEntryForMeal(entries, mealPeriod) {
  const slot = normalizeWhatIAteMealPeriod(mealPeriod);
  if (!slot) return null;
  const matches = (entries || []).filter(
    (entry) => normalizeWhatIAteMealPeriod(entry?.meal_period) === slot
  );
  return matches.length ? matches[matches.length - 1] : null;
}
