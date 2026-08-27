/**
 * Feed Deals — full-screen swipe reel of restaurant deal videos.
 * Text search / filters live at /deals (classic DealsPage).
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DealVideoSwipe from "../../../components/consumer/feed/DealVideoSwipe.jsx";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import { apiGet } from "../../../lib/api.js";
import { mapDealsToFeedVideoItems } from "../../../lib/feedDealVideos.js";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";

const DEFAULT_MARKET = { city: "Los Angeles", state: "CA" };

function resolveMarket() {
  if (typeof window === "undefined") return DEFAULT_MARKET;
  const detected = readDetectedLocation(window.localStorage);
  const city = String(detected?.city || "").trim();
  const state = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  if (city && state) return { city, state };
  return DEFAULT_MARKET;
}

export default function FeedDealsPage() {
  const market = useMemo(() => resolveMarket(), []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          city: market.city,
          state: market.state,
          has_video: "1",
        });
        const data = await apiGet(`/deals?${params.toString()}`);
        if (cancelled) return;
        setItems(mapDealsToFeedVideoItems(data?.deals));
      } catch (err) {
        if (cancelled) return;
        setItems([]);
        setError(err?.message || "Unable to load deal videos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [market.city, market.state]);

  const searchHref = `/deals?city=${encodeURIComponent(market.city)}&state=${encodeURIComponent(market.state)}`;

  const headerSlot = (
    <div style={styles.chrome} data-testid="feed-deals-chrome">
      <Link to="/feed" style={styles.chromeBtn} data-testid="feed-deals-back">
        Feed
      </Link>
      <Link to={searchHref} style={styles.chromeBtn} data-testid="feed-deals-search">
        Search deals
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.loading} data-testid="feed-deals-loading">
        {headerSlot}
        <p style={styles.loadingText}>Loading deal videos…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loading} data-testid="feed-deals-error">
        {headerSlot}
        <p style={styles.loadingText}>{error}</p>
        <Link to={searchHref} style={styles.searchLink}>
          Search text deals
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="feed-deals-page">
      <DealVideoSwipe
        items={items}
        startIndex={0}
        bottomInset={FEED_PRIMARY_NAV_HEIGHT + 8}
        headerSlot={headerSlot}
      />
      {items.length === 0 ? (
        <div style={styles.emptyActions} data-testid="feed-deals-empty">
          <Link to={searchHref} style={styles.searchLink}>
            Search all deals
          </Link>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  loading: {
    minHeight: "100dvh",
    background: "#050705",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  loadingText: {
    color: "#9aab9e",
    fontSize: 14,
    margin: 0,
  },
  chrome: {
    position: "fixed",
    top: "max(12px, env(safe-area-inset-top))",
    left: 0,
    right: 0,
    zIndex: 50,
    display: "flex",
    justifyContent: "space-between",
    padding: "0 12px",
    pointerEvents: "none",
  },
  chromeBtn: {
    pointerEvents: "auto",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  },
  searchLink: {
    color: "#8fd4a8",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
  },
  emptyActions: {
    position: "fixed",
    bottom: "calc(var(--feed-primary-nav-h, 72px) + 24px)",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    zIndex: 45,
    pointerEvents: "none",
  },
};
