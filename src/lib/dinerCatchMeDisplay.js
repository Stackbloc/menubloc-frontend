/**
 * Catch Me display helpers. Destination + date range only — never Wanna Eat.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

function parseYmd(value) {
  const raw = String(value || "").trim().slice(0, 10);
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function monthLabel(month) {
  return MONTHS[month - 1] || "";
}

export function formatCatchMeRange(startDate, endDate) {
  const start = parseYmd(startDate);
  const end = parseYmd(endDate);
  if (!start || !end) return null;
  const startMonth = monthLabel(start.month);
  const endMonth = monthLabel(end.month);
  if (!startMonth || !endMonth) return null;
  if (start.month === end.month && start.year === end.year) {
    if (start.day === end.day) return `${startMonth} ${start.day}`;
    return `${startMonth} ${start.day}–${end.day}`;
  }
  return `${startMonth} ${start.day}–${endMonth} ${end.day}`;
}

export function catchMeEditSummary(catchMe) {
  if (!catchMe) return null;
  const dest =
    String(catchMe.destination || "").trim() ||
    [catchMe.city_name, catchMe.state_code].filter(Boolean).join(", ");
  const range = formatCatchMeRange(catchMe.start_date, catchMe.end_date);
  if (!dest || !range) return null;
  return `${dest} · ${range}`;
}

/** Profile line: "Catch Me in Atlanta, Sept 18–21" (city without state). */
export function catchMeProfileLine(catchMe) {
  if (!catchMe) return null;
  const city = String(catchMe.city_name || "").trim() || String(catchMe.destination || "").trim();
  const range = formatCatchMeRange(catchMe.start_date, catchMe.end_date);
  if (!city || !range) return null;
  return `Catch Me in ${city}, ${range}`;
}
