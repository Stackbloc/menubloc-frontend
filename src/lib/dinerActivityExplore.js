/**
 * Peer profile activity exploration helpers.
 * Presentation + URL builders only — reuses existing /search and want APIs.
 * Do not alter home screen food search parameter builders.
 */

import { iconForFoodInterest, iconForFoodText } from "./foodInterestIcons.js";

/** Canonical peer profile for Who's Eating / discovery deep links. */
export function dinerCanonicalProfilePath(dinerId) {
  const id = Number(dinerId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return `/account/diners/${encodeURIComponent(String(id))}`;
}

/**
 * Consumer dish search from a want signal.
 * Uses /search?q=&city=&state= — not HomeNext builders.
 */
export function buildFoodExploreSearchUrl({
  foodName,
  foodInterestKey,
  city,
  state,
} = {}) {
  const label = String(foodName || "").trim();
  const key = String(foodInterestKey || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  const q = label || (key ? key.replace(/_/g, " ") : "food");
  const params = new URLSearchParams();
  params.set("q", q);
  const c = String(city || "").trim();
  const st = String(state || "").trim();
  if (c) params.set("city", c);
  if (st) params.set("state", st);
  return `/search?${params.toString()}`;
}

export function foodExploreLabel(want = {}) {
  const name = String(want.food_name || "").trim();
  const key = String(want.food_interest_key || "").trim();
  if (name) {
    const short = name.length > 28 ? `${name.slice(0, 26)}…` : name;
    return `See ${short}`;
  }
  if (key) {
    const pretty = key.replace(/_/g, " ");
    return `See ${pretty}`;
  }
  return "See food";
}

export function wantActivityIcon(want = {}) {
  if (want.food_interest_key) return iconForFoodInterest(want.food_interest_key);
  return iconForFoodText(want.food_name);
}

export function formatWantActivityHeadline({ displayName, want } = {}) {
  const name = String(displayName || "").trim() || "Diner";
  const food = String(want?.food_name || "").trim() || "food";
  const icon = wantActivityIcon(want || {});
  return `${icon} ${name} wants ${food}`;
}

export function formatPlanActivityHeadline({ displayName, plan } = {}) {
  const name = String(displayName || "").trim() || "Diner";
  const when = formatRelativePlanWhen(plan?.plan_date);
  const place = String(plan?.restaurant_name || plan?.place_label || "").trim();
  if (when && place) return `📅 ${name} is eating out ${when} · ${place}`;
  if (when) return `📅 ${name} is eating out ${when}`;
  if (place) return `📅 ${name} is eating at ${place}`;
  return `📅 ${name} has an eating plan`;
}

export function formatRelativeWantWhen(createdAt) {
  if (!createdAt) return null;
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startThen = new Date(t);
  startThen.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startToday.getTime() - startThen.getTime()) / dayMs);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  try {
    return startThen.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch (_err) {
    return null;
  }
}

function formatRelativePlanWhen(planDate) {
  if (!planDate) return null;
  const raw = String(planDate).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays > 1 && diffDays < 7) {
    try {
      return target.toLocaleDateString(undefined, { weekday: "long" });
    } catch (_err) {
      return raw;
    }
  }
  try {
    return target.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  } catch (_err) {
    return raw;
  }
}

export function wantContextLine({ want, locationLabel } = {}) {
  const bits = [];
  const when = formatRelativeWantWhen(want?.created_at);
  if (when) bits.push(when);
  const place = String(want?.city || "").trim();
  const st = String(want?.state || "").trim();
  if (place && st) bits.push(`${place}, ${st}`);
  else if (place) bits.push(place);
  else if (locationLabel) bits.push(String(locationLabel).trim());
  // School/affiliation belongs on the identity line — never as a location bit.
  return bits.filter(Boolean).join(" · ") || null;
}
