import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function asString(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

function asNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickFirst(obj, keys, fallback = "") {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && asString(v) !== "") return v;
  }
  return fallback;
}

function boolField(v) {
  if (v === true) return true;
  if (v === false || v === 0 || v === "0") return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "yes" || s === "1";
  }
  return false;
}

function formatPrice(item) {
  const dollars = asNumber(item?.price);
  if (dollars !== null) return `$${dollars.toFixed(2).replace(/\.00$/, "")}`;

  const minor = asNumber(item?.price_minor_units);
  if (minor !== null) return `$${(minor / 100).toFixed(2).replace(/\.00$/, "")}`;

  const cents = asNumber(item?.price_cents);
  if (cents !== null) return `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;

  return "";
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text, query) {
  const t = asString(text);
  const q = asString(query);
  if (!t || !q) return t;

  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = t.split(re);
  if (parts.length <= 1) return t;

  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <mark key={i} style={{ background: "#fff3a0", borderRadius: 3, padding: "0 2px" }}>
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function renderList(items) {
  return (
    <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
      {items.map((entry, i) => (
        <li key={`${entry}-${i}`} style={{ marginBottom: 4 }}>
          {entry}
        </li>
      ))}
    </ul>
  );
}

export default function SearchResultCard({ item, query }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState("insights");

  const isMenuItemRow = Boolean(item?.menu_item_id || item?.menu_item_name);

  const restaurantId = asString(pickFirst(item, ["restaurant_id", "restaurantId", "id"], ""));
  const menuItemId = asString(pickFirst(item, ["menu_item_id", "menuItemId"], ""));

  const restaurantName = asString(
    pickFirst(item, ["restaurant_name", "restaurantName", "name", "title"], "Restaurant")
  );
  const menuItemName = asString(
    pickFirst(item, ["menu_item_name", "menuItemName", "item_name", "dish"], "Menu item")
  );

  const city = asString(item?.city);
  const state = asString(item?.state);
  const postal = asString(pickFirst(item, ["postal_code", "zip", "zipcode"], ""));

  const locationLine = useMemo(() => {
    const parts = [city, state, postal].filter(Boolean);
    return parts.join(" ");
  }, [city, state, postal]);

  const price = useMemo(() => formatPrice(item), [item]);

  const hasDeal = boolField(item?.has_active_deal);
  const isVegan = boolField(item?.is_vegan);
  const isGlutenFree = boolField(item?.is_gluten_free);
  const isPopular = boolField(item?.is_popular) || boolField(item?.popular);

  const symbols = [
    hasDeal ? "Deal" : null,
    isVegan ? "Vegan" : null,
    isGlutenFree ? "Gluten-free" : null,
    isPopular ? "Popular" : null,
  ].filter(Boolean);

  const chips = item?.chips || {};

  const insightsItems = Array.isArray(chips?.insights?.items) ? chips.insights.items.filter(Boolean).slice(0, 6) : [];
  const insightReasons = Array.isArray(chips?.insights?.reasons) ? chips.insights.reasons.filter(Boolean) : [];

  const nutritionChip = chips?.nutrition_chip || {};
  const nutritionStatus = asString(nutritionChip?.status).toLowerCase();
  const nutritionAvailable = nutritionStatus && nutritionStatus !== "unavailable" && nutritionStatus !== "missing";

  const calories = pickFirst(nutritionChip, ["calories", "kcal"], "");
  const protein = pickFirst(nutritionChip, ["protein", "protein_g"], "");
  const sodium = pickFirst(nutritionChip, ["sodium", "sodium_mg"], "");

  const pairingSuggestions = Array.isArray(chips?.pairings_chip?.suggestions)
    ? chips.pairings_chip.suggestions.filter(Boolean)
    : [];

  const restaurantHref = restaurantId ? `/restaurants/${restaurantId}` : null;
  const menuItemHref = menuItemId ? `/menu-items/${menuItemId}` : null;

  const styles = {
    card: {
      border: "1px solid #e9e9e9",
      borderRadius: 14,
      background: "#fff",
      padding: 14,
      boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
    },
    header: { display: "flex", justifyContent: "space-between", gap: 12 },
    title: { margin: 0, fontSize: 15, fontWeight: 900, lineHeight: 1.25 },
    sub: { marginTop: 4, fontSize: 12, color: "#555" },
    meta: { marginTop: 4, fontSize: 12, color: "#777" },
    price: { fontSize: 14, fontWeight: 900, whiteSpace: "nowrap" },
    symbolRow: { marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" },
    symbol: {
      border: "1px solid #e6e6e6",
      borderRadius: 999,
      padding: "4px 8px",
      fontSize: 11,
      fontWeight: 700,
      color: "#333",
      background: "#fafafa",
    },
    actions: { marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
    link: { fontSize: 12, fontWeight: 800, color: "#1947d1", textDecoration: "none" },
    toggle: {
      border: "1px solid #d8d8d8",
      background: "#fff",
      borderRadius: 999,
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
    },
    expanded: { marginTop: 12, paddingTop: 12, borderTop: "1px solid #efefef" },
    tabs: { display: "flex", gap: 8, flexWrap: "wrap" },
    tabButton: (active) => ({
      border: active ? "1px solid #111" : "1px solid #e0e0e0",
      borderRadius: 999,
      background: active ? "#111" : "#fff",
      color: active ? "#fff" : "#333",
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
    }),
    panel: { marginTop: 10, fontSize: 13, color: "#333" },
    panelTitle: { fontWeight: 900 },
    detailLine: { marginTop: 6 },
  };

  return (
    <article style={styles.card}>
      <div style={styles.header}>
        <div style={{ minWidth: 0 }}>
          <h3 style={styles.title}>
            {isMenuItemRow ? highlight(menuItemName, query) : highlight(restaurantName, query)}
          </h3>

          {isMenuItemRow && (
            <div style={styles.sub}>
              {restaurantHref ? (
                <Link to={restaurantHref} style={styles.link}>
                  {highlight(restaurantName, query)}
                </Link>
              ) : (
                highlight(restaurantName, query)
              )}
            </div>
          )}

          {locationLine ? <div style={styles.meta}>{locationLine}</div> : null}
        </div>

        {price ? <div style={styles.price}>{price}</div> : <div />}
      </div>

      {symbols.length > 0 && (
        <div style={styles.symbolRow}>
          {symbols.map((label) => (
            <span key={label} style={styles.symbol}>
              {label}
            </span>
          ))}
        </div>
      )}

      <div style={styles.actions}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {restaurantHref ? (
            <Link to={restaurantHref} style={styles.link}>
              View restaurant
            </Link>
          ) : null}

          {isMenuItemRow && menuItemHref ? (
            <Link to={menuItemHref} style={styles.link}>
              View menu item
            </Link>
          ) : null}
        </div>

        <button
          type="button"
          style={styles.toggle}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse details" : "Expand details"}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <section style={styles.expanded}>
          <div style={styles.tabs}>
            <button type="button" style={styles.tabButton(tab === "insights")} onClick={() => setTab("insights")}>
              Insights
            </button>
            <button type="button" style={styles.tabButton(tab === "nutrition")} onClick={() => setTab("nutrition")}>
              Nutrition
            </button>
            <button type="button" style={styles.tabButton(tab === "pairings")} onClick={() => setTab("pairings")}>
              Pairings
            </button>
          </div>

          <div style={styles.panel}>
            {tab === "insights" && (
              <>
                <div style={styles.panelTitle}>Insights</div>
                {insightsItems.length > 0 && renderList(insightsItems)}
                {insightsItems.length === 0 && insightReasons.length > 0 && renderList(insightReasons)}
                {insightsItems.length === 0 && insightReasons.length === 0 && (
                  <div style={styles.detailLine}>No insights yet.</div>
                )}
              </>
            )}

            {tab === "nutrition" && (
              <>
                <div style={styles.panelTitle}>Nutrition</div>
                {nutritionAvailable ? (
                  <div style={styles.detailLine}>
                    {[
                      calories !== "" ? `Calories: ${calories}` : null,
                      protein !== "" ? `Protein: ${protein}` : null,
                      sodium !== "" ? `Sodium: ${sodium}` : null,
                    ]
                      .filter(Boolean)
                      .join(" | ") || "Nutrition not available yet."}
                  </div>
                ) : (
                  <div style={styles.detailLine}>Nutrition not available yet.</div>
                )}
              </>
            )}

            {tab === "pairings" && (
              <>
                <div style={styles.panelTitle}>Pairings</div>
                {pairingSuggestions.length > 0 ? (
                  renderList(pairingSuggestions)
                ) : (
                  <div style={styles.detailLine}>Pairings coming soon.</div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
