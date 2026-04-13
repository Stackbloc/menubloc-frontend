// ============================================================
// File: src/pages/DealsPage.jsx
// Purpose: Display active restaurant deals with canonical Grubbid
// public discovery styling, grouped one restaurant at a time.
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageNav } from "../components/NavButton.jsx";
import ShareIcon from "../components/share/ShareIcon.jsx";
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

const PRICE_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Under $10", value: "under_10" },
  { label: "$10 to $20", value: "10_to_20" },
  { label: "$20+", value: "20_plus" },
];

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

function formatInlineDistanceMiles(value) {
  const miles = Number(value);
  if (!Number.isFinite(miles)) return "";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

function getDealDisplayPrice(deal) {
  const menuPrice = Number.parseFloat(deal?.menu_item_price);
  if (Number.isFinite(menuPrice) && menuPrice >= 0) {
    return Math.round(menuPrice * 100);
  }

  const fixedPriceCents = Number(deal?.fixed_price_cents);
  if (Number.isFinite(fixedPriceCents) && fixedPriceCents >= 0) {
    return fixedPriceCents;
  }

  return null;
}

function getGroupPriceCents(group) {
  for (const deal of group.deals) {
    const price = getDealDisplayPrice(deal);
    if (price != null) return price;
  }
  return null;
}

function matchesPriceFilter(priceCents, priceFilter) {
  if (priceFilter === "all") return true;
  if (!Number.isFinite(priceCents)) return false;
  if (priceFilter === "under_10") return priceCents < 1000;
  if (priceFilter === "10_to_20") return priceCents >= 1000 && priceCents < 2000;
  if (priceFilter === "20_plus") return priceCents >= 2000;
  return true;
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
      priceCents: getGroupPriceCents({ deals: sortedDeals }),
    };
  });
}

function buildRestaurantMenuUrl(restaurantSlug, restaurantId) {
  const base = restaurantSlug || restaurantId;
  if (!base) return null;
  return `/restaurants/${base}/menu`;
}

