/**
 * Calendar-day helpers for journal / diary attribution.
 *
 * Rules:
 * - Pure `YYYY-MM-DD` → keep as written (diner local journal day).
 * - PG DATE serialized as midnight UTC (`…T00:00:00.000Z`) → keep the YMD
 *   from the string (UTC midnight is DATE semantics, not an instant).
 * - Real timestamps → device-local calendar day (never UTC slice of the ISO).
 */

export function localDateYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Normalize any API / form date value to `YYYY-MM-DD` for journal filtering.
 */
export function calendarDayYmd(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // Prefer UTC parts when the instant is exactly UTC midnight (DATE wire form).
    if (
      value.getUTCHours() === 0 &&
      value.getUTCMinutes() === 0 &&
      value.getUTCSeconds() === 0 &&
      value.getUTCMilliseconds() === 0
    ) {
      const y = value.getUTCFullYear();
      const m = String(value.getUTCMonth() + 1).padStart(2, "0");
      const d = String(value.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return localDateYmd(value);
  }

  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const m = raw.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/i);
  if (m) {
    const [, ymd, hh, mm, ss, , tz] = m;
    const isMidnight = hh === "00" && mm === "00" && String(ss) === "00";
    const tzNorm = String(tz || "").toUpperCase();
    const isUtcish =
      !tz ||
      tzNorm === "Z" ||
      tzNorm === "+00:00" ||
      tzNorm === "+0000" ||
      tzNorm === "-00:00" ||
      tzNorm === "-0000";
    // DATE columns and date-only forms land as midnight UTC / naive midnight.
    if (isMidnight && isUtcish) return ymd;

    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return localDateYmd(d);
    return ymd;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return localDateYmd(d);
  return "";
}

/** Alias used across hub / plans — timezone-safe for timestamps. */
export function planYmd(value) {
  return calendarDayYmd(value);
}
