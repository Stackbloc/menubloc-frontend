// ============================================================
// File: src/pages/DealsPage.jsx
// Purpose: Display active restaurant deals styled to match the
// Grubbid discovery page (sticky header, cream bg, card feed).
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import ShareIcon from "../components/share/ShareIcon.jsx";
import { parseLocation } from "../lib/locationUtils.js";
import { trackDealClick } from "../lib/analytics.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { buildLocalizedApiUrl, withLanguageHeaders } from "../lib/languageApi.js";

// ── Utility ──────────────────────────────────────────────────

function buildDealUrl(deal) {
  const id = deal.deal_id || deal.id;
  return id ? `/deals/${id}` : null;
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
  const candidate = group.deals.find((deal) => Number.isFinite(Number(deal.distance_miles)));
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
    const amountOffCents = parseCurrencyToCents(deal?.discount_value ?? deal?.discount_amount_cents);
    if (amountOffCents != null) return Math.max(menuPriceCents - amountOffCents, 0);
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
  return base ? `/restaurants/${base}/menu` : null;
}

function buildRestaurantScopedShareUrl({ origin, city, state, lat, lng, restaurantId }) {
  const url = new URL("/deals", origin);
  if (city) url.searchParams.set("city", city);
  if (state) url.searchParams.set("state", state);
  if (lat != null) url.searchParams.set("lat", String(lat));
  if (lng != null) url.searchParams.set("lng", String(lng));
  if (restaurantId != null && restaurantId !== "") url.searchParams.set("restaurant_id", String(restaurantId));
  return url.toString();
}

async function shareLink({ url, title, text }) {
  if (navigator.share) { await navigator.share({ url, title, text }); return; }
  if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); window.alert("Share link copied."); return; }
  window.prompt("Copy this link:", url);
}

// ── Deal row card ─────────────────────────────────────────────

