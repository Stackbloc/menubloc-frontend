/**
 * Fisher–Yates — fresh order on each load (profile Videos + Feed playback).
 */
export function shuffleProfileVideos(list) {
  const next = Array.isArray(list) ? [...list] : [];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
}

/** Alias for Feed / non-profile callers. */
export const shuffleFeedVideos = shuffleProfileVideos;

/**
 * True when `next` keeps the viewer's place in `prev`: a Load More page appended to the end,
 * clips removed in place, or the same clips re-sent. False for a fresh list (new load / reshuffle) → restart the reel.
 */
export function feedListKeepsPosition(prev, next) {
  const a = Array.isArray(prev) ? prev : [];
  const b = Array.isArray(next) ? next : [];
  if (a.length === 0 || b.length === 0) return false;
  if (b.length >= a.length) {
    return a.every((row, i) => String(row?.id) === String(b[i]?.id));
  }
  // Removal: `next` is `prev` with some clips dropped, order unchanged.
  let j = 0;
  for (const row of a) {
    if (j < b.length && String(row?.id) === String(b[j]?.id)) j += 1;
  }
  return j === b.length && b.length < a.length;
}

/**
 * Feed home never ends: advance one clip, or reshuffle and restart when past the last.
 * Default reshuffle keeps the clips watched most recently (last half of the finished pass)
 * out of the first half of the new pass, so repeats are spaced as far apart as possible.
 */
export function wrapEndlessFeedNext(list, currentIndex, reshuffle = null) {
  const rows = Array.isArray(list) ? list : [];
  if (rows.length === 0) return { items: rows, index: 0 };
  const i = Math.min(Math.max(0, Number(currentIndex) || 0), rows.length - 1);
  if (i + 1 < rows.length) {
    return { items: rows, index: i + 1 };
  }
  if (typeof reshuffle !== "function") {
    return { items: reshuffleAwayFromRecent(rows), index: 0 };
  }
  // Custom reshuffle (e.g. Feed Deals keeps meal-time sort order across passes).
  const currentId = rows[i]?.id;
  const reshuffled = reshuffle(rows);
  if (rows.length > 1 && currentId != null && String(reshuffled[0]?.id) === String(currentId)) {
    // Swap with the neighbor so the custom order is preserved as much as possible.
    const tmp = reshuffled[0];
    reshuffled[0] = reshuffled[1];
    reshuffled[1] = tmp;
  }
  return { items: reshuffled, index: 0 };
}

function reshuffleAwayFromRecent(rows) {
  const gap = Math.floor(rows.length / 2);
  const recentIds = new Set(rows.slice(rows.length - gap).map((row) => String(row?.id)));
  const isRecent = (row) => recentIds.has(String(row?.id));
  const fresh = shuffleFeedVideos(rows.filter((row) => !isRecent(row)));
  const head = fresh.slice(0, gap);
  const tail = shuffleFeedVideos([...fresh.slice(gap), ...rows.filter(isRecent)]);
  return [...head, ...tail];
}
