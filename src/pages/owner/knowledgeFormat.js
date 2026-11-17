/** Plain helpers for the plan-50 owner pages (kept apart from components for fast refresh). */

export const STATUS_TONE = {
  draft: "muted",
  pending_review: "warn",
  approved: "ok",
  rejected: "bad",
  superseded: "muted",
  archived: "muted",
  processed: "ok",
  processing: "info",
  pending: "muted",
  failed: "bad",
  queued: "muted",
  running: "info",
  done: "ok",
  timed_out: "bad",
  accepted: "ok",
  warn: "warn",
  hold: "warn",
  quarantined: "bad",
  proposed: "warn",
  verified: "ok",
};

export const STATUS_LABEL = {
  pending_review: "Pending review",
  timed_out: "Timed out",
  quarantined: "Rejected",
  hold: "Held",
  warn: "Warning",
};

export const pct = (v) => (v == null ? "—" : `${Math.round(Number(v) * 100)}%`);

export function when(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export const humanClass = (c) => String(c || "").replace(/_/g, " ");
