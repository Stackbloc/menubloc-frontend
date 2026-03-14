/**
 * ============================================================
 * File: SearchResultCard.jsx
 * Path: menubloc-frontend/src/components/SearchResultCard.jsx
 * Date: 2026-03-10
 * Purpose:
 *   Search result card UI — food-first, scan-optimized.
 *   - Grouped by restaurant (restaurant header, muted)
 *   - Menu items as primary content
 *   - Badges inline after item name: Popular → Deal → GF → Vegan
 *   - Price: whole dollars only, right-aligned, minWidth 64
 *   - Chips in order: Nutrition → Insights → Show Similar
 *   - Insights chip toggles InsightCardDeck (real chip-driven data only)
 *     Data derived entirely from existing row payload — no new fetches.
 *   - Footer CTA: "View Menu" → /public/restaurants/:id/menu
 *
 *   2026-03-10 update:
 *   - Public restaurant profile links now prefer /restaurants/:slugOrId
 *   - Menu links remain /public/restaurants/:id/menu
 * ============================================================
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import InsightCardDeck, { buildInsightCards } from "./InsightCardDeck.jsx";

/* ---- Helpers ---- */

function asStr(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

function asNum(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const c = v.replace(/[^\d.-]/g, "");
    if (!c) return null;
    const n = Number(c);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pick(obj, keys, fallback) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && asStr(v) !== "") return v;
  }
  return fallback !== undefined ? fallback : "";
}

function asBool(v) {
  if (v === true) return true;
  if (v === false || v === 0 || v === "0") return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "yes" || s === "1";
  }
  return false;
}

/* Whole dollars only — no cents on search cards */
function fmtPrice(row) {
  const d = asNum(row?.price) ?? asNum(row?.item?.price);
  if (d !== null) return "$" + Math.round(d);
  const m = asNum(row?.price_minor_units) ?? asNum(row?.item?.price_minor_units);
  if (m !== null) return "$" + Math.round(m / 100);
  const c = asNum(row?.price_cents) ?? asNum(row?.item?.price_cents);
  if (c !== null) return "$" + Math.round(c / 100);
  return "";
}

function escRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hl(text, query) {
  const t = asStr(text);
  const q = asStr(query);
  if (!t || !q) return t;
  const re = new RegExp("(" + escRe(q) + ")", "ig");
  const parts = t.split(re);
  if (parts.length <= 1) return t;
  return parts.map((p, i) =>
    i % 2 === 1
      ? React.createElement(
          "mark",
          { key: i, style: { background: "#fff3a0", borderRadius: 4, padding: "0 3px" } },
          p
        )
      : React.createElement("span", { key: i }, p)
  );
}

function renderUL(arr) {
  return (
    <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
      {arr.map((e, i) => (
        <li key={i} style={{ marginBottom: 3 }}>
          {e}
        </li>
      ))}
    </ul>
  );
}

function getItemId(row) {
  return asStr(pick(row, ["menu_item_id", "menuItemId", "id"]));
}
function getRestId(row) {
  return asStr(pick(row, ["restaurant_id", "restaurantId", "id"]));
}
function getRestSlug(row) {
  return asStr(pick(row, ["restaurant_slug", "restaurantSlug", "slug"]));
}
function getRestName(row) {
  return asStr(pick(row, ["restaurant_name", "restaurantName", "name", "title"], "Restaurant"));
}
function getItemName(row) {
  return asStr(pick(row, ["menu_item_name", "menuItemName", "item_name", "dish", "name"], "Menu item"));
}

function getRestaurantProfileTarget(x) {
  const slug = asStr(pick(x, ["restaurant_slug", "restaurantSlug", "slug"]));
  if (slug) return slug;
  return asStr(pick(x, ["restaurant_id", "restaurantId", "id"]));
}

function normalizeTier(raw) {
  const s = asStr(raw).toLowerCase();
  if (!s) return "";
  if (s.includes("pro")) return "pro";
  if (s.includes("verified")) return "verified";
  return "";
}

function getCuisineLike(x) {
  return asStr(pick(x, ["cuisine", "category", "restaurant_cuisine", "restaurant_category"], ""));
}

function getPhoneLike(x) {
  return asStr(pick(x, ["phone", "restaurant_phone"], ""));
}

function getDistanceMilesLike(x) {
  const n = asNum(pick(x, ["distance_miles", "restaurant_distance_miles"], null));
  return n === null ? null : n;
}

