/**
 * TikTok-style See Who's Eating fullscreen reel.
 * Edge-to-edge cover video · swipe/flip up for next · clear exit (× / Escape / swipe down on first).
 * Screen name → Connect request when signed in; guests → login.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { requestConnection } from "../../../lib/consumerApi.js";
import {
  MENUPY_CLOSE_LIVE_FEED_FULLSCREEN,
  stripMediaUrlFragment,
} from "../../../lib/menuplyLiveFeedControl.js";
import {
  dinerPeerProfilePath,
  liveFeedCategoryLabel,
} from "../../../lib/liveFeedCategory.js";

const SWIPE_MIN_PX = 56;

export default function SeeWhosEatingFullscreen({
  items = [],
  startIndex = 0,
  isAuthenticated = false,
  viewerUserId = null,
  onClose,
}) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(startIndex);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectNotice, setConnectNotice] = useState("");
  const [connectError, setConnectError] = useState("");
  const videoRef = useRef(null);
  const touchStartY = useRef(null);
  const item = items[index] || null;

  useEffect(() => {
    setIndex(Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)));
  }, [startIndex, items.length]);

  useEffect(() => {
    setConnectNotice("");
    setConnectError("");
  }, [index, item?.id]);

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
    const onReady = () => {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    if (el.readyState >= 2) onReady();
    else {
      el.addEventListener("loadeddata", onReady);
      el.addEventListener("canplay", onReady);
    }
    return () => {
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("canplay", onReady);
    };
  }, [index, item?.id]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
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
  }, [items.length, index, onClose]);

  function goNext() {
    setIndex((i) => (i + 1 < items.length ? i + 1 : i));
  }

  function goPrevOrClose() {
    if (index <= 0) {
      onClose?.();
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

  function openPosterProfile(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const path = dinerPeerProfilePath(item?.diner?.id);
    if (!path) return;
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
    const peerId = item?.diner?.id != null ? Number(item.diner.id) : null;
    if (!peerId) return;

    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/my-menuply")}`);
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

  if (!item || typeof document === "undefined") return null;

  const dishHref =
    item.menu_item_href ||
    (item.menu_item_id ? `/menu-items/${item.menu_item_id}` : null);
  const restaurantHref = item.restaurant_slug
    ? `/r/${encodeURIComponent(item.restaurant_slug)}`
    : null;
  const screenName = item.diner?.display_name || "A diner";
  const atEnd = index >= items.length - 1;
  const atStart = index <= 0;

  const ui = (
    <div
      style={styles.overlay}
      data-testid="see-whos-eating-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label="See who's eating"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
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

      <video
        key={item.id}
        ref={videoRef}
        src={stripMediaUrlFragment(item.video_url)}
        style={styles.video}
        playsInline
        muted
        loop
        autoPlay
        controls={false}
        preload="auto"
        data-testid="see-whos-eating-video-tap"
        onClick={openPosterProfile}
      />

      <div style={styles.meta}>
        <button
          type="button"
          style={styles.screenNameBtn}
          data-testid="see-whos-eating-screen-name"
          disabled={connectBusy}
          onClick={onScreenNameClick}
        >
          @{screenName}
        </button>
        <p style={styles.category} data-testid="see-whos-eating-fullscreen-category">
          {liveFeedCategoryLabel(item.kind)}
        </p>
        {connectNotice ? <p style={styles.notice}>{connectNotice}</p> : null}
        {connectError ? <p style={styles.error}>{connectError}</p> : null}
        {item.is_recommend ? <p style={styles.recommend}>Recommend</p> : null}
        {restaurantHref ? (
          <Link to={restaurantHref} style={styles.link} onClick={(e) => e.stopPropagation()}>
            {item.restaurant_name || "Restaurant"}
          </Link>
        ) : item.restaurant_name ? (
          <p style={styles.place}>{item.restaurant_name}</p>
        ) : null}
        {dishHref ? (
          <Link to={dishHref} style={styles.dish} onClick={(e) => e.stopPropagation()}>
            {item.item_name || item.food_name || "Dish"}
          </Link>
        ) : (
          <p style={styles.place}>{item.item_name || item.food_name || ""}</p>
        )}
        <p style={styles.hint}>
          {index + 1} / {items.length}
          {atEnd
            ? " · swipe down for previous · Exit to leave"
            : atStart
              ? " · swipe up for next · swipe down or Exit to leave"
              : " · swipe up next · swipe down previous"}
        </p>
      </div>

      {!atEnd ? (
        <div style={styles.swipeCue} aria-hidden="true">
          ↑ Swipe up
        </div>
      ) : null}
    </div>
  );

  return createPortal(ui, document.body);
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100dvh",
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
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    background: "#000",
  },
  meta: {
    position: "absolute",
    left: "max(16px, env(safe-area-inset-left))",
    right: "max(16px, env(safe-area-inset-right))",
    bottom: "max(28px, env(safe-area-inset-bottom))",
    color: "#fff",
    textShadow: "0 1px 4px rgba(0,0,0,0.65)",
    pointerEvents: "auto",
    zIndex: 2,
  },
  category: {
    margin: "0 0 8px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.88)",
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
  notice: { margin: "0 0 6px", fontSize: 13, color: "#bbf7d0", fontWeight: 600 },
  error: { margin: "0 0 6px", fontSize: 13, color: "#fecaca", fontWeight: 600 },
  recommend: {
    margin: "0 0 6px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#bbf7d0",
  },
  link: {
    display: "block",
    color: "#fff",
    fontWeight: 700,
    marginBottom: 4,
    textDecoration: "underline",
  },
  dish: {
    display: "block",
    color: "#ecfdf5",
    fontWeight: 600,
    marginBottom: 6,
    textDecoration: "underline",
  },
  place: { margin: "0 0 4px", fontSize: 14, fontWeight: 600 },
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