function DealRow({ deal, restaurantUrl, onShare, onDealClick }) {
  const dealUrl = buildDealUrl(deal);
  const link = dealUrl || restaurantUrl;
  return (
    <div style={{ padding: "10px 14px", borderTop: "1px solid #1F2937" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", marginBottom: 3 }}>
        {link ? (
          <Link to={link} style={{ color: "#FFFFFF", textDecoration: "none" }}>
            {deal.title || "Untitled Deal"}
          </Link>
        ) : (
          <span>{deal.title || "Untitled Deal"}</span>
        )}
      </div>
      {deal.description && (
        <div style={{ fontSize: 12, color: "#667085", marginBottom: 6, lineHeight: 1.45 }}>
          {deal.description}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        {link && (
          <Link
            to={link}
            onClick={() => onDealClick?.(deal)}
            style={{
              display: "inline-flex", alignItems: "center",
              height: 26, padding: "0 11px",
              borderRadius: 999, background: "#22C55E",
              color: "#0B0F0C", fontSize: 12, fontWeight: 800,
              textDecoration: "none",
            }}
          >
            View deal
          </Link>
        )}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            aria-label="Share"
            style={{
              border: "none", background: "transparent",
              color: "#9ca3af", cursor: "pointer",
              padding: "2px 4px", lineHeight: 1,
              display: "flex", alignItems: "center",
            }}
          >
            <ShareIcon size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function DealsPage() {
  const { t, language } = useLanguage();
  const { search } = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(search);
  const urlCity = urlParams.get("city") || "";
  const urlState = urlParams.get("state") || "";
  const urlLat = urlParams.get("lat") ? parseFloat(urlParams.get("lat")) : null;
  const urlLng = urlParams.get("lng") ? parseFloat(urlParams.get("lng")) : null;
  const expandedRestaurantId = urlParams.get("restaurant_id") || "";
  const sessionLocation = (() => {
    try { return String(window.sessionStorage.getItem("grubbid.discovery.location") || "").trim(); } catch { return ""; }
  })();
  const parsedSessionLocation = useMemo(() => parseLocation(sessionLocation), [sessionLocation]);
  const effectiveCity = urlCity || parsedSessionLocation.city || "";
  const effectiveState = urlState || parsedSessionLocation.state || "";
  const locationLabel = [effectiveCity, effectiveState].filter(Boolean).join(", ") || sessionLocation;
  const requestIdRef = useRef(0);

  const [searchQuery, setSearchQuery] = useState("");
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
    if (effectiveCity) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
      () => {},
      { timeout: 8000 }
    );
  }, [urlLat, urlLng, effectiveCity]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    async function fetchDeals() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const hasExplicitCityScope = Boolean(effectiveCity);
        if (effectiveCity) params.set("city", effectiveCity);
        if (effectiveState) params.set("state", effectiveState);
        if (!hasExplicitCityScope && userLat != null && userLng != null) {
          params.set("lat", userLat);
          params.set("lng", userLng);
        }
        const response = await fetch(
          `${buildLocalizedApiUrl(`/deals?${params.toString()}`, language)}`,
          {
            signal: controller.signal,
            headers: withLanguageHeaders({}, language),
          },
        );
        const data = await response.json().catch(() => ({}));
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        if (!data.ok && data.error) throw new Error(data.error);
        setDeals(data.deals || []);
      } catch (nextError) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        setError(nextError.message);
      } finally {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        setLoading(false);
      }
    }
    fetchDeals();
    return () => { controller.abort(); };
  }, [effectiveCity, effectiveState, userLat, userLng, language]);

  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return deals;
    const q = searchQuery.trim().toLowerCase();
    return deals.filter((deal) =>
      (deal.restaurant_name || "").toLowerCase().includes(q) ||
      (deal.title || "").toLowerCase().includes(q)
    );
  }, [deals, searchQuery]);

  const groupedDeals = useMemo(() => {
    const groups = groupDealsByRestaurant(filteredDeals).map((group, index) => ({ ...group, originalIndex: index }));
    return [...groups].sort((a, b) => {
      const aD = Number.isFinite(a.distanceMiles) ? a.distanceMiles : null;
      const bD = Number.isFinite(b.distanceMiles) ? b.distanceMiles : null;
      if (aD == null && bD == null) return a.originalIndex - b.originalIndex;
      if (aD == null) return 1;
      if (bD == null) return -1;
      if (aD !== bD) return aD - bD;
      return a.originalIndex - b.originalIndex;
    });
  }, [deals]);

  const hasLocation = Boolean(effectiveCity) || (userLat != null && userLng != null);
  const locationContextLabel = locationLabel
    ? `Near ${locationLabel}`
    : hasLocation ? "Near you" : "Nearby";

  function toggleRestaurant(groupKey) {
    setExpandedRestaurants((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }

  async function handleShare(group, deal = group.primaryDeal) {
    const dealUrl = deal ? buildDealUrl(deal) : null;
    const shareUrl = dealUrl
      ? new URL(dealUrl, window.location.origin).toString()
      : buildRestaurantScopedShareUrl({
          origin: window.location.origin,
          city: effectiveCity,
          state: effectiveState,
          lat: effectiveCity ? null : userLat,
          lng: effectiveCity ? null : userLng,
          restaurantId: group.restaurantId || group.key,
        });
    try {
      await shareLink({
        url: shareUrl,
        title: `${group.restaurantName}: ${deal?.title || "Deal"}`,
        text: deal?.title
          ? `Check out ${deal.title} from ${group.restaurantName}.`
          : `Check out this deal from ${group.restaurantName}.`,
      });
    } catch {}
  }

  function handleDealClick(group, deal) {
    trackDealClick({
      dealId: deal?.deal_id || deal?.id,
      restaurantId: group?.restaurantId || group?.key,
      restaurantName: group?.restaurantName || "",
      dealTitle: deal?.title || "",
    });
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0B0F0C", color: "#FFFFFF" }}>
      <style>{`
        .deals-skeleton { animation: skelPulse 1.4s ease-in-out infinite; }
        @keyframes skelPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      `}</style>

      {/* ── STICKY TOP: page header + search + location title ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#0B0F0C" }}>
        <StickyPageHeader />
        <div style={{ borderBottom: "1px solid #1F2937", paddingBottom: 12 }}>
          {/* Search bar */}
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "10px 16px 0" }}>
            <input
              type="search"
              placeholder={t("deals.searchPlaceholder", "Search deals or restaurants…")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                height: 36, borderRadius: 999,
                border: "1.5px solid #1F2937",
                background: "#121A14", padding: "0 14px",
                fontSize: 13, fontWeight: 600, color: "#F9FAFB",
                outline: "none",
              }}
            />
          </div>

          {/* Page title row */}
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "10px 16px 0", textAlign: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              🔥 {t("deals.nearYou", "Deals Near {location}").replace(
                "{location}",
                locationLabel || t("discovery.you", "You"),
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE FEED ── */}
      <div style={{ maxWidth: 576, margin: "0 auto", padding: "10px 10px 80px" }}>

        {/* Skeletons */}
        {loading && [0, 1, 2].map((i) => (
          <div
            key={i}
            className="deals-skeleton"
            style={{ background: "#1F2937", borderRadius: 12, height: 110, marginBottom: 8 }}
          />
        ))}

        {/* Error */}
        {!loading && error && (
          <div style={{
            padding: "20px 18px", borderRadius: 14, marginBottom: 8,
            border: "1px solid #450a0a", background: "#1c0a0a",
            fontSize: 14, fontWeight: 700, color: "#fca5a5",
          }}>
            {t("deals.loadError", "Could not load deals: {error}").replace("{error}", error)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && groupedDeals.length === 0 && (
          <div style={{
            textAlign: "center", padding: "48px 20px",
            color: "#9ca3af", fontSize: 15, fontWeight: 600, lineHeight: 1.6,
          }}>
            {t("deals.emptyNearby", "No deals found nearby. Check back soon.")}
          </div>
        )}

        {/* Deal groups */}
        {!loading && !error && groupedDeals.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", paddingLeft: 2, marginBottom: 2 }}>
              {groupedDeals.length}{" "}
              {groupedDeals.length === 1
                ? t("deals.countSingular", "deal")
                : t("deals.countPlural", "deals")}
            </div>

            {groupedDeals.map((group) => {
              const expandedKey = group.restaurantId || group.key;
              const isExpanded = Boolean(expandedRestaurants[expandedKey]);
              const hiddenCount = group.extraDeals.length;
              const restaurantUrl = buildRestaurantMenuUrl(group.restaurantSlug, group.restaurantId);

              return (
                <div
                  key={group.key}
                  style={{
                    borderRadius: 12,
                    border: "1px solid #1F2937",
                    background: "#121A14",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.4)",
                    overflow: "hidden",
                  }}
                >
                  {/* Restaurant header row */}
                  <div style={{ padding: "12px 14px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      {restaurantUrl ? (
                        <Link
                          to={restaurantUrl}
                          style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF", textDecoration: "none", lineHeight: 1.2 }}
                        >
                          {group.restaurantName}
                        </Link>
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF" }}>{group.restaurantName}</div>
                      )}
                      {group.distanceMiles != null && (
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginTop: 2 }}>
                          {formatInlineDistanceMiles(group.distanceMiles)} away
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary deal */}
                  {group.primaryDeal && (
                    <DealRow
                      deal={group.primaryDeal}
                      restaurantUrl={restaurantUrl}
                      onShare={() => handleShare(group, group.primaryDeal)}
                      onDealClick={(clickedDeal) => handleDealClick(group, clickedDeal)}
                    />
                  )}

                  {/* Expanded extra deals */}
                  {isExpanded && group.extraDeals.map((deal) => (
                    <DealRow
                      key={deal.deal_id || deal.id}
                      deal={deal}
                      restaurantUrl={restaurantUrl}
                      onShare={() => handleShare(group, deal)}
                      onDealClick={(clickedDeal) => handleDealClick(group, clickedDeal)}
                    />
                  ))}

                  {/* Expand/collapse toggle */}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleRestaurant(expandedKey)}
                      style={{
                        display: "block", width: "100%",
                        border: "none", borderTop: "1px solid #1F2937",
                        background: "transparent", padding: "10px 14px",
                        fontSize: 12, fontWeight: 800,
                        color: "#22C55E", cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {isExpanded
                        ? "↑ Hide additional deals"
                        : `+ ${hiddenCount} more deal${hiddenCount > 1 ? "s" : ""} from ${group.restaurantName}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
