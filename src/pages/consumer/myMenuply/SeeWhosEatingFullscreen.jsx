/**
 * TikTok-style See Who's Eating fullscreen reel.
 * Feed home: sound on by default (muted fallback if autoplay blocked). Tap/click toggles mute.
 * Screen name → Connect request when signed in; guests → login.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import ShareButton from "../../../components/share/ShareButton.jsx";
import InviteToEatModal from "../../../components/InviteToEatModal.jsx";
import BrowseMenusIcon from "../../../components/icons/BrowseMenusIcon.jsx";
import { hidePublicFeedItem, requestConnection } from "../../../lib/consumerApi.js";
import {
  MENUPY_CLOSE_LIVE_FEED_FULLSCREEN,
  stripMediaUrlFragment,
} from "../../../lib/menuplyLiveFeedControl.js";
import { MY_MENUPLY_PROFILE_PATH } from "../../../lib/myMenuplyRoutes.js";
import {
  liveFeedPosterDisplayName,
  liveFeedCreatorProfilePath,
  isLiveFeedRestaurantCreator,
  isLiveFeedGuestCreator,
  isLiveFeedVenueItem,
} from "../../../lib/liveFeedCategory.js";
import FeedPlaceCaption from "../../../components/consumer/feed/FeedPlaceCaption.jsx";
import { FEED_EMPTY_FIRST_VISIT_PROMPT_COPY } from "../../../lib/feedEmptyFirstVisitPrompt.js";
import {
  FEED_MENU_LIBRARY_CHANGED,
  isFeedMenuBookmarked,
  menuPathFromRestaurantRef,
  recordFeedMenuOpen,
  restaurantRefFromFeedItem,
  toggleFeedMenuBookmark,
} from "../../../lib/feedMenuLibrary.js";
import { buildFeedVideoShareData, feedClipSharePath, feedClipShareUrl } from "../../../lib/feedShare.js";
import {
  attemptFeedVideoAutoplay,
  defaultFeedVideoMuted,
  feedVideoElementStyle,
  resolveFeedVideoOverlayStyle,
} from "../../../lib/feedVideoPresentation.js";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";
import {
  formatVerticalReelCue,
  formatVerticalReelNavHint,
} from "../../../lib/feedVerticalReelNavigationCopy.js";
import MenuplyAccountInviteCard from "../../../components/consumer/MenuplyAccountInviteCard.jsx";

const SWIPE_MIN_PX = 56;

/**
 * @param {"modal"|"feedHome"} variant
 *   modal — My Menuply overlay (exit closes).
 *   feedHome — primary Feed shell (no exit; swipe down on first stays; bottom padding for shell nav).
 */
