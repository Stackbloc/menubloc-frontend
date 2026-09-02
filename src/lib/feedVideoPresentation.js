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

/** Feed home plays with sound by default; modal / preview reels stay muted. */
export function defaultFeedVideoMuted(variant = "modal") {
  return variant !== "feedHome";
}

/**
 * Autoplay Feed video; try unmuted first when preferSound, fall back to muted if blocked.
 * @param {HTMLVideoElement|null|undefined} el
 * @param {{ preferSound?: boolean }} [opts]
 * @returns {Promise<{ muted: boolean }>}
 */
export async function attemptFeedVideoAutoplay(el, { preferSound = false } = {}) {
  if (!el) return { muted: true };

  const playMuted = async () => {
    el.muted = true;
    el.defaultMuted = true;
    try {
      await el.play();
    } catch {
      /* browser may still block until visible */
    }
    return { muted: true };
  };

  if (!preferSound) {
    return playMuted();
  }

  el.muted = false;
  el.defaultMuted = false;
  el.volume = 1;
  try {
    await el.play();
    return { muted: false };
  } catch {
    return playMuted();
  }
}
