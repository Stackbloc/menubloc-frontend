/**
 * Today on menuply.com — the same screen as the app's Today tab (menuply-mobile src/api/today.ts;
 * web follows the app, Andre 2026-11-13). Parsing and the small helpers are a straight port so both
 * read the server the same way:
 *   GET  /api/consumer/today?window=&style=|food=&lat=&lng=&tz=&date=
 *   POST /api/consumer/today/yes | /skip | /events
 */
import {
  getTodayHome,
  postTodayEvent,
  postTodaySkip,
  postTodayYes,
} from "./consumerApi.js";
import { API_BASE } from "./api.js";
import { getAnalyticsSessionId, getAnalyticsVisitorId, isAnalyticsStaffSession } from "./analyticsSessionId.js";

const text = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const strings = (v) => (Array.isArray(v) ? v.map(text).filter((x) => x != null) : []);

// ── Meal windows (Today only) ────────────────────────────────────────────────
// Same colors as the app's meal tokens (theme/tokens.ts).
export const DAY_START = 4 * 60;
export const MEAL_WINDOWS = [
  { key: "breakfast", label: "Breakfast", hours: "7–10 AM", start: 7 * 60, end: 10 * 60, color: "#9a4a07", soft: "#fdf1e1" },
  { key: "lunch", label: "Lunch", hours: "11 AM–2 PM", start: 11 * 60, end: 14 * 60, color: "#0f7a24", soft: "#e8f5e3" },
  { key: "dinner", label: "Dinner", hours: "5–9 PM", start: 17 * 60, end: 21 * 60, color: "#1d4fbf", soft: "#e7eefc" },
  { key: "late", label: "Late", hours: "9 PM–4 AM", start: 21 * 60, end: 24 * 60 + DAY_START, color: "#6b2bc9", soft: "#f1eafd" },
];
/** Quick Invite codes per meal (app QuickInviteCard MEAL_INVITE). */
export const MEAL_INVITE = { breakfast: "LDB", lunch: "LDL", dinner: "LDD", late: "LLN" };

/** 12:00–3:59 AM: last night's Late night is still going (blended with the new day). */
export function lateCarry(now) {
  return now.getHours() * 60 + now.getMinutes() < DAY_START;
}

export function windowMinutes(now, w) {
  const m = now.getHours() * 60 + now.getMinutes();
  return w?.key === "late" && m < DAY_START ? m + 1440 : m;
}

/** The meal tabs, in clock order from now: 12–4 AM opens with last night's Late night. */
export function mealTabs(now, isToday = true) {
  if (!isToday || !lateCarry(now)) return MEAL_WINDOWS;
  const late = MEAL_WINDOWS.find((w) => w.key === "late");
  return [{ ...late, hours: "until 4 AM" }, ...MEAL_WINDOWS.filter((w) => w.key !== "late")];
}

/** The window we're in, else the next one today, else tomorrow's breakfast. */
export function currentWindowKey(now) {
  const inside = MEAL_WINDOWS.find((w) => {
    const m = windowMinutes(now, w);
    return m >= w.start && m < w.end;
  });
  if (inside) return inside.key;
  const m = windowMinutes(now);
  return MEAL_WINDOWS.find((w) => m < w.start)?.key ?? "breakfast";
}

export function windowState(w, now) {
  const m = windowMinutes(now, w);
  if (m >= w.end) return "done";
  if (m >= w.start) return "now";
  return "later";
}

