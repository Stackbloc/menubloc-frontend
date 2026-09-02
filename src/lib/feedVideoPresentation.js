/**
 * Feed video framing — preserve full portrait subject (face + dish), not center-crop.
 * Desktop shell leaves a fixed left rail; the player must match that viewport.
 */

/** Show the full uploaded frame (letterbox if needed) — avoids cropping faces. */
export const FEED_VIDEO_OBJECT_FIT = "contain";

export const FEED_VIDEO_OBJECT_POSITION = "center center";

/**
 * Feed home portals to body; inset overlay so cover/contain aligns with visible pane
 * (not the full viewport under the desktop rail).
 * @param {boolean} isFeedHome
 */
export function resolveFeedVideoOverlayStyle(isFeedHome) {
  if (!isFeedHome) return {};
  return {
    left: "var(--feed-desktop-rail-w, 0px)",
    width: "calc(100vw - var(--feed-desktop-rail-w, 0px))",
    right: "auto",
  };
}

export function feedVideoElementStyle() {
  return {
    objectFit: FEED_VIDEO_OBJECT_FIT,
    objectPosition: FEED_VIDEO_OBJECT_POSITION,
  };
}
