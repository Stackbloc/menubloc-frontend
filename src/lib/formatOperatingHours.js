/**
 * Concise public-profile hours formatting (no React).
 * Today line + consecutive day-range grouping.
 */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function asStr(v) {
  return v == null ? "" : String(v);
}

function formatTimeLabel(raw) {
  const s = asStr(raw).trim();
  if (!s) return "";
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}

function scheduleTextForRow(row) {
  if (!row) return "—";
  if (row.is_closed) return "Closed";
  if (row.label) return String(row.label);
  const open = formatTimeLabel(row.opens_at);
  const close = formatTimeLabel(row.closes_at);
  if (open && close) return `${open} – ${close}`;
  return open || close || "—";
}

function scheduleKeyForRow(row) {
  if (!row) return "missing";
  if (row.is_closed) return "closed";
  if (row.label) return `label:${String(row.label)}`;
  return `hours:${asStr(row.opens_at).trim()}|${asStr(row.closes_at).trim()}`;
}

/** Day-of-week 0=Sun … 6=Sat in restaurant timezone when provided. */
export function getTodayDayOfWeek(timezone = null, now = new Date()) {
  const tz = asStr(timezone).trim();
  if (tz) {
    try {
      const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "short",
      }).format(now);
      const idx = DAY_LABELS.indexOf(weekday);
      if (idx >= 0) return idx;
    } catch {
      /* fall through to local */
    }
  }
  return now.getDay();
}

/**
 * Food-truck hours hero heading: "Today, Friday, June 1, 2026"
 * Uses restaurant timezone when provided.
 */
export function formatFoodTruckHoursTodayHeading(timezone = null, now = new Date()) {
  const tz = asStr(timezone).trim();
  const opts = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(tz ? { timeZone: tz } : {}),
  };
  try {
    const parts = new Intl.DateTimeFormat("en-US", opts).formatToParts(now);
    const weekday = parts.find((p) => p.type === "weekday")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";
    const day = parts.find((p) => p.type === "day")?.value || "";
    const year = parts.find((p) => p.type === "year")?.value || "";
    if (weekday && month && day && year) {
      return `Today, ${weekday}, ${month} ${day}, ${year}`;
    }
  } catch {
    /* fall through */
  }
  try {
    const fallback = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(now);
    // "Friday, June 1, 2026" → "Today, Friday, June 1, 2026"
    return `Today, ${fallback}`;
  } catch {
    return "Today";
  }
}

function dayRangeLabel(startDow, endDow) {
  const start = DAY_LABELS[startDow] || `Day ${startDow}`;
  if (startDow === endDow) return start;
  const end = DAY_LABELS[endDow] || `Day ${endDow}`;
  return `${start} – ${end}`;
}

/**
 * Concise hours for public profiles:
 *   Today: 10:30 AM – 1:00 AM
 *   Sun – Thu  10:30 AM – 1:00 AM
 *   Fri – Sat  10:30 AM – 1:30 AM
 *
 * @param {object[]} rows
 * @param {{ timezone?: string|null, now?: Date, includeTodayLine?: boolean }} [opts]
 *   includeTodayLine — default true. Food-truck hero sets false and labels the
 *   Hours header with "Today" instead (avoids a duplicate Today row).
 */
export function formatHoursRows(
  rows,
  { timezone = null, now = new Date(), includeTodayLine = true } = {}
) {
  if (!Array.isArray(rows) || !rows.length) return [];

  const byDow = new Map();
  for (const row of rows) {
    const dow = Number(row?.day_of_week);
    if (!Number.isInteger(dow) || dow < 0 || dow > 6) continue;
    byDow.set(dow, row);
  }
  if (!byDow.size) return [];

  const todayDow = getTodayDayOfWeek(timezone, now);
  const todayRow = byDow.get(todayDow);
  const out = [];
  if (includeTodayLine !== false) {
    out.push({ day: "Today", text: scheduleTextForRow(todayRow) });
  }

  const ordered = [...byDow.entries()].sort((a, b) => a[0] - b[0]);
  let rangeStart = ordered[0][0];
  let rangeEnd = ordered[0][0];
  let rangeKey = scheduleKeyForRow(ordered[0][1]);
  let rangeText = scheduleTextForRow(ordered[0][1]);

  const flush = () => {
    out.push({ day: dayRangeLabel(rangeStart, rangeEnd), text: rangeText });
  };

  for (let i = 1; i < ordered.length; i += 1) {
    const [dow, row] = ordered[i];
    const key = scheduleKeyForRow(row);
    if (key === rangeKey && dow === rangeEnd + 1) {
      rangeEnd = dow;
      continue;
    }
    flush();
    rangeStart = dow;
    rangeEnd = dow;
    rangeKey = key;
    rangeText = scheduleTextForRow(row);
  }
  flush();

  return out;
}
