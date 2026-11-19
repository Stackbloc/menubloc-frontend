/**
 * Unified search, Social part — web (2026-11-19, same as app 65cbffb src/api/searchSocial.ts).
 * Andre 2026-11-19: "all should show up in search - event, plans, people, and food".
 * GET /search/social returns plans, events and people for the search words, shown under the
 * Search "Social" option. Food results come from GET /search, unchanged. Who's in each list
 * follows each person's own settings; the backend decides.
 */

export const EMPTY_SOCIAL_GROUPS = Object.freeze({ plans: [], events: [], people: [] });

const list = (v) => (Array.isArray(v) ? v : []);
const text = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

const PLAN_ACTIONS = new Set(["join", "ask", "asked", "going"]);
const PLAN_SOURCES = new Set(["eating_plan", "my_event", "invite"]);

/** Same shape as the Connects plans SocialPlanActionButton already takes. */
function parsePlan(r) {
  const key = text(r?.key);
  const action = PLAN_ACTIONS.has(r?.action) ? r.action : null;
  // "none" (invite only) never comes back as a search row people can act on.
  if (!key || !action) return null;
  const peerId = num(r.peer?.id);
  return {
    key,
    source: PLAN_SOURCES.has(r.source) ? r.source : null,
    ref: r.ref != null ? String(r.ref) : null,
    peer: peerId
      ? { id: peerId, name: text(r.peer?.name) || "A diner", avatarUrl: text(r.peer?.avatar_url), avatarMotionUrl: text(r.peer?.avatar_motion_url) }
      : null,
    title: text(r.title) || "Plan",
    date: text(r.date),
    time: text(r.time),
    placeName: text(r.place?.name),
    goingCount: num(r.going_count),
    action,
    href: text(r.href),
  };
}

function parseEvent(r) {
  const key = text(r?.key);
  const title = text(r?.title);
  const kind = r?.kind === "venue_event" || r?.kind === "diner_event" ? r.kind : null;
  if (!key || !title || !kind) return null;
  const slug = text(r.slug);
  const token = text(r.token);
  if (kind === "venue_event" ? !slug : !token) return null;
  return {
    key,
    kind,
    title,
    date: text(r.date),
    time: text(r.time),
    timeLabel: text(r.time_label),
    placeName: text(r.place_name),
    ageLabel: text(r.age_label),
    goingCount: num(r.going_count),
    slug,
    token,
  };
}

function parsePerson(r) {
  const id = num(r?.id);
  if (!id) return null;
  return {
    key: text(r.key) || `person:${id}`,
    id,
    name: text(r.name) || "A diner",
    avatarUrl: text(r.avatar_url),
    vibe: text(r.vibe),
    isConnect: r.is_connect === true,
    locationLabel: text(r.location_label),
  };
}

export function parseSearchSocial(body) {
  if (!body || body.ok !== true) throw new Error("search social: bad response");
  return {
    plans: list(body.plans).map(parsePlan).filter(Boolean),
    events: list(body.events).map(parseEvent).filter(Boolean),
    people: list(body.people).map(parsePerson).filter(Boolean),
  };
}

/** "Fri, Nov 20 · 7:00 PM" (same as the app's formatWhen). */
export function formatWhen(date, time) {
  if (!date) return null;
  const [y, mo, d] = String(date).split("-").map(Number);
  const day = new Date(y, (mo || 1) - 1, d || 1).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!time) return day;
  const [h, m] = String(time).split(":").map(Number);
  if (!Number.isFinite(h)) return day;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${day} · ${h12}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/**
 * Build the GET /search/social URL. The top food results' restaurants go along, so "tacos" finds
 * a plan at a taco place. `where` = { lat, lng } or { city, state } or null.
 */
export function searchSocialUrl(apiBase, q, where, restaurantIds) {
  const u = new URL(`${apiBase}/search/social`);
  u.searchParams.set("q", q);
  const ids = list(restaurantIds)
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
  const unique = [...new Set(ids)].slice(0, 30);
  if (unique.length) u.searchParams.set("restaurant_ids", unique.join(","));
  if (where && Number.isFinite(where.lat) && Number.isFinite(where.lng)) {
    u.searchParams.set("lat", String(where.lat));
    u.searchParams.set("lng", String(where.lng));
  } else if (where && where.city) {
    u.searchParams.set("city", where.city);
    if (where.state) u.searchParams.set("state", where.state);
  }
  return u.toString();
}

export async function fetchSearchSocial(apiBase, q, where, restaurantIds) {
  const res = await fetch(searchSocialUrl(apiBase, q, where, restaurantIds), { credentials: "include" });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseSearchSocial(json);
}