function getProfileTierLike(x) {
  return normalizeTier(
    pick(
      x,
      ["profile_tier", "restaurant_profile_tier", "listing_status", "restaurant_listing_status"],
      ""
    )
  );
}

function getPopular(row) {
  const score = asNum(row?.score);
  const dups = asNum(row?.__dupCount);
  return (
    asBool(row?.is_popular) ||
    asBool(row?.popular) ||
    (score !== null && score >= 18) ||
    (dups !== null && dups >= 2)
  );
}

/*
 * resolveChips / resolveItemFlag
 *
 * The search API returns rows as { item: { chips, is_vegan, ... }, restaurant: {...} }.
 * normalizeRows spreads the outer object, so chips and item-level flags live at
 * row.item.chips / row.item.is_vegan — NOT at row.chips / row.is_vegan.
 * These helpers check the top-level first (for any legacy flat shapes) and fall
 * back to the nested item object.
 */
function resolveChips(row) {
  return row?.chips || row?.item?.chips || {};
}

function resolveItemFlag(row, key) {
  const top = row?.[key];
  if (top != null) return top;
  return row?.item?.[key] ?? null;
}

/* ---- Chip button ---- */

function Chip({ label, active, available, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: "var(--text-1, 12px)",
        fontWeight: 700,
        lineHeight: 1,
        cursor: "pointer",
        border: active
          ? "1px solid var(--link, #124ba3)"
          : available
          ? "1px solid #b9d4fb"
          : "1px solid var(--border, #e4e9f0)",
        background: active ? "var(--link, #124ba3)" : available ? "#eef4ff" : "#f7f9fc",
        color: active ? "#fff" : available ? "#1447a8" : "var(--muted-2, #93a0b2)",
      }}
    >
      {label}
    </button>
  );
}

/* ---- Detail panel content ---- */

