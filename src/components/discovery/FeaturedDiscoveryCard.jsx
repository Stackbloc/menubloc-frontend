import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ChainLocationsSheet from "./ChainLocationsSheet.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { getDisplayItemCount, getMenuAvailabilityLabel, shouldLinkRestaurantCardToMenu } from "../../lib/publicCardCounts.js";
import { getLocalizedField, getLocalizedPreviewLabel } from "../../utils/getLocalizedField.js";
import { appendLanguageParam } from "../../lib/languageApi.js";
import { restaurantMenuPathFromRow, restaurantPathFromRow } from "../../lib/canonicalUrl.js";

function buildMergedSearch(baseSearch, extra) {
  const params = new URLSearchParams(baseSearch || "");
  const extraParams = new URLSearchParams(extra || "");
  for (const [k, v] of extraParams.entries()) params.set(k, v);
  const out = params.toString();
  return out ? `?${out}` : "";
}

function formatDistance(value) {
  if (value == null) return null;
  const n = Number(value);
  // Suppress null-island distances (lat=0,lng=0 computes ~5600mi from any US city)
  if (!Number.isFinite(n) || n > 3000) return null;
  return `${n.toFixed(1)} mi`;
}

const CUISINE_GRADIENTS = {
  american:      "linear-gradient(145deg, #f59e0b 0%, #b45309 100%)",
  burger:        "linear-gradient(145deg, #f59e0b 0%, #b45309 100%)",
  burgers:       "linear-gradient(145deg, #f59e0b 0%, #b45309 100%)",
  bbq:           "linear-gradient(145deg, #b45309 0%, #7c2d12 100%)",
  chicken:       "linear-gradient(145deg, #d97706 0%, #92400e 100%)",
  southern:      "linear-gradient(145deg, #b45309 0%, #78350f 100%)",
  soul:          "linear-gradient(145deg, #b45309 0%, #78350f 100%)",
  sandwich:      "linear-gradient(145deg, #ea580c 0%, #9a3412 100%)",
  steak:         "linear-gradient(145deg, #991b1b 0%, #450a0a 100%)",
  steakhouse:    "linear-gradient(145deg, #991b1b 0%, #450a0a 100%)",
  italian:       "linear-gradient(145deg, #ef4444 0%, #991b1b 100%)",
  pizza:         "linear-gradient(145deg, #ef4444 0%, #991b1b 100%)",
  mexican:       "linear-gradient(145deg, #f97316 0%, #b45309 100%)",
  "tex-mex":     "linear-gradient(145deg, #f97316 0%, #b45309 100%)",
  tacos:         "linear-gradient(145deg, #f97316 0%, #b45309 100%)",
  asian:         "linear-gradient(145deg, #6366f1 0%, #312e81 100%)",
  chinese:       "linear-gradient(145deg, #6366f1 0%, #312e81 100%)",
  japanese:      "linear-gradient(145deg, #4f46e5 0%, #1e1b4b 100%)",
  sushi:         "linear-gradient(145deg, #0891b2 0%, #0e4f6b 100%)",
  thai:          "linear-gradient(145deg, #7c3aed 0%, #3b0764 100%)",
  korean:        "linear-gradient(145deg, #6366f1 0%, #1e1b4b 100%)",
  vietnamese:    "linear-gradient(145deg, #0891b2 0%, #0c4a6e 100%)",
  indian:        "linear-gradient(145deg, #d97706 0%, #713f12 100%)",
  mediterranean: "linear-gradient(145deg, #0d9488 0%, #134e4a 100%)",
  greek:         "linear-gradient(145deg, #0d9488 0%, #134e4a 100%)",
  seafood:       "linear-gradient(145deg, #0284c7 0%, #0c4a6e 100%)",
  vegan:         "linear-gradient(145deg, #22c55e 0%, #14532d 100%)",
  vegetarian:    "linear-gradient(145deg, #22c55e 0%, #14532d 100%)",
  salad:         "linear-gradient(145deg, #22c55e 0%, #14532d 100%)",
  healthy:       "linear-gradient(145deg, #22c55e 0%, #14532d 100%)",
  breakfast:     "linear-gradient(145deg, #ca8a04 0%, #713f12 100%)",
  brunch:        "linear-gradient(145deg, #ca8a04 0%, #713f12 100%)",
  cafe:          "linear-gradient(145deg, #78716c 0%, #1c1917 100%)",
  coffee:        "linear-gradient(145deg, #78716c 0%, #1c1917 100%)",
};

