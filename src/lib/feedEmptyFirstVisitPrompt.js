/**
 * Feed home empty-state coach — first /feed visit only, until national video threshold.
 */

export const FEED_EMPTY_FIRST_VISIT_PROMPT_COPY =
  "Tap X below to post a video about what you're eating or wanting to eat today.";

/** Hide the first-visit coach once this many public Feed videos exist nationally. */
export const FEED_EMPTY_PROMPT_VIDEO_THRESHOLD = 50;

const STORAGE_KEY = "menuply:feed-first-visit-seen";

export function hasSeenFeedBefore(storage) {
  if (!storage) return true;
  try {
    return storage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markFeedFirstVisitSeen(storage) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage blocked — skip silently.
  }
}

export function shouldShowFeedEmptyFirstVisitPrompt({
  publicVideoCount = 0,
  hasItems = false,
  storage,
} = {}) {
  if (hasItems) return false;
  if (hasSeenFeedBefore(storage)) return false;
  const count = Number(publicVideoCount);
  if (Number.isFinite(count) && count >= FEED_EMPTY_PROMPT_VIDEO_THRESHOLD) return false;
  return true;
}
