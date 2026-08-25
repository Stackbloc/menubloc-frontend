/**
 * My Menuply green-band See Who's Eating surface — muted autoplay reel.
 * Guests may watch; Connect on screen name requires sign-in.
 * Dish identity is CK menu_item_id only.
 */

import { useEffect, useRef, useState } from "react";
import { listSeeWhosEating } from "../../../lib/consumerApi.js";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
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

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !preview?.video_url) return undefined;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    return undefined;
  }, [preview?.id, preview?.video_url]);

  function openAt(index) {
    setStartIndex(index);
    setFullscreenOpen(true);
  }

  return (
    <div style={styles.wrap} data-testid="see-whos-eating-surface">
      <p style={styles.kicker}>See who&apos;s eating</p>
      <button
        type="button"
        style={styles.reelBtn}
        data-testid="see-whos-eating-preview"
        onClick={() => openAt(0)}
        disabled={!preview}
        aria-label={preview ? "Open See who's eating reel" : "No market videos yet"}
      >
        {preview?.video_url ? (
          <video
            ref={videoRef}
            src={`${preview.video_url}#t=0.001`}
            style={styles.video}
            muted
            playsInline
            loop
            autoPlay
            controls={false}
          />
        ) : (
          <div style={styles.empty}>
            {loading ? (
              <span>Loading…</span>
            ) : error ? (
              <span>{error}</span>
            ) : (
              <span>
                {emptyReason === "no_market" || emptyReason === "guest_market_required"
                  ? "Add a location to see nearby diners."
                  : "No eating videos in this market yet."}
              </span>
            )}
          </div>
        )}
        {preview ? (
          <div style={styles.caption}>
            <span style={styles.screenName}>
              {preview.diner?.display_name || "A diner"}
            </span>
            {preview.is_recommend ? <span style={styles.badge}>Recommend</span> : null}
          </div>
        ) : null}
      </button>
      {!isAuthenticated ? (
        <p style={styles.guestHint}>
          Watch freely. Sign in to Connect when you tap a screen name.
        </p>
      ) : null}

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

const styles = {
  wrap: {
    margin: "0 0 12px",
  },
  kicker: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.72)",
    margin: "0 0 8px",
  },
  reelBtn: {
    display: "block",
    width: "100%",
    padding: 0,
    border: "none",
    borderRadius: 16,
    overflow: "hidden",
    background: "rgba(0,0,0,0.28)",
    cursor: "pointer",
    position: "relative",
    aspectRatio: "9 / 16",
    maxHeight: 280,
    margin: "0 auto",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "#052e16",
  },
  empty: {
    minHeight: 160,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    textAlign: "center",
  },
  caption: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
  },
  screenName: {
    fontWeight: 800,
    fontSize: 14,
  },
  badge: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#bbf7d0",
  },
  guestHint: {
    margin: "8px 0 0",
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.4,
  },
};