/** "12:40" → "12:40 PM". */
export function timeLabel(hhmm) {
  const m = typeof hhmm === "string" ? hhmm.match(/^(\d{2}):(\d{2})/) : null;
  if (!m) return null;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

/** "Maya", "Maya & Jordan", "Maya, Jordan & Alex". */
export function namesText(names) {
  if (!names?.length) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekday = (ymd) => WEEKDAYS[new Date(`${ymd}T12:00:00Z`).getUTCDay()] ?? "";
export const dayShort = (ymd, index) => (index === 0 ? "Today" : weekday(ymd).slice(0, 3));
export function dayLong(ymd, index) {
  if (index === 0) return "Today";
  return index === 1 ? "Tomorrow" : weekday(ymd);
}
export const dayNumber = (ymd) => String(Number(ymd.slice(8, 10)));
export function dayDate(ymd) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [, m, d] = ymd.split("-").map(Number);
  return `${months[(m ?? 1) - 1]} ${d}`;
}

/** Reason tag look: fave green, Wishlist blue, Fave + wish purple, new orange, others neutral. */
export function reasonTone(tag) {
  switch (tag) {
    case "fave":
    case "shared_fave":
      return MEAL_WINDOWS[1].color;
    case "wish":
      return MEAL_WINDOWS[2].color;
    case "fave_wish":
      return MEAL_WINDOWS[3].color;
    case "new":
    case "newly_added":
    case "for_you":
      return MEAL_WINDOWS[0].color;
    default:
      return "#5c665f";
  }
}

// ── Parsing (app parseToday) ─────────────────────────────────────────────────
// newly_added / for_you / sponsored (app 9d3a32d + 04ac9be, Andre 2026-11-13).
const TAGS = new Set(["fave_wish", "fave", "wish", "go_to", "nearby", "new", "newly_added", "for_you", "sponsored", "shared_fave", "group_go_to", "group_plan"]);
const KEYS = new Set(["breakfast", "lunch", "dinner", "late"]);
const ACTIONS = new Set(["join", "ask", "asked"]);

function parseFriendPlan(r) {
  const ref = text(r?.ref);
  const action = text(r?.action);
  if (!r || !ref || !ACTIONS.has(action)) return null;
  return { source: text(r.source) ?? "eating_plan", ref, time: text(r.time), people: strings(r.people), peopleCount: num(r.people_count) ?? 0, action };
}

function parseDish(r) {
  const id = num(r?.id);
  const name = text(r?.name);
  if (!r || !id || !name) return null;
  return { id, name, photoUrl: text(r.photo_url), price: num(r.price), saved: r.saved === "wish" || r.saved === "love" ? r.saved : null };
}

function parsePick(r) {
  const rest = r?.restaurant ?? null;
  const reason = r?.reason ?? null;
  const id = num(rest?.id);
  const tag = text(reason?.tag);
  if (!id || !tag || !TAGS.has(tag)) return null;
  return {
    rank: num(r.rank) ?? 0,
    kind: r.kind === "dish" || r.kind === "discovery" ? r.kind : "place",
    dish: parseDish(r.dish),
    hoursKnown: r.hours_known !== false,
    style: text(r.style),
    foodTruck: r.food_truck === true,
    restaurant: { id, name: text(rest?.name) ?? "Restaurant", slug: text(rest?.slug), cuisine: text(rest?.cuisine), logoUrl: text(rest?.logo_url) },
    miles: num(r.miles),
    reason: { tag, label: text(reason?.label) ?? "", line: text(reason?.line) ?? "" },
    plan: parseFriendPlan(r.plan),
    // Sponsored idea (#4 / #7): its views and taps are counted for the advertiser.
    sponsorshipId: tag === "sponsored" ? num(r.sponsorship_id) : null,
  };
}

export function parsePlan(r) {
  const ref = text(r?.ref);
  if (!r || !ref) return null;
  return {
    source: "eating_plan",
    ref,
    title: text(r.title) ?? "Meal",
    placeName: text(r.place_name),
    restaurantId: num(r.restaurant_id),
    date: text(r.date),
    time: text(r.time),
    going: strings(r.going),
    asked: strings(r.asked),
    lat: num(r.lat),
    lng: num(r.lng),
    walkMinutes: num(r.walk_minutes),
  };
}

function parsePerson(p, vibe) {
  const userId = num(p?.user_id);
  if (!userId) return null;
  const bl = p.both_like ?? null;
  const blId = bl ? num(bl.restaurant_id) : null;
  const blName = bl ? text(bl.name) : null;
  return {
    userId,
    name: text(p.name) ?? "A Connect",
    avatarUrl: text(p.avatar_url),
    vibe: vibe ?? (p.vibe === "hungry" ? "hungry" : "open"),
    label: text(p.label) ?? (vibe === "up_for" ? "Up for it" : "Open"),
    both: p.both === true,
    bothLike: blId && blName ? { restaurantId: blId, name: blName } : null,
    // Up for coffee rows (mig 0430): Invite asks for coffee, not the tab's meal.
    window: text(p.window),
  };
}

export function parseOpen(r) {
  if (!r || typeof r !== "object") return null;
  const plans = (Array.isArray(r.plans) ? r.plans : [])
    .map((p) => {
      const ref = text(p?.ref);
      const action = text(p?.action);
      // Eating at home (mig 0427): Ask to join only; the place is never shown.
      const atHome = p?.at_home === true;
      const placeName = atHome ? "Home" : text(p?.place_name);
      if (!ref || !placeName || !ACTIONS.has(action)) return null;
      return { source: text(p.source) ?? "eating_plan", ref, people: strings(p.people), peopleCount: num(p.people_count) ?? 0, avatarUrl: text(p.avatar_url), placeName, atHome, time: text(p.time), action: atHome && action === "join" ? "ask" : action };
    })
    .filter(Boolean);
  return {
    plans,
    people: (Array.isArray(r.people) ? r.people : []).map((p) => parsePerson(p, null)).filter(Boolean),
    upFor: (Array.isArray(r.up_for) ? r.up_for : []).map((p) => parsePerson(p, "up_for")).filter(Boolean),
  };
}

/** Hungry now rows the Your Connects box shows; the rest go to the Connects chip. */
export const BOX_HUNGRY = 3;

/**
 * Today Connects (Andre 2026-11-14, same as the app's splitConnects): the box shows Hungry now (up
 * to 3); the Connects chip lists plans, Up for, other open signals, extra Hungry, then Eating at
 * home. `count` = things still to do in the chip (plans I asked to join don't count).
 */
export function splitConnects(open, asked = new Set()) {
  const all = open?.people ?? [];
  const hungryAll = all.filter((p) => p.vibe === "hungry");
  const hungry = hungryAll.slice(0, BOX_HUNGRY);
  const people = [...all.filter((p) => p.vibe !== "hungry"), ...hungryAll.slice(BOX_HUNGRY)];
  const upFor = open?.upFor ?? [];
  const plans = (open?.plans ?? []).filter((p) => !p.atHome);
  const home = (open?.plans ?? []).filter((p) => p.atHome);
  const todo = (p) => p.action !== "asked" && !asked.has(p.ref);
  const count = plans.filter(todo).length + home.filter(todo).length + people.length + upFor.length;
  return { hungry, plans, people, upFor, home, count, any: plans.length + home.length + people.length + upFor.length > 0 };
}

export function parseToday(b) {
  const body = b ?? {};
  const key = text(body.window?.key);
  if (!key || !KEYS.has(key)) throw new Error("today: missing window");
  const chips = (list) =>
    (Array.isArray(list) ? list : [])
      .map((c) => ({ key: text(c?.key) ?? "", label: text(c?.label) ?? "", count: num(c?.count) ?? 0, kind: c?.kind === "style" ? "style" : "food" }))
      .filter((c) => c.key && c.label);
  const picks = (list) => (Array.isArray(list) ? list.map(parsePick).filter(Boolean) : []);
  const days = (Array.isArray(body.days) ? body.days : [])
    .map((d) => {
      const date = text(d?.date);
      return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { date, hasPlans: d.has_plans === true } : null;
    })
    .filter(Boolean);
  const social = body.social && typeof body.social === "object" ? { open: parseOpen(body.social.open) } : null;
  return {
    window: key,
    date: text(body.date),
    days,
    planTime: text(body.plan_time?.time),
    planDate: text(body.plan_time?.date),
    hasSaves: body.has_saves === true,
    hasLocation: body.has_location === true,
    cravings: chips(body.cravings),
    picks: picks(body.picks),
    more: picks(body.more),
    myPlan: parsePlan(body.my_plan),
    social,
  };
}

function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function todayQuery(windowKey, where, chip, day = null) {
  const q = new URLSearchParams({ window: windowKey });
  if (day) q.set("date", day);
  if (chip) q.set(chip.kind === "style" ? "style" : "food", chip.key);
  if (where && Number.isFinite(where.lat) && Number.isFinite(where.lng)) {
    q.set("lat", String(where.lat));
    q.set("lng", String(where.lng));
  }
  const tz = timeZone();
  if (tz) q.set("tz", tz);
  return q.toString();
}

export async function fetchToday(windowKey, where, chip, day = null) {
  return parseToday(await getTodayHome(todayQuery(windowKey, where, chip, day)));
}

/** One row per Today tap (plan 36) — fire-and-forget, never blocks the tap. */
export function logTodayEvent(action, windowKey, day, { pick = null, targetUserId = null } = {}) {
  postTodayEvent({
    action,
    window: windowKey,
    tz: timeZone(),
    ...(day ? { date: day } : {}),
    ...(pick ? { restaurant_id: pick.restaurant.id, menu_item_id: pick.dish?.id ?? null, rank: pick.rank, reason_tag: pick.reason.tag, kind: pick.kind } : {}),
    ...(targetUserId ? { target_user_id: targetUserId } : {}),
  }).catch(() => undefined);
}

/** Skip = "not today": this place sorts to the bottom of this meal for 3 days. */
export const notToday = (pick, windowKey, day = null) =>
  postTodaySkip({ restaurant_id: pick.restaurant.id, menu_item_id: pick.dish?.id ?? null, window: windowKey, tz: timeZone(), ...(day ? { date: day } : {}) });

/** Going here (or Go here instead): adds the meal to My Social Calendar. */
export async function sayYes(pick, windowKey, swapped, day = null) {
  const b = await postTodayYes({ restaurant_id: pick.restaurant.id, window: windowKey, rank: pick.rank, swapped, tz: timeZone(), ...(day ? { date: day } : {}) });
  const plan = parsePlan(b?.plan);
  if (!plan) throw new Error("today: missing plan");
  return plan;
}

/** "Couldn't …" text for a failed call, never a raw status code. */
export function todayErrorMessage(err) {
  if (err?.status === 401) return "Sign in again to see Today.";
  return String(err?.payload?.message || err?.message || "Something went wrong. Try again.");
}

/**
 * Sponsored Today idea: one view or tap (POST /public/sponsorships/:id/event, placement "today"),
 * the same event the app sends. Staff browsing is not counted. Never throws.
 */
export function trackTodaySponsorship(sponsorshipId, type, viewId, clickTarget) {
  if (!sponsorshipId || typeof window === "undefined" || isAnalyticsStaffSession()) return;
  const mobile = /Mobi|Android|iPhone/i.test(navigator.userAgent || "");
  fetch(`${API_BASE}/public/sponsorships/${sponsorshipId}/event`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event_id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined,
      type,
      placement: "today",
      view_id: viewId,
      ...(type === "click" ? { click_target: clickTarget || "other" } : {}),
      session_id: getAnalyticsSessionId(),
      visitor_id: getAnalyticsVisitorId(),
      platform: "web",
      device_type: mobile ? "mobile" : "desktop",
    }),
  }).catch(() => undefined);
}