function DetailPanel({ tab, row, similarItems }) {
  const chips = resolveChips(row);

  /* Nutrition */
  const nutChip = chips?.nutrition_chip || {};
  const cal = nutChip.calories_kcal ?? null;
  const pro = nutChip.protein_g ?? null;
  const fat = nutChip.fat_g ?? null;
  const sod = nutChip.sodium_mg ?? null;
  const sug = nutChip.sugar_g ?? null;
  const calPctW = nutChip.calories_pct_women ?? null;
  const calPctM = nutChip.calories_pct_men ?? null;
  const proPct = nutChip.protein_pct_daily ?? null;
  const nutOk =
    asStr(nutChip?.status).toLowerCase() === "available" ||
    asNum(cal) !== null ||
    asNum(pro) !== null ||
    asNum(fat) !== null ||
    asNum(sod) !== null ||
    asNum(sug) !== null;

  const muted = { color: "var(--muted-2, #93a0b2)" };
  const wrap = {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid var(--border, #e4e9f0)",
    fontSize: "var(--text-2, 14px)",
    color: "var(--ink, #0f1720)",
    lineHeight: 1.5,
  };

  if (tab === "nutrition") {
    const rowStyle = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 12,
      padding: "2px 0",
    };
    const subStyle = {
      fontSize: "var(--text-1, 12px)",
      color: "var(--muted-2, #93a0b2)",
      marginBottom: 4,
    };
    const valStyle = { fontWeight: 700, whiteSpace: "nowrap" };

    return (
      <div style={wrap}>
        {nutOk ? (
          <>
            {cal !== null && (
              <>
                <div style={rowStyle}>
                  <span>Calories</span>
                  <span style={valStyle}>{cal}</span>
                </div>
                {(calPctW !== null || calPctM !== null) && (
                  <div style={subStyle}>
                    {calPctW !== null ? `${calPctW}% Daily (W)` : ""}
                    {calPctW !== null && calPctM !== null ? " · " : ""}
                    {calPctM !== null ? `${calPctM}% (M)` : ""}
                  </div>
                )}
              </>
            )}
            {pro !== null && (
              <div style={rowStyle}>
                <span>Protein</span>
                <span style={valStyle}>
                  {pro}g{proPct !== null ? ` (${proPct}%)` : ""}
                </span>
              </div>
            )}
            {fat !== null && (
              <div style={rowStyle}>
                <span>Fat</span>
                <span style={valStyle}>{fat}g</span>
              </div>
            )}
            {sod !== null && (
              <div style={rowStyle}>
                <span>Sodium</span>
                <span style={valStyle}>{sod}mg</span>
              </div>
            )}
            {sug !== null && (
              <div style={rowStyle}>
                <span>Sugar</span>
                <span style={valStyle}>{sug}g</span>
              </div>
            )}
            {cal === null && pro === null && fat === null && sod === null && (
              <span style={muted}>Calculated nutrition values are not available for this item yet.</span>
            )}
          </>
        ) : (
          <span style={muted}>Calculated nutrition values are not available for this item yet.</span>
        )}
      </div>
    );
  }

  if (tab === "insights") {
    return (
      <div style={wrap}>
        <InsightCardDeck item={row} />
      </div>
    );
  }

  if (tab === "similar") {
    const groups = Array.isArray(similarItems) ? similarItems : [];
    return (
      <div style={wrap}>
        {groups.length > 0 ? (
          <div style={{ display: "grid", gap: 14 }}>
            {groups.map(({ restaurant_id, restaurant_name, items: siItems }) => (
              <div key={restaurant_id || restaurant_name}>
                <div
                  style={{
                    fontSize: "var(--text-1, 12px)",
                    color: "var(--muted, #5b6675)",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {restaurant_name}
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {(Array.isArray(siItems) ? siItems : []).map((si) => {
                    const siName = getItemName(si);
                    const siPrice = fmtPrice(si);
                    const siId = getItemId(si);
                    const siHref = siId ? "/menu-items/" + siId : null;
                    return (
                      <div
                        key={siId || siName}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "var(--text-2, 14px)",
                            fontWeight: 600,
                            color: "var(--ink, #0f1720)",
                            minWidth: 0,
                          }}
                        >
                          {siHref ? (
                            <Link
                              to={siHref}
                              style={{ color: "var(--link, #124ba3)", textDecoration: "none" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.textDecoration = "underline";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.textDecoration = "none";
                              }}
                            >
                              {siName}
                            </Link>
                          ) : (
                            siName
                          )}
                        </div>
                        {siPrice ? (
                          <span
                            style={{
                              fontSize: "var(--text-2, 14px)",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              color: "var(--ink, #0f1720)",
                              flexShrink: 0,
                            }}
                          >
                            {siPrice}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span style={muted}>No similar items found nearby.</span>
        )}
      </div>
    );
  }

  return null;
}

/* ---- Single item row ---- */

function ItemRow({ row, query, similarItems }) {
  const [openTab, setOpenTab] = useState(null);

  const mid = getItemId(row);
  const name = getItemName(row);
  const href = mid ? "/menu-items/" + mid : null;
  const price = fmtPrice(row);
  const popular = getPopular(row);
  const hasDeal = asBool(resolveItemFlag(row, "has_active_deal"));
  const isVegan = asBool(resolveItemFlag(row, "is_vegan"));
  const isGF = asBool(resolveItemFlag(row, "is_gluten_free"));

  const chips = resolveChips(row);
  const nutChip = chips?.nutrition_chip || {};
  const hasNut =
    asStr(nutChip?.status).toLowerCase() === "available" ||
    asNum(nutChip.calories_kcal) !== null ||
    asNum(nutChip.protein_g) !== null ||
    asNum(nutChip.fat_g) !== null ||
    asNum(nutChip.sodium_mg) !== null ||
    asNum(nutChip.sugar_g) !== null;
  const hasIns = buildInsightCards(row).length > 0;
  const hasSimilar = Array.isArray(similarItems) && similarItems.length > 0;

  function toggle(tab) {
    setOpenTab((prev) => (prev === tab ? null : tab));
  }

  return (
    <div
      style={{
        paddingTop: 10,
        paddingBottom: 10,
        borderBottom: "1px solid var(--border, #e4e9f0)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: "var(--text-4, 18px)",
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}
          >
            {href ? (
              <Link
                to={href}
                style={{ color: "var(--link, #124ba3)", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                  e.currentTarget.style.textUnderlineOffset = "3px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                {hl(name, query)}
              </Link>
            ) : (
              hl(name, query)
            )}
          </span>

          {popular && <DietBadge label="★ Popular" tone="popular" />}
          {hasDeal && <DietBadge label="🏷 Deal" tone="deal" />}
          {isGF && <DietBadge label="GF" tone="gf" />}
          {isVegan && <DietBadge label="🌿 Vegan" tone="vegan" />}
        </div>

        {price ? (
          <span
            style={{
              fontSize: "var(--text-2, 14px)",
              fontWeight: 800,
              whiteSpace: "nowrap",
              color: "var(--ink, #0f1720)",
              flexShrink: 0,
              minWidth: 64,
              textAlign: "right",
            }}
          >
            {price}
          </span>
        ) : null}
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Chip
          label="Nutrition"
          active={openTab === "nutrition"}
          available={hasNut}
          onClick={() => toggle("nutrition")}
        />
        {hasIns && (
          <Chip
            label="Insights"
            active={openTab === "insights"}
            available={true}
            onClick={() => toggle("insights")}
          />
        )}
        {hasSimilar && (
          <Chip
            label="Show Similar"
            active={openTab === "similar"}
            available={true}
            onClick={() => toggle("similar")}
          />
        )}
      </div>

      {openTab && <DetailPanel tab={openTab} row={row} similarItems={similarItems} />}
    </div>
  );
}

/* ---- Small diet/status badge (non-interactive) ---- */

function DietBadge({ label, tone }) {
  const tones = {
    deal: { background: "#fff8e8", borderColor: "#e8cf9c", color: "#7a5600" },
    vegan: { background: "#eefcf2", borderColor: "#b9e2c3", color: "#27643a" },
    gf: { background: "#eef4ff", borderColor: "#c4d6fb", color: "#21408a" },
    popular: { background: "#fff1f1", borderColor: "#f1c0c0", color: "#8a2f2f" },
  };
  const t = tones[tone] || {};
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "3px 8px",
        fontSize: "var(--text-1, 12px)",
        fontWeight: 700,
        lineHeight: 1,
        border: "1px solid " + (t.borderColor || "var(--border, #e4e9f0)"),
        background: t.background || "#f7f9fc",
        color: t.color || "var(--muted, #5b6675)",
        userSelect: "none",
      }}
    >
      {label}
    </span>
  );
}

/* ---- Card shell ---- */

const cardStyle = {
  border: "1px solid var(--border, #e4e9f0)",
  borderRadius: 14,
  background: "#fff",
  padding: "12px 14px",
  boxShadow: "var(--shadow-1, 0 6px 18px rgba(16,24,40,0.06))",
  fontFamily: "var(--font-ui)",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

function RestaurantMeta({ cuisine, phone, distanceMiles, profileTier }) {
  const pieces = [];
  if (cuisine) pieces.push(cuisine);
  if (distanceMiles !== null) pieces.push(`${distanceMiles.toFixed(1)} mi`);
  if (phone) pieces.push(phone);

  const tierLabel = profileTier === "pro" ? "Pro" : profileTier === "verified" ? "Verified" : "";
  const tierStyle =
    profileTier === "pro"
      ? { background: "#eef7ff", border: "1px solid #b9d6fb", color: "#1a4f95" }
      : profileTier === "verified"
      ? { background: "#ecfff4", border: "1px solid #b9e7c9", color: "#1f6a3c" }
      : null;

  return (
    <div
      style={{
        marginBottom: 8,
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {tierLabel ? (
        <span
          style={{
            fontSize: "var(--text-1, 12px)",
            fontWeight: 800,
            borderRadius: 999,
            padding: "2px 8px",
            ...tierStyle,
          }}
        >
          {tierLabel}
        </span>
      ) : null}
      {pieces.length > 0 ? (
        <span
          style={{
            fontSize: "var(--text-1, 12px)",
            color: "var(--muted, #5b6675)",
            fontWeight: 600,
          }}
        >
          {pieces.join(" • ")}
        </span>
      ) : null}
    </div>
  );
}

/* ---- Main export ---- */

export default function SearchResultCard({ restaurant, items, item, query, crossRestaurantItems }) {
  const grouped = Array.isArray(items) && items.length > 0;

  if (grouped) {
    const restId = asStr(restaurant?.restaurant_id || restaurant?.id);
    const restSlug = asStr(restaurant?.restaurant_slug || restaurant?.slug);
    const restName =
      asStr(restaurant?.restaurant_name || restaurant?.name) || getRestName(items[0]);
    const cuisine = getCuisineLike(restaurant) || getCuisineLike(items[0]);
    const phone = getPhoneLike(restaurant) || getPhoneLike(items[0]);
    const distanceMiles = getDistanceMilesLike(restaurant) ?? getDistanceMilesLike(items[0]);
    const profileTier = getProfileTierLike(restaurant) || getProfileTierLike(items[0]);

    const restProfileTarget = restSlug || restId;
    const restHref = restProfileTarget ? "/restaurants/" + restProfileTarget : null;
    const menuHref = restId ? "/public/restaurants/" + restId + "/menu" : null;

    const similarItems = Array.isArray(crossRestaurantItems)
      ? crossRestaurantItems.filter((x) => asStr(x.restaurant_id) !== restId)
      : [];

    return (
      <article style={cardStyle}>
        <div style={{ marginBottom: 2 }}>
          {restHref ? (
            <Link
              to={restHref}
              style={{
                fontSize: "var(--text-2, 14px)",
                fontWeight: 700,
                color: "var(--muted, #5b6675)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {restName}
            </Link>
          ) : (
            <span
              style={{
                fontSize: "var(--text-2, 14px)",
                fontWeight: 700,
                color: "var(--muted, #5b6675)",
              }}
            >
              {restName}
            </span>
          )}
        </div>

        <RestaurantMeta
          cuisine={cuisine}
          phone={phone}
          distanceMiles={distanceMiles}
          profileTier={profileTier}
        />

        <div>
          {items.map((row) => {
            const mid = getItemId(row);
            const nm = getItemName(row);
            return <ItemRow key={mid || nm} row={row} query={query} similarItems={similarItems} />;
          })}
        </div>

        {menuHref && (
          <div style={{ marginTop: 10 }}>
            <Link
              to={menuHref}
              style={{
                fontSize: "var(--text-1, 12px)",
                fontWeight: 700,
                color: "var(--link, #124ba3)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              View Menu →
            </Link>
          </div>
        )}
      </article>
    );
  }

  const isItemRow = Boolean(item?.menu_item_id || item?.menu_item_name);
  const restIdS = getRestId(item);
  const restSlugS = getRestSlug(item);
  const restNameS = getRestName(item);
  const cuisineS = getCuisineLike(item);
  const phoneS = getPhoneLike(item);
  const distanceMilesS = getDistanceMilesLike(item);
  const profileTierS = getProfileTierLike(item);
  const restProfileTargetS = restSlugS || restIdS;
  const restHrefS = restProfileTargetS ? "/restaurants/" + restProfileTargetS : null;
  const menuHrefS = restIdS ? "/public/restaurants/" + restIdS + "/menu" : null;
  const similarItemsS = Array.isArray(crossRestaurantItems)
    ? crossRestaurantItems.filter((x) => asStr(x.restaurant_id) !== restIdS)
    : [];

  if (isItemRow) {
    return (
      <article style={cardStyle}>
        {restHrefS && (
          <div style={{ marginBottom: 2 }}>
            <Link
              to={restHrefS}
              style={{
                fontSize: "var(--text-2, 14px)",
                fontWeight: 700,
                color: "var(--muted, #5b6675)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {restNameS}
            </Link>
          </div>
        )}
        <RestaurantMeta
          cuisine={cuisineS}
          phone={phoneS}
          distanceMiles={distanceMilesS}
          profileTier={profileTierS}
        />
        <ItemRow row={item} query={query} similarItems={similarItemsS} />
        {menuHrefS && (
          <div style={{ marginTop: 10 }}>
            <Link
              to={menuHrefS}
              style={{
                fontSize: "var(--text-1, 12px)",
                fontWeight: 700,
                color: "var(--link, #124ba3)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              View Menu →
            </Link>
          </div>
        )}
      </article>
    );
  }

  return (
    <article style={cardStyle}>
      <div
        style={{
          fontSize: "var(--text-3, 16px)",
          fontWeight: 700,
          color: "var(--ink, #0f1720)",
        }}
      >
        {restHrefS ? (
          <Link
            to={restHrefS}
            style={{ color: "var(--link, #124ba3)", textDecoration: "none" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {hl(restNameS, query)}
          </Link>
        ) : (
          hl(restNameS, query)
        )}
      </div>
      <RestaurantMeta
        cuisine={cuisineS}
        phone={phoneS}
        distanceMiles={distanceMilesS}
        profileTier={profileTierS}
      />
      {menuHrefS && (
        <div style={{ marginTop: 8 }}>
          <Link
            to={menuHrefS}
            style={{
              fontSize: "var(--text-1, 12px)",
              fontWeight: 700,
              color: "var(--link, #124ba3)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            View Menu →
          </Link>
        </div>
      )}
    </article>
  );
}