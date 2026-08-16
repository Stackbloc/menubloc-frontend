/**
 * Derive "What we doing Friday, June 12th?" from YYYY-MM-DD.
 */

function ordinal(n) {
  const v = Math.abs(Number(n)) % 100;
  const j = v % 10;
  if (v > 10 && v < 14) return `${n}th`;
  if (j === 1) return `${n}st`;
  if (j === 2) return `${n}nd`;
  if (j === 3) return `${n}rd`;
  return `${n}th`;
}

export function formatWhatWeDoingTitle(planDate) {
  const raw = String(planDate || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "What we doing?";
  const d = new Date(`${raw}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "What we doing?";
  const weekday = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const month = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const day = d.getUTCDate();
  return `What we doing ${weekday}, ${month} ${ordinal(day)}?`;
}

export function menuplyWhatWeDoingUrl(token) {
  const t = String(token || "").trim();
  if (!t) return "";
  return `https://menuply.com/account/what-we-doing/${encodeURIComponent(t)}`;
}
