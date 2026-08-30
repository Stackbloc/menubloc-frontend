/**
 * MENUS tab — Feed-scoped Yellow Browser deck (saved + 48h recents).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CatalogMenuRenderer, {
  prefetchCatalogMenu,
} from "../../../components/menuCatalog/CatalogMenuRenderer.jsx";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import {
  FEED_MENU_LIBRARY_CHANGED,
  buildFeedMenuDeck,
  isFeedMenuBookmarked,
  readFeedMenuLibrary,
  recordFeedMenuOpen,
  removeFeedMenuSaved,
  toggleFeedMenuBookmark,
} from "../../../lib/feedMenuLibrary.js";

function resolveLocationParams() {
  if (typeof window === "undefined") return {};
  const detected = readDetectedLocation(window.localStorage);
  const city = String(detected?.city || "").trim();
  const state = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  const lat = detected?.lat;
  const lng = detected?.lng;
  const out = {};
  if (city) out.city = city;
  if (state) out.state = state;
  if (lat != null && lng != null) {
    out.lat = lat;
    out.lng = lng;
  }
  return out;
}

function deckToBrowseEntry(row) {
  return {
    restaurant_id: row.restaurant_id,
    restaurant_name: row.restaurant_name,
    slug: row.slug,
    city: row.city,
    state: row.state,
  };
}

export default function FeedMenusPage() {
  const [deck, setDeck] = useState(() => buildFeedMenuDeck(readFeedMenuLibrary()));
  const [index, setIndex] = useState(0);
  const [menuStatus, setMenuStatus] = useState("idle");
  const [toast, setToast] = useState("");
  const swipeRef = useRef({ startX: 0, startY: 0, active: false, axis: null });
  const areaRef = useRef(null);
  const locationParams = useMemo(() => resolveLocationParams(), []);

  const reloadDeck = useCallback(() => {
    setDeck(buildFeedMenuDeck(readFeedMenuLibrary()));
  }, []);

  useEffect(() => {
    reloadDeck();
    function onChange() {
      reloadDeck();
    }
    window.addEventListener(FEED_MENU_LIBRARY_CHANGED, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(FEED_MENU_LIBRARY_CHANGED, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [reloadDeck]);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, deck.length - 1)));
  }, [deck.length]);

  const current = deck[index] || null;
  const currentEntry = current ? deckToBrowseEntry(current) : null;
  const bookmarked = current ? isFeedMenuBookmarked(current.restaurant_id) : false;

  useEffect(() => {
    if (!current) return;
    recordFeedMenuOpen(current);
    const next = deck[index + 1];
    if (next?.restaurant_id) prefetchCatalogMenu(next.restaurant_id, locationParams);
  }, [current?.restaurant_id, deck, index, locationParams]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1 < deck.length ? i + 1 : i));
  }, [deck.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const trySwipeNavigation = useCallback(
    (dx, dy) => {
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return false;
      if (dx < 0) goNext();
      else goPrev();
      return true;
    },
    [goNext, goPrev]
  );

  useEffect(() => {
    const el = areaRef.current;
    if (!el || deck.length === 0) return undefined;

    function resetSwipe() {
      swipeRef.current = { startX: 0, startY: 0, active: false, axis: null };
    }

    function handleTouchStart(event) {
      const touch = event.touches?.[0];
      if (!touch) return;
      swipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        active: true,
        axis: null,
      };
    }

    function handleTouchMove(event) {
      const touch = event.touches?.[0];
      if (!touch || !swipeRef.current.active) return;
      const dx = touch.clientX - swipeRef.current.startX;
      const dy = touch.clientY - swipeRef.current.startY;
      if (!swipeRef.current.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        swipeRef.current.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (swipeRef.current.axis === "x") event.preventDefault();
    }

    function handleTouchEnd(event) {
      const touch = event.changedTouches?.[0];
      if (!touch || !swipeRef.current.active) return;
      const dx = touch.clientX - swipeRef.current.startX;
      const dy = touch.clientY - swipeRef.current.startY;
      const wasHorizontal = swipeRef.current.axis === "x";
      resetSwipe();
      if (!wasHorizontal) return;
      trySwipeNavigation(dx, dy);
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true, capture: true });
    el.addEventListener("touchcancel", resetSwipe, { passive: true, capture: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart, { capture: true });
      el.removeEventListener("touchmove", handleTouchMove, { capture: true });
      el.removeEventListener("touchend", handleTouchEnd, { capture: true });
      el.removeEventListener("touchcancel", resetSwipe, { capture: true });
    };
  }, [deck.length, trySwipeNavigation]);

  function onToggleBookmark() {
    if (!current) return;
    const saved = toggleFeedMenuBookmark(current);
    setToast(saved ? "Saved to Menus" : "Removed from saved");
    reloadDeck();
  }

  function onRemoveSaved() {
    if (!current || current.tier !== "saved") return;
    removeFeedMenuSaved(current.restaurant_id);
    reloadDeck();
  }

  const navBottom = `calc(${FEED_PRIMARY_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`;

  if (deck.length === 0) {
    return (
      <div style={styles.emptyPage} data-testid="feed-menus-empty">
        <h1 style={styles.h1}>My Menu Stack</h1>
        <p style={styles.emptyCopy}>
          Tap <strong style={styles.emptyStrong}>Save</strong> (☆) or the{" "}
          <strong style={styles.emptyStrong}>restaurant name</strong> on a video. Menus you open stay
          for 48 hours; saves stay until you remove them.
        </p>
        <div style={styles.emptyActions}>
          <Link to="/feed" style={styles.primaryLink} data-testid="feed-menus-browse-feed">
            Browse Feed
          </Link>
          <Link to="/browse-menus" style={styles.discoverLink} data-testid="feed-menus-discover">
            Discover restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page} data-testid="feed-menus">
      <header style={styles.header}>
        <div style={styles.headerMain}>
          <h1 style={styles.h1Compact}>My Menu Stack</h1>
          <span style={styles.counter} data-testid="feed-menus-counter">
            {index + 1} / {deck.length}
          </span>
          {current?.tier === "recent" ? (
            <span style={styles.tierBadge} data-testid="feed-menus-tier-recent">
              Recent
            </span>
          ) : null}
        </div>
        <div style={styles.headerActions}>
          <button
            type="button"
            style={styles.iconBtn}
            aria-label={bookmarked ? "Remove bookmark" : "Save menu"}
            aria-pressed={bookmarked}
            data-testid="feed-menus-bookmark"
            onClick={onToggleBookmark}
          >
            {bookmarked ? "★" : "☆"}
          </button>
          {current?.tier === "saved" ? (
            <button
              type="button"
              style={styles.textBtn}
              data-testid="feed-menus-remove-saved"
              onClick={onRemoveSaved}
            >
              Remove
            </button>
          ) : null}
          <button
            type="button"
            style={styles.textBtn}
            disabled={index <= 0}
            onClick={goPrev}
            data-testid="feed-menus-prev"
          >
            Prev
          </button>
          <button
            type="button"
            style={styles.textBtn}
            disabled={index >= deck.length - 1}
            onClick={goNext}
            data-testid="feed-menus-next"
          >
            Next
          </button>
        </div>
      </header>

      {toast ? (
        <p style={styles.toast} role="status" data-testid="feed-menus-toast">
          {toast}
        </p>
      ) : null}

      <div ref={areaRef} style={{ ...styles.menuArea, paddingBottom: navBottom }}>
        {currentEntry ? (
          <CatalogMenuRenderer
            key={currentEntry.restaurant_id}
            entry={currentEntry}
            locationParams={locationParams}
            isMobile
            onLoadStateChange={setMenuStatus}
          />
        ) : null}
        {menuStatus === "error" ? (
          <p style={styles.menuError} role="alert">
            Unable to load this menu.
          </p>
        ) : null}
      </div>

      <div style={{ ...styles.footer, bottom: navBottom }}>
        <Link to="/browse-menus" style={styles.discoverInline} data-testid="feed-menus-discover-inline">
          Discover more restaurants
        </Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    background: "var(--gb-color-page, #fff8e6)",
    color: "#0f172a",
  },
  emptyPage: {
    minHeight: "100dvh",
    padding: `24px 20px calc(${FEED_PRIMARY_NAV_HEIGHT + 28}px + env(safe-area-inset-bottom))`,
    background: "#0b1210",
    color: "#e8f0ec",
  },
  h1: { margin: "8px 0 12px", fontSize: 28, fontWeight: 800 },
  h1Compact: { margin: 0, fontSize: 18, fontWeight: 800, color: "#e8f0ec" },
  emptyCopy: {
    margin: "0 0 20px",
    color: "rgba(232,240,236,0.72)",
    fontSize: 15,
    lineHeight: 1.45,
    maxWidth: 420,
  },
  emptyStrong: { color: "#e8f0ec", fontWeight: 750 },
  emptyActions: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "flex-start",
  },
  primaryLink: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 12,
    background: "rgba(94, 234, 212, 0.14)",
    border: "1px solid rgba(94, 234, 212, 0.35)",
    color: "#5eead4",
    fontWeight: 800,
    fontSize: 15,
    textDecoration: "none",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(8, 12, 10, 0.96)",
    color: "#e8f0ec",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  headerMain: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  headerActions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  counter: { fontSize: 13, color: "rgba(232,240,236,0.65)" },
  tierBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#5eead4",
    border: "1px solid rgba(94,234,212,0.35)",
    borderRadius: 999,
    padding: "2px 8px",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#fde68a",
    fontSize: 18,
    cursor: "pointer",
  },
  textBtn: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "#e8f0ec",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  toast: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    top: 56,
    zIndex: 30,
    margin: 0,
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(16, 40, 32, 0.95)",
    color: "#5eead4",
    fontSize: 13,
    fontWeight: 700,
  },
  menuArea: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    WebkitOverflowScrolling: "touch",
  },
  menuError: {
    margin: 12,
    padding: 10,
    borderRadius: 10,
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: 13,
  },
  footer: {
    position: "fixed",
    left: 0,
    right: 0,
    zIndex: 15,
    textAlign: "center",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.92)",
    borderTop: "1px solid rgba(0,0,0,0.06)",
  },
  discoverLink: {
    display: "inline-block",
    color: "#5eead4",
    fontWeight: 700,
    textDecoration: "none",
  },
  discoverInline: {
    color: "#0f766e",
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
  },
};
