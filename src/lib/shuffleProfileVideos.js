/**
 * Fisher–Yates — fresh order on each profile load so the first N videos rotate.
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
