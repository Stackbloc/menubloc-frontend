/**
 * Color tag for a Social Plan (Andre 2026-10-28, same rule as the app): meals by time of day
 * (Breakfast before 11, Lunch to 4, Dinner to 10, then Late night), Event, Venue event.
 */
export const PLAN_TAG_COLORS = {
  breakfast: { bg: "#fef3c7", fg: "#92400e" },
  lunch: { bg: "#dcfce7", fg: "#166534" },
  dinner: { bg: "#e0e7ff", fg: "#3730a3" },
  late: { bg: "#e2e8f0", fg: "#1e293b" },
  meal: { bg: "#f1f5f9", fg: "#475569" },
  event: { bg: "#f3e8ff", fg: "#6b21a8" },
  venue: { bg: "#ccfbf1", fg: "#115e59" },
};

export function planTag(p) {
  const kind = p?.kind || (p?.source === "my_event" ? "my_event" : p?.source === "venue_event" ? "venue_event" : "dine");
  if (kind === "my_event") return { label: "Event", tone: "event" };
  if (kind === "venue_event") return { label: "Venue event", tone: "venue" };
  const h = p?.time ? Number(String(p.time).slice(0, 2)) : NaN;
  if (!Number.isFinite(h)) return { label: "Meal", tone: "meal" };
  if (h < 11) return { label: "Breakfast", tone: "breakfast" };
  if (h < 16) return { label: "Lunch", tone: "lunch" };
  if (h < 22) return { label: "Dinner", tone: "dinner" };
  return { label: "Late night", tone: "late" };
}

/** Next 7 days (YYYY-MM-DD, label) and 11 AM – 10 PM every 30 minutes, like the invite form. */
export function dayChoices(now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getDate()}`;
    return { date, label };
  });
}

export function timeChoices() {
  const out = [];
  for (let m = 11 * 60; m <= 22 * 60; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push({ time: `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, label: `${h % 12 || 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}` });
  }
  return out;
}

/** YYYY-MM-DD for a local date. */
export function ymdOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Plans grouped by day (undated plans left out). */
export function plansByDay(plans) {
  const m = new Map();
  for (const p of plans || []) {
    if (!p?.date) continue;
    m.set(p.date, [...(m.get(p.date) || []), p]);
  }
  return m;
}
