/**
 * MENUS tab — Feed-scoped Yellow Browser deck (saved + followed + 48h recents).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CatalogMenuRenderer, {
  prefetchCatalogMenu,
} from "../../../components/menuCatalog/CatalogMenuRenderer.jsx";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { getFollowedRestaurants } from "../../../lib/consumerApi.js";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import {
  FEED_MENU_FOLLOWS_CHANGED,
  FEED_MENU_LIBRARY_CHANGED,
  buildFeedMenuDeck,
  isFeedMenuBookmarked,
  readFeedMenuLibrary,
  recordFeedMenuOpen,
  removeFeedMenuSaved,
  toggleFeedMenuBookmark,
} from "../../../lib/feedMenuLibrary.js";
import { buildFeedMenuSampleDeck } from "../../../lib/feedMenuSampleStack.js";

const MENU_STACK_INSTRUCTION =
  "Liked restaurants stay here until you unlike them. Tap Save (☆) to pin any menu. Menus you open from Feed stay for 48 hours; saved pins stay until you remove them.";

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
  const { isAuthenticated } = useConsumer();
  const [followedRestaurants, setFollowedRestaurants] = useState([]);
  const [libraryTick, setLibraryTick] = useState(0);
  const personalDeck = useMemo(
    () => buildFeedMenuDeck(readFeedMenuLibrary(), Date.now(), followedRestaurants),
    [followedRestaurants, libraryTick]
  );
  const isSampleMode = personalDeck.length === 0;
  const deck = useMemo(
    () => (isSampleMode ? buildFeedMenuSampleDeck() : personalDeck),
    [isSampleMode, personalDeck]
  );
  const [index, setIndex] = useState(0);
  const [menuStatus, setMenuStatus] = useState("idle");
  const [toast, setToast] = useState("");
  const swipeRef = useRef({ startX: 0, startY: 0, active: false, axis: null });
  const areaRef = useRef(null);
  const locationParams = useMemo(() => resolveLocationParams(), []);

  const reloadLibrary = useCallback(() => {
    setLibraryTick((tick) => tick + 1);
  }, []);

  const loadFollowedRestaurants = useCallback(() => {
    if (!isAuthenticated) {
      setFollowedRestaurants([]);
      return undefined;
    }
    let alive = true;
    getFollowedRestaurants()
      .then((result) => {
        if (!alive) return;
        setFollowedRestaurants(result?.restaurants || []);
      })
      .catch(() => {
        if (alive) setFollowedRestaurants([]);
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    return loadFollowedRestaurants();
  }, [loadFollowedRestaurants]);

  useEffect(() => {
    reloadLibrary();
    function onLibraryChange() {
      reloadLibrary();
    }
    window.addEventListener(FEED_MENU_LIBRARY_CHANGED, onLibraryChange);
    window.addEventListener("storage", onLibraryChange);
    return () => {
      window.removeEventListener(FEED_MENU_LIBRARY_CHANGED, onLibraryChange);
      window.removeEventListener("storage", onLibraryChange);
    };
  }, [reloadLibrary]);

  useEffect(() => {
    function onFollowsChange() {
      loadFollowedRestaurants();
    }
    window.addEventListener(FEED_MENU_FOLLOWS_CHANGED, onFollowsChange);
    return () => {
      window.removeEventListener(FEED_MENU_FOLLOWS_CHANGED, onFollowsChange);
    };
  }, [loadFollowedRestaurants]);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, deck.length - 1)));
  }, [deck.length]);

  const current = deck[index] || null;
  const currentEntry = current ? deckToBrowseEntry(current) : null;
  const bookmarked = current ? isFeedMenuBookmarked(current.restaurant_id) : false;

  useEffect(() => {
    if (!current || isSampleMode) return;
    recordFeedMenuOpen(current);
    const next = deck[index + 1];
    if (next?.restaurant_id) prefetchCatalogMenu(next.restaurant_id, locationParams);
  }, [current?.restaurant_id, deck, index, locationParams, isSampleMode]);

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
    reloadLibrary();
  }

  function onRemoveSaved() {
    if (!current || current.tier !== "saved") return;
    removeFeedMenuSaved(current.restaurant_id);
    reloadLibrary();
  }

  const navBottom = `calc(${FEED_PRIMARY_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`;

  return (
    <div style={styles.page} data-testid="feed-menus">
      <header style={styles.header}>
        <div style={styles.headerMain}>
          <h1 style={styles.h1Compact}>My Menu Stack</h1>
          <span style={styles.counter} data-testid="feed-menus-counter">
            {index + 1} / {deck.length}
          </span>
          {isSampleMode ? (
            <span style={styles.tierBadge} data-testid="feed-menus-tier-sample">
              Sample
            </span>
          ) : current?.tier === "followed" ? (
            <span style={styles.tierBadge} data-testid="feed-menus-tier-followed">
              Liked
            </span>
          ) : current?.tier === "recent" ? (
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

      {isSampleMode ? (
        <div style={styles.sampleHint} data-testid="feed-menus-sample-hint">
          <p style={styles.sampleHintCopy}>{MENU_STACK_INSTRUCTION}</p>
          <div style={styles.sampleHintActions}>
            <Link to="/feed" style={styles.sampleHintLink} data-testid="feed-menus-browse-feed">
              Browse Feed
            </Link>
            <Link to="/browse-menus" style={styles.sampleHintLinkMuted} data-testid="feed-menus-discover">
              Discover restaurants
            </Link>
          </div>
        </div>
      ) : (
        <div style={styles.stackHint} data-testid="feed-menus-stack-hint">
          <p style={styles.stackHintCopy}>{MENU_STACK_INSTRUCTION}</p>
        </div>
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
  h1Compact: { margin: 0, fontSize: 18, fontWeight: 800, color: "#e8f0ec" },
  sampleHint: {
    margin: "0 12px 8px",
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(94, 234, 212, 0.08)",
    border: "1px solid rgba(94, 234, 212, 0.22)",
  },
  sampleHintCopy: {
    margin: "0 0 10px",
    color: "rgba(232,240,236,0.78)",
    fontSize: 13,
    lineHeight: 1.45,
  },
  sampleHintStrong: { color: "#e8f0ec", fontWeight: 750 },
  stackHint: {
    margin: "0 12px 8px",
    padding: "10px 14px",
    borderRadius: 12,
    background: "rgba(94, 234, 212, 0.06)",
    border: "1px solid rgba(94, 234, 212, 0.18)",
  },
  stackHintCopy: {
    margin: 0,
    color: "rgba(232,240,236,0.72)",
    fontSize: 12,
    lineHeight: 1.45,
  },
  sampleHintActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  sampleHintLink: {
    color: "#5eead4",
    fontWeight: 800,
    fontSize: 13,
    textDecoration: "none",
  },
  sampleHintLinkMuted: {
    color: "rgba(232,240,236,0.72)",
    fontWeight: 700,
    fontSize: 13,
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
  discoverInline: {
    color: "#0f766e",
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
  },
};
