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
  vegan:         { color: "#16a34a", emoji: "🥗" },
  vegetarian:    { color: "#16a34a", emoji: "🥗" },
  salad:         { color: "#16a34a", emoji: "🥗" },
  healthy:       { color: "#16a34a", emoji: "🥗" },
  breakfast:     { color: "#ca8a04", emoji: "🍳" },
  brunch:        { color: "#ca8a04", emoji: "🍳" },
  cafe:          { color: "#78716c", emoji: "☕" },
  coffee:        { color: "#78716c", emoji: "☕" },
};

const DEFAULT_IDENTITY = { color: "#64748b", emoji: "🍽️" };

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
  const allergens = normalizeAllergens(
    menu?.allergens || menu?.preview_allergens || menu?.chips?.nutrition_chip?.allergens
  );
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
        display: "flex", flexDirection: "row",
        textDecoration: "none", color: "inherit",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid #eee",
        boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        transition: "box-shadow 160ms ease, transform 160ms ease",
      }}
    >
      {(menu.flex_activity > 0) && (
        <div style={{
          width: 7, flexShrink: 0,
          borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
          background: `linear-gradient(to top, #16a34a ${Math.min(100, menu.flex_activity)}%, #bbf7d0 100%)`,
          opacity: Math.max(0.4, Math.min(1, menu.flex_activity / 100)),
          transition: "opacity 300ms ease",
        }} />
      )}

      {/* Content */}
      <div style={{ padding: "6px 11px 6px", background: "#fff", flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontWeight: 700, fontSize: 13, color: "#111",
              lineHeight: 1.2, letterSpacing: "-0.01em",
            }}>
              {name}
              {isVerified && (
                <span style={{
                  marginLeft: 6, fontSize: 9, fontWeight: 800,
                  color: "#fff", background: "#2d6a4f",
                  borderRadius: 3, padding: "1px 4px",
                  verticalAlign: "middle", letterSpacing: "0.04em",
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
                  fontSize: 15, cursor: "pointer", padding: "1px 4px",
                  background: "none", border: "none",
                  opacity: saved ? 1 : 0.2, transition: "opacity 0.2s", flexShrink: 0,
                }}
              >🔖</button>
            )}
            <button
              type="button"
              onClick={handleFollow}
              disabled={followLoading}
              aria-label={followed ? `Unfollow ${name}` : `Follow ${name}`}
              style={{
                width: 28, height: 28, border: "none", borderRadius: 6,
                background: followed ? "#16a34a" : "#f3f4f6",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 200ms ease",
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 900,
                color: followed ? "#fff" : "#9ca3af",
              }}>
                {followed ? "✓" : "F"}
              </span>
            </button>
          </div>
        </div>

        {/* Follow confirmation */}
        {followConfirm && (
          <div style={{
            fontSize: 11, fontWeight: 800, color: "#16a34a",
            marginBottom: 2, letterSpacing: "0.01em",
          }}>
            Following {name}
          </div>
        )}

        {/* Meta row */}
        {metaItems.length > 0 && (
          <div style={{ fontSize: 11, color: "#a09285", marginTop: 2, display: "flex", flexWrap: "wrap", gap: "0 4px" }}>
            {metaItems.map((item, i) => (
              <span key={item.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <span style={{ color: "#d4cbc2" }}>·</span>}
                {item.clickable ? (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowChainSheet(true); }}
                    style={{
                      background: "none", border: "none", padding: 0,
                      font: "inherit", color: "inherit", cursor: "pointer",
                      textDecoration: "underline", textUnderlineOffset: 2,
                    }}
                  >{item.text}</button>
                ) : item.text}
              </span>
            ))}
            {phone && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#d4cbc2" }}>·</span>
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: "#a09285", textDecoration: "none" }}
                  aria-label={`Call ${phone}`}
                >📞</a>
              </span>
            )}
          </div>
        )}

        {/* Preview chips */}
        {chips.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
            {chips.map((tag) => (
              <span key={tag} style={{
                fontSize: 10, color: "#7a6f66",
                border: "1px solid #e0d8d0",
                background: "transparent",
                padding: "2px 7px", borderRadius: 99,
              }}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
            ))}
          </div>
        )}

        {/* Allergen indicator */}
        {allergens.length > 0 && (
          <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: "#9a3412" }}>
            ⚠️ {allergens.join(", ")}
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
