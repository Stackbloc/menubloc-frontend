/**
 * My Menuply See Who's Eating — sticky muted autoplay reel (high-tech frame).
 * Guests may watch; Connect on screen name requires sign-in.
 * Dish identity is CK menu_item_id only.
 */

import { useEffect, useRef, useState } from "react";
import { listSeeWhosEating } from "../../../lib/consumerApi.js";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import {
  MENUPY_CLOSE_LIVE_FEED_FULLSCREEN,
  MENUPY_PAUSE_LIVE_FEED,
  MENUPY_RESUME_LIVE_FEED,
  getMealVideoPlayDepth,
  stripMediaUrlFragment,
} from "../../../lib/menuplyLiveFeedControl.js";
import SeeWhosEatingFullscreen from "./SeeWhosEatingFullscreen.jsx";

const DEFAULT_MARKET = { city: "Los Angeles", state: "CA" };

function resolveMarket({ city, state } = {}) {
  const fromPropsCity = String(city || "").trim();
  const fromPropsState = String(state || "").trim().toUpperCase().slice(0, 2);
  if (fromPropsCity && fromPropsState) {
    return { city: fromPropsCity, state: fromPropsState };
  }
  if (typeof window === "undefined") return DEFAULT_MARKET;
  const detected = readDetectedLocation(window.localStorage);
  const dCity = String(detected?.city || "").trim();
  const dState = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  if (dCity && dState) return { city: dCity, state: dState };
  return DEFAULT_MARKET;
}

export default function SeeWhosEatingSurface({
  city = null,
  state = null,
  isAuthenticated = false,
  viewerUserId = null,
  /** When true (default), this surface owns sticky positioning. Parent may set false when title+feed share one sticky shell. */
  sticky = true,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyReason, setEmptyReason] = useState(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const videoRef = useRef(null);
  const market = resolveMarket({ city, state });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listSeeWhosEating({ city: market.city, state: market.state, limit: 20 })
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.items) ? data.items : [];
        setItems(rows);
        setEmptyReason(data?.empty_reason || (rows.length ? null : "no_videos"));
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setError(err?.message || "Unable to load videos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [market.city, market.state]);

  const preview = items[0] || null;
  const marketLabel = `${market.city}, ${market.state}`.toUpperCase();

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !preview?.video_url) return undefined;

    function onPauseLive() {
      try {
        el.pause();
      } catch {
        /* ignore */
      }
    }
    function onResumeLive() {
      if (fullscreenOpen) return;
      if (getMealVideoPlayDepth() > 0) return;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    window.addEventListener(MENUPY_PAUSE_LIVE_FEED, onPauseLive);
    window.addEventListener(MENUPY_RESUME_LIVE_FEED, onResumeLive);
    if (!fullscreenOpen && getMealVideoPlayDepth() === 0) {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
    return () => {
      window.removeEventListener(MENUPY_PAUSE_LIVE_FEED, onPauseLive);
      window.removeEventListener(MENUPY_RESUME_LIVE_FEED, onResumeLive);
    };
  }, [preview?.id, preview?.video_url, fullscreenOpen]);

  useEffect(() => {
    function onCloseFs() {
      setFullscreenOpen(false);
    }
    window.addEventListener(MENUPY_CLOSE_LIVE_FEED_FULLSCREEN, onCloseFs);
    return () => window.removeEventListener(MENUPY_CLOSE_LIVE_FEED_FULLSCREEN, onCloseFs);
  }, []);

  function openAt(index) {
    setStartIndex(index);
    setFullscreenOpen(true);
  }

  return (
    <div
      style={sticky ? styles.stickyShell : styles.embeddedShell}
      data-testid="see-whos-eating-surface"
      data-sticky={sticky ? "1" : "0"}
    >
      <div style={styles.panel}>
        <div style={styles.hudRow}>
          <div style={styles.hudLeft}>
            <span style={styles.liveDot} aria-hidden="true" />
            <span style={styles.liveLabel}>LIVE FEED</span>
            <span style={styles.divider}>/</span>
            <span style={styles.kicker}>See who&apos;s eating</span>
          </div>
          <span style={styles.marketChip} title={marketLabel}>
            {marketLabel}
          </span>
        </div>

        <button
          type="button"
          style={styles.reelBtn}
          data-testid="see-whos-eating-preview"
          onClick={() => openAt(0)}
          disabled={!preview}
          aria-label={preview ? "Open See who's eating reel" : "No market videos yet"}
        >
          <span style={styles.cornerTL} aria-hidden="true" />
          <span style={styles.cornerTR} aria-hidden="true" />
          <span style={styles.cornerBL} aria-hidden="true" />
          <span style={styles.cornerBR} aria-hidden="true" />
          <span style={styles.scanOverlay} aria-hidden="true" />

          {preview?.video_url ? (
            <video
              ref={videoRef}
              key={preview.id || preview.video_url}
              src={stripMediaUrlFragment(preview.video_url)}
              style={styles.video}
              muted
              playsInline
              loop
              autoPlay
              controls={false}
              preload="auto"
              onCanPlay={(e) => {
                if (fullscreenOpen || getMealVideoPlayDepth() > 0) return;
                const p = e.currentTarget.play();
                if (p && typeof p.catch === "function") p.catch(() => {});
              }}
              onLoadedData={(e) => {
                if (fullscreenOpen || getMealVideoPlayDepth() > 0) return;
                const p = e.currentTarget.play();
                if (p && typeof p.catch === "function") p.catch(() => {});
              }}
            />
          ) : (
            <div style={styles.empty}>
              {loading ? (
                <span style={styles.emptyCode}>SYNCING MARKET…</span>
              ) : error ? (
                <span>{error}</span>
              ) : (
                <span style={styles.emptyCode}>
                  {emptyReason === "no_market" || emptyReason === "guest_market_required"
                    ? "NO GEO LOCK — ADD LOCATION"
                    : "NO SIGNAL IN THIS MARKET"}
                </span>
              )}
            </div>
          )}

          {preview ? (
            <div style={styles.caption}>
              <span style={styles.screenName}>
                @{preview.diner?.display_name || "diner"}
              </span>
              {preview.is_recommend ? <span style={styles.badge}>REC</span> : null}
              <span style={styles.tapHint}>TAP · FULL SCREEN</span>
            </div>
          ) : null}
        </button>

        {!isAuthenticated ? (
          <p style={styles.guestHint}>
            Watch freely. Sign in to Connect when you tap a screen name.
          </p>
        ) : (
          <p style={styles.guestHint}>
            {items.length
              ? `${items.length} signal${items.length === 1 ? "" : "s"} in range · tap to expand`
              : "Waiting for nearby diner video"}
          </p>
        )}
      </div>

      {fullscreenOpen ? (
        <SeeWhosEatingFullscreen
          items={items}
          startIndex={startIndex}
          isAuthenticated={isAuthenticated}
          viewerUserId={viewerUserId}
          onClose={() => setFullscreenOpen(false)}
        />
      ) : null}
    </div>
  );
}

