/** Diner Intelligence Stage 4 display helpers (pure, unit tested). */
import { formatDuration } from "./liveDisplay.js";

export const PROFILE_RANGE_OPTIONS = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["90d", "90 days"],
  ["365d", "365 days"],
  ["custom", "Custom"],
  ["lifetime", "Lifetime"],
];
export const PROFILE_RANGE_KEYS = PROFILE_RANGE_OPTIONS.map(([k]) => k);
export const DEFAULT_PROFILE_RANGE = "30d";

const TIER_LABELS = { sheep: "Sheep", gold_standard: "Gold Standard", influencer: "Influencer" };

/** Range from the URL: ?range=… (or the list page's ?interval=…), with from/to for custom. */
export function rangeFromParams(params) {
  const raw = params.get("range") || params.get("interval") || DEFAULT_PROFILE_RANGE;
  const key = PROFILE_RANGE_KEYS.includes(raw) ? raw : DEFAULT_PROFILE_RANGE;
  if (key !== "custom") return { key };
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  return /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) ? { key, from, to } : { key: DEFAULT_PROFILE_RANGE };
}

export function shortDate(ymdOrIso) {
  if (!ymdOrIso) return "—";
  const s = String(ymdOrIso);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00Z`) : new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" });
}

export function tierLabel(classification) {
  if (!classification) return null;
  return TIER_LABELS[classification] || String(classification).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * One cell of a metric: {text, tone, partial}. tone: value | zero | not_tracked | unavailable.
 * A missing value is never shown as 0.
 */
export function metricCell(metric, field) {
  if (!metric) return { text: "—", tone: "not_tracked", partial: false };
  if (metric.status === "not_instrumented") return { text: "Not tracked", tone: "not_tracked", partial: false };
  const st = metric[`${field}_status`];
  if (st === "unavailable") return { text: "Unavailable", tone: "unavailable", partial: false };
  if (st === "not_instrumented") return { text: "Not tracked", tone: "not_tracked", partial: false };
  const v = metric[field];
  const partial = Boolean(metric[`${field}_partial`]);
  if (v == null) return { text: "—", tone: "zero", partial };
  let text;
  if (metric.format === "duration") text = formatDuration(v);
  else if (metric.format === "percent") {
    const detail = metric[`${field}_detail`];
    text = `${Math.round(Number(v) * 100)}%${detail ? ` (${detail.yes} of ${detail.of})` : ""}`;
  } else text = Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 });
  return { text, tone: Number(v) > 0 ? "value" : "zero", partial };
}

/** The footnote under a metric: its note plus the "recorded since" gap, if any. */
export function metricFootnote(metric) {
  if (!metric) return null;
  const parts = [];
  if (metric.status === "not_instrumented" && metric.reason) parts.push(metric.reason);
  else if (metric.note) parts.push(metric.note);
  if ((metric.lifetime_partial || metric.period_partial) && metric.since) {
    parts.push(`Recorded since ${shortDate(metric.since)}; earlier activity isn't in the starred numbers.`);
  }
  if (metric.kind === "snapshot") parts.push("A snapshot, not a sum.");
  return parts.length ? parts.join(" ") : null;
}

export function rangeCaption(data) {
  if (!data) return "";
  if (data.range === "lifetime") return "Lifetime: everything since this diner joined.";
  return `${shortDate(data.from)} through ${shortDate(data.to)} (Los Angeles days)`;
}
