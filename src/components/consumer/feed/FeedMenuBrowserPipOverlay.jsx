/**
 * Menu Browser — menu-primary panel with Feed video kept as PiP (parent owns the <video>).
 * Browse context is frozen to the restaurant selected at open; Feed may advance independently.
 */

import { useMemo } from "react";
import CatalogMenuRenderer from "../../menuCatalog/CatalogMenuRenderer.jsx";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";

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
 *   bottomInset?: number,
 *   onClose: () => void,
 *   onSwitchBrowseToPlaying?: () => void,
 * }} props
 */
export default function FeedMenuBrowserPipOverlay({
  restaurantRef,
  playingRestaurantRef = null,
  bottomInset = 0,
  onClose,
  onSwitchBrowseToPlaying,
}) {
  const locationParams = useMemo(() => resolveFeedMenuBrowserLocationParams(), []);
  const entry = useMemo(() => {
    if (!restaurantRef?.restaurant_id) return null;
    return {
      restaurant_id: restaurantRef.restaurant_id,
      restaurant_name: restaurantRef.restaurant_name,
      slug: restaurantRef.slug,
      city: restaurantRef.city,
      state: restaurantRef.state,
    };
  }, [restaurantRef]);

  const playingId = playingRestaurantRef?.restaurant_id
    ? String(playingRestaurantRef.restaurant_id)
    : "";
  const browseId = entry?.restaurant_id ? String(entry.restaurant_id) : "";
  const canSwitchBrowse =
    Boolean(playingId) &&
    Boolean(browseId) &&
    playingId !== browseId &&
    typeof onSwitchBrowseToPlaying === "function";

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
          aria-label="Back to Feed"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose?.();
          }}
        >
          ← Feed
        </button>
        <span style={styles.title} data-testid="feed-menu-browser-title">
          {entry.restaurant_name || "Menu"}
        </span>
        <span style={styles.headerSpacer} aria-hidden="true" />
      </header>

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

      <div style={styles.menuArea} data-testid="feed-menu-browser-menu">
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
    width: 72,
    flexShrink: 0,
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
    // Leave room so PiP video (parent) is not covered by scrolled content hit-targets at the corner.
    paddingBottom: "calc(max(28px, env(safe-area-inset-bottom)) + 220px)",
  },
};