const DEFAULT_GRADIENT = "linear-gradient(145deg, #1e3a2f 0%, #0f1f18 100%)";

const CUISINE_EMOJI = {
  american: "🍔", burger: "🍔", burgers: "🍔",
  bbq: "🔥", chicken: "🍗", southern: "🍗", soul: "🍗",
  sandwich: "🥪", sandwiches: "🥪",
  steak: "🥩", steakhouse: "🥩",
  italian: "🍕", pizza: "🍕",
  mexican: "🌮", "tex-mex": "🌮", tacos: "🌮",
  asian: "🥡", chinese: "🥡", japanese: "🍱",
  sushi: "🍣", thai: "🌶️", korean: "🥘",
  vietnamese: "🍜", indian: "🍛",
  mediterranean: "🫒", greek: "🫒",
  seafood: "🦞",
  vegan: "🥗", vegetarian: "🥗", salad: "🥗", healthy: "🥗",
  breakfast: "🍳", brunch: "🍳",
  cafe: "☕", coffee: "☕",
};

function getCuisineStyle(cuisine) {
  if (!cuisine) return { gradient: DEFAULT_GRADIENT, emoji: "🍽️" };
  const key = cuisine.toLowerCase();
  for (const [pattern] of Object.entries(CUISINE_GRADIENTS)) {
    if (key.includes(pattern)) {
      return {
        gradient: CUISINE_GRADIENTS[pattern],
        emoji: CUISINE_EMOJI[pattern] || "🍽️",
      };
    }
  }
  return { gradient: DEFAULT_GRADIENT, emoji: "🍽️" };
}