const ACCENT = "#5eead4";
const PANEL_BG =
  "linear-gradient(165deg, rgba(2, 18, 12, 0.97) 0%, rgba(6, 46, 28, 0.94) 55%, rgba(4, 32, 20, 0.98) 100%)";

const styles = {
  stickyShell: {
    position: "sticky",
    top: "var(--sph-h, 56px)",
    zIndex: 40,
    margin: "0 -16px 14px",
    padding: "10px 16px 12px",
    background: PANEL_BG,
    borderBottom: `1px solid rgba(94, 234, 212, 0.28)`,
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  /** Nested under My Menuply sticky title+feed cluster — no second sticky. */
  embeddedShell: {
    position: "relative",
    margin: 0,
    padding: "8px 16px 12px",
    background: PANEL_BG,
    borderBottom: `1px solid rgba(94, 234, 212, 0.28)`,
    borderRadius: "0 0 18px 18px",
  },
  panel: {
    maxWidth: 420,
    margin: "0 auto",
  },
  hudRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  hudLeft: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    flexWrap: "wrap",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#34d399",
    boxShadow: "0 0 0 3px rgba(52, 211, 153, 0.25), 0 0 10px rgba(52, 211, 153, 0.8)",
    flexShrink: 0,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: ACCENT,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  divider: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 11,
  },
  kicker: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.78)",
  },
  marketChip: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: ACCENT,
    border: `1px solid rgba(94, 234, 212, 0.35)`,
    borderRadius: 4,
    padding: "3px 7px",
    whiteSpace: "nowrap",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    maxWidth: "42%",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  reelBtn: {
    display: "block",
    width: "100%",
    padding: 0,
    border: `1px solid rgba(94, 234, 212, 0.45)`,
    borderRadius: 10,
    overflow: "hidden",
    background: "rgba(0,0,0,0.55)",
    cursor: "pointer",
    position: "relative",
    aspectRatio: "9 / 16",
    maxHeight: 240,
    margin: "0 auto",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 24px rgba(52, 211, 153, 0.12)",
  },
  cornerTL: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 14,
    height: 14,
    borderTop: `2px solid ${ACCENT}`,
    borderLeft: `2px solid ${ACCENT}`,
    zIndex: 2,
    pointerEvents: "none",
  },
  cornerTR: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderTop: `2px solid ${ACCENT}`,
    borderRight: `2px solid ${ACCENT}`,
    zIndex: 2,
    pointerEvents: "none",
  },
  cornerBL: {
    position: "absolute",
    bottom: 6,
    left: 6,
    width: 14,
    height: 14,
    borderBottom: `2px solid ${ACCENT}`,
    borderLeft: `2px solid ${ACCENT}`,
    zIndex: 2,
    pointerEvents: "none",
  },
  cornerBR: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    borderBottom: `2px solid ${ACCENT}`,
    borderRight: `2px solid ${ACCENT}`,
    zIndex: 2,
    pointerEvents: "none",
  },
  scanOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    pointerEvents: "none",
    background:
      "linear-gradient(180deg, rgba(94,234,212,0.08) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.35) 100%), repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.04) 2px 3px)",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "#020b07",
  },
  empty: {
    minHeight: 160,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    textAlign: "center",
  },
  emptyCode: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    letterSpacing: "0.08em",
    fontSize: 11,
    color: ACCENT,
  },
  caption: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
    textShadow: "0 1px 3px rgba(0,0,0,0.75)",
  },
  screenName: {
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: "0.02em",
  },
  badge: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#052e16",
    background: ACCENT,
    borderRadius: 3,
    padding: "2px 5px",
  },
  tapHint: {
    marginLeft: "auto",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.65)",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  guestHint: {
    margin: "8px 0 0",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.4,
    letterSpacing: "0.02em",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
};
