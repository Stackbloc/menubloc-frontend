/**
 * Feed home — immediate full-screen video swipe (TikTok/Reels-style).
 * Reuses SeeWhosEatingFullscreen; photos never enter this pool.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSeeWhosEating } from "../../../lib/consumerApi.js";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import SeeWhosEatingFullscreen from "../myMenuply/SeeWhosEatingFullscreen.jsx";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";

const DEFAULT_MARKET = { city: "Los Angeles", state: "CA" };

function resolveMarket() {
  if (typeof window === "undefined") return DEFAULT_MARKET;
  const detected = readDetectedLocation(window.localStorage);
  const dCity = String(detected?.city || "").trim();
  const dState = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  if (dCity && dState) return { city: dCity, state: dState };
  return DEFAULT_MARKET;
}

export default function FeedHomePage() {
  const { isAuthenticated, consumer } = useConsumer();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const market = resolveMarket();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listSeeWhosEating({
      city: market.city,
      state: market.state,
      limit: 20,
      kind: "all",
    })
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setError(err?.message || "Unable to load Feed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [market.city, market.state]);

  function onRemovedFromFeed(itemId) {
    const id = String(itemId || "").trim();
    if (!id) return;
    setItems((prev) => (prev || []).filter((row) => String(row?.id) !== id));
  }

  const headerSlot = (
    <div style={styles.chrome} data-testid="feed-home-chrome">
      <Link to="/search" style={styles.chromeBtn} data-testid="feed-search">
        Search
      </Link>
      <Link
        to="/my-menuply?compose=ate"
        style={styles.chromeCamera}
        data-testid="feed-create"
        title="Create video"
      >
        ＋
      </Link>
    </div>
  );

  if (loading && items.length === 0) {
    return (
      <div style={styles.loading} data-testid="feed-home-loading">
        {headerSlot}
        <p style={styles.loadingText}>Loading Feed…</p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div style={styles.loading} data-testid="feed-home-error">
        {headerSlot}
        <p style={styles.loadingText}>{error}</p>
      </div>
    );
  }

  return (
    <div data-testid="feed-home">
      <SeeWhosEatingFullscreen
        variant="feedHome"
        items={items}
        startIndex={0}
        isAuthenticated={Boolean(isAuthenticated)}
        viewerUserId={consumer?.id || null}
        onRemovedFromFeed={onRemovedFromFeed}
        bottomInset={FEED_PRIMARY_NAV_HEIGHT + 8}
        headerSlot={headerSlot}
      />
    </div>
  );
}

const styles = {
  chrome: {
    position: "absolute",
    top: "max(12px, env(safe-area-inset-top))",
    left: 12,
    right: 12,
    zIndex: 3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    pointerEvents: "none",
  },
  chromeBtn: {
    pointerEvents: "auto",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  chromeCamera: {
    pointerEvents: "auto",
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(30, 120, 90, 0.92)",
    color: "#fff",
    fontSize: 26,
    fontWeight: 500,
    textDecoration: "none",
    border: "2px solid rgba(255,255,255,0.35)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
  },
  loading: {
    minHeight: "100dvh",
    background: "#050705",
    position: "relative",
    color: "#fff",
  },
  loadingText: {
    position: "absolute",
    top: "42%",
    left: 24,
    right: 24,
    textAlign: "center",
    color: "rgba(255,255,255,0.8)",
    fontWeight: 600,
  },
};
