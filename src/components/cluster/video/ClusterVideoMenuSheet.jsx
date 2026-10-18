/**
 * Video → dish → basket without leaving the cluster: the clip's restaurant menu in a sheet,
 * with the video's dish pinned under the header as "From the video" (same CatalogMenuRenderer
 * treatment as the Feed Menu Browser, including Add to basket). Close returns to the cluster
 * exactly where the diner was.
 */

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import CatalogMenuRenderer from "../../menuCatalog/CatalogMenuRenderer.jsx";
import { clusterVideoDishName } from "../../../lib/clusterVideoIndex.js";

/** Room under the last dish / beside the order bar for the compact floating player. */
const SHEET_PLAYER_CLEARANCE_PX = 200;
const SHEET_ORDER_BAR_INSET_RIGHT_PX = 136;

export default function ClusterVideoMenuSheet({ cluster, video, item = null, withPlayer = false, onClose }) {
  const entry = useMemo(() => {
    if (!video?.restaurant_id) return null;
    return {
      restaurant_id: video.restaurant_id,
      restaurant_name: video.restaurant_name || undefined,
      slug: video.restaurant_slug || undefined,
      city: video.city || cluster?.city || undefined,
      state: video.state || cluster?.state || undefined,
    };
  }, [video, cluster]);

  const locationParams = useMemo(() => {
    const out = {};
    if (cluster?.city) out.city = cluster.city;
    if (cluster?.state) out.state = cluster.state;
    return out;
  }, [cluster]);

  // The row the diner tapped carries this menu's own id (chain stores list canonical ids);
  // the clip's id and dish name are the fallbacks.
  const highlightId = item?.menu_item_id ?? video?.menu_item_id ?? null;
  const highlightName = (item && (item.name || item.menu_item_name)) || clusterVideoDishName(video);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!entry || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.restaurant_name || "Restaurant"} menu`}
      data-testid="cluster-video-menu-sheet"
      data-restaurant-id={String(entry.restaurant_id)}
      style={styles.root}
    >
      <header style={styles.header}>
        <button
          type="button"
          style={styles.back}
          data-testid="cluster-video-menu-sheet-close"
          aria-label={`Back to ${cluster?.name || "cluster"}`}
          onClick={onClose}
        >
          ←
        </button>
        <span style={styles.title}>{entry.restaurant_name || "Menu"}</span>
        <span style={styles.spacer} aria-hidden="true" />
      </header>
      <div style={styles.body}>
        <CatalogMenuRenderer
          key={`${entry.restaurant_id}-${highlightId || highlightName || "none"}`}
          entry={entry}
          locationParams={locationParams}
          isMobile
          highlightMenuItemId={highlightId}
          highlightMenuItemName={highlightName}
          pinnedItemLabel={highlightName ? "From the video" : null}
          enableRestaurantContextualVideo={false}
          bottomClearance={withPlayer ? SHEET_PLAYER_CLEARANCE_PX : 0}
          orderBarInsetRight={withPlayer ? SHEET_ORDER_BAR_INSET_RIGHT_PX : 0}
        />
      </div>
    </div>,
    document.body
  );
}

const styles = {
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 220,
    display: "flex",
    flexDirection: "column",
    background: "var(--gb-color-page, #fff8e6)",
    color: "#0f172a",
  },
  header: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    paddingTop: "max(10px, env(safe-area-inset-top))",
    background: "rgba(15, 23, 42, 0.94)",
    color: "#e8f0ec",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
    lineHeight: 1,
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
  spacer: { width: 36, flexShrink: 0 },
  // Same container contract as the Feed Menu Browser: the renderer scrolls itself.
  body: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    touchAction: "pan-y",
  },
};
