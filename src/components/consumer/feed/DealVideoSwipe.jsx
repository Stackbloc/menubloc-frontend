/**
 * TikTok-style swipe reel for restaurant deal videos (Feed Deals).
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { stripMediaUrlFragment } from "../../../lib/menuplyLiveFeedControl.js";
import { recordFeedMenuOpen, restaurantRefFromDealItem } from "../../../lib/feedMenuLibrary.js";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";
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
  const isDesktopViewport = useFeedShellDesktop();
  const videoRef = useRef(null);
  const touchStartY = useRef(null);
  const item = items[index] || null;

  useEffect(() => {
    setIndex(Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)));
  }, [startIndex, items.length]);

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
  }, [items.length, index]);

  function goNext() {
    setIndex((i) => (i + 1 < items.length ? i + 1 : i));
  }

  function goPrev() {
    setIndex((i) => (i > 0 ? i - 1 : i));
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
    if (dy < 0) goNext();
    else goPrev();
  }

  if (typeof document === "undefined") return null;

  const overlayStyle = {
    ...styles.overlay,
    ...(containInShell ? styles.overlayContained : null),
    paddingBottom: Math.max(0, Number(bottomInset) || 0),
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
        data-testid="feed-deals-video"
      />

      <div
        style={{
          ...styles.meta,
          bottom: `calc(${Math.max(0, Number(bottomInset) || 0)}px + max(12px, env(safe-area-inset-bottom)))`,
        }}
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

      {!atEnd ? (
        <div style={styles.swipeCue} aria-hidden="true">
          {formatVerticalReelCue({ isDesktopViewport })}
        </div>
      ) : null}
    </div>
  );

  return containInShell ? ui : createPortal(ui, document.body);
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
    objectFit: "cover",
    background: "#000",
  },
  meta: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
    padding: "0 16px 8px",
    background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
    color: "#fff",
    pointerEvents: "none",
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
