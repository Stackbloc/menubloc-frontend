import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ChainLocationsSheet from "./ChainLocationsSheet.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { followRestaurant, unfollowRestaurant } from "../../lib/consumerApi.js";

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
  return Number.isFinite(n) ? `${n.toFixed(1)} mi` : null;
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
}) {
  const [showChainSheet, setShowChainSheet] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followConfirm, setFollowConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const id = menu?.restaurant_id;
  const chainId = menu?.chain_id ?? null;
  const name = (menu?.restaurant_name || "Restaurant").replace(/^The\s+/i, "");
  const cuisine = menu?.cuisine || menu?.category || null;
  const distance = formatDistance(menu?.distance_miles);
  const locationCount = menu?.location_count || 1;
  const itemCount = menu?.menu_item_count || 0;
  const isVerified = menu?.menu_status === "published";
  const chips = (menu?.preview_items || []).slice(0, 3);
  const phone = menu?.phone || null;

  const href = `/public/restaurants/${id}/menu${buildMergedSearch(location.search, activeFilterParams)}`;

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

  const itemCountLabel = itemCount > 0
    ? (activeFilterLabel ? `${itemCount} ${activeFilterLabel} items` : `${itemCount} items`)
    : null;

  const hasGeoContext = menu?.distance_miles != null;
  const locationCountLabel = locationCount > 1
    ? `${locationCount} location${locationCount === 1 ? "" : "s"} ${hasGeoContext ? "nearby" : "in this area"}`
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
        border: "1px solid #243020",
        background: "#141E15",
        boxShadow: "0 6px 24px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.32)",
        transition: "box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease",
      }}
    >
      <div style={{
        width: 7,
        flexShrink: 0,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        background: menu.flex_activity > 0
          ? `linear-gradient(to top, #22C55E ${Math.min(100, menu.flex_activity)}%, #4ade80 100%)`
          : "#1F2937",
        opacity: menu.flex_activity > 0
          ? Math.max(0.5, Math.min(1, menu.flex_activity / 100))
          : 0.5,
        transition: "background 300ms ease, opacity 300ms ease",
      }} />

      {/* Content */}
      <div style={{ padding: "9px 12px 9px", background: "#141E15", flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontWeight: 700,
              fontSize: 13,
              color: "#FFFFFF",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}>
              {name}
              {isVerified && (
                <span style={{
                  marginLeft: 6,
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#0B0F0C",
                  background: "#22C55E",
                  borderRadius: 3,
                  padding: "1px 4px",
                  verticalAlign: "middle",
                  letterSpacing: "0.04em",
                }}>LIVE</span>
              )}
            </div>
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
                background: followed ? "#22C55E" : "#1F2937",
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
                color: followed ? "#0B0F0C" : "#6B7280",
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
            color: "#22C55E",
            marginBottom: 2,
            letterSpacing: "0.01em",
          }}>
            Following {name}
          </div>
        )}

        {/* Meta row */}
        {metaItems.length > 0 && (
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2, display: "flex", flexWrap: "wrap", gap: "0 4px" }}>
            {metaItems.map((item, i) => (
              <span key={item.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <span style={{ color: "#374151" }}>·</span>}
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
                color: "#9CA3AF",
                border: "1px solid #1F2937",
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
        onClose={() => setShowChainSheet(false)}
      />
    )}
  </>
  );
}
