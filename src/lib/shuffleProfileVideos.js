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
 * Feed home never ends: advance one clip, or reshuffle and restart when past the last.
 * When reshuffling, prefer a different first clip than the one just watched (if pool > 1).
 */
export function wrapEndlessFeedNext(list, currentIndex) {
  const rows = Array.isArray(list) ? list : [];
  if (rows.length === 0) return { items: rows, index: 0 };
  const i = Math.min(Math.max(0, Number(currentIndex) || 0), rows.length - 1);
  if (i + 1 < rows.length) {
    return { items: rows, index: i + 1 };
  }
  const currentId = rows[i]?.id;
  const reshuffled = shuffleFeedVideos(rows);
  if (rows.length > 1 && currentId != null && String(reshuffled[0]?.id) === String(currentId)) {
    const j = 1 + Math.floor(Math.random() * (reshuffled.length - 1));
    const tmp = reshuffled[0];
    reshuffled[0] = reshuffled[j];
    reshuffled[j] = tmp;
  }
  return { items: reshuffled, index: 0 };
}
