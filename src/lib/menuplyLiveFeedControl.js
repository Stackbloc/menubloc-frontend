/**
 * Pause / resume the sticky See Who's Eating Public Feed when a diner meal video plays.
 * CustomEvents so meal cards and Public Feed stay decoupled.
 *
 * Product rules (2026-08-25):
 * - Sticky Public Feed stays at top (do not reorder).
 * - Meal video play → pause Public Feed (stop decode), close fullscreen reel if open.
 * - Resume same item from currentTime when no meal video is playing.
 * - Meal A → B: refcount so no resume flicker between clips.
 * - Scrolling the Public Feed while a meal plays does not stop the meal.
 */

export const MENUPY_PAUSE_LIVE_FEED = "menuply:pause-live-feed";
export const MENUPY_RESUME_LIVE_FEED = "menuply:resume-live-feed";
export const MENUPY_CLOSE_LIVE_FEED_FULLSCREEN = "menuply:close-live-feed-fullscreen";
/** Detail: { id: "ate:123" | "want:…" | "plan:…" } — drop a clip from CRT without refetch. */
export const MENUPY_PRUNE_LIVE_FEED_ITEM = "menuply:prune-live-feed-item";

let mealPlayDepth = 0;

export function getMealVideoPlayDepth() {
  return mealPlayDepth;
}

/** Strip media fragment (#t=…) so playback uses a clean URL. */
export function stripMediaUrlFragment(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  const hash = raw.indexOf("#");
  return hash >= 0 ? raw.slice(0, hash) : raw;
}

export function pauseMenuplyLiveFeed() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MENUPY_PAUSE_LIVE_FEED));
}

export function resumeMenuplyLiveFeed() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MENUPY_RESUME_LIVE_FEED));
}

export function closeMenuplyLiveFeedFullscreen() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MENUPY_CLOSE_LIVE_FEED_FULLSCREEN));
}

/** Remove one Public Feed item from the CRT list (e.g. after diary delete or owner hide). */
export function pruneMenuplyLiveFeedItem(itemId) {
  if (typeof window === "undefined") return;
  const id = String(itemId || "").trim();
  if (!id) return;
  window.dispatchEvent(new CustomEvent(MENUPY_PRUNE_LIVE_FEED_ITEM, { detail: { id } }));
}

/** Call when a meal / highlight video starts playing (refcount-safe). */
export function notifyMealVideoPlaying() {
  mealPlayDepth += 1;
  if (mealPlayDepth === 1) {
    closeMenuplyLiveFeedFullscreen();
    pauseMenuplyLiveFeed();
  }
}

/** Call when a meal / highlight video stops or unmounts (refcount-safe). */
export function notifyMealVideoStopped() {
  mealPlayDepth = Math.max(0, mealPlayDepth - 1);
  if (mealPlayDepth === 0) {
    resumeMenuplyLiveFeed();
  }
}

/** Test helper — reset refcount between unit tests. */
export function __resetMealVideoPlayDepthForTests() {
  mealPlayDepth = 0;
}
