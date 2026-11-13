/** Diner Intelligence Stage 6 display helpers (pure, unit tested). */
import { PROFILE_RANGE_KEYS } from "./profileDisplay.js";

export const DEFAULT_NETWORK_RANGE = "30d";
export const TIER_OPTIONS = [
  ["", "Any tier"],
  ["none", "No Connects"],
  ["sheep", "Sheep (1–4)"],
  ["gold_standard", "Gold Standard (5–10)"],
  ["influencer", "Influencer (11+)"],
];
export const TIER_NAMES = { none: "No Connects", sheep: "Sheep", gold_standard: "Gold Standard", influencer: "Influencer" };
export const SOURCE_NAMES = {
  invite_code: "Invite code",
  diner_qr: "Diner QR",
  eat_invitation: "Invite to Eat",
  dining_crew: "Circle invite",
  open_invite: "Open Invite",
  unknown: "Direct / not recorded",
};
export const SOURCE_OPTIONS = [["", "Any source"], ...Object.entries(SOURCE_NAMES)];

export function sourceName(source) {
  if (!source) return SOURCE_NAMES.unknown;
  return SOURCE_NAMES[source] || String(source).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Range + cluster from URL params, with a key prefix so two sections on one page don't collide
 * (/owner/diners uses n…; the USC and list pages use plain keys).
 */
export function rangeStateFromParams(params, prefix = "") {
  const raw = params.get(`${prefix}range`) || DEFAULT_NETWORK_RANGE;
  const key = PROFILE_RANGE_KEYS.includes(raw) ? raw : DEFAULT_NETWORK_RANGE;
  const cluster = Number(params.get(prefix ? `${prefix}cluster` : "cluster_id"));
  const clusterId = Number.isInteger(cluster) && cluster > 0 ? cluster : 0;
  if (key !== "custom") return { range: { key }, clusterId };
  const from = params.get(`${prefix}from`) || "";
  const to = params.get(`${prefix}to`) || "";
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to);
  return { range: ok ? { key, from, to } : { key: DEFAULT_NETWORK_RANGE }, clusterId };
}

export function rangeApiParams({ range, clusterId }) {
  const p = { range: range.key };
  if (range.key === "custom") Object.assign(p, { from: range.from, to: range.to });
  if (clusterId) p.cluster_id = clusterId;
  return p;
}

/** Link to the diner list behind a number, keeping the period and cluster. */
export function drillPath(set, state, extra = {}) {
  const qs = new URLSearchParams({ set, ...Object.fromEntries(Object.entries(rangeApiParams(state)).map(([k, v]) => [k, String(v)])) });
  for (const [k, v] of Object.entries(extra)) if (v != null && v !== "") qs.set(k, String(v));
  return `/owner/diners/list?${qs}`;
}

/** List-page filters from its URL. */
export function listStateFromParams(params) {
  const base = rangeStateFromParams(params);
  const ymd = (v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  const tier = TIER_OPTIONS.some(([k]) => k && k === params.get("tier")) ? params.get("tier") : "";
  const page = Math.max(1, Math.floor(Number(params.get("page")) || 1));
  return {
    ...base,
    set: params.get("set") || "",
    cohortFrom: ymd(params.get("cohort_from")),
    cohortTo: ymd(params.get("cohort_to")),
    tier,
    source: params.get("source") || "",
    page,
  };
}

export function listApiParams(state, pageSize = 50) {
  return {
    ...rangeApiParams(state),
    set: state.set,
    cohort_from: state.cohortFrom,
    cohort_to: state.cohortTo,
    tier: state.tier,
    source: state.source,
    page: state.page,
    page_size: pageSize,
  };
}

/** Progress toward the USC goal, 0–100, never above 100. */
export function goalPercent(engaged, target) {
  const t = Number(target);
  if (!t) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(engaged || 0) / t) * 100)));
}

/** The highest value across a chart's series (blank days ignored), at least 1. */
export function chartMax(chart) {
  let max = 1;
  for (const s of chart?.series || []) for (const p of s.points || []) if (p.value != null && p.value > max) max = p.value;
  return max;
}

/** True when a chart has no recorded point at all (snapshots not started yet). */
export function chartIsEmpty(chart) {
  return !(chart?.series || []).some((s) => (s.points || []).some((p) => p.value != null));
}
