/**
 * Weekly hours editing helpers shared by the owner Profile Manager and the operator Hours page
 * (2026-10-20, Andre: set Mon–Fri hours at once; add an "Open 24 hrs" option).
 *
 * Rows: { day_of_week 0=Sun…6=Sat, opens_at "HH:MM", closes_at "HH:MM", is_closed, label }.
 * Open 24 hours is stored as 00:00–00:00 with label "Open 24 hours": the backend already treats
 * opens = closes as all day (ordering, search) and the public profile prints the label.
 */

export const OPEN_24_LABEL = "Open 24 hours";

/** Mon-first order for pickers; values are day_of_week. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DAY_PRESETS = [
  { key: "weekdays", label: "Mon–Fri", days: [1, 2, 3, 4, 5] },
  { key: "weekend", label: "Sat–Sun", days: [6, 0] },
  { key: "every", label: "Every day", days: [1, 2, 3, 4, 5, 6, 0] },
];

const hhmm = (v) => String(v || "").slice(0, 5);
const is24Label = (label) => /\b24\s*(?:hr|hrs|hour|hours)\b/i.test(String(label || ""));

export function isOpen24(row) {
  if (!row || row.is_closed) return false;
  if (is24Label(row.label)) return true;
  const open = hhmm(row.opens_at);
  return Boolean(open) && open === hhmm(row.closes_at);
}

/** Turn one day's 24-hour flag on or off (off restores default times). */
export function setOpen24(row, on, { opens = "09:00", closes = "21:00" } = {}) {
  if (on) return { ...row, is_closed: false, opens_at: "00:00", closes_at: "00:00", label: OPEN_24_LABEL };
  return {
    ...row,
    opens_at: opens,
    closes_at: closes,
    label: is24Label(row.label) ? null : row.label ?? null,
  };
}

/**
 * Apply one setting to several days.
 * @param {object[]} schedule
 * @param {number[]} days day_of_week values
 * @param {{ mode: "hours"|"open24"|"closed", opens_at?: string, closes_at?: string }} setting
 */
export function applyHoursToDays(schedule, days, setting) {
  const pick = new Set((days || []).map(Number));
  return schedule.map((row) => {
    if (!pick.has(Number(row.day_of_week))) return row;
    if (setting.mode === "closed") {
      return { ...row, is_closed: true, label: is24Label(row.label) ? null : row.label ?? null };
    }
    if (setting.mode === "open24") return setOpen24(row, true);
    return {
      ...row,
      is_closed: false,
      opens_at: setting.opens_at,
      closes_at: setting.closes_at,
      label: is24Label(row.label) ? null : row.label ?? null,
    };
  });
}
