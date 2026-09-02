/**
 * Feed video framing.
 * Desktop: left rail + full-viewport portal caused cover to crop faces — use contain + rail inset.
 * Mobile: full-bleed cover already looks correct; do not change mobile object-fit.
 */

export const FEED_VIDEO_OBJECT_FIT_DESKTOP = "contain";
export const FEED_VIDEO_OBJECT_FIT_MOBILE = "cover";
export const FEED_VIDEO_OBJECT_POSITION = "center center";

/**
 * Feed home portals to body; inset overlay on desktop so framing aligns with visible pane
 * (not the full viewport under the left rail). Mobile rail width is 0 — no inset effect.
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

/**
 * @param {{ desktopFeedShell?: boolean }} [opts]
 */
export function feedVideoElementStyle(opts = {}) {
  const desktopFeedShell = Boolean(opts.desktopFeedShell);
  return {
    objectFit: desktopFeedShell ? FEED_VIDEO_OBJECT_FIT_DESKTOP : FEED_VIDEO_OBJECT_FIT_MOBILE,
    objectPosition: FEED_VIDEO_OBJECT_POSITION,
  };
}
