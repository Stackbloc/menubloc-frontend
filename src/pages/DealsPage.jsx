// ============================================================
// File: src/pages/DealsPage.jsx
// Purpose: Display active restaurant deals with canonical Grubbid
// public discovery styling, grouped one restaurant at a time.
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageNav } from "../components/NavButton.jsx";
import {
  Card,
  FilterChip,
  PageHero,
  PageShell,
  PageSplit,
  SelectField,
  StatusMessage,
} from "../components/grubbid/GrubbidPrimitives.jsx";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

const CUISINE_OPTIONS = [
  "American",
  "Chinese",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mexican",
  "Thai",
  "Vietnamese",
];

const DISTANCE_OPTIONS = [
  { label: "5 miles", value: "5" },
  { label: "10 miles", value: "10" },
  { label: "25 miles", value: "25" },
  { label: "50 miles", value: "50" },
];

const SORT_OPTIONS = [
  { label: "Default order", value: "default" },
  { label: "Closest to me", value: "closest" },
];

function formatDealBadge(deal) {
  const raw = String(
    deal?.discount_value ||
      (deal?.deal_type === "percent_off" && deal?.discount_percent != null ? `${deal.discount_percent}%` : "") ||
      (deal?.deal_type === "amount_off" && deal?.discount_amount_cents != null
        ? `$${(deal.discount_amount_cents / 100).toFixed(2)}`
        : "") ||
      (deal?.deal_type === "fixed_price" && deal?.fixed_price_cents != null
        ? `$${(deal.fixed_price_cents / 100).toFixed(2)}`
        : "")
  ).trim();

  if (!raw) return "";
  if (deal?.deal_type === "fixed_price" && /^\$\d+(?:\.\d{1,2})?$/i.test(raw)) {
    return `Only ${raw}`;
  }
  if (deal?.deal_type === "amount_off" && /^\$\d+(?:\.\d{1,2})?$/i.test(raw)) {
    return `${raw} off`;
  }
  if (deal?.deal_type === "percent_off" && /^\d+(?:\.\d+)?%$/i.test(raw)) {
    return `${raw} off`;
  }
  if (/^\d+(?:\.\d+)?%$/i.test(raw)) return `${raw} off`;
  if (/^\$\d+(?:\.\d{1,2})?$/i.test(raw)) return `${raw} off`;
  return raw;
}

function buildDealUrl(deal) {
  const base = deal.restaurant_slug || deal.restaurant_id;
  if (!base) return null;
  if (deal.menu_item_id) {
    return `/restaurants/${base}/menu-items/${deal.menu_item_id}`;
  }
  return `/restaurants/${base}/menu`;
}

function getRestaurantKey(deal) {
  return String(deal.restaurant_id || deal.restaurant_slug || deal.restaurant_name || deal.deal_id || deal.id);
}

function sortDealsForDisplay(deals) {
  return [...deals].sort((a, b) => {
    const aTime = Date.parse(a.created_at || a.starts_at || 0);
    const bTime = Date.parse(b.created_at || b.starts_at || 0);
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }
    return Number(b.deal_id || b.id || 0) - Number(a.deal_id || a.id || 0);
  });
}

function getGroupDistanceMiles(group) {
  const candidate = group.deals.find((deal) => {
    const miles = Number(deal.distance_miles);
    return Number.isFinite(miles);
  });
  return candidate ? Number(candidate.distance_miles) : null;
}

function formatDistanceMiles(value) {
  const miles = Number(value);
  if (!Number.isFinite(miles)) return "";
  if (miles < 10) return `${miles.toFixed(1)} miles away`;
  return `${Math.round(miles)} miles away`;
}

function groupDealsByRestaurant(deals) {
  const groups = new Map();

  deals.forEach((deal) => {
    const key = getRestaurantKey(deal);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        restaurantId: deal.restaurant_id || null,
        restaurantName: deal.restaurant_name || "Restaurant",
        restaurantSlug: deal.restaurant_slug || null,
        deals: [],
      });
    }
    groups.get(key).deals.push(deal);
  });

  return Array.from(groups.values()).map((group) => {
    const sortedDeals = sortDealsForDisplay(group.deals);
    return {
      ...group,
      deals: sortedDeals,
      primaryDeal: sortedDeals[0] || null,
      extraDeals: sortedDeals.slice(1),
      distanceMiles: getGroupDistanceMiles({ deals: sortedDeals }),
    };
  });
}

