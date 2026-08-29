/**
 * Feed Deals — full-screen swipe reel of restaurant deal videos.
 * Text search / filters live at /deals (classic DealsPage).
 */

import { useEffect, useMemo, useState } from "react";
import DealVideoSwipe from "../../../components/consumer/feed/DealVideoSwipe.jsx";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import { apiGet } from "../../../lib/api.js";
import { mapDealsToFeedVideoItems } from "../../../lib/feedDealVideos.js";
import {
  DEAL_MEAL_PERIODS,
  defaultDealMealPeriod,
} from "../../../lib/dealMealPeriods.js";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import { useFeedShellDesktop } from "../../../lib/useFeedShellDesktop.js";

const DEFAULT_MARKET = { city: "Los Angeles", state: "CA" };
const MEAL_FILTERS = [{ id: "all", label: "All" }, ...DEAL_MEAL_PERIODS];

function resolveMarket() {
  if (typeof window === "undefined") return DEFAULT_MARKET;
  const detected = readDetectedLocation(window.localStorage);
  const city = String(detected?.city || "").trim();
  const state = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  if (city && state) return { city, state };
  return DEFAULT_MARKET;
}

export default function FeedDealsPage() {
  const isDesktop = useFeedShellDesktop();
  const market = useMemo(() => resolveMarket(), []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mealFilter, setMealFilter] = useState(() => defaultDealMealPeriod());

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
        if (mealFilter && mealFilter !== "all") {
          params.set("meal_period", mealFilter);
        }
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
  }, [market.city, market.state, mealFilter]);

  const headerSlot = (
    <div style={styles.chromeWrap} data-testid="feed-deals-chrome">
      <div
        style={styles.mealStrip}
        role="tablist"
        aria-label="Filter deal videos by meal time"
        data-testid="feed-deals-meal-filters"
      >
        {MEAL_FILTERS.map((chip) => {
          const selected = mealFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={selected}
              data-testid={`feed-deals-meal-${chip.id}`}
              style={{
                ...styles.mealChip,
                ...(selected ? styles.mealChipSelected : null),
              }}
              onClick={() => setMealFilter(chip.id)}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
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
      </div>
    );
  }

  return (
    <div style={styles.page} data-testid="feed-deals-page">
      <DealVideoSwipe
        items={items}
        startIndex={0}
        bottomInset={isDesktop ? 8 : FEED_PRIMARY_NAV_HEIGHT + 8}
        headerSlot={headerSlot}
        containInShell
      />
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100dvh",
    background: "#050705",
  },
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
  chromeWrap: {
    position: "fixed",
    top: "max(12px, env(safe-area-inset-top))",
    left: 0,
    right: 0,
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    pointerEvents: "none",
  },
  mealStrip: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    padding: "0 12px",
    pointerEvents: "auto",
  },
  mealChip: {
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(0,0,0,0.45)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  mealChipSelected: {
    background: "rgba(143,212,168,0.25)",
    borderColor: "#8fd4a8",
    color: "#fff",
  },
};
