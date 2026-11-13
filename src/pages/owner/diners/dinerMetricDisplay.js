/**
 * Diner Intelligence (plan 39, Stage 1): how a diner metric reads on the page.
 * The backend gives each metric a status. Zero, "couldn't be read" and "not recorded" must never look the same,
 * so only a counted metric shows a number.
 */

export const DINER_INTERVAL_OPTIONS = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["90d", "90 days"],
  ["365d", "365 days"],
];

export const DINER_INTERVAL_LABELS = Object.fromEntries(DINER_INTERVAL_OPTIONS);

function formatCount(metric) {
  const n = Number(metric?.count || 0);
  if (metric?.is_average) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-US");
}

/** {value, subtitle, tone} for one metric card. tone: "count" | "zero" | "unavailable" | "not_tracked". */
export function displayDinerMetric(metric) {
  const status = metric?.status;
  if (status === "unavailable") {
    return { value: "Unavailable", subtitle: metric.reason || "Couldn't be read just now. Not the same as 0.", tone: "unavailable" };
  }
  if (status === "not_instrumented") {
    return { value: "Not tracked", subtitle: metric.reason || "Menuply doesn't record this yet.", tone: "not_tracked" };
  }
  const value = formatCount(metric);
  const parts = [];
  if (metric?.is_average) {
    if (metric.accepted_connects_total != null) parts.push(`${metric.accepted_connects_total} accepted total`);
    if (metric.active_diners != null) parts.push(`${metric.active_diners} active diners`);
    if (metric.lifetime) parts.push("lifetime");
  } else if (metric?.unique_diners != null) {
    parts.push(`${Number(metric.unique_diners).toLocaleString("en-US")} unique diners`);
  }
  return { value, subtitle: parts.join(" · ") || null, tone: status === "zero" || value === "0" ? "zero" : "count" };
}

/** A per-diner count from the detail endpoint: null means it couldn't be counted (shown as "—"). */
export function displayDinerCount(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString("en-US");
}

export function dinerProfilePath(id, interval) {
  const base = `/owner/diners/${encodeURIComponent(String(id))}`;
  // The profile opens on 30 days (Stage 4); any other window from the list is carried over.
  return interval && interval !== "30d" ? `${base}?interval=${encodeURIComponent(interval)}` : base;
}
