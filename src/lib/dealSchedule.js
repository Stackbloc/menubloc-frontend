/**
 * Deal days of week + time of day (Andre 2026-11-04). Mirrors the backend's
 * src/lib/dealSchedule.js labels so forms preview exactly what diners see.
 *
 *   valid_days        0 = Sunday … 6 = Saturday. [] = every day.
 *   valid_start_time  "HH:MM" restaurant-local. Both null = all day; end before start = overnight.
 *   valid_end_time
 */

export const DEAL_WEEKDAYS = [
  { id: 1, short: "Mon", letter: "M" },
  { id: 2, short: "Tue", letter: "T" },
  { id: 3, short: "Wed", letter: "W" },
  { id: 4, short: "Thu", letter: "T" },
  { id: 5, short: "Fri", letter: "F" },
  { id: 6, short: "Sat", letter: "S" },
  { id: 0, short: "Sun", letter: "S" },
];

/** Quick picks for the hours row. */
export const DEAL_HOUR_PRESETS = [
  { id: "breakfast", label: "Breakfast", start: "06:00", end: "11:00" },
  { id: "lunch", label: "Lunch", start: "11:00", end: "14:00" },
  { id: "happy_hour", label: "Happy hour", start: "15:00", end: "18:00" },
  { id: "dinner", label: "Dinner", start: "17:00", end: "21:00" },
  { id: "late_night", label: "Late night", start: "21:00", end: "02:00" },
];

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_PLURAL = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

export function normalizeDealDays(raw) {
  if (!Array.isArray(raw)) return [];
  const set = new Set(raw.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6));
  return set.size === 7 ? [] : [...set].sort((a, b) => a - b);
}

/** "11:00:00" → "11:00"; anything else → "". */
export function normalizeDealTime(raw) {
  const m = String(raw || "").match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
}

function toMinutes(t) {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function formatDealTime12(t) {
  const mins = toMinutes(t);
  if (mins == null) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 12 && m === 0) return "Noon";
  if (h === 0 && m === 0) return "Midnight";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

export function formatDealDays(days) {
  const list = normalizeDealDays(days);
  if (!list.length) return null;
  if (list.length === 1) return DAY_PLURAL[list[0]];
  if (list.length === 2 && list[0] === 0 && list[1] === 6) return "Sat & Sun";
  const weekOrder = list.map((d) => (d === 0 ? 7 : d)).sort((a, b) => a - b);
  const consecutive = weekOrder.every((d, i) => i === 0 || d === weekOrder[i - 1] + 1);
  const name = (d) => DAY_SHORT[d % 7];
  if (consecutive && weekOrder.length >= 3) return `${name(weekOrder[0])}–${name(weekOrder[weekOrder.length - 1])}`;
  return weekOrder.map(name).join(", ");
}

export function formatDealHours(start, end) {
  const s = formatDealTime12(start);
  const e = formatDealTime12(end);
  if (!s || !e) return null;
  const sm = s.match(/^(.*) (AM|PM)$/);
  const em = e.match(/^(.*) (AM|PM)$/);
  return sm && em && sm[2] === em[2] ? `${sm[1]}–${e}` : `${s}–${e}`;
}

/** "Mon–Fri · 11 AM–2 PM" · "Tuesdays" · "3–6 PM daily" · null (any time). */
export function formatDealSchedule({ days, start, end } = {}) {
  const d = formatDealDays(days);
  const h = formatDealHours(start, end);
  if (d && h) return `${d} · ${h}`;
  if (d) return d;
  return h ? `${h} daily` : null;
}

/** Same, from a deal row (API field names); prefers the server's schedule_label. */
export function dealScheduleLabel(deal) {
  if (!deal) return null;
  if (deal.schedule_label) return deal.schedule_label;
  return formatDealSchedule({ days: deal.valid_days, start: deal.valid_start_time, end: deal.valid_end_time });
}

function shortDate(ymd) {
  const m = String(ymd || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
}

/**
 * The terms line built from the owner's choices, e.g.
 * "20% off Carbonara. Mon–Fri · 11 AM–2 PM, Nov 4 – Dec 4."
 * Used as the description when the owner leaves it empty, and offered as "Add terms" otherwise.
 */
export function buildDealTermsText({ dealType, value, itemNames = [], days, start, end, startDate, endDate } = {}) {
  let offer = null;
  if (dealType === "percent_off" && Number(value) > 0) offer = `${Number(value)}% off`;
  else if (dealType === "amount_off" && Number(value) > 0) offer = `${money(value)} off`;
  else if (dealType === "fixed_price" && Number(value) > 0) offer = `${money(value)}`;
  else if (dealType === "bogo") offer = "Buy one, get one";
  const names = itemNames.filter(Boolean);
  const what = names.length ? names.join(", ") : null;
  let first = null;
  if (offer && what) first = dealType === "fixed_price" ? `${what} for ${offer}` : `${offer} ${what}`;
  else first = offer || what;

  const when = [];
  const schedule = formatDealSchedule({ days, start, end });
  when.push(schedule || "Every day");
  const a = shortDate(startDate);
  const b = shortDate(endDate);
  if (a && b) when.push(a === b ? a : `${a} – ${b}`);
  const second = when.join(", ");
  return [first, second].filter(Boolean).map((s) => `${s}.`).join(" ");
}

const DAY_WORDS = /\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|days|s)?\b|weekday|weekend|daily|every day/i;
const TIME_WORDS = /\b\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)|\bnoon\b|\bmidnight\b|\blunch\b|\bbreakfast\b|\bdinner\b|\bhappy hour\b|\blate night\b/i;

/**
 * Does the owner's own copy say when the deal runs? Returns what's missing:
 * { days: bool, hours: bool } (true = the schedule sets it but the copy doesn't mention it).
 */
export function dealCopyMissingSchedule(description, { days, start, end } = {}) {
  const text = String(description || "");
  const hasDays = normalizeDealDays(days).length > 0;
  const hasHours = Boolean(normalizeDealTime(start) && normalizeDealTime(end));
  return {
    days: hasDays && !DAY_WORDS.test(text),
    hours: hasHours && !TIME_WORDS.test(text),
  };
}

/** Problem text for the form's own validation, or null. */
export function dealScheduleProblem({ start, end } = {}) {
  if (Boolean(start) !== Boolean(end)) return "Set both a start time and an end time, or pick All day.";
  if (start && end && start === end) return "The start and end time can't be the same.";
  return null;
}
