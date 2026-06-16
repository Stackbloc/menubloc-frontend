import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ChainLocationsSheet from "./ChainLocationsSheet.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { followRestaurant, unfollowRestaurant } from "../../lib/consumerApi.js";
import { getDisplayItemCount } from "../../lib/publicCardCounts.js";
import { getLocalizedField, getLocalizedPreviewLabel } from "../../utils/getLocalizedField.js";
import { appendLanguageParam } from "../../lib/languageApi.js";

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
  american:      { color: "#B7791F", emoji: "🍔" },
  burger:        { color: "#B7791F", emoji: "🍔" },
  burgers:       { color: "#B7791F", emoji: "🍔" },
  bbq:           { color: "#A24A1B", emoji: "🔥" },
  barbecue:      { color: "#A24A1B", emoji: "🔥" },
  sandwich:      { color: "#B7791F", emoji: "🥪" },
  sandwiches:    { color: "#B7791F", emoji: "🥪" },
  wings:         { color: "#A24A1B", emoji: "🍗" },
  chicken:       { color: "#A24A1B", emoji: "🍗" },
  southern:      { color: "#A24A1B", emoji: "🍗" },
  soul:          { color: "#A24A1B", emoji: "🍗" },
  steak:         { color: "#7F1D1D", emoji: "🥩" },
  steakhouse:    { color: "#7F1D1D", emoji: "🥩" },
  italian:       { color: "#8F1D2C", emoji: "🍕" },
  pizza:         { color: "#8F1D2C", emoji: "🍕" },
  mexican:       { color: "#B3261E", emoji: "🌮" },
  "tex-mex":     { color: "#B3261E", emoji: "🌮" },
  tacos:         { color: "#B3261E", emoji: "🌮" },
  asian:         { color: "#047857", emoji: "🥡" },
  chinese:       { color: "#047857", emoji: "🥡" },
  japanese:      { color: "#047857", emoji: "🍱" },
  sushi:         { color: "#2563EB", emoji: "🍣" },
  thai:          { color: "#B3261E", emoji: "🌶️" },
  korean:        { color: "#047857", emoji: "🥘" },
  vietnamese:    { color: "#047857", emoji: "🍜" },
  indian:        { color: "#A24A1B", emoji: "🍛" },
  mediterranean: { color: "#047857", emoji: "🫒" },
  greek:         { color: "#047857", emoji: "🫒" },
  seafood:       { color: "#2563EB", emoji: "🦞" },
  vegan:         { color: "#16A34A", emoji: "🥗" },
  vegetarian:    { color: "#16A34A", emoji: "🥗" },
  salad:         { color: "#16A34A", emoji: "🥗" },
  salads:        { color: "#16A34A", emoji: "🥗" },
  healthy:       { color: "#16A34A", emoji: "🥗" },
  breakfast:     { color: "#B7791F", emoji: "🍳" },
  brunch:        { color: "#B7791F", emoji: "🍳" },
  cafe:          { color: "#78716c", emoji: "☕" },
  coffee:        { color: "#78716c", emoji: "☕" },
};

const DEFAULT_IDENTITY = { color: "#2F6F4E", emoji: "🍽️" };

function titleCaseLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildCuisineIdentityLine(menu, identity) {
  const rawParts = [menu?.cuisine, menu?.category]
    .map((part) => titleCaseLabel(part))
    .filter(Boolean);
  const parts = Array.from(new Set(rawParts));
  if (parts.length === 0) return null;
  return `${identity.emoji} ${parts.join(" • ")}`;
}