export default function FeaturedDiscoveryCard({
  menu,
  activeFilterParams = "",
  activeFilterLabel = null,
  hasActiveFilters = false,
}) {
  const [showChainSheet, setShowChainSheet] = useState(false);
  const location = useLocation();
  const { language, t } = useLanguage();

  const id = menu?.restaurant_id;
  const chainId = menu?.chain_id ?? null;
  const localizedName =
    getLocalizedField(menu, "restaurant_name", language) ||
    getLocalizedField(menu, "name", language) ||
    menu?.restaurant_name ||
    menu?.name ||
    t("common.restaurant", "Restaurant");
  const name = localizedName.replace(/^The\s+/i, "");
  const cuisine = menu?.cuisine || menu?.category || null;
  const distance = formatDistance(menu?.distance_miles);
  const itemCount = getDisplayItemCount({ restaurant: menu, hasActiveFilters });
  const menuReady = shouldLinkRestaurantCardToMenu(menu);
  const availabilityLabel = getMenuAvailabilityLabel(menu, t);
  const isVerified = menuReady && menu?.menu_status === "published";
  const hasDeals = menuReady && (menu?.has_deals || false);
  const previewSource = menuReady && Array.isArray(menu?.preview_menu_items) && menu.preview_menu_items.length
    ? menu.preview_menu_items
    : menuReady ? (menu?.preview_items || []) : [];
  const chips = previewSource.slice(0, 3).map((item) => getLocalizedPreviewLabel(item, language));
  const locationCount = menu?.location_count || 1;

  const profileHref = restaurantPathFromRow(menu) || `/public/restaurants/${id}`;
  const menuHref = restaurantMenuPathFromRow(menu) || `/public/restaurants/${id}/menu`;
  const cardSearch = buildMergedSearch(location.search, activeFilterParams);
  const href = appendLanguageParam(
    menuReady ? `${menuHref}${cardSearch}` : `${profileHref}${cardSearch}#claim-profile`,
    language
  );
  const { gradient, emoji } = getCuisineStyle(cuisine);

  const itemWord = t(itemCount === 1 ? "common.itemSingular" : "common.itemPlural", itemCount === 1 ? "item" : "items");
  const itemCountLabel = itemCount > 0
    ? (activeFilterLabel ? `${itemCount} ${activeFilterLabel} ${itemWord}` : `${itemCount} ${itemWord}`)
    : null;

  const hasGeoContext = menu?.distance_miles != null;
  const locationCountLabel = locationCount > 1
    ? (hasGeoContext
      ? t("discovery.locationCountNearby", "{count} locations nearby", { count: locationCount })
      : t("discovery.locationCountArea", "{count} locations in this area", { count: locationCount }))
    : null;

  return (
    <>
      <Link
        to={href}
        style={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
          borderRadius: 16,
          overflow: "hidden",
          background: gradient,
          boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
          position: "relative",
          minHeight: 160,
        }}
      >
        {/* Subtle noise overlay for depth */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.10) 0%, transparent 55%)",
        }} />

        {/* Dark scrim for text readability */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "rgba(0,0,0,0.30)",
        }} />

        {/* Featured label — top left */}
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 4,
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 9px",
          borderRadius: 999,
          fontSize: 9, fontWeight: 800, letterSpacing: 1,
          background: "rgba(255,255,255,0.20)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.30)",
          color: "#fff",
          textTransform: "uppercase",
          textShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}>
          ✦ Featured Nearby
        </div>

        {/* Verified badge — top right */}
        {isVerified && (
          <div style={{
            position: "absolute", top: 12, right: 12, zIndex: 4,
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px",
            borderRadius: 999,
            fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
            background: "rgba(255,255,255,0.20)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.30)",
            color: "#fff",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
            LIVE MENU
          </div>
        )}

        {/* Main content */}
        <div style={{
          position: "relative", zIndex: 3,
          padding: "46px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          {/* Emoji + name row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 36, lineHeight: 1, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }}>
              {emoji}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 17, fontWeight: 900, color: "#fff",
                lineHeight: 1.15, letterSpacing: "-0.02em",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {name}
              </div>
              {cuisine && (
                <div style={{
                  fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.78)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                  marginTop: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                </div>
              )}
            </div>
          </div>

          {/* Meta pills row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
            {distance && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.82)",
                background: "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 999, padding: "2px 8px",
              }}>
                📍 {distance}
              </span>
            )}
            {locationCountLabel && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (chainId != null) setShowChainSheet(true); }}
                style={{
                  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.82)",
                  background: "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 999, padding: "2px 8px",
                  cursor: chainId != null ? "pointer" : "default",
                  textDecoration: chainId != null ? "underline" : "none",
                  textUnderlineOffset: 2,
                }}
              >
                🏪 {locationCountLabel}
              </button>
            )}
            {itemCountLabel && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.82)",
                background: "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 999, padding: "2px 8px",
              }}>
                📋 {itemCountLabel}
              </span>
            )}
            {!itemCountLabel && availabilityLabel && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.82)",
                background: "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 999, padding: "2px 8px",
              }}>
                {availabilityLabel}
              </span>
            )}
            {hasDeals && (
              <span style={{
                fontSize: 10, fontWeight: 800, color: "#fde68a",
                background: "rgba(161,98,7,0.45)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(253,230,138,0.35)",
                borderRadius: 999, padding: "2px 8px",
              }}>
                🏷 Deals
              </span>
            )}
          </div>

          {/* Preview item chips */}
          {chips.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {chips.map((tag) => (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 700,
                  color: "rgba(255,255,255,0.90)",
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  backdropFilter: "blur(6px)",
                  padding: "3px 9px",
                  borderRadius: 99,
                }}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {showChainSheet && chainId != null && (
        <ChainLocationsSheet
          chainId={chainId}
          currentRestaurantId={id}
          onClose={() => setShowChainSheet(false)}
        />
      )}
    </>
  );
}
