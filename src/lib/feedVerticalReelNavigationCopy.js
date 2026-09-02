/**
 * Vertical video reel navigation hints.
 *
 * Touch devices: swipe up/down (finger on screen).
 * Desktop (including Mac laptops): arrow keys — same as swipe on mobile.
 *   ↓ / → / j = next · ↑ / ← / k = previous
 */

/** @param {boolean} isDesktopViewport from useFeedShellDesktop */
export function verticalReelUsesArrowKeyHints(isDesktopViewport) {
  return Boolean(isDesktopViewport);
}

/**
 * @param {{
 *   index: number,
 *   total: number,
 *   atStart: boolean,
 *   atEnd: boolean,
 *   isDesktopViewport: boolean,
 *   modalWithExit?: boolean,
 * }} opts
 */
export function formatVerticalReelNavHint({
  index,
  total,
  atStart,
  atEnd,
  isDesktopViewport,
  modalWithExit = false,
}) {
  const pos = `${index + 1} / ${total}`;
  if (verticalReelUsesArrowKeyHints(isDesktopViewport)) {
    if (atEnd) return `${pos} · ↑ arrow key for previous`;
    if (atStart && modalWithExit) {
      return `${pos} · ↓ arrow key for next · ↑ arrow key or Exit to leave`;
    }
    if (atStart) return `${pos} · ↓ arrow key for next`;
    return `${pos} · ↓ arrow key next · ↑ arrow key previous`;
  }
  if (atEnd) return `${pos} · swipe down for previous`;
  if (atStart && modalWithExit) {
    return `${pos} · swipe up for next · swipe down or Exit to leave`;
  }
  if (atStart) return `${pos} · swipe up for next`;
  return `${pos} · swipe up next · swipe down previous`;
}

/** Short cue shown at bottom of reel when more items exist. */
export function formatVerticalReelCue({ isDesktopViewport }) {
  if (verticalReelUsesArrowKeyHints(isDesktopViewport)) {
    return "↓ Arrow key for next";
  }
  return "↑ Swipe up";
}

export const FEED_HOME_DESKTOP_NAV_COACH_COPY =
  "On desktop, use ↓ and ↑ arrow keys to move between videos — the same as swipe up and down on your phone.";

export const FEED_HOME_DESKTOP_NAV_COACH_DURATION_MS = 12_000;
