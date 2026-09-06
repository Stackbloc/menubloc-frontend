/**
 * Menu Browser — menu-primary panel; parent owns Feed PiP video.
 * Horizontal swipe walks restaurants discussed from open clip → current playing clip.
 * Full Feed exits Browse and restores the reel.
 */

import { useMemo, useRef } from "react";
import CatalogMenuRenderer from "../../menuCatalog/CatalogMenuRenderer.jsx";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import { clampBrowseTrailIndex } from "../../../lib/feedMenuBrowserTrail.js";

const SWIPE_MIN_PX = 48;

export function resolveFeedMenuBrowserLocationParams() {
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

/**
 * @param {{
 *   restaurantRef: { restaurant_id: string, restaurant_name?: string, slug?: string, city?: string, state?: string },
 *   playingRestaurantRef?: { restaurant_id: string, restaurant_name?: string } | null,
 *   trail?: object[],
 *   trailIndex?: number,
 *   bottomInset?: number,
 *   onClose: () => void,
 *   onTrailPrev?: () => void,
 *   onTrailNext?: () => void,
 *   onSwitchBrowseToPlaying?: () => void,
 * }} props
 */
export default function FeedMenuBrowserPipOverlay({
  restaurantRef,
  playingRestaurantRef = null,
  trail = null,
  trailIndex = 0,
  bottomInset = 0,
  onClose,
  onTrailPrev,
  onTrailNext,
  onSwitchBrowseToPlaying,
}) {
  const locationParams = useMemo(() => resolveFeedMenuBrowserLocationParams(), []);
  const swipeRef = useRef({ startX: 0, startY: 0, active: false, axis: null });

  const trailList = Array.isArray(trail) && trail.length > 0 ? trail : null;
  const activeIndex = trailList
    ? clampBrowseTrailIndex(trailIndex, trailList.length)
    : 0;
  const activeRef = trailList ? trailList[activeIndex] : restaurantRef;

  const entry = useMemo(() => {
    if (!activeRef?.restaurant_id) return null;
    return {
      restaurant_id: activeRef.restaurant_id,
      restaurant_name: activeRef.restaurant_name,
      slug: activeRef.slug,
      city: activeRef.city,
      state: activeRef.state,
    };
  }, [activeRef]);

  const playingId = playingRestaurantRef?.restaurant_id
    ? String(playingRestaurantRef.restaurant_id)
    : "";
  const browseId = entry?.restaurant_id ? String(entry.restaurant_id) : "";
  const canSwitchBrowse =
    Boolean(playingId) &&
    Boolean(browseId) &&
    playingId !== browseId &&
    typeof onSwitchBrowseToPlaying === "function";

  const trailCount = trailList?.length || 0;
  const canTrailPrev = trailCount > 1 && activeIndex > 0 && typeof onTrailPrev === "function";
  const canTrailNext =
    trailCount > 1 && activeIndex < trailCount - 1 && typeof onTrailNext === "function";

  function resetSwipe() {
    swipeRef.current = { startX: 0, startY: 0, active: false, axis: null };
  }

  function onAreaTouchStart(e) {
    e.stopPropagation();
    const touch = e.touches?.[0];
    if (!touch) return;
    swipeRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      active: true,
      axis: null,
    };
  }

  function onAreaTouchMove(e) {
    e.stopPropagation();
    const touch = e.touches?.[0];
    if (!touch || !swipeRef.current.active) return;
    const dx = touch.clientX - swipeRef.current.startX;
    const dy = touch.clientY - swipeRef.current.startY;
    if (!swipeRef.current.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      swipeRef.current.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (swipeRef.current.axis === "x") e.preventDefault();
  }

  function onAreaTouchEnd(e) {
    e.stopPropagation();
    const touch = e.changedTouches?.[0];
    if (!touch || !swipeRef.current.active) {
      resetSwipe();
      return;
    }
    const dx = touch.clientX - swipeRef.current.startX;
    const dy = touch.clientY - swipeRef.current.startY;
    const wasHorizontal = swipeRef.current.axis === "x";
    resetSwipe();
    if (!wasHorizontal) return;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    // Finger left → next menu toward current discussion; finger right → previous.
    if (dx < 0) onTrailNext?.();
    else onTrailPrev?.();
  }

  if (!entry) return null;

  const padBottom = Math.max(0, Number(bottomInset) || 0);

  return (
    <div
      style={{
        ...styles.root,
        paddingBottom: padBottom > 0 ? padBottom : undefined,
      }}
      data-testid="feed-menu-browser-pip"
      data-browse-restaurant-id={browseId}
      data-trail-index={String(activeIndex)}
      data-trail-count={String(trailCount || 1)}
      role="dialog"
      aria-modal="true"
      aria-label="Menu Browser"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <header style={styles.header}>
        <button
          type="button"
          style={styles.backBtn}
          data-testid="feed-menu-browser-close"
          aria-label="Full Feed"
          title="Full Feed"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose?.();
          }}
        >
          Full Feed
        </button>
        <span style={styles.title} data-testid="feed-menu-browser-title">
          {entry.restaurant_name || "Menu"}
        </span>
        {trailCount > 1 ? (
          <span style={styles.trailCounter} data-testid="feed-menu-browser-trail-counter">
            {activeIndex + 1} / {trailCount}
          </span>
        ) : (
          <span style={styles.headerSpacer} aria-hidden="true" />
        )}
      </header>

      {trailCount > 1 ? (
        <div style={styles.trailNav} data-testid="feed-menu-browser-trail-nav">
          <button
            type="button"
            style={{
              ...styles.trailBtn,
              ...(canTrailPrev ? null : styles.trailBtnDisabled),
            }}
            disabled={!canTrailPrev}
            data-testid="feed-menu-browser-trail-prev"
            aria-label="Previous discussed menu"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTrailPrev?.();
            }}
          >
            ← Prev menu
          </button>
          <span style={styles.trailHint}>Swipe menus · discussed in Feed</span>
          <button
            type="button"
            style={{
              ...styles.trailBtn,
              ...(canTrailNext ? null : styles.trailBtnDisabled),
            }}
            disabled={!canTrailNext}
            data-testid="feed-menu-browser-trail-next"
            aria-label="Next discussed menu"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTrailNext?.();
            }}
          >
            Next menu →
          </button>
        </div>
      ) : null}

      {canSwitchBrowse ? (
        <div style={styles.switchBar} data-testid="feed-menu-browser-switch-bar">
          <p style={styles.switchCopy}>
            Now playing{" "}
            <strong>{playingRestaurantRef.restaurant_name || "another restaurant"}</strong>
          </p>
          <button
            type="button"
            style={styles.switchBtn}
            data-testid="feed-menu-browser-switch"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSwitchBrowseToPlaying();
            }}
          >
            Browse this menu
          </button>
        </div>
      ) : null}

      <div
        style={styles.menuArea}
        data-testid="feed-menu-browser-menu"
        onTouchStart={onAreaTouchStart}
        onTouchMove={onAreaTouchMove}
        onTouchEnd={onAreaTouchEnd}
        onTouchCancel={resetSwipe}
      >
        <CatalogMenuRenderer
          key={entry.restaurant_id}
          entry={entry}
          locationParams={locationParams}
          isMobile
        />
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: "absolute",
    inset: 0,
    zIndex: 12,
    display: "flex",
    flexDirection: "column",
    background: "var(--gb-color-page, #fff8e6)",
    color: "#0f172a",
    pointerEvents: "auto",
  },
  header: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    paddingTop: "max(10px, env(safe-area-inset-top))",
    background: "rgba(15, 23, 42, 0.92)",
    color: "#e8f0ec",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    zIndex: 2,
  },
  backBtn: {
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: 800,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  headerSpacer: {
    width: 88,
    flexShrink: 0,
  },
  trailCounter: {
    flexShrink: 0,
    minWidth: 52,
    textAlign: "right",
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(232,240,236,0.85)",
  },
  trailNav: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "rgba(15, 23, 42, 0.82)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    zIndex: 2,
  },
  trailBtn: {
    border: "1px solid rgba(250, 204, 21, 0.55)",
    borderRadius: 999,
    padding: "6px 10px",
    background: "rgba(250, 204, 21, 0.16)",
    color: "#fde68a",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  trailBtnDisabled: {
    opacity: 0.35,
    cursor: "default",
  },
  trailHint: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(232,240,236,0.65)",
  },
  switchBar: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    padding: "8px 12px",
    background: "rgba(250, 204, 21, 0.18)",
    borderBottom: "1px solid rgba(234, 179, 8, 0.45)",
    zIndex: 2,
  },
  switchCopy: {
    margin: 0,
    flex: 1,
    minWidth: 140,
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  switchBtn: {
    border: "none",
    borderRadius: 999,
    padding: "8px 12px",
    background: "#EAB308",
    color: "#1a1a1a",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  menuArea: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    WebkitOverflowScrolling: "touch",
    paddingBottom: "calc(max(28px, env(safe-area-inset-bottom)) + 220px)",
    touchAction: "pan-y",
  },
};