function buildRestaurantScopedShareUrl({
  origin,
  city,
  state,
  lat,
  lng,
  cuisine,
  radiusMiles,
  restaurantId,
}) {
  const url = new URL("/deals", origin);
  if (city) url.searchParams.set("city", city);
  if (state) url.searchParams.set("state", state);
  if (lat != null) url.searchParams.set("lat", String(lat));
  if (lng != null) url.searchParams.set("lng", String(lng));
  if (cuisine) url.searchParams.set("cuisine", cuisine);
  if (radiusMiles) url.searchParams.set("radius_miles", radiusMiles);
  if (restaurantId != null && restaurantId !== "") {
    url.searchParams.set("restaurant_id", String(restaurantId));
  }
  return url.toString();
}

async function shareLink({ url, title, text }) {
  if (navigator.share) {
    await navigator.share({ url, title, text });
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    window.alert("Share link copied to clipboard.");
    return;
  }

  window.prompt("Copy this link:", url);
}

function DealSummary({ deal, onShare = null }) {
  const dealUrl = buildDealUrl(deal);

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>
        {dealUrl ? (
          <Link
            to={dealUrl}
            style={{
              color: "var(--gb-color-brand, #1a73e8)",
              textDecoration: "none",
            }}
          >
            {deal.title || "Untitled Deal"}
          </Link>
        ) : (
          <span style={{ color: "var(--gb-color-ink-strong)" }}>
            {deal.title || "Untitled Deal"}
          </span>
        )}
      </div>

      {deal.description ? (
        <div style={{ marginTop: 6, color: "var(--gb-color-ink-soft)", fontSize: 14, lineHeight: 1.55 }}>
          {deal.description}
        </div>
      ) : null}

      {deal.discount_value || deal.discount_percent != null || deal.discount_amount_cents != null || deal.fixed_price_cents != null ? (
        <div
          style={{
            marginTop: 8,
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: "var(--gb-radius-pill)",
            background: "var(--gb-color-success-bg)",
            border: "1px solid var(--gb-color-success-border)",
            color: "var(--gb-color-success-text)",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {formatDealBadge(deal)}
        </div>
      ) : null}

      {dealUrl ? (
        <div style={{ marginTop: 10 }}>
          <Link to={dealUrl} className="gb-linkish" style={{ fontSize: 13, fontWeight: 800 }}>
            {deal.menu_item_id ? `View ${deal.menu_item_name || "Item"} →` : "View Menu →"}
          </Link>
        </div>
      ) : null}

      {onShare ? (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={onShare}
            style={{
              border: "1px solid var(--gb-color-border, rgba(0,0,0,0.12))",
              background: "#fff",
              color: "var(--gb-color-ink-strong)",
              borderRadius: 999,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Share
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function DealsPage() {
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const urlCity = urlParams.get("city") || "";
  const urlState = urlParams.get("state") || "";
  const urlLat = urlParams.get("lat") ? parseFloat(urlParams.get("lat")) : null;
  const urlLng = urlParams.get("lng") ? parseFloat(urlParams.get("lng")) : null;
  const expandedRestaurantId = urlParams.get("restaurant_id") || "";
  const locationLabel = [urlCity, urlState].filter(Boolean).join(", ");

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cuisine, setCuisine] = useState(urlParams.get("cuisine") || "");
  const [radiusMiles, setRadiusMiles] = useState(urlParams.get("radius_miles") || "");
  const [sortMode, setSortMode] = useState("default");
  const [expandedRestaurants, setExpandedRestaurants] = useState(() =>
    expandedRestaurantId ? { [expandedRestaurantId]: true } : {}
  );

  const [userLat, setUserLat] = useState(urlLat);
  const [userLng, setUserLng] = useState(urlLng);
  const [locDetecting, setLocDetecting] = useState(false);

  useEffect(() => {
    if (!expandedRestaurantId) return;
    setExpandedRestaurants((prev) => ({ ...prev, [expandedRestaurantId]: true }));
  }, [expandedRestaurantId]);

  useEffect(() => {
    setSortMode((prev) => {
      if (userLat != null && userLng != null) {
        return prev === "default" ? "closest" : prev;
      }
      return prev === "closest" ? "default" : prev;
    });
  }, [userLat, userLng]);

  useEffect(() => {
    if (urlLat != null && urlLng != null) return;
    if (!navigator.geolocation) return;

    setLocDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocDetecting(false);
      },
      () => setLocDetecting(false),
      { timeout: 8000 }
    );
  }, [urlLat, urlLng]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDeals() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (urlCity) params.set("city", urlCity);
        if (urlState) params.set("state", urlState);
        if (cuisine) params.set("cuisine", cuisine);
        if (userLat != null && userLng != null && radiusMiles) {
          params.set("lat", userLat);
          params.set("lng", userLng);
          params.set("radius_miles", radiusMiles);
        }

        const response = await fetch(`${API_BASE}/deals?${params.toString()}`);
        const data = await response.json().catch(() => ({}));

        if (cancelled) return;
        if (!data.ok && data.error) throw new Error(data.error);

        setDeals(data.deals || []);
      } catch (nextError) {
        if (!cancelled) setError(nextError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDeals();
    return () => {
      cancelled = true;
    };
  }, [urlCity, urlState, cuisine, userLat, userLng, radiusMiles]);

  const groupedDeals = useMemo(() => {
    const groups = groupDealsByRestaurant(deals).map((group, index) => ({
      ...group,
      originalIndex: index,
    }));

    if (sortMode !== "closest" || userLat == null || userLng == null) {
      return groups;
    }

    return [...groups].sort((a, b) => {
      const aDistance = Number.isFinite(a.distanceMiles) ? a.distanceMiles : null;
      const bDistance = Number.isFinite(b.distanceMiles) ? b.distanceMiles : null;
      if (aDistance == null && bDistance == null) return a.originalIndex - b.originalIndex;
      if (aDistance == null) return 1;
      if (bDistance == null) return -1;
      if (aDistance !== bDistance) return aDistance - bDistance;
      return a.originalIndex - b.originalIndex;
    });
  }, [deals, sortMode, userLat, userLng]);
  const hasLocation = userLat != null && userLng != null;

  function toggleRestaurant(groupKey) {
    setExpandedRestaurants((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }

  async function handleShare(group) {
    const oneDealOnly = group.deals.length === 1;
    const singleDeal = group.primaryDeal;
    const singleDealUrl = singleDeal ? buildDealUrl(singleDeal) : null;

    const shareUrl =
      oneDealOnly && singleDealUrl
        ? new URL(singleDealUrl, window.location.origin).toString()
        : buildRestaurantScopedShareUrl({
            origin: window.location.origin,
            city: urlCity,
            state: urlState,
            lat: userLat,
            lng: userLng,
            cuisine,
            radiusMiles,
            restaurantId: group.restaurantId || group.key,
          });

    const shareTitle = oneDealOnly
      ? `${group.restaurantName}: ${singleDeal?.title || "Deal"}`
      : `${group.restaurantName} deals on Grubbid`;

    const shareText = oneDealOnly
      ? `Check out this deal from ${group.restaurantName}.`
      : `Check out all deals from ${group.restaurantName}.`;

    try {
      await shareLink({
        url: shareUrl,
        title: shareTitle,
        text: shareText,
      });
    } catch (_error) {
      // User dismissed share sheet or sharing failed.
    }
  }

  return (
    <PageShell width="wide">
      <PageNav />

      <PageSplit
        aside={(
          <Card>
            <div style={{ marginBottom: 14, color: "var(--gb-color-ink-strong)", fontSize: 16, fontWeight: 900 }}>
              Filter By
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <SelectField label="Cuisine" value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
                <option value="">All</option>
                {CUISINE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectField>

              {hasLocation ? (
                <>
                  <SelectField
                    label="Distance"
                    value={radiusMiles}
                    onChange={(event) => setRadiusMiles(event.target.value)}
                  >
                    <option value="">Any distance</option>
                    {DISTANCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField
                    label="Sort By"
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value)}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.value === "closest" && !hasLocation}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </SelectField>
                </>
              ) : locDetecting ? (
                <div style={{ fontSize: 13, color: "var(--gb-color-ink-muted)" }}>
                  Detecting location for distance filter…
                </div>
              ) : null}

              <FilterChip active={!cuisine && !radiusMiles} onClick={() => { setCuisine(""); setRadiusMiles(""); }}>
                Show all deals
              </FilterChip>
            </div>
          </Card>
        )}
      >
        <PageHero
          title={locationLabel ? `Restaurant Deals Near ${locationLabel}` : "Restaurant Deals"}
          description="Active promotions from restaurants in your area."
        />

        <Card>
          {loading ? (
            <div style={{ display: "grid", gap: 12 }}>
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  style={{
                    height: 96,
                    borderRadius: "var(--gb-radius-card-tight)",
                    background: "rgba(0, 0, 0, 0.06)",
                  }}
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <StatusMessage tone="muted">
              <strong style={{ display: "block", marginBottom: 8, color: "var(--gb-color-ink-strong)" }}>
                Could not load deals
              </strong>
              {error}
            </StatusMessage>
          ) : null}

          {!loading && !error && groupedDeals.length === 0 ? (
            <StatusMessage tone="muted">
              <strong style={{ display: "block", marginBottom: 8, color: "var(--gb-color-ink-strong)" }}>
                {locationLabel
                  ? `Currently, there are not any deals near ${locationLabel}.`
                  : "Currently, there are not any deals in this area."}
              </strong>
              Check back soon. We are still growing.
            </StatusMessage>
          ) : null}

          {!loading && !error && groupedDeals.length > 0 ? (
            <>
              <div className="gb-count-label" style={{ marginBottom: 14 }}>
                {groupedDeals.length} {groupedDeals.length === 1 ? "restaurant" : "restaurants"} with deals
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {groupedDeals.map((group) => {
                  const expandedKey = group.restaurantId || group.key;
                  const isExpanded = Boolean(expandedRestaurants[expandedKey]);
                  const hiddenCount = group.extraDeals.length;

                  return (
                    <Card
                      key={group.key}
                      muted
                      style={{
                        borderRadius: "var(--gb-radius-card-tight)",
                        padding: "16px 20px",
                        boxShadow: "none",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: "var(--gb-color-ink-strong)", fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
                            {group.restaurantName}
                          </div>
                          {group.distanceMiles != null ? (
                            <div
                              style={{
                                color: "var(--gb-color-ink-muted)",
                                fontSize: 13,
                                fontWeight: 600,
                                marginBottom: 8,
                              }}
                            >
                              {formatDistanceMiles(group.distanceMiles)}
                            </div>
                          ) : null}
                          {group.primaryDeal ? (
                            <DealSummary
                              deal={group.primaryDeal}
                              onShare={() => handleShare(group)}
                            />
                          ) : null}
                      </div>

                      {hiddenCount > 0 ? (
                        <div style={{ marginTop: 14 }}>
                          <button
                            type="button"
                            onClick={() => toggleRestaurant(expandedKey)}
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              color: "var(--gb-color-brand, #1a73e8)",
                              fontSize: 13,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {isExpanded ? "Hide Additional Deals" : `View More Deals (${hiddenCount})`}
                          </button>

                          {isExpanded ? (
                            <div
                              style={{
                                marginTop: 14,
                                paddingTop: 14,
                                borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                                display: "grid",
                                gap: 14,
                              }}
                            >
                              {group.extraDeals.map((deal) => (
                                <div key={deal.deal_id || deal.id}>
                                  <DealSummary deal={deal} />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            </>
          ) : null}
        </Card>
      </PageSplit>
    </PageShell>
  );
}