function buildRestaurantScopedShareUrl({
  origin,
  city,
  state,
  lat,
  lng,
  cuisine,
  restaurantId,
}) {
  const url = new URL("/deals", origin);
  if (city) url.searchParams.set("city", city);
  if (state) url.searchParams.set("state", state);
  if (lat != null) url.searchParams.set("lat", String(lat));
  if (lng != null) url.searchParams.set("lng", String(lng));
  if (cuisine) url.searchParams.set("cuisine", cuisine);
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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "flex-start",
          columnGap: 10,
          rowGap: 6,
        }}
      >
        <div style={{ minWidth: 0, flex: "0 1 auto", fontSize: 16, fontWeight: 800, lineHeight: 1.35 }}>
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

        {onShare ? (
          <button
            type="button"
            onClick={onShare}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              background: "transparent",
              padding: 0,
              color: "var(--gb-color-ink-muted)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
          >
            <ShareIcon size={14} />
            <span>Share this deal</span>
          </button>
        ) : null}
      </div>

      {deal.description ? (
        <div style={{ marginTop: 4, color: "var(--gb-color-ink-soft)", fontSize: 14, lineHeight: 1.45 }}>
          {deal.description}
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
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [priceFilter, setPriceFilter] = useState("all");
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
    let cancelled = false;

    async function loadCuisineOptions() {
      try {
        const response = await fetch(`${API_BASE}/api/meta/cuisines`);
        const data = await response.json().catch(() => ({}));
        if (cancelled || !data?.ok || !Array.isArray(data.cuisines)) return;
        setCuisineOptions(data.cuisines);
      } catch {
        if (!cancelled) setCuisineOptions([]);
      }
    }

    loadCuisineOptions();
    return () => {
      cancelled = true;
    };
  }, []);

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
        if (userLat != null && userLng != null) {
          params.set("lat", userLat);
          params.set("lng", userLng);
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
  }, [urlCity, urlState, cuisine, userLat, userLng]);

  const groupedDeals = useMemo(() => {
    const groups = groupDealsByRestaurant(deals).map((group, index) => ({
      ...group,
      originalIndex: index,
    }));

    return [...groups]
      .sort((a, b) => {
        const aDistance = Number.isFinite(a.distanceMiles) ? a.distanceMiles : null;
        const bDistance = Number.isFinite(b.distanceMiles) ? b.distanceMiles : null;
        if (aDistance == null && bDistance == null) return a.originalIndex - b.originalIndex;
        if (aDistance == null) return 1;
        if (bDistance == null) return -1;
        if (aDistance !== bDistance) return aDistance - bDistance;
        return a.originalIndex - b.originalIndex;
      })
      .filter((group) => matchesPriceFilter(group.priceCents, priceFilter));
  }, [deals, priceFilter]);
  const hasLocation = userLat != null && userLng != null;

  function toggleRestaurant(groupKey) {
    setExpandedRestaurants((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }

  async function handleShare(group, deal = group.primaryDeal) {
    const dealUrl = deal ? buildDealUrl(deal) : null;

    const shareUrl =
      dealUrl
        ? new URL(dealUrl, window.location.origin).toString()
        : buildRestaurantScopedShareUrl({
            origin: window.location.origin,
            city: urlCity,
            state: urlState,
            lat: userLat,
            lng: userLng,
            cuisine,
            restaurantId: group.restaurantId || group.key,
          });

    const shareTitle = `${group.restaurantName}: ${deal?.title || "Deal"}`;
    const shareText = deal?.title
      ? `Check out ${deal.title} from ${group.restaurantName}.`
      : `Check out this deal from ${group.restaurantName}.`;

    try {
      await shareLink({
        url: shareUrl,
        title: shareTitle,
        text: shareText,
      });
    } catch {
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
              Filters
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <SelectField label="Cuisine" value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
                <option value="">All</option>
                {cuisineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>

              <SelectField label="Price" value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
                {PRICE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>

              {!hasLocation && locDetecting ? (
                <div style={{ fontSize: 13, color: "var(--gb-color-ink-muted)" }}>
                  Detecting location for nearby deals…
                </div>
              ) : null}

              <FilterChip
                active={!cuisine && priceFilter === "all"}
                onClick={() => {
                  setCuisine("");
                  setPriceFilter("all");
                }}
              >
                Reset filters
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
                  const restaurantUrl = buildRestaurantMenuUrl(group.restaurantSlug, group.restaurantId);

                  return (
                    <Card
                      key={group.key}
                      muted
                      style={{
                        borderRadius: "var(--gb-radius-card-tight)",
                        padding: "14px 18px",
                        boxShadow: "none",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "baseline",
                            gap: 6,
                            marginBottom: 8,
                          }}
                        >
                          {restaurantUrl ? (
                            <Link
                              to={restaurantUrl}
                              style={{
                                color: "var(--gb-color-ink-strong)",
                                fontSize: 17,
                                fontWeight: 900,
                                textDecoration: "none",
                              }}
                            >
                              {group.restaurantName}
                            </Link>
                          ) : (
                            <div style={{ color: "var(--gb-color-ink-strong)", fontSize: 17, fontWeight: 900 }}>
                              {group.restaurantName}
                            </div>
                          )}
                          {group.distanceMiles != null ? (
                            <div
                              style={{
                                color: "var(--gb-color-ink-muted)",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {"• "}{formatInlineDistanceMiles(group.distanceMiles)}
                            </div>
                          ) : null}
                        </div>
                        {group.primaryDeal ? (
                          <DealSummary
                            deal={group.primaryDeal}
                            onShare={() => handleShare(group, group.primaryDeal)}
                          />
                        ) : null}
                      </div>

                      {hiddenCount > 0 ? (
                        <div style={{ marginTop: 12 }}>
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
                            {isExpanded
                              ? "Hide additional deals"
                              : `View more deals from ${group.restaurantName}${hiddenCount > 0 ? ` (${hiddenCount})` : ""}`}
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
                                  <DealSummary deal={deal} onShare={() => handleShare(group, deal)} />
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
