/**
 * Shared display helpers for Owner → Bots (directory + Nutribot / Language Bot pages).
 */

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const SCHEDULED_BOTS = {
  nutribot: {
    key: "nutribot",
    name: "Nutribot",
    path: "/owner/bots/nutribot",
    blurb: "Adds nutrition estimates to menu items that don't have them yet.",
  },
  language_bot: {
    key: "language_bot",
    name: "Language Bot",
    path: "/owner/bots/language-bot",
    blurb: "Translates new and changed restaurants, menus and deals into Spanish and Chinese.",
  },
  hours_bot: {
    key: "hours_bot",
    name: "Hours Bot",
    path: "/owner/bots/hours-bot",
    blurb: "Finds opening hours for restaurants that don't have them and shows them on their profile. Restaurants with menus go first.",
  },
};

export const HOURS_OUTCOME_LABELS = {
  saved: "Hours added",
  not_found: "Not found",
  kept_existing: "Already had hours",
  suspicious: "Found, but looked wrong",
  error: "Lookup failed — will retry",
};

export const HOURS_OUTCOME_STATUS = {
  saved: "success",
  not_found: "completed_no_writes",
  kept_existing: "completed_no_writes",
  suspicious: "stale",
  error: "error",
};

export const HOURS_SOURCE_LABELS = {
  openstreetmap: "OpenStreetMap",
  website: "Restaurant website",
  google_places: "Google",
};

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shortTime(value) {
  const [h, m] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(h)) return "";
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

/** "Mon–Thu 11am–9pm · Fri 11am–11pm · Sun closed" (consecutive equal days grouped). */
export function formatHoursSummary(rows) {
  if (!Array.isArray(rows) || !rows.length) return "";
  const sorted = [...rows].sort((a, b) => ((a.day_of_week + 6) % 7) - ((b.day_of_week + 6) % 7)); // Monday first
  const label = (r) => (r.is_closed ? "closed" : `${shortTime(r.opens_at)}–${shortTime(r.closes_at)}`);
  const groups = [];
  for (const r of sorted) {
    const last = groups[groups.length - 1];
    const text = label(r);
    if (last && last.text === text && ((last.end + 1) % 7) === r.day_of_week) {
      last.end = r.day_of_week;
    } else {
      groups.push({ start: r.day_of_week, end: r.day_of_week, text });
    }
  }
  return groups
    .map((g) => `${SHORT_DAYS[g.start]}${g.end !== g.start ? `–${SHORT_DAYS[g.end]}` : ""} ${g.text}`)
    .join(" · ");
}

export const STATUS_LABELS = {
  running: "Running",
  success: "Finished",
  completed_no_writes: "Finished — nothing to update",
  error: "Failed",
  stale: "Stopped (timed out)",
  dry_run: "Test run",
};

export const STATUS_TONES = {
  running: { bg: "#eef4ff", fg: "#1d4ed8" },
  success: { bg: "#ecfdf3", fg: "#047857" },
  completed_no_writes: { bg: "#f4f4f5", fg: "#52525b" },
  error: { bg: "#fef2f2", fg: "#b91c1c" },
  stale: { bg: "#fff7ed", fg: "#c2410c" },
  dry_run: { bg: "#f4f4f5", fg: "#52525b" },
};

export function formatTime12(hhmm) {
  const [h, m] = String(hhmm || "12:00").split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function scheduleSummary(schedule) {
  if (!schedule) return "";
  if (!schedule.enabled) return "Paused — runs only when you click Run now";
  const time = `${formatTime12(schedule.time_of_day)} Pacific`;
  if (schedule.frequency === "daily") return `Every day at ${time}`;
  return `Every ${DAY_NAMES[schedule.day_of_week] || "week"} at ${time}`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(start, end) {
  if (!start || !end) return "";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h} h ${mins % 60} min`;
}

export function triggerLabel(trigger) {
  if (trigger === "scheduled") return "Scheduled";
  if (trigger === "manual") return "Run now";
  if (trigger === "admin") return "Admin";
  return "—";
}

/** One-line result for a run row. */
export function runResultText(botKey, run) {
  if (!run) return "";
  const t = run.totals || {};
  if (botKey === "nutribot") {
    if (t.items == null) return "";
    const parts = [`${t.updated} of ${t.items} items updated`];
    if (t.no_template) parts.push(`${t.no_template} had no matching dish template`);
    if (t.failed) parts.push(`${t.failed} failed`);
    return parts.join(" · ");
  }
  if (botKey === "hours_bot") {
    if (run.scope_type === "restaurant") {
      if (t.found) return "Hours added";
      if (t.skipped) return "Already had hours";
      if (t.failed) return "Lookup failed";
      return "No hours found";
    }
    const parts = [`${t.checked || 0} checked`, `${t.found || 0} hours added`];
    if (t.not_found) parts.push(`${t.not_found} not found`);
    if (t.failed) parts.push(`${t.failed} failed`);
    return parts.join(" · ");
  }
  const parts = [`${t.translated || 0} translated`];
  if (t.failed) parts.push(`${t.failed} failed`);
  return parts.join(" · ");
}
