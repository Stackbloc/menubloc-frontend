// ============================================================
// File: src/pages/DealsPage.jsx
// Purpose: Display active restaurant deals with canonical Grubbid
// public discovery styling, grouped one restaurant at a time.
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import GlobalHeader from "../components/layout/GlobalHeader.jsx";
import ShareIcon from "../components/share/ShareIcon.jsx";
import Breadcrumbs from "../components/ui/Breadcrumbs.jsx";
import {
  Card,
  PageHero,
  PageShell,
  StatusMessage,
} from "../components/grubbid/GrubbidPrimitives.jsx";
import { useOrderCart } from "../context/OrderCartContext.jsx";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

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

function getDealMenuPriceCents(deal) {
  const menuPrice = Number.parseFloat(deal?.menu_item_price);
  return Number.isFinite(menuPrice) && menuPrice >= 0 ? Math.round(menuPrice * 100) : 0;
}

function parseCurrencyToCents(value) {
  const normalized = String(value || "").replace(/[^0-9.]/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

function getDealOrderPriceCents(deal) {
  const menuPriceCents = getDealMenuPriceCents(deal);
  const fixedPriceCents = Number(deal?.fixed_price_cents);
  if (Number.isFinite(fixedPriceCents) && fixedPriceCents >= 0) return fixedPriceCents;

  const explicitDealPriceCents = Number(deal?.deal_price_cents);
  if (Number.isFinite(explicitDealPriceCents) && explicitDealPriceCents >= 0) return explicitDealPriceCents;

  if (deal?.deal_type === "fixed_price") {
    const parsedFixedPrice = parseCurrencyToCents(deal?.discount_value);
    if (parsedFixedPrice != null) return parsedFixedPrice;
  }

  if (deal?.deal_type === "amount_off" && menuPriceCents > 0) {
    const amountOffCents = parseCurrencyToCents(
      deal?.discount_value ?? deal?.discount_amount_cents
    );
    if (amountOffCents != null) {
      return Math.max(menuPriceCents - amountOffCents, 0);
    }
  }

  if (deal?.deal_type === "percent_off" && menuPriceCents > 0) {
    const percentRaw = String(deal?.discount_value ?? deal?.discount_percent ?? "").replace(/[^0-9.]/g, "");
    const percentOff = Number.parseFloat(percentRaw);
    if (Number.isFinite(percentOff) && percentOff > 0) {
      return Math.max(Math.round(menuPriceCents * (1 - percentOff / 100)), 0);
    }
  }

  return menuPriceCents;
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
  restaurantId,
}) {
  const url = new URL("/deals", origin);
  if (city) url.searchParams.set("city", city);
  if (state) url.searchParams.set("state", state);
  if (lat != null) url.searchParams.set("lat", String(lat));
  if (lng != null) url.searchParams.set("lng", String(lng));
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

function DealSummary({ deal, menuUrl = null, onShare = null, onAddToOrder = null }) {
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

      {(dealUrl || menuUrl || onAddToOrder) ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          {dealUrl ? (
            <Link
              to={dealUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 40,
                padding: "0 16px",
                borderRadius: 999,
                background: "#11211a",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              View deal
            </Link>
          ) : null}

          {onAddToOrder ? (
            <button
              type="button"
              onClick={onAddToOrder}
              style={{
                border: "1px solid rgba(17, 33, 26, 0.12)",
                borderRadius: 999,
                background: "#f8faf8",
                color: "#11211a",
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Add to order
            </button>
          ) : null}

          {menuUrl ? (
            <Link
              to={menuUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 40,
                padding: "0 16px",
                borderRadius: 999,
                border: "1px solid rgba(17, 33, 26, 0.16)",
                background: "#fff",
                color: "#11211a",
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              View full menu
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function DealsPage() {
  const { search } = useLocation();
  const { addToCart } = useOrderCart();
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
  const [expandedRestaurants, setExpandedRestaurants] = useState(() =>
    expandedRestaurantId ? { [expandedRestaurantId]: true } : {}
  );

  const [userLat, setUserLat] = useState(urlLat);
  const [userLng, setUserLng] = useState(urlLng);

  useEffect(() => {
    if (!expandedRestaurantId) return;
    setExpandedRestaurants((prev) => ({ ...prev, [expandedRestaurantId]: true }));
  }, [expandedRestaurantId]);

  useEffect(() => {
    if (urlLat != null && urlLng != null) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {},
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
  }, [urlCity, urlState, userLat, userLng]);

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
      });
  }, [deals]);
  const hasLocation = userLat != null && userLng != null;
  const locationContextLabel = locationLabel
    ? `Near ${locationLabel}`
    : hasLocation
    ? "Using current location"
    : "Nearby deals";

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

  function handleAddToOrder(group, deal) {
    if (!deal?.menu_item_id || !group?.restaurantId) return;

    const dealPriceCents = getDealOrderPriceCents(deal);
    const menuPriceCents = getDealMenuPriceCents(deal);
    const hasDealPrice = dealPriceCents > 0 && menuPriceCents > 0 && dealPriceCents !== menuPriceCents;

    addToCart({
      restaurant: {
        restaurantId: group.restaurantId,
        restaurantName: group.restaurantName,
        slug: group.restaurantSlug,
      },
      item: {
        menuItemId: deal.menu_item_id,
        name: deal.menu_item_name || deal.title || "Deal item",
        description: deal.description || "",
        quantity: 1,
        basePriceCents: dealPriceCents,
        originalBasePriceCents: hasDealPrice ? menuPriceCents : dealPriceCents,
        pricingType: hasDealPrice ? "deal" : "",
        pricingLabel: hasDealPrice ? "Deal applied" : "",
      },
    });
  }

  return (
    <PageShell width="wide">
      <GlobalHeader />
      <Breadcrumbs
        items={[
          { label: "Discovery", to: "/" },
          { label: "Deals" },
        ]}
      />

      <div style={{ display: "grid", gap: 16 }}>
        <PageHero
          title={locationLabel ? `Restaurant Deals Near ${locationLabel}` : "Restaurant Deals Near You"}
          description="Active promotions from restaurants in your area, with direct access to each full Grubbid menu."
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            width: "fit-content",
            minHeight: 40,
            padding: "0 14px",
            borderRadius: 999,
            border: "1px solid rgba(17, 33, 26, 0.12)",
            background: "#ffffff",
            color: "#11211a",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          <span style={{ color: "#667085", fontWeight: 700 }}>Location</span>
          <span>{locationContextLabel}</span>
        </div>

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
                            menuUrl={restaurantUrl}
                            onShare={() => handleShare(group, group.primaryDeal)}
                            onAddToOrder={
                              group.primaryDeal?.menu_item_id
                                ? () => handleAddToOrder(group, group.primaryDeal)
                                : null
                            }
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
                                  <DealSummary
                                    deal={deal}
                                    menuUrl={restaurantUrl}
                                    onShare={() => handleShare(group, deal)}
                                    onAddToOrder={deal?.menu_item_id ? () => handleAddToOrder(group, deal) : null}
                                  />
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
      </div>
    </PageShell>
  );
}
