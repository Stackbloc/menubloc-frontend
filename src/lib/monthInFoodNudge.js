const NUDGE_DAYS = 7;

/** Last month, while this month is in its first week (Los Angeles); else null. */
export function nudgeMonth(now = new Date()) {
  const la = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type) => Number(la.find((p) => p.type === type)?.value);
  if (part("day") > NUDGE_DAYS) return null;
  const last = new Date(Date.UTC(part("year"), part("month") - 2, 1));
  return {
    ym: `${last.getUTCFullYear()}-${String(last.getUTCMonth() + 1).padStart(2, "0")}`,
    name: last.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }),
  };
}
