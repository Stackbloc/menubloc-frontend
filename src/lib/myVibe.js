/**
 * My Vibe on Profile (app AvailabilityCard + api/profilePrefs.ts, plan 41, Andre 2026-11-12/13).
 * Being findable is the passive baseline ("Available" is a backend status, never shown). What a diner
 * sets: Hungry now, Up for <meal or coffee> (day + meal, mig 0430), Eating at home (an at-home plan,
 * Just me or who can ask, mig 0427), and Pause. Set with "Up for"; report with "Open for".
 */

export const MEAL_KEYS = ["breakfast", "lunch", "dinner", "late"];
export const MEAL_NAMES = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", late: "Late night" };
/** "Up for" takes coffee next to the four meals (Andre 2026-11-13, mig 0430); others see "Open for coffee". */
export const UP_FOR_KEYS = ["breakfast", "coffee", "lunch", "dinner", "late"];
export const UP_FOR_NAMES = { ...MEAL_NAMES, coffee: "Coffee" };

export const PAUSE_CHOICES = [
  { key: "3h", label: "3 hours" },
  { key: "today", label: "Today" },
  { key: "week", label: "1 week" },
  { key: "month", label: "1 month" },
  { key: "forever", label: "Until I turn it back on" },
];

const text = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** GET/PUT /api/consumer/profile/availability body → { available, pausedUntil, pausedForever, hungry, upFor }. */
export function parseAvailability(body) {
  const a = body?.availability ?? null;
  if (!a || typeof a.available !== "boolean") return null;
  return {
    available: a.available,
    pausedUntil: text(a.paused_until),
    pausedForever: a.paused_forever === true,
    hungry: a.hungry === true,
    upFor: (Array.isArray(a.up_for) ? a.up_for : []).flatMap((u) => {
      const date = text(u?.date);
      const w = UP_FOR_KEYS.find((m) => m === u?.window);
      return date && w ? [{ date, window: w }] : [];
    }),
  };
}

/** "2026-11-14" for a local Date. */
export function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today + the next 6 days as YYYY-MM-DD. */
export function nextDays(now, n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    return ymd(d);
  });
}

/** "Today" / "Tomorrow" / "Sat" for a YYYY-MM-DD, seen from `now`. */
export function dayLabel(date, now) {
  const today = new Date(now);
  if (date === ymd(today)) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date === ymd(tomorrow)) return "Tomorrow";
  const [y, m, d] = String(date).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

/** The active row: "Open for lunch · Today" (set with "Up for", report with "Open for"). */
export function upForLine(u, now) {
  return `Open for ${UP_FOR_NAMES[u.window].toLowerCase()} · ${dayLabel(u.date, now)}`;
}

/** "7:30 PM" for "19:30:00". */
export function timeLabel(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ""));
  if (!m) return "";
  const d = new Date(2000, 0, 1, Number(m[1]), Number(m[2]));
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "Paused until Fri 5:00 PM", "Paused until you turn it back on", or "Available". */
export function availabilityLine(a, now) {
  if (a.available) return "Available";
  if (a.pausedForever || !a.pausedUntil) return "Paused until you turn it back on";
  const end = new Date(new Date(a.pausedUntil).getTime() - 1000); // midnight reads as 11:59 PM
  const t = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const days = (end.getTime() - now) / 86400000;
  const sameDay = new Date(now).toDateString() === end.toDateString();
  const day = sameDay
    ? "today"
    : days < 6
      ? end.toLocaleDateString("en-US", { weekday: "short" })
      : end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Paused until ${day} ${t}`;
}

/** My at-home plans (I host) from GET /api/consumer/social-plans?scope=upcoming, first 3. */
export function atHomePlans(body) {
  const rows = Array.isArray(body?.plans) ? body.plans : [];
  return rows
    .filter((r) => r?.at_home === true && r?.my_status === "organizer" && text(r?.source) && r?.id != null)
    .slice(0, 3)
    .map((r) => ({
      key: text(r.key) || `${r.source}-${r.id}`,
      source: r.source,
      id: String(r.id),
      date: text(r.date),
      time: text(r.time),
      visibility: text(r.visibility),
      circleId: r.visibility === "circle" && Number.isFinite(Number(r.circle_id)) ? Number(r.circle_id) : null,
    }));
}

/** Who can ask to join an at-home plan: "Just me", "My Connects can ask", "<circle> can ask". */
export function homeWhoLine(plan, circles = []) {
  if (plan.visibility === "only_me") return "Just me";
  if (plan.circleId) return `${circles.find((c) => c.id === plan.circleId)?.name || "A circle"} can ask`;
  return "Connects can ask";
}

/** "Eating at home · Sat 7:00 PM · Connects can ask". */
export function homeLine(plan, now, circles = []) {
  const when = [plan.date ? dayLabel(plan.date, now) : "", plan.time ? timeLabel(plan.time) : ""].filter(Boolean).join(" ");
  return ["Eating at home", when, homeWhoLine(plan, circles)].filter(Boolean).join(" · ");
}

/** GET /api/consumer/circles → [{ id, name }]. */
export function circlesFrom(body) {
  return (Array.isArray(body?.circles) ? body.circles : [])
    .map((c) => ({ id: Number(c?.id) || 0, name: text(c?.name) || "Circle" }))
    .filter((c) => c.id);
}

/** POST /api/consumer/social-plans body for Eating at home (app createPlan, mig 0427). */
export function atHomePlanBody({ date, meal, who, circleId = null }) {
  return {
    kind: "meal",
    date,
    time: null,
    restaurant_id: null,
    place_name: null,
    title: null,
    who: who === "just_me" ? "just_me" : "ask",
    at_home: true,
    window: meal,
    ...(who !== "just_me" && circleId ? { circle_id: circleId } : {}),
  };
}