export default function SeeWhosEatingFullscreen({
  items = [],
  startIndex = 0,
  isAuthenticated = false,
  viewerUserId = null,
  onClose,
  onRemovedFromFeed,
  variant = "modal",
  bottomInset = 0,
  desktopFeedShell = false,
  headerSlot = null,
  showEmptyFirstVisitPrompt = false,
  sharedClipId = "",
  showSharedAccountInvite = false,
}) {
  const navigate = useNavigate();
  const isDesktopViewport = useFeedShellDesktop();
  const [index, setIndex] = useState(startIndex);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectNotice, setConnectNotice] = useState("");
  const [connectError, setConnectError] = useState("");
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [menuBookmarked, setMenuBookmarked] = useState(false);
  const [menuBookmarkToast, setMenuBookmarkToast] = useState("");
  const [videoMuted, setVideoMuted] = useState(() => defaultFeedVideoMuted(variant));
  const [inviteOpen, setInviteOpen] = useState(false);
  const videoRef = useRef(null);
  const touchStartY = useRef(null);
  const ignoreVideoClickRef = useRef(false);
  const item = items[index] || null;
  const feedShareData = useMemo(() => (item ? buildFeedVideoShareData(item) : null), [item]);
  const inviteVideoShareUrl = useMemo(
    () => (item?.id ? feedClipShareUrl(item.id) : ""),
    [item?.id]
  );
  const sharedClipNextPath = feedClipSharePath(sharedClipId) || "/feed";

  useEffect(() => {
    setIndex(Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)));
  }, [startIndex, items.length]);

  useEffect(() => {
    setConnectNotice("");
    setConnectError("");
    setRemoveError("");
    setMenuBookmarkToast("");
    setVideoMuted(defaultFeedVideoMuted(variant));
    setInviteOpen(false);
  }, [index, item?.id, variant]);

  const restaurantRef = restaurantRefFromFeedItem(item);
  const inviteMenuItemId =
    item?.menu_item_id != null && String(item.menu_item_id).trim() !== ""
      ? item.menu_item_id
      : null;
  const inviteMenuItemName = String(item?.item_name || item?.food_name || "").trim() || null;

  useEffect(() => {
    if (!restaurantRef?.restaurant_id) {
      setMenuBookmarked(false);
      return undefined;
    }
    function syncBookmark() {
      setMenuBookmarked(isFeedMenuBookmarked(restaurantRef.restaurant_id));
    }
    syncBookmark();
    window.addEventListener(FEED_MENU_LIBRARY_CHANGED, syncBookmark);
    return () => window.removeEventListener(FEED_MENU_LIBRARY_CHANGED, syncBookmark);
  }, [restaurantRef?.restaurant_id]);

  useEffect(() => {
    if (!menuBookmarkToast) return undefined;
    const t = window.setTimeout(() => setMenuBookmarkToast(""), 2200);
    return () => window.clearTimeout(t);
  }, [menuBookmarkToast]);

  useEffect(() => {
    if (!item && items.length === 0) {
      if (variant === "modal") onClose?.();
      return;
    }
    if (!item && items.length > 0) {
      setIndex((i) => Math.min(i, items.length - 1));
    }
  }, [item, items.length, onClose, variant]);

  useEffect(() => {
    function onForcedClose() {
      onClose?.();
    }
    window.addEventListener(MENUPY_CLOSE_LIVE_FEED_FULLSCREEN, onForcedClose);
    return () => window.removeEventListener(MENUPY_CLOSE_LIVE_FEED_FULLSCREEN, onForcedClose);
  }, [onClose]);

  // Lock page scroll while the reel owns the viewport.
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
      attemptFeedVideoAutoplay(el, { preferSound: variant === "feedHome" }).then(({ muted }) => {
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
  }, [index, item?.id, variant]);

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
        if (variant === "modal") onClose?.();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "j") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "k") {
        e.preventDefault();
        goPrevOrClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goNext/goPrev close over latest index
  }, [items.length, index, onClose, variant]);

  function goNext() {
    setIndex((i) => (i + 1 < items.length ? i + 1 : i));
  }

  function goPrevOrClose() {
    if (index <= 0) {
      if (variant === "modal") onClose?.();
      return;
    }
    setIndex((i) => i - 1);
  }

  function onTouchStart(e) {
    const t = e.changedTouches?.[0];
    if (!t) return;
    touchStartY.current = t.clientY;
  }

  function onTouchEnd(e) {
    const start = touchStartY.current;
    touchStartY.current = null;
    const t = e.changedTouches?.[0];
    if (start == null || !t) return;
    const dy = t.clientY - start;
    if (Math.abs(dy) < SWIPE_MIN_PX) return;
    // Finger moves up → content flips up → next video (TikTok).
    if (dy < 0) goNext();
    else goPrevOrClose();
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
    if (e.pointerType !== "touch") return;
    ignoreVideoClickRef.current = true;
    onToggleVideoSound(e);
  }

  function onVideoClick(e) {
    if (ignoreVideoClickRef.current) {
      ignoreVideoClickRef.current = false;
      return;
    }
    onToggleVideoSound(e);
  }

  function openPosterProfile(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const path = liveFeedCreatorProfilePath(item);
    if (!path) return;
    if (isLiveFeedVenueItem(item) || isLiveFeedRestaurantCreator(item)) {
      onClose?.();
      navigate(path);
      return;
    }
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(path)}`);
      return;
    }
    onClose?.();
    navigate(path);
  }

  async function onScreenNameClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isLiveFeedVenueItem(item) || isLiveFeedRestaurantCreator(item)) {
      openPosterProfile(e);
      return;
    }
    if (isLiveFeedGuestCreator(item)) {
      return;
    }
    const peerId = item?.diner?.id != null ? Number(item.diner.id) : null;
    if (!peerId) return;

    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(MY_MENUPLY_PROFILE_PATH)}`);
      return;
    }

    if (viewerUserId != null && Number(viewerUserId) === peerId) {
      setConnectNotice("That's you.");
      return;
    }

    setConnectBusy(true);
    setConnectError("");
    setConnectNotice("");
    try {
      const data = await requestConnection({
        recipient_user_id: peerId,
        source: "see_whos_eating",
        source_ref: item?.id != null ? String(item.id) : null,
      });
      const status = data?.connection?.status;
      if (status === "accepted") {
        setConnectNotice("You're now Connects.");
      } else {
        setConnectNotice("Connect request sent — they'll get a notification.");
      }
    } catch (err) {
      const code = err?.payload?.code || err?.code;
      if (code === "already_connected") {
        setConnectNotice("You're already Connects.");
      } else if (code === "already_pending") {
        setConnectNotice("Connect request already pending.");
      } else {
        setConnectError(err?.message || "Unable to send Connect request");
      }
    } finally {
      setConnectBusy(false);
    }
  }

  function onFeedMenuLinkClick() {
    const ref = restaurantRefFromFeedItem(item);
    if (ref) recordFeedMenuOpen(ref);
  }

  function onToggleMenuBookmark(event) {
    event?.stopPropagation?.();
    const ref = restaurantRefFromFeedItem(item);
    if (!ref) return;
    const saved = toggleFeedMenuBookmark(ref);
    setMenuBookmarked(saved);
    setMenuBookmarkToast(saved ? "Saved to Menus" : "Removed from saved");
  }

  async function onRemoveFromPublicFeed(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!item || removeBusy) return;
    const peerId = item?.diner?.id != null ? Number(item.diner.id) : null;
    const kind = String(item.kind || "")
      .trim()
      .toLowerCase();
    if (isLiveFeedVenueItem(item) || !["ate", "want", "plan", "reviews", "cooking"].includes(kind)) return;
    if (viewerUserId == null || peerId == null || Number(viewerUserId) !== peerId) return;

    const ok =
      typeof window === "undefined" ||
      window.confirm(
        "Remove this video from Public Feed? It stays in your Eating list."
      );
    if (!ok) return;

    setRemoveBusy(true);
    setRemoveError("");
    try {
      await hidePublicFeedItem(item);
      const removedId = item.id;
      const nextLen = Math.max(0, items.length - 1);
      onRemovedFromFeed?.(removedId);
      if (nextLen === 0) {
        if (variant === "modal") onClose?.();
      } else {
        setIndex((i) => Math.min(i, nextLen - 1));
      }
    } catch (err) {
      setRemoveError(err?.message || "Unable to remove from Public Feed");
    } finally {
      setRemoveBusy(false);
    }
  }

  if ((!item && variant === "modal") || typeof document === "undefined") return null;

  const isVenue = isLiveFeedVenueItem(item);
  const screenName = item ? liveFeedPosterDisplayName(item) : "";
  const showRestaurantBadge = item ? isLiveFeedRestaurantCreator(item) : false;
  const atEnd = index >= items.length - 1;
  const atStart = index <= 0;
  const peerId = item?.diner?.id != null ? Number(item.diner.id) : null;
  const isOwnDinerClip =
    item &&
    !isVenue &&
    viewerUserId != null &&
    peerId != null &&
    Number(viewerUserId) === peerId &&
    ["ate", "want", "plan", "reviews", "cooking"].includes(
      String(item.kind || "")
        .trim()
        .toLowerCase()
    );
  const isFeedHome = variant === "feedHome";
  const showInviteShare = Boolean(isFeedHome && restaurantRef?.restaurant_id);
  const soundPromptLabel = isDesktopViewport ? "Click for sound" : "Tap for sound";
  const soundToggleLabel = videoMuted ? soundPromptLabel : "Mute";
  const showDesktopSoundLayer = Boolean(isDesktopViewport && item?.video_url && videoMuted);
  const navInset = isFeedHome ? Math.max(0, Number(bottomInset) || 0) : 0;
  const overlayStyle = {
    ...styles.overlay,
    ...resolveFeedVideoOverlayStyle(isFeedHome),
    ...(isFeedHome
      ? {
          zIndex: 40,
          top: 0,
          bottom: navInset,
          height: navInset > 0 ? `calc(100dvh - ${navInset}px)` : "100dvh",
          paddingBottom: 0,
        }
      : null),
  };

  if (!item && isFeedHome) {
    const empty = (
      <div
        style={overlayStyle}
        data-testid="see-whos-eating-fullscreen"
        data-variant="feedHome"
        role="region"
        aria-label="Feed"
      >
        {headerSlot}
        {showEmptyFirstVisitPrompt ? (
          <p style={styles.emptyFeed} data-testid="feed-empty-first-visit-prompt">
            {FEED_EMPTY_FIRST_VISIT_PROMPT_COPY}
          </p>
        ) : null}
      </div>
    );
    return createPortal(empty, document.body);
  }

  const ui = (
    <div
      style={overlayStyle}
      data-testid="see-whos-eating-fullscreen"
      data-variant={variant}
      role={isFeedHome ? "region" : "dialog"}
      aria-modal={isFeedHome ? undefined : "true"}
      aria-label={isFeedHome ? "Feed" : "See who's eating"}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {headerSlot}
      {!isFeedHome ? (
        <>
          <button
            type="button"
            style={styles.close}
            onClick={onClose}
            aria-label="Close fullscreen"
            data-testid="see-whos-eating-fullscreen-close"
          >
            ×
          </button>

          <button
            type="button"
            style={styles.exitChip}
            onClick={onClose}
            data-testid="see-whos-eating-fullscreen-exit"
          >
            Exit
          </button>
        </>
      ) : null}

      {restaurantRef && isFeedHome ? (
        <button
          type="button"
          style={styles.bookmarkBtn}
          aria-label={menuBookmarked ? "Remove menu bookmark" : "Save restaurant menu"}
          aria-pressed={menuBookmarked}
          data-testid="see-whos-eating-menu-bookmark"
          onClick={onToggleMenuBookmark}
        >
          {menuBookmarked ? "★ Saved" : "☆ Save menu"}
        </button>
      ) : null}

      {item && isFeedHome && feedShareData ? (
        <div
          style={{
            ...styles.shareBtnWrap,
            top: restaurantRef
              ? "calc(max(16px, env(safe-area-inset-top)) + 48px)"
              : "max(16px, env(safe-area-inset-top))",
          }}
          data-testid="see-whos-eating-share-wrap"
        >
          <ShareButton
            shareData={feedShareData}
            variant="menu"
            label="Share"
            modalTitle="Share video"
            iconOnly
            tone="ghost"
            size="compact"
            stopPropagation
            analyticsContext={{ surface: "feed_home_video", clip_id: item.id }}
          />
        </div>
      ) : null}

      {showSharedAccountInvite && isFeedHome && !isAuthenticated ? (
        <div style={styles.sharedInviteWrap}>
          <MenuplyAccountInviteCard
            variant="dark"
            nextPath={sharedClipNextPath}
            testId="feed-shared-clip-account-invite"
          />
        </div>
      ) : null}

      {menuBookmarkToast && isFeedHome ? (
        <p style={styles.bookmarkToast} role="status" data-testid="see-whos-eating-menu-bookmark-toast">
          {menuBookmarkToast}
        </p>
      ) : null}

      <video
        key={item.id}
        ref={videoRef}
        src={stripMediaUrlFragment(item.video_url)}
        style={{
          ...styles.video,
          ...feedVideoElementStyle({ desktopFeedShell: isFeedHome && desktopFeedShell }),
        }}
        playsInline
        muted={videoMuted}
        loop
        autoPlay
        controls={false}
        preload="auto"
        data-testid="see-whos-eating-video-tap"
        onClick={onVideoClick}
        onPointerUp={onVideoPointerUp}
      />

      {showDesktopSoundLayer ? (
        <button
          type="button"
          style={styles.videoTapLayer}
          aria-label={videoMuted ? soundToggleLabel : "Mute video"}
          data-testid="see-whos-eating-video-sound-layer"
          onClick={onToggleVideoSound}
        />
      ) : null}

      <button
        type="button"
        style={{
          ...styles.soundToggle,
          ...(isFeedHome
            ? {
                top: "max(16px, env(safe-area-inset-top))",
                left: "max(16px, env(safe-area-inset-left))",
              }
            : {
                left: "auto",
                right: "max(12px, env(safe-area-inset-right))",
                top: "calc(max(16px, env(safe-area-inset-top)) + 52px)",
              }),
        }}
        aria-label={videoMuted ? soundPromptLabel : "Mute video"}
        data-testid="see-whos-eating-sound-toggle"
        onClick={onToggleVideoSound}
      >
        {soundToggleLabel}
      </button>

      <div style={styles.metaDock}>
        <button
          type="button"
          style={styles.screenNameBtn}
          data-testid="see-whos-eating-screen-name"
          disabled={(connectBusy && !isVenue && !showRestaurantBadge) || isLiveFeedGuestCreator(item)}
          onClick={onScreenNameClick}
        >
          {screenName}
        </button>
        {showRestaurantBadge ? (
          <span style={styles.restaurantBadge} data-testid="see-whos-eating-restaurant-badge">
            Restaurant
          </span>
        ) : null}
        <FeedPlaceCaption item={item} onMenuLinkClick={onFeedMenuLinkClick} />
        {connectNotice ? <p style={styles.notice}>{connectNotice}</p> : null}
        {connectError ? <p style={styles.error}>{connectError}</p> : null}
        {removeError ? <p style={styles.error}>{removeError}</p> : null}
        {isOwnDinerClip ? (
          <button
            type="button"
            style={styles.removeBtn}
            disabled={removeBusy}
            onClick={onRemoveFromPublicFeed}
            data-testid="see-whos-eating-remove-public-feed"
          >
            {removeBusy ? "Removing…" : "Remove from Public Feed"}
          </button>
        ) : null}
        {item.is_recommend ? <p style={styles.recommend}>Recommend</p> : null}
        {(variant !== "feedHome" || isDesktopViewport) ? (
          <p style={styles.hint}>
            {formatVerticalReelNavHint({
              index,
              total: items.length,
              atStart,
              atEnd,
              isDesktopViewport,
              modalWithExit: variant === "modal",
            })}
          </p>
        ) : null}
      </div>

      {showInviteShare ? (
        <div
          style={{
            ...styles.feedActionDock,
            bottom: `calc(${navInset}px + max(28px, env(safe-area-inset-bottom)) + 12px)`,
          }}
        >
          <button
            type="button"
            style={styles.yellowBrowserBtn}
            data-testid="feed-video-yellow-browser"
            aria-label="Yellow Browser — open restaurant menu"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const ref = restaurantRefFromFeedItem(item);
              if (!ref) return;
              recordFeedMenuOpen(ref);
              const menuPath = menuPathFromRestaurantRef(ref);
              if (menuPath) navigate(menuPath);
            }}
          >
            <BrowseMenusIcon size={28} title="Yellow Browser" />
          </button>
          <button
            type="button"
            style={styles.inviteShareBtn}
            data-testid="feed-video-share-invite"
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

      {!atEnd ? (
        <div style={styles.swipeCue} aria-hidden="true">
          {formatVerticalReelCue({ isDesktopViewport })}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {createPortal(ui, document.body)}
      {showInviteShare ? (
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
      ) : null}
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100dvh",
    boxSizing: "border-box",
    zIndex: 200000,
    background: "#000",
    overflow: "hidden",
    overscrollBehavior: "none",
  },
  close: {
    position: "absolute",
    top: "max(12px, env(safe-area-inset-top))",
    right: "max(12px, env(safe-area-inset-right))",
    zIndex: 3,
    width: 44,
    height: 44,
    border: "none",
    borderRadius: 22,
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 30,
    lineHeight: 1,
    cursor: "pointer",
  },
  exitChip: {
    position: "absolute",
    top: "max(16px, env(safe-area-inset-top))",
    left: "max(12px, env(safe-area-inset-left))",
    zIndex: 3,
    border: "1px solid rgba(255,255,255,0.45)",
    borderRadius: 999,
    padding: "8px 14px",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.02em",
    cursor: "pointer",
  },
  bookmarkBtn: {
    position: "absolute",
    top: "max(16px, env(safe-area-inset-top))",
    right: "max(12px, env(safe-area-inset-right))",
    zIndex: 3,
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(0,0,0,0.55)",
    color: "#fde68a",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  shareBtnWrap: {
    position: "absolute",
    right: "max(8px, env(safe-area-inset-right))",
    zIndex: 3,
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
  sharedInviteWrap: {
    position: "absolute",
    left: "max(12px, env(safe-area-inset-left))",
    right: "max(12px, env(safe-area-inset-right))",
    top: "max(12px, env(safe-area-inset-top))",
    zIndex: 4,
    pointerEvents: "auto",
  },
  bookmarkToast: {
    position: "absolute",
    top: "calc(max(16px, env(safe-area-inset-top)) + 44px)",
    right: "max(12px, env(safe-area-inset-right))",
    zIndex: 4,
    margin: 0,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(16, 40, 32, 0.92)",
    color: "#5eead4",
    fontSize: 12,
    fontWeight: 700,
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
    zIndex: 4,
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
  metaDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "28px max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
    color: "#fff",
    textShadow: "0 1px 4px rgba(0,0,0,0.65)",
    pointerEvents: "auto",
    zIndex: 3,
    background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 32%, rgba(0,0,0,0.88) 100%)",
  },
  captionMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px 10px",
    margin: "0 0 8px",
    maxWidth: "100%",
  },
  categoryChip: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: "#5eead4",
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(94, 234, 212, 0.45)",
    borderRadius: 6,
    padding: "4px 10px",
    flexShrink: 0,
    maxWidth: "100%",
    lineHeight: 1.25,
    whiteSpace: "normal",
  },
  contentLink: {
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    textDecoration: "underline",
    textUnderlineOffset: 3,
    minHeight: 32,
    display: "inline-flex",
    alignItems: "center",
    touchAction: "manipulation",
  },
  foodPlain: {
    fontSize: 15,
    fontWeight: 600,
    color: "rgba(255,255,255,0.92)",
  },
  captionSep: {
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
  },
  emptyFeed: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "40%",
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.45,
    zIndex: 2,
  },
  secondaryLink: {
    display: "block",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 600,
    fontSize: 14,
    margin: "0 0 8px",
    textDecoration: "underline",
    textUnderlineOffset: 2,
    touchAction: "manipulation",
  },
  screenNameBtn: {
    display: "inline-block",
    margin: "0 0 2px",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: 17,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  restaurantBadge: {
    display: "inline-block",
    margin: "0 0 8px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#fde68a",
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(253, 230, 138, 0.45)",
    borderRadius: 6,
    padding: "3px 8px",
  },
  notice: { margin: "0 0 6px", fontSize: 13, color: "#bbf7d0", fontWeight: 600 },
  error: { margin: "0 0 6px", fontSize: 13, color: "#fecaca", fontWeight: 600 },
  removeBtn: {
    display: "inline-block",
    margin: "0 0 10px",
    padding: "8px 12px",
    minHeight: 40,
    border: "1px solid rgba(254, 202, 202, 0.55)",
    borderRadius: 8,
    background: "rgba(0,0,0,0.5)",
    color: "#fecaca",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    touchAction: "manipulation",
  },
  recommend: {
    margin: "0 0 6px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#bbf7d0",
  },
  hint: { margin: 0, fontSize: 12, opacity: 0.8 },
  swipeCue: {
    position: "absolute",
    left: "50%",
    bottom: "max(88px, calc(env(safe-area-inset-bottom) + 72px))",
    transform: "translateX(-50%)",
    zIndex: 2,
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.4)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: 600,
    pointerEvents: "none",
  },
};
