/**
 * TikTok-style swipe reel for restaurant deal videos (Feed Deals).
 * Sound on by default (same as Feed home); muted fallback if autoplay blocked. Tap/click toggles mute.
 * Meta dock: desktop shell lifts captions so meal-time badges do not clip; mobile caption layout unchanged.
 * Opposite-side Share & Invite opens Invite to Eat with video deep link in share text.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import InviteToEatModal from "../../InviteToEatModal.jsx";
import BrowseMenusIcon from "../../icons/BrowseMenusIcon.jsx";
import FeedMenuBrowserPipOverlay from "./FeedMenuBrowserPipOverlay.jsx";
import { stripMediaUrlFragment } from "../../../lib/menuplyLiveFeedControl.js";
import {
  recordFeedMenuOpen,
  restaurantRefFromDealItem,
} from "../../../lib/feedMenuLibrary.js";
import { feedDealShareUrl } from "../../../lib/feedShare.js";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";
import {
  attemptFeedVideoAutoplay,
  defaultFeedVideoMuted,
  feedVideoElementStyle,
} from "../../../lib/feedVideoPresentation.js";
import {
  formatVerticalReelCue,
  formatVerticalReelNavHint,
} from "../../../lib/feedVerticalReelNavigationCopy.js";

const SWIPE_MIN_PX = 56;

export default function DealVideoSwipe({
  items = [],
  startIndex = 0,
  bottomInset = 0,
  headerSlot = null,
  containInShell = false,
}) {
  const [index, setIndex] = useState(startIndex);
  const [videoMuted, setVideoMuted] = useState(() => defaultFeedVideoMuted("feedHome"));
  const [inviteOpen, setInviteOpen] = useState(false);
  const [browseRestaurantRef, setBrowseRestaurantRef] = useState(null);
  const isDesktopViewport = useFeedShellDesktop();
  const videoRef = useRef(null);
  const touchStartY = useRef(null);
  const pipSwipeStartY = useRef(null);
  const ignoreVideoClickRef = useRef(false);
  const item = items[index] || null;
  const restaurantRef = restaurantRefFromDealItem(item);
  const menuBrowserOpen = Boolean(browseRestaurantRef?.restaurant_id);
  const inviteVideoShareUrl = useMemo(
    () => feedDealShareUrl(item?.deal_id || item?.id),
    [item?.deal_id, item?.id]
  );
  const showInviteShare = Boolean(restaurantRef?.restaurant_id);
  const inviteMenuItemId =
    item?.menu_item_id != null && String(item.menu_item_id).trim() !== ""
      ? item.menu_item_id
      : null;
  const inviteMenuItemName = String(item?.menu_item_name || "").trim() || null;

  useEffect(() => {
    setIndex(Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)));
  }, [startIndex, items.length]);

  useEffect(() => {
    setVideoMuted(defaultFeedVideoMuted("feedHome"));
    setInviteOpen(false);
    // Keep browseRestaurantRef locked across Feed index changes.
  }, [index, item?.id]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    el.currentTime = 0;
    let cancelled = false;

    const onReady = () => {
      if (cancelled) return;
      attemptFeedVideoAutoplay(el, { preferSound: true }).then(({ muted }) => {
        if (!cancelled) setVideoMuted(muted);
      });
    };

    if (el.readyState >= 2) onReady();
    else {
      el.addEventListener("loadeddata", onReady);
      el.addEventListener("canplay", onReady);
    }
    return () => {
      cancelled = true;
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("canplay", onReady);
    };
  }, [index, item?.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = videoMuted;
    if (!videoMuted) {
      el.volume = 1;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }, [videoMuted, item?.id]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (menuBrowserOpen) setBrowseRestaurantRef(null);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "j") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "k") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, index, menuBrowserOpen]);

  function goNext() {
    setIndex((i) => (i + 1 < items.length ? i + 1 : i));
  }

  function goPrev() {
    setIndex((i) => (i > 0 ? i - 1 : i));
  }

  function onTouchStart(e) {
    if (menuBrowserOpen) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    touchStartY.current = t.clientY;
  }

  function onTouchEnd(e) {
    if (menuBrowserOpen) return;
    const start = touchStartY.current;
    touchStartY.current = null;
    const t = e.changedTouches?.[0];
    if (start == null || !t) return;
    const dy = t.clientY - start;
    if (Math.abs(dy) < SWIPE_MIN_PX) return;
    if (dy < 0) goNext();
    else goPrev();
  }

  function onPipTouchStart(e) {
    if (!menuBrowserOpen) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    pipSwipeStartY.current = t.clientY;
  }

  function onPipTouchEnd(e) {
    if (!menuBrowserOpen) return;
    const start = pipSwipeStartY.current;
    pipSwipeStartY.current = null;
    const t = e.changedTouches?.[0];
    if (start == null || !t) return;
    const dy = t.clientY - start;
    if (Math.abs(dy) < SWIPE_MIN_PX) return;
    ignoreVideoClickRef.current = true;
    if (dy < 0) goNext();
    else goPrev();
  }

  function openMenuBrowser(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const ref = restaurantRefFromDealItem(item);
    if (!ref?.restaurant_id) return;
    recordFeedMenuOpen(ref);
    setBrowseRestaurantRef({ ...ref });
    const el = videoRef.current;
    if (el) {
      attemptFeedVideoAutoplay(el, { preferSound: true }).then(({ muted }) => {
        setVideoMuted(muted);
      });
    } else {
      setVideoMuted(false);
    }
  }

  function closeMenuBrowser() {
    setBrowseRestaurantRef(null);
  }

  function switchBrowseToPlaying() {
    const ref = restaurantRefFromDealItem(item);
    if (!ref?.restaurant_id) return;
    recordFeedMenuOpen(ref);
    setBrowseRestaurantRef({ ...ref });
  }

  function applyVideoSoundState(nextMuted) {
    const el = videoRef.current;
    if (!el) return;
    el.muted = nextMuted;
    el.defaultMuted = nextMuted;
    if (!nextMuted) {
      el.volume = 1;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }

  function onToggleVideoSound(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setVideoMuted((prev) => {
      const next = !prev;
      applyVideoSoundState(next);
      return next;
    });
  }

  function onVideoPointerUp(e) {
    if (menuBrowserOpen) {
      ignoreVideoClickRef.current = true;
      closeMenuBrowser();
      return;
    }
    if (e.pointerType !== "touch") return;
    ignoreVideoClickRef.current = true;
    onToggleVideoSound(e);
  }

  function onVideoClick(e) {
    if (menuBrowserOpen) {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      closeMenuBrowser();
      return;
    }
    if (ignoreVideoClickRef.current) {
      ignoreVideoClickRef.current = false;
      return;
    }
    onToggleVideoSound(e);
  }

  if (typeof document === "undefined") return null;

  const safeBottomInset = Math.max(0, Number(bottomInset) || 0);
  // Mobile captions unchanged. Desktop shell (incl. laptop widths): lift meta so meal badges do not clip.
  const metaBottomPad = isDesktopViewport
    ? `calc(${safeBottomInset}px + max(28px, env(safe-area-inset-bottom)) + 12px)`
    : `calc(${safeBottomInset}px + max(12px, env(safe-area-inset-bottom)))`;

  const overlayStyle = {
    ...styles.overlay,
    ...(containInShell ? styles.overlayContained : null),
    paddingBottom: safeBottomInset,
  };

  if (!item) {
    const empty = (
      <div
        style={overlayStyle}
        data-testid="feed-deals-video-swipe"
        data-variant="empty"
        role="region"
        aria-label="Deal videos"
      >
        {headerSlot}
        <p style={styles.empty}>No deal videos yet. Restaurants can post videos here soon.</p>
      </div>
    );
    return containInShell ? empty : createPortal(empty, document.body);
  }

  const atEnd = index >= items.length - 1;
  const atStart = index <= 0;
  const soundPromptLabel = isDesktopViewport ? "Click for sound" : "Tap for sound";
  const soundToggleLabel = videoMuted ? soundPromptLabel : "Mute";
  const showDesktopSoundLayer = Boolean(isDesktopViewport && item?.video_url && videoMuted);

  const ui = (
    <div
      style={overlayStyle}
      data-testid="feed-deals-video-swipe"
      data-variant="reel"
      role="region"
      aria-label="Deal videos"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {headerSlot}

      {menuBrowserOpen && browseRestaurantRef ? (
        <FeedMenuBrowserPipOverlay
          restaurantRef={browseRestaurantRef}
          playingRestaurantRef={restaurantRef}
          bottomInset={safeBottomInset}
          onClose={closeMenuBrowser}
          onSwitchBrowseToPlaying={switchBrowseToPlaying}
        />
      ) : null}

      <video
        key={item.id}
        ref={videoRef}
        src={stripMediaUrlFragment(item.video_url)}
        style={{
          ...styles.video,
          ...feedVideoElementStyle({
            desktopFeedShell: containInShell && isDesktopViewport && !menuBrowserOpen,
          }),
          ...(menuBrowserOpen
            ? {
                ...styles.videoPip,
                bottom: `calc(${safeBottomInset}px + max(16px, env(safe-area-inset-bottom)) + 12px)`,
                width: isDesktopViewport ? 200 : 140,
                height: isDesktopViewport ? 356 : 248,
              }
            : null),
        }}
        playsInline
        muted={videoMuted}
        loop
        autoPlay
        controls={false}
        preload="auto"
        data-testid="feed-deals-video"
        aria-label={menuBrowserOpen ? "Expand video — back to Feed" : undefined}
        onClick={onVideoClick}
        onPointerUp={onVideoPointerUp}
        onTouchStart={onPipTouchStart}
        onTouchEnd={onPipTouchEnd}
      />

      {showDesktopSoundLayer && !menuBrowserOpen ? (
        <button
          type="button"
          style={styles.videoTapLayer}
          aria-label={videoMuted ? soundToggleLabel : "Mute video"}
          data-testid="feed-deals-video-sound-layer"
          onClick={onToggleVideoSound}
        />
      ) : null}

      {!menuBrowserOpen ? (
        <button
          type="button"
          style={{
            ...styles.soundToggle,
            top: "max(16px, env(safe-area-inset-top))",
            left: "auto",
            right: "max(12px, env(safe-area-inset-right))",
          }}
          aria-label={videoMuted ? soundPromptLabel : "Mute video"}
          data-testid="feed-deals-sound-toggle"
          onClick={onToggleVideoSound}
        >
          {soundToggleLabel}
        </button>
      ) : (
        <button
          type="button"
          style={{
            ...styles.soundToggle,
            ...styles.pipSoundToggle,
            bottom: `calc(${safeBottomInset}px + max(16px, env(safe-area-inset-bottom)) + ${
              isDesktopViewport ? 372 : 264
            }px)`,
          }}
          aria-label={videoMuted ? soundPromptLabel : "Mute video"}
          data-testid="feed-deals-pip-sound-toggle"
          onClick={onToggleVideoSound}
        >
          {soundToggleLabel}
        </button>
      )}

      {!menuBrowserOpen ? (
      <div
        style={{
          ...styles.meta,
          ...(isDesktopViewport ? styles.metaDesktop : null),
          bottom: metaBottomPad,
        }}
        data-testid="feed-deals-meta-dock"
      >
        {item.feed_promoted ? (
          <span style={styles.sponsored} data-testid="feed-deals-sponsored">
            Sponsored
          </span>
        ) : null}
        {item.restaurant_href ? (
          <Link
            to={item.restaurant_href}
            style={styles.restaurantLink}
            data-testid="feed-deals-restaurant"
            onClick={() => {
              const ref = restaurantRefFromDealItem(item);
              if (ref) recordFeedMenuOpen(ref);
            }}
          >
            {item.restaurant_name}
          </Link>
        ) : (
          <span style={styles.restaurantPlain}>{item.restaurant_name}</span>
        )}
        <Link to={item.deal_href} style={styles.titleLink} data-testid="feed-deals-title">
          {item.headline || item.title}
        </Link>
        {item.meal_time_caption &&
        item.title &&
        item.title !== item.meal_time_caption ? (
          <span style={styles.dealTitleSub} data-testid="feed-deals-deal-title">
            {item.title}
          </span>
        ) : null}
        {item.discount_label ? (
          <span style={styles.discount} data-testid="feed-deals-discount">
            {item.discount_label}
          </span>
        ) : null}
        {Array.isArray(item.meal_period_labels) && item.meal_period_labels.length ? (
          <div style={styles.mealRow} data-testid="feed-deals-meal-labels">
            {item.meal_period_labels.map((label) => (
              <span key={label} style={styles.mealBadge}>
                {label}
              </span>
            ))}
          </div>
        ) : null}
        {item.menu_item_name ? (
          <span style={styles.menuItem}>{item.menu_item_name}</span>
        ) : null}
        {item.description ? <p style={styles.description}>{item.description}</p> : null}
        <p style={styles.hint}>
          {formatVerticalReelNavHint({
            index,
            total: items.length,
            atStart,
            atEnd,
            isDesktopViewport,
          })}
        </p>
      </div>
      ) : null}

      {showInviteShare && !menuBrowserOpen ? (
        <div
          style={{
            ...styles.feedActionDock,
            bottom: metaBottomPad,
          }}
        >
          <button
            type="button"
            style={styles.yellowBrowserBtn}
            data-testid="feed-deals-yellow-browser"
            aria-label="Menu Browser"
            title="Menu Browser"
            onClick={openMenuBrowser}
          >
            <BrowseMenusIcon size={28} title="Menu Browser" />
          </button>
          <button
            type="button"
            style={styles.inviteShareBtn}
            data-testid="feed-deals-share-invite"
            aria-label="Share & Invite"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setInviteOpen(true);
            }}
          >
            Share & Invite
          </button>
        </div>
      ) : null}

      {!atEnd && !menuBrowserOpen ? (
        <div
          style={{
            ...styles.swipeCue,
            ...(isDesktopViewport ? styles.swipeCueDesktop : null),
          }}
          aria-hidden="true"
        >
          {formatVerticalReelCue({ isDesktopViewport })}
        </div>
      ) : null}
    </div>
  );

  const inviteModal = showInviteShare ? (
    <InviteToEatModal
      open={inviteOpen}
      onClose={() => setInviteOpen(false)}
      restaurantId={restaurantRef.restaurant_id}
      restaurantName={restaurantRef.restaurant_name}
      menuItemId={inviteMenuItemId}
      menuItemName={inviteMenuItemName}
      videoShareUrl={inviteVideoShareUrl || null}
      shareMessageLead="Let's try this out!"
      flowTitle="Share & Invite"
    />
  ) : null;

  if (containInShell) {
    return (
      <>
        {ui}
        {inviteModal}
      </>
    );
  }
  return (
    <>
      {createPortal(ui, document.body)}
      {inviteModal}
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100dvh",
    zIndex: 40,
    background: "#000",
    overflow: "hidden",
    overscrollBehavior: "none",
  },
  overlayContained: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    minHeight: "100dvh",
  },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    background: "#000",
    cursor: "pointer",
    zIndex: 1,
  },
  videoPip: {
    inset: "auto",
    top: "auto",
    left: "auto",
    right: "max(12px, env(safe-area-inset-right))",
    borderRadius: 14,
    zIndex: 30,
    boxShadow: "0 10px 32px rgba(0,0,0,0.55)",
    border: "2px solid rgba(255,255,255,0.4)",
    objectFit: "cover",
    background: "#000",
  },
  pipSoundToggle: {
    top: "auto",
    left: "auto",
    right: "max(12px, env(safe-area-inset-right))",
    zIndex: 31,
  },
  videoTapLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    border: "none",
    padding: 0,
    margin: 0,
    background: "transparent",
    cursor: "pointer",
    pointerEvents: "auto",
  },
  soundToggle: {
    position: "absolute",
    zIndex: 55,
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    pointerEvents: "auto",
  },
  feedActionDock: {
    position: "absolute",
    right: "max(12px, env(safe-area-inset-right))",
    zIndex: 5,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    pointerEvents: "auto",
  },
  yellowBrowserBtn: {
    border: "none",
    padding: 6,
    borderRadius: 12,
    background: "rgba(0,0,0,0.45)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 0,
    fontFamily: "inherit",
  },
  inviteShareBtn: {
    border: "1px solid rgba(255,255,255,0.4)",
    borderRadius: 999,
    padding: "10px 14px",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.01em",
    cursor: "pointer",
    textShadow: "0 1px 3px rgba(0,0,0,0.75)",
    fontFamily: "inherit",
  },
  // Mobile meta matches prior working caption layout (no maxHeight clamp).
  meta: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 3,
    padding: "0 16px 8px",
    background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
    color: "#fff",
    pointerEvents: "none",
  },
  metaDesktop: {
    maxHeight: "38%",
    overflowY: "auto",
    paddingLeft: "max(20px, env(safe-area-inset-left))",
    paddingRight: "max(20px, env(safe-area-inset-right))",
    paddingBottom: 16,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.9) 100%)",
  },
  sponsored: {
    display: "inline-block",
    marginBottom: 8,
    padding: "3px 8px",
    borderRadius: 999,
    background: "rgba(253,230,138,0.2)",
    color: "#fde68a",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  restaurantLink: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#8fd4a8",
    textDecoration: "none",
    pointerEvents: "auto",
    marginBottom: 4,
  },
  restaurantPlain: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#8fd4a8",
    marginBottom: 4,
  },
  titleLink: {
    display: "block",
    fontSize: 18,
    fontWeight: 800,
    color: "#fff",
    textDecoration: "none",
    lineHeight: 1.25,
    pointerEvents: "auto",
    marginBottom: 6,
  },
  dealTitleSub: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(255,255,255,0.88)",
    marginBottom: 6,
    lineHeight: 1.3,
  },
  discount: {
    display: "inline-block",
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 4,
  },
  mealRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
    pointerEvents: "none",
  },
  mealBadge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.28)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  menuItem: {
    display: "block",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 4,
  },
  description: {
    margin: "6px 0 0",
    fontSize: 13,
    lineHeight: 1.35,
    color: "rgba(255,255,255,0.88)",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  hint: {
    margin: "10px 0 0",
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  swipeCue: {
    position: "absolute",
    bottom: "calc(28% + env(safe-area-inset-bottom))",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: 600,
    pointerEvents: "none",
  },
  swipeCueDesktop: {
    bottom: "calc(36% + env(safe-area-inset-bottom))",
  },
  empty: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    lineHeight: 1.45,
  },
};
