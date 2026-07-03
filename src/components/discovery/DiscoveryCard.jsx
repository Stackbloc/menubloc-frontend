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

const MAX_DISPLAY_MILES = 50;

function formatDistance(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n > MAX_DISPLAY_MILES) return null;
  return `${n.toFixed(1)} mi`;
}

function normalizeAllergens(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => String(v || "").replace(/_/g, " ").trim())
    .filter(Boolean)
    .map((v) => v.charAt(0).toUpperCase() + v.slice(1));
}

const CUISINE_IDENTITY = {
  american:      { color: "#f59e0b", emoji: "🍔" },
  burger:        { color: "#f59e0b", emoji: "🍔" },
  burgers:       { color: "#f59e0b", emoji: "🍔" },
  bbq:           { color: "#b45309", emoji: "🔥" },
  sandwich:      { color: "#ea580c", emoji: "🥪" },
  sandwiches:    { color: "#ea580c", emoji: "🥪" },
  wings:         { color: "#ea580c", emoji: "🍗" },
  chicken:       { color: "#d97706", emoji: "🍗" },
  southern:      { color: "#b45309", emoji: "🍗" },
  soul:          { color: "#b45309", emoji: "🍗" },
  steak:         { color: "#991b1b", emoji: "🥩" },
  steakhouse:    { color: "#991b1b", emoji: "🥩" },
  italian:       { color: "#ef4444", emoji: "🍕" },
  pizza:         { color: "#ef4444", emoji: "🍕" },
  mexican:       { color: "#f97316", emoji: "🌮" },
  "tex-mex":     { color: "#f97316", emoji: "🌮" },
  tacos:         { color: "#f97316", emoji: "🌮" },
  asian:         { color: "#6366f1", emoji: "🥡" },
  chinese:       { color: "#6366f1", emoji: "🥡" },
  japanese:      { color: "#6366f1", emoji: "🍱" },
  sushi:         { color: "#0891b2", emoji: "🍣" },
  thai:          { color: "#7c3aed", emoji: "🌶️" },
  korean:        { color: "#6366f1", emoji: "🥘" },
  vietnamese:    { color: "#0891b2", emoji: "🍜" },
  indian:        { color: "#d97706", emoji: "🍛" },
  mediterranean: { color: "#0d9488", emoji: "🫒" },
  greek:         { color: "#0d9488", emoji: "🫒" },
  seafood:       { color: "#0284c7", emoji: "🦞" },
  vegan:         { color: "#22C55E", emoji: "🥗" },
  vegetarian:    { color: "#22C55E", emoji: "🥗" },
  salad:         { color: "#22C55E", emoji: "🥗" },
  healthy:       { color: "#22C55E", emoji: "🥗" },
  breakfast:     { color: "#ca8a04", emoji: "🍳" },
  brunch:        { color: "#ca8a04", emoji: "🍳" },
  cafe:          { color: "#78716c", emoji: "☕" },
  coffee:        { color: "#78716c", emoji: "☕" },
};

const DEFAULT_IDENTITY = { color: "#4B5563", emoji: "🍽️" };

function getCuisineIdentity(cuisine) {
  if (!cuisine) return DEFAULT_IDENTITY;
  const key = cuisine.toLowerCase();
  for (const [pattern, identity] of Object.entries(CUISINE_IDENTITY)) {
    if (key.includes(pattern)) return identity;
  }
  return DEFAULT_IDENTITY;
}

export default function DiscoveryCard({
  menu,
  saved = false,
  onSave,
  activeFilterParams = "",
  activeFilterLabel = null,
  hasActiveFilters = false,
  /** HomeNext only — uniform pane heights: featured (Popular) vs compact (other sections). */
  paneVariant = null,
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
  const locationCount = menu?.location_count || 1;
  const itemCount = getDisplayItemCount({ restaurant: menu, hasActiveFilters });
  const menuReady = shouldLinkRestaurantCardToMenu(menu);
  const availabilityLabel = getMenuAvailabilityLabel(menu, t);
  const isVerified = menuReady && menu?.menu_status === "published";
  const previewSource = menuReady && Array.isArray(menu?.preview_menu_items) && menu.preview_menu_items.length
    ? menu.preview_menu_items
    : menuReady ? (menu?.preview_items || []) : [];
  const previewLimit = paneVariant === "compact" ? 2 : 3;
  const chips = previewSource.slice(0, previewLimit).map((item) => getLocalizedPreviewLabel(item, language));
  const paneClass =
    paneVariant === "featured"
      ? "discovery-pane discovery-pane--featured"
      : paneVariant === "compact"
        ? "discovery-pane discovery-pane--compact"
        : "";
  const phone = menu?.phone || null;

  const profileHref = restaurantPathFromRow(menu) || `/public/restaurants/${id}`;
  const menuHref = restaurantMenuPathFromRow(menu) || `/public/restaurants/${id}/menu`;
  const cardSearch = buildMergedSearch(location.search, activeFilterParams);
  const href = appendLanguageParam(
    menuReady ? `${menuHref}${cardSearch}` : `${profileHref}${cardSearch}#claim-profile`,
    language
  );

  const itemWord = t(itemCount === 1 ? "common.itemSingular" : "common.itemPlural", itemCount === 1 ? "item" : "items");
  const itemCountLabel = itemCount > 0 && !paneVariant
    ? (activeFilterLabel ? `${itemCount} ${activeFilterLabel} ${itemWord}` : `${itemCount} ${itemWord}`)
    : null;

  const hasGeoContext = menu?.distance_miles != null;
  const locationCountLabel = locationCount > 1
    ? (hasGeoContext
      ? t("discovery.locationCountNearby", "{count} locations nearby", { count: locationCount })
      : t("discovery.locationCountArea", "{count} locations in this area", { count: locationCount }))
    : null;

  const metaItems = [
    distance           ? { key: "distance", text: distance,          clickable: false } : null,
    locationCountLabel && chainId != null
                       ? { key: "chain",    text: locationCountLabel, clickable: true  } : null,
    locationCountLabel && chainId == null
                       ? { key: "chain",    text: locationCountLabel, clickable: false } : null,
    itemCountLabel     ? { key: "items",    text: itemCountLabel,     clickable: false } : null,
    !itemCountLabel && availabilityLabel
                       ? { key: "availability", text: availabilityLabel, clickable: false } : null,
  ].filter(Boolean);

  return (
  <>
    <Link
      to={href}
      className={paneClass || undefined}
      style={{
        display: "flex",
        flexDirection: "row",
        textDecoration: "none",
        color: "inherit",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid var(--gb-color-border)",
        background: "linear-gradient(180deg, #071b12 0%, #0b2418 100%)",
        boxShadow: "var(--gb-shadow-card)",
        transition: "box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease",
        ...(paneVariant ? { height: "100%", boxSizing: "border-box" } : {}),
      }}
    >
      <div style={{
        width: 4,
        flexShrink: 0,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        background: getCuisineIdentity(cuisine).color,
        opacity: 0.9,
      }} />

      {/* Content */}
      <div
        className={paneVariant ? "discovery-pane-body" : undefined}
        style={{ padding: "9px 12px 9px", background: "transparent", flex: 1, minWidth: 0 }}
      >
        {/* Name row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontWeight: 700,
              fontSize: 13,
              color: "var(--gb-color-ink-strong)",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}>
              {name}
              {isVerified && (
                <span style={{
                  marginLeft: 6,
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#ffffff",
                  background: "var(--gb-color-accent)",
                  borderRadius: 3,
                  padding: "1px 4px",
                  verticalAlign: "middle",
                  letterSpacing: "0.04em",
                }}>LIVE</span>
              )}
            </div>
          </div>
          {onSave ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(id); }}
                aria-label={saved ? "Unsave" : "Save"}
                style={{
                  fontSize: 15,
                  cursor: "pointer",
                  padding: "1px 4px",
                  background: "none",
                  border: "none",
                  opacity: saved ? 1 : 0.3,
                  transition: "opacity 0.2s",
                  flexShrink: 0,
                }}
              >🔖</button>
            </div>
          ) : null}
        </div>

        {/* Meta row — pill chips */}
        {(metaItems.length > 0 || paneVariant) && (
          <div
            className={paneVariant ? "discovery-pane-meta" : undefined}
            style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}
          >
            {metaItems.map((item) => {
              const emoji = item.key === "distance" ? "📍" : item.key === "chain" ? "🏪" : "🍽️";
              const pillStyle = {
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.70)",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 99,
                padding: "2px 7px",
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                lineHeight: 1.4,
              };
              return item.clickable ? (
                <button
                  key={item.key}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowChainSheet(true); }}
                  style={{ ...pillStyle, cursor: "pointer", border: "none", textDecoration: "underline", textUnderlineOffset: 2 }}
                ><span>{emoji}</span><span>{item.text}</span></button>
              ) : (
                <span key={item.key} style={pillStyle}><span>{emoji}</span><span>{item.text}</span></span>
              );
            })}
          </div>
        )}

        {/* Preview chips */}
        {(chips.length > 0 || paneVariant) && (
          <div
            className={paneVariant ? "discovery-pane-preview" : undefined}
            style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}
          >
            {chips.map((tag) => (
              <span key={tag} style={{
                fontSize: 10,
                color: "var(--gb-color-ink-muted)",
                border: "1px solid var(--gb-color-border)",
                background: "transparent",
                padding: "2px 7px",
                borderRadius: 99,
              }}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
            ))}
          </div>
        )}

      </div>
    </Link>
    {showChainSheet && chainId != null && (
      <ChainLocationsSheet
        chainId={chainId}
        currentRestaurantId={id}
        marketCity={menu?.city}
        marketState={menu?.state}
        onClose={() => setShowChainSheet(false)}
      />
    )}
  </>
  );
}
