/** Diner Intelligence Stage 3 display helpers (pure, unit tested). */

export const LIVE_RANGE_OPTIONS = [
  ["1d", "Today"],
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["90d", "90 days"],
];

export const PLATFORM_LABELS = { web: "Web", ios: "iPhone", android: "Android" };

export const DIRECTORY_SORT_OPTIONS = [
  ["last_seen", "Most recent"],
  ["duration", "Longest session"],
  ["connects", "Most Connects"],
  ["name", "Name"],
];

export const LIVE_REFRESH_MS = 30 * 1000;

/** 75 → "1m 15s", 3700 → "1h 1m", null → "—". */
export function formatDuration(secs) {
  if (secs == null || !Number.isFinite(Number(secs))) return "—";
  const s = Math.max(0, Math.round(Number(secs)));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}

/** "just now", "3 min ago", "2 hr ago", "4 days ago". */
export function timeAgo(iso, nowMs = Date.now()) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const secs = Math.max(0, Math.round((nowMs - t) / 1000));
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** 0 → "12 AM", 13 → "1 PM". */
export function hourLabel(h) {
  const n = Number(h) % 24;
  const suffix = n < 12 ? "AM" : "PM";
  const v = n % 12 === 0 ? 12 : n % 12;
  return `${v} ${suffix}`;
}

export function platformList(platforms) {
  const list = Array.isArray(platforms) ? platforms : [];
  return list.length ? list.map((p) => PLATFORM_LABELS[p] || p).join(" + ") : "—";
}

/** A number, or "—" when there's no data (never shows a missing value as 0). */
export function showNumber(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 });
}

/**
 * Compare this period with the one before. Returns {text, tone}: tone up | down | flat | none.
 * No earlier data → "No earlier data" (never a fake +100%).
 */
export function compareText(now, before, { hasBefore = true, format = showNumber } = {}) {
  if (!hasBefore || before == null) return { text: "No earlier data", tone: "none" };
  if (now == null) return { text: `Before: ${format(before)}`, tone: "none" };
  const diff = Number(now) - Number(before);
  if (Math.abs(diff) < 1e-9) return { text: `Same as before (${format(before)})`, tone: "flat" };
  const pct = Number(before) ? Math.round((diff / Number(before)) * 100) : null;
  const sign = diff > 0 ? "+" : "−";
  const pctText = pct == null ? "" : ` (${sign}${Math.abs(pct)}%)`;
  return { text: `${sign}${format(Math.abs(diff))}${pctText} vs before (${format(before)})`, tone: diff > 0 ? "up" : "down" };
}
