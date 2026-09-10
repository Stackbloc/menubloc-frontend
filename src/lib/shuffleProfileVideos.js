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
