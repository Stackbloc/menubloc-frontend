/**
 * Feed comments (backend mig 0423): small rules shared by the comment sheet and its tests.
 * Same wording as the app (menuply-mobile src/features/feedComments/format.ts).
 */

/** "now", "5m", "3h", "2d", "4w", then a short date. */
export function commentTimeAgo(iso, now = Date.now()) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  if (d < 35) return `${Math.floor(d / 7)}w`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Rail label: the count when there is one, else "Comment". 1.2K style past 999. */
export function commentCountLabel(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "Comment";
  if (v < 1000) return String(v);
  const k = v / 1000;
  return `${k >= 10 ? Math.floor(k) : Math.floor(k * 10) / 10}K`;
}

export function commentsTitle(total) {
  const v = Number(total) || 0;
  return v === 1 ? "1 comment" : `${v} comments`;
}

/** One key per send; a retry of the same send reuses it, so the server makes one comment. */
export function newCommentClientKey() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, "");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Feed items carry comment_count only when comments are on for this viewer. */
export function feedItemCommentsOn(item) {
  return typeof item?.comment_count === "number";
}

export const COMMENT_MAX = 500;
