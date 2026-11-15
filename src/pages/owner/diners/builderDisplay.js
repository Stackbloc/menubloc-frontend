/** Diner Intelligence Stage 7 display helpers (pure, unit tested). Network Builder on /owner/diners. */
import { PROFILE_RANGE_KEYS } from "./profileDisplay.js";

export const DEFAULT_BUILDER_RANGE = "30d";
export const BUILDER_PAGE_SIZE = 25;
export const BUILDER_SORT_KEYS = ["nvs", "trend", "friends", "active_friends", "activated_recruits", "confirmed_hosted", "joined_plans", "social_days", "multi_diner_plans"];
export const CATEGORY_OPTIONS = [
  ["", "Any category"],
  ["unconnected", "Unconnected"],
  ["sheep", "Sheep"],
  ["gold_standard", "Gold Standard"],
  ["influencer", "Influencer"],
];

/** /owner/diners keeps several sections in one URL, so Network Builder keys start with "b". */
export function builderStateFromParams(params) {
  const raw = params.get("brange") || DEFAULT_BUILDER_RANGE;
  const key = PROFILE_RANGE_KEYS.includes(raw) ? raw : DEFAULT_BUILDER_RANGE;
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  const from = params.get("bfrom") || "";
  const to = params.get("bto") || "";
  const range = key === "custom" && ymd.test(from) && ymd.test(to) ? { key, from, to } : { key: key === "custom" ? DEFAULT_BUILDER_RANGE : key };
  const sort = BUILDER_SORT_KEYS.includes(params.get("bsort")) ? params.get("bsort") : "nvs";
  const dir = params.get("bdir") === "asc" ? "asc" : "desc";
  const category = CATEGORY_OPTIONS.some(([k]) => k && k === params.get("bcat")) ? params.get("bcat") : "";
  const page = Math.max(1, Math.floor(Number(params.get("bpage")) || 1));
  return { range, sort, dir, category, repeat: params.get("brepeat") === "1", plans: params.get("bplans") === "1", page };
}

export function builderApiParams(state, pageSize = BUILDER_PAGE_SIZE) {
  const p = { range: state.range.key, sort: state.sort, dir: state.dir, page: state.page, page_size: pageSize };
  if (state.range.key === "custom") Object.assign(p, { from: state.range.from, to: state.range.to });
  if (state.category) p.classification = state.category;
  if (state.repeat) p.repeat = "1";
  if (state.plans) p.plans = "1";
  return p;
}

/** Clicking a header: same column flips direction, a new column starts high-to-low. Back to page 1 either way. */
export function nextSort(state, key) {
  if (state.sort === key) return { bsort: key, bdir: state.dir === "desc" ? "asc" : "desc", bpage: null };
  return { bsort: key, bdir: "desc", bpage: null };
}

/** "+5", "−3", "0", or "—" when there's no score 30 days ago. */
export function trendLabel(trend) {
  if (trend == null) return "—";
  const n = Math.round(Number(trend) * 10) / 10;
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}
