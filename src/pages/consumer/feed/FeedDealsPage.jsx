/**
 * Feed Deals Live — meal-time media browse inside the Feed shell.
 * Classic text list remains at /deals.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FEED_PRIMARY_NAV_HEIGHT } from "../../../components/consumer/feed/FeedPrimaryNav.jsx";
import { apiGet } from "../../../lib/api.js";
import {
  DEAL_MEAL_PERIODS,
  dealHasMedia,
  dealMealPeriodLabel,
  defaultDealMealPeriod,
  normalizeDealMealPeriod,
} from "../../../lib/dealMealPeriods.js";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";

const DEFAULT_MARKET = { city: "Los Angeles", state: "CA" };

function resolveMarketFromParams(searchParams) {
  const qCity = String(searchParams.get("city") || "").trim();
  const qState = String(searchParams.get("state") || "").trim().toUpperCase().slice(0, 2);
  if (qCity && qState) return { city: qCity, state: qState };
  if (typeof window === "undefined") return DEFAULT_MARKET;
  const detected = readDetectedLocation(window.localStorage);
  const dCity = String(detected?.city || "").trim();
  const dState = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  if (dCity && dState) return { city: dCity, state: dState };
  return DEFAULT_MARKET;
}

function formatDealValue(deal) {
  if (deal.deal_type === "percent_off" && deal.discount_percent != null) {
    return `${deal.discount_percent}% off`;
  }
  if (deal.deal_type === "amount_off" && deal.discount_amount_cents != null) {
    return `$${(Number(deal.discount_amount_cents) / 100).toFixed(2)} off`;
  }
  if (deal.deal_type === "fixed_price" && deal.fixed_price_cents != null) {
    return `$${(Number(deal.fixed_price_cents) / 100).toFixed(2)}`;
  }
  if (deal.discount_value) return String(deal.discount_value);
  return deal.deal_type || "Deal";
}

function DealMediaCard({ deal }) {
  const id = deal.deal_id || deal.id;
  const href = id ? `/deals/${id}` : "/deals";
  const video = String(deal.video_url || "").trim();
  const photo = String(deal.photo_url || "").trim();
  const audio = String(deal.audio_url || "").trim();
  const periods = Array.isArray(deal.meal_periods) ? deal.meal_periods : [];
  const periodLabels = periods.map(dealMealPeriodLabel).filter(Boolean);

  return (
    <Link to={href} style={styles.card} data-testid={`feed-deal-card-${id}`}>
      <div style={styles.mediaWell}>
        {video ? (
          <video
            src={video}
            style={styles.mediaEl}
            muted
            playsInline
            loop
            autoPlay
            controls={false}
          />
        ) : photo ? (
          <img src={photo} alt="" style={styles.mediaEl} />
        ) : audio ? (
          <div style={styles.audioWell}>
            <span style={styles.audioLabel}>Audio deal</span>
            <audio src={audio} controls style={styles.audio} />
          </div>
        ) : (
          <div style={styles.textWell}>
            <span style={styles.textWellLabel}>Text deal</span>
          </div>
        )}
        {deal.feed_promoted === true ? (
          <span style={styles.sponsored}>Sponsored</span>
        ) : null}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.restaurant}>{deal.restaurant_name || "Restaurant"}</div>
        <div style={styles.title}>{deal.title}</div>
        <div style={styles.meta}>
          <span>{formatDealValue(deal)}</span>
          {periodLabels.length > 0 ? (
            <span style={styles.periodChip}>{periodLabels.join(" · ")}</span>
          ) : (
            <span style={styles.periodChip}>All day</span>
          )}
        </div>
        {deal.description ? (
          <p style={styles.description}>{deal.description}</p>
        ) : null}
      </div>
    </Link>
  );
}

export default function FeedDealsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const market = useMemo(() => resolveMarketFromParams(searchParams), [searchParams]);
  const mealFromUrl = normalizeDealMealPeriod(searchParams.get("meal_period"));
  const [mealPeriod, setMealPeriod] = useState(
    () => mealFromUrl || defaultDealMealPeriod()
  );
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mealFromUrl && mealFromUrl !== mealPeriod) {
      setMealPeriod(mealFromUrl);
    }
  }, [mealFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("city", market.city);
    next.set("state", market.state);
    next.set("meal_period", mealPeriod);
    if (
      next.get("city") !== searchParams.get("city") ||
      next.get("state") !== searchParams.get("state") ||
      next.get("meal_period") !== searchParams.get("meal_period")
    ) {
      setSearchParams(next, { replace: true });
    }
  }, [market.city, market.state, mealPeriod, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          city: market.city,
          state: market.state,
          meal_period: mealPeriod,
          prefer_media: "1",
        });
        const data = await apiGet(`/deals?${params.toString()}`);
        if (cancelled) return;
        setDeals(Array.isArray(data?.deals) ? data.deals : []);
      } catch (err) {
        if (cancelled) return;
        setDeals([]);
        setError(err?.message || "Unable to load deals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [market.city, market.state, mealPeriod]);

  const mediaCount = deals.filter(dealHasMedia).length;
  const textListHref = `/deals?city=${encodeURIComponent(market.city)}&state=${encodeURIComponent(market.state)}`;

  return (
    <div style={styles.page} data-testid="feed-deals-page">
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.h1}>Deals</h1>
          <Link to={textListHref} style={styles.textListLink} data-testid="feed-deals-text-list">
            Text list
          </Link>
        </div>
        <p style={styles.sub}>
          {market.city}, {market.state} · meal-time deals
        </p>
        <div style={styles.chips} role="tablist" aria-label="Meal period">
          {DEAL_MEAL_PERIODS.map((p) => {
            const active = p.id === mealPeriod;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`feed-deals-meal-${p.id}`}
                onClick={() => setMealPeriod(p.id)}
                style={{
                  ...styles.chip,
                  ...(active ? styles.chipActive : null),
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </header>

      <div style={styles.body}>
        {loading ? (
          <p style={styles.status} data-testid="feed-deals-loading">
            Loading deals…
          </p>
        ) : null}
        {error && !loading ? (
          <p style={styles.status} data-testid="feed-deals-error">
            {error}
          </p>
        ) : null}
        {!loading && !error && deals.length === 0 ? (
          <div style={styles.empty} data-testid="feed-deals-empty">
            <p style={styles.status}>
              No {dealMealPeriodLabel(mealPeriod).toLowerCase()} deals in {market.city} right now.
            </p>
            <Link to={textListHref} style={styles.textListLink}>
              Browse text deals
            </Link>
          </div>
        ) : null}
        {!loading && deals.length > 0 ? (
          <>
            <p style={styles.count} data-testid="feed-deals-count">
              {deals.length} deal{deals.length === 1 ? "" : "s"}
              {mediaCount > 0 ? ` · ${mediaCount} with media` : ""}
            </p>
            <div style={styles.grid}>
              {deals.map((deal) => (
                <DealMediaCard key={deal.deal_id || deal.id} deal={deal} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    paddingBottom: FEED_PRIMARY_NAV_HEIGHT + 24,
    background: "#050705",
    color: "#f4f7f4",
  },
  header: {
    padding: "16px 16px 8px",
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "linear-gradient(180deg, #0a100c 0%, #050705 100%)",
  },
  headerTop: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  h1: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  sub: {
    margin: "4px 0 12px",
    fontSize: 13,
    color: "#9aab9e",
  },
  textListLink: {
    color: "#8fd4a8",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    border: "1px solid #2a3a2f",
    background: "#121a14",
    color: "#c5d4c8",
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  chipActive: {
    background: "#1F4E3D",
    borderColor: "#2f7a5c",
    color: "#fff",
  },
  body: {
    padding: "8px 16px 24px",
  },
  status: {
    color: "#9aab9e",
    fontSize: 14,
    margin: "12px 0",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-start",
  },
  count: {
    fontSize: 12,
    color: "#7d9184",
    margin: "0 0 12px",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    borderRadius: 14,
    overflow: "hidden",
    background: "#0e1510",
    border: "1px solid #1c2a20",
  },
  mediaWell: {
    position: "relative",
    aspectRatio: "16 / 10",
    background: "#0a100c",
  },
  mediaEl: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  audioWell: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  audioLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8fd4a8",
  },
  audio: {
    width: "100%",
  },
  textWell: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1F4E3D 0%, #0e1510 100%)",
  },
  textWellLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#c5e6d2",
  },
  sponsored: {
    position: "absolute",
    top: 10,
    left: 10,
    background: "rgba(0,0,0,0.65)",
    color: "#fde68a",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    padding: "3px 8px",
    borderRadius: 999,
  },
  cardBody: {
    padding: "12px 14px 14px",
  },
  restaurant: {
    fontSize: 12,
    fontWeight: 600,
    color: "#8fd4a8",
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.25,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginTop: 6,
    fontSize: 12,
    color: "#b7c8bb",
  },
  periodChip: {
    background: "#18241c",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 11,
    color: "#9aab9e",
  },
  description: {
    margin: "8px 0 0",
    fontSize: 13,
    lineHeight: 1.4,
    color: "#9aab9e",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
};
