/** Diner Intelligence Stage 5 display helpers (pure, unit tested). */
import { compareText } from "./liveDisplay.js";
import { PROFILE_RANGE_OPTIONS, shortDate } from "./profileDisplay.js";

/** Sections compare a period with the one before, so Lifetime isn't offered. */
export const SECTIONS_RANGE_OPTIONS = PROFILE_RANGE_OPTIONS.filter(([key]) => key !== "lifetime");
export const SECTIONS_RANGE_KEYS = SECTIONS_RANGE_OPTIONS.map(([k]) => k);
export const DEFAULT_SECTIONS_RANGE = "30d";
const MIN_PEOPLE = 5;

/** ?srange=… (&sfrom/&sto for custom) + ?scluster; separate keys so the roster's ?interval isn't touched. */
export function sectionsStateFromParams(params) {
  const raw = params.get("srange") || DEFAULT_SECTIONS_RANGE;
  const key = SECTIONS_RANGE_KEYS.includes(raw) ? raw : DEFAULT_SECTIONS_RANGE;
  const cluster = Number(params.get("scluster"));
  const clusterId = Number.isInteger(cluster) && cluster > 0 ? cluster : 0;
  if (key !== "custom") return { range: { key }, clusterId };
  const from = params.get("sfrom") || "";
  const to = params.get("sto") || "";
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to);
  return { range: ok ? { key, from, to } : { key: DEFAULT_SECTIONS_RANGE }, clusterId };
}

export function sectionsApiParams({ range, clusterId }) {
  const p = { range: range.key };
  if (range.key === "custom") Object.assign(p, { from: range.from, to: range.to });
  if (clusterId) p.cluster_id = clusterId;
  return p;
}

/** A value in the metric's format. People under 5 (but above 0) show "<5". Missing is "—", never 0. */
export function formatSectionValue(value, format) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  if (format === "percent") return `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
  if (format === "people" && n > 0 && n < MIN_PEOPLE) return `<${MIN_PEOPLE}`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

/** {text, tone}: tone value | zero | unavailable | not_tracked. */
export function sectionCell(metric) {
  if (!metric) return { text: "—", tone: "zero" };
  if (metric.status === "unavailable") return { text: "Unavailable", tone: "unavailable" };
  if (metric.status === "not_instrumented") return { text: "Not tracked", tone: "not_tracked" };
  const text = formatSectionValue(metric.value, metric.format);
  return { text, tone: metric.value > 0 ? "value" : "zero" };
}

/**
 * The line under a value: change against the previous period. Small people counts aren't compared
 * (a "+2 vs <5" line would reveal the hidden number).
 */
export function sectionCompare(metric) {
  if (!metric || metric.status === "unavailable" || metric.status === "not_instrumented") return null;
  const small = (v) => metric.format === "people" && v != null && Number(v) > 0 && Number(v) < MIN_PEOPLE;
  if (small(metric.value) || small(metric.previous)) return { text: "Too few people to compare", tone: "none" };
  const format = (v) => formatSectionValue(v, metric.format === "people" ? "count" : metric.format);
  if (metric.format === "percent" && metric.value != null && metric.previous != null) {
    const diff = Math.round((Number(metric.value) - Number(metric.previous)) * 10) / 10;
    if (diff === 0) return { text: `Same as before (${format(metric.previous)})`, tone: "flat" };
    const sign = diff > 0 ? "+" : "−";
    return { text: `${sign}${Math.abs(diff)} pts vs before (${format(metric.previous)})`, tone: diff > 0 ? "up" : "down" };
  }
  return compareText(metric.value, metric.previous, { hasBefore: metric.previous != null, format });
}

export function sectionFootnote(metric) {
  if (!metric) return null;
  const parts = [];
  if (metric.note) parts.push(metric.note);
  if (metric.partial && metric.since) parts.push(`Recorded since ${shortDate(metric.since)}, so this period is only partly counted.`);
  else if (metric.partial) parts.push("Not recorded for this whole period yet.");
  return parts.length ? parts.join(" ") : null;
}

export function sourceLabel(source) {
  return source === "owner_analytics" ? "Owner Analytics" : null;
}

export function sectionsCaption(data) {
  if (!data?.range) return "";
  return `${shortDate(data.range.from)} through ${shortDate(data.range.to)}, compared with ${shortDate(data.previous?.from)} through ${shortDate(data.previous?.to)} (Los Angeles days)`;
}

/** Bar label for a trend bucket: "Nov 3" (day) or "Wk of Nov 3" (week). */
export function bucketLabel(bucket, grain) {
  const d = new Date(`${bucket}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return bucket;
  const s = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return grain === "week" ? `Wk of ${s}` : s;
}