function hexToRgba(hex, alpha) {
  const cleaned = String(hex || "").replace("#", "");
  if (cleaned.length !== 6) return `rgba(47,111,78,${alpha})`;
  const value = Number.parseInt(cleaned, 16);
  if (!Number.isFinite(value)) return `rgba(47,111,78,${alpha})`;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

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
  visualIndex = 0,
}) {
  const [showChainSheet, setShowChainSheet] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followConfirm, setFollowConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
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
  const identity = getCuisineIdentity([menu?.cuisine, menu?.category].filter(Boolean).join(" "));
  const cuisineIdentityLine = buildCuisineIdentityLine(menu, identity);
  const accent = identity.color;
  const accentSoft = hexToRgba(accent, 0.16);
  const accentBorder = hexToRgba(accent, 0.34);
  const accentGlow = hexToRgba(accent, 0.26);
  const useRhythmGradient = visualIndex > 0 && (visualIndex + 1) % 5 === 0;
  const distance = formatDistance(menu?.distance_miles);
  const locationCount = menu?.location_count || 1;
  const itemCount = getDisplayItemCount({ restaurant: menu, hasActiveFilters });
  const isVerified = menu?.menu_status === "published";
  const previewSource = Array.isArray(menu?.preview_menu_items) && menu.preview_menu_items.length
    ? menu.preview_menu_items
    : menu?.preview_items || [];
  const chips = previewSource.slice(0, 3).map((item) => getLocalizedPreviewLabel(item, language));
  const phone = menu?.phone || null;

  const href = appendLanguageParam(
    `/public/restaurants/${id}/menu${buildMergedSearch(location.search, activeFilterParams)}`,
    language
  );

  async function handleFollow(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate("/account"); return; }
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (followed) {
        await unfollowRestaurant(id);
        setFollowed(false);
      } else {
        await followRestaurant(id);
        setFollowed(true);
        setFollowConfirm(true);
        setTimeout(() => setFollowConfirm(false), 2500);
      }
    } catch {}
    setFollowLoading(false);
  }

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

  const metaItems = [
    distance           ? { key: "distance", text: distance,          clickable: false } : null,
    locationCountLabel && chainId != null
                       ? { key: "chain",    text: locationCountLabel, clickable: true  } : null,
    locationCountLabel && chainId == null
                       ? { key: "chain",    text: locationCountLabel, clickable: false } : null,
    itemCountLabel     ? { key: "items",    text: itemCountLabel,     clickable: false } : null,
  ].filter(Boolean);

  return (
  <>
    <Link
      to={href}
      style={{
        display: "flex",
        flexDirection: "row",
        textDecoration: "none",
        color: "inherit",
        overflow: "hidden",
        borderRadius: 12,
        border: `1px solid ${accentBorder}`,
        background: useRhythmGradient
          ? `radial-gradient(circle at 88% 0%, ${hexToRgba(accent, 0.22)} 0%, transparent 34%), linear-gradient(145deg, #17261C 0%, #0E1711 54%, #142019 100%)`
          : `radial-gradient(circle at 96% 10%, ${accentSoft} 0%, transparent 30%), linear-gradient(145deg, #142119 0%, #0B120E 58%, #101A13 100%)`,
        boxShadow: `var(--gb-shadow-card), 0 0 0 1px ${hexToRgba(accent, 0.08)}, 0 12px 30px ${hexToRgba(accent, useRhythmGradient ? 0.13 : 0.08)}`,
        transition: "box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease",
        position: "relative",
      }}
    >
      <div aria-hidden="true" style={{
        position: "absolute",
        top: -30,
        right: -28,
        width: 86,
        height: 86,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accentGlow} 0%, transparent 66%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        width: 7,
        flexShrink: 0,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        background: menu.flex_activity > 0
          ? `linear-gradient(to top, ${accent} ${Math.min(100, menu.flex_activity)}%, #4ade80 100%)`
          : `linear-gradient(to bottom, ${accentBorder}, ${hexToRgba(accent, 0.12)})`,
        opacity: menu.flex_activity > 0
          ? Math.max(0.5, Math.min(1, menu.flex_activity / 100))
          : 0.82,
        transition: "background 300ms ease, opacity 300ms ease",
        zIndex: 1,
      }} />

      {/* Content */}
      <div style={{ padding: "9px 12px 9px", background: "transparent", flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
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
                  background: accent,
                  boxShadow: `0 0 12px ${hexToRgba(accent, 0.28)}`,
                  borderRadius: 3,
                  padding: "1px 4px",
                  verticalAlign: "middle",
                  letterSpacing: "0.04em",
                }}>LIVE</span>
              )}
            </div>
            {cuisineIdentityLine && (
              <div style={{
                marginTop: 3,
                fontSize: 10,
                fontWeight: 700,
                color: "var(--gb-color-ink-soft)",
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {cuisineIdentityLine}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {onSave && (
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
            )}
            <button
              type="button"
              onClick={handleFollow}
              disabled={followLoading}
              aria-label={followed ? `Unfollow ${name}` : `Follow ${name}`}
              style={{
                width: 28,
                height: 28,
                border: "none",
                borderRadius: 6,
                background: followed ? accent : hexToRgba(accent, 0.13),
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 200ms ease",
              }}
            >
              <span style={{
                fontSize: 11,
                fontWeight: 900,
                color: followed ? "#ffffff" : "var(--gb-color-ink-muted)",
              }}>
                {followed ? "✓" : "F"}
              </span>
            </button>
          </div>
        </div>

        {/* Follow confirmation */}
        {followConfirm && (
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--gb-color-accent)",
            marginBottom: 2,
            letterSpacing: "0.01em",
          }}>
            Following {name}
          </div>
        )}

        {/* Meta row */}
        {metaItems.length > 0 && (
          <div style={{ fontSize: 11, color: "var(--gb-color-ink-muted)", marginTop: 2, display: "flex", flexWrap: "wrap", gap: "0 4px" }}>
            {metaItems.map((item, i) => (
              <span key={item.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <span style={{ color: "var(--gb-color-border-strong)" }}>·</span>}
                {item.clickable ? (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowChainSheet(true); }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      font: "inherit",
                      color: "inherit",
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                    }}
                  >{item.text}</button>
                ) : item.text}
              </span>
            ))}
          </div>
        )}

        {/* Preview chips */}
        {chips.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
            {chips.map((tag) => (
              <span key={tag} style={{
                fontSize: 10,
                color: "var(--gb-color-ink-soft)",
                border: `1px solid ${hexToRgba(accent, 0.26)}`,
                background: hexToRgba(accent, 0.08),
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
        onClose={() => setShowChainSheet(false)}
      />
    )}
  </>
  );
}
