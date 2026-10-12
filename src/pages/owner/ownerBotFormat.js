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
};

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
  const parts = [`${t.translated || 0} translated`];
  if (t.failed) parts.push(`${t.failed} failed`);
  return parts.join(" · ");
}
