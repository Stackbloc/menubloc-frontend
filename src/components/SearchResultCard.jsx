/**
 * ============================================================
 * File: menubloc-frontend/src/components/SearchResultCard.jsx
 * Date: 2026-03-05
 * Purpose:
 *   Search result card UI.
 *   - Grouped by restaurant (restaurant header first)
 *   - Menu items under restaurant
 *   - No separate Expand button
 *   - Insights/Nutrition/Pairings/Popular chips always shown under each menu item
 *   - Clicking a chip opens/closes the detail panel for that item+tab
 *   - Only one panel open at a time per item
 * ============================================================
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";

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

function fmtPrice(row) {
  const d = asNum(row?.price);
  if (d !== null) return "$" + d.toFixed(2).replace(/\.00$/, "");
  const m = asNum(row?.price_minor_units);
  if (m !== null) return "$" + (m / 100).toFixed(2).replace(/\.00$/, "");
  const c = asNum(row?.price_cents);
  if (c !== null) return "$" + (c / 100).toFixed(2).replace(/\.00$/, "");
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
      ? React.createElement("mark", { key: i, style: { background: "#fff3a0", borderRadius: 4, padding: "0 3px" } }, p)
      : React.createElement("span", { key: i }, p)
  );
}

function renderUL(arr) {
  return (
    <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
      {arr.map((e, i) => (
        <li key={i} style={{ marginBottom: 3 }}>{e}</li>
      ))}
    </ul>
  );
}

function getItemId(row) { return asStr(pick(row, ["menu_item_id", "menuItemId", "id"])); }
function getRestId(row) { return asStr(pick(row, ["restaurant_id", "restaurantId", "id"])); }
function getRestName(row) { return asStr(pick(row, ["restaurant_name", "restaurantName", "name", "title"], "Restaurant")); }
function getItemName(row) { return asStr(pick(row, ["menu_item_name", "menuItemName", "item_name", "dish", "name"], "Menu item")); }

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

/* ---- Chip button ---- */

function Chip({ label, active, available, onClick }) {
  const on = active;
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
        border: on
          ? "1px solid var(--link, #124ba3)"
          : available
          ? "1px solid #b9d4fb"
          : "1px solid var(--border, #e4e9f0)",
        background: on
          ? "var(--link, #124ba3)"
          : available
          ? "#eef4ff"
          : "#f7f9fc",
        color: on
          ? "#fff"
          : available
          ? "#1447a8"
          : "var(--muted-2, #93a0b2)",
      }}
    >
      {label}
    </button>
  );
}

/* ---- Detail panel content ---- */

function DetailPanel({ tab, row }) {
  const chips = row?.chips || {};

  const insItems = Array.isArray(chips?.insights?.items)
    ? chips.insights.items.filter(Boolean).slice(0, 6)
    : [];
  const insReasons = Array.isArray(chips?.insights?.reasons)
    ? chips.insights.reasons.filter(Boolean)
    : [];

  const nutChip = chips?.nutrition_chip || {};
  const nutStatus = asStr(nutChip?.status).toLowerCase();
  const nutOk = nutStatus && nutStatus !== "unavailable" && nutStatus !== "missing";
  const cal = pick(nutChip, ["calories", "kcal"]);
  const pro = pick(nutChip, ["protein", "protein_g"]);
  const sod = pick(nutChip, ["sodium", "sodium_mg"]);

  const pairs = Array.isArray(chips?.pairings_chip?.suggestions)
    ? chips.pairings_chip.suggestions.filter(Boolean)
    : [];

  const muted = { color: "var(--muted-2, #93a0b2)" };
  const wrap = {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid var(--border, #e4e9f0)",
    fontSize: "var(--text-2, 14px)",
    color: "var(--ink, #0f1720)",
    lineHeight: 1.5,
  };

  if (tab === "insights") {
    return (
      <div style={wrap}>
        {insItems.length > 0 && renderUL(insItems)}
        {insItems.length === 0 && insReasons.length > 0 && renderUL(insReasons)}
        {insItems.length === 0 && insReasons.length === 0 && (
          <span style={muted}>No insights yet.</span>
        )}
      </div>
    );
  }

  if (tab === "nutrition") {
    return (
      <div style={wrap}>
        {nutOk ? (
          <span>
            {[
              cal !== "" ? "Calories: " + cal : null,
              pro !== "" ? "Protein: " + pro : null,
              sod !== "" ? "Sodium: " + sod : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Nutrition not available yet."}
          </span>
        ) : (
          <span style={muted}>Nutrition not available yet.</span>
        )}
      </div>
    );
  }

  if (tab === "pairings") {
    return (
      <div style={wrap}>
        {pairs.length > 0 ? renderUL(pairs) : <span style={muted}>Pairings coming soon.</span>}
      </div>
    );
  }

  return null;
}

/* ---- Single item row ---- */

function ItemRow({ row, query }) {
  const [openTab, setOpenTab] = useState(null);

  const mid = getItemId(row);
  const name = getItemName(row);
  const href = mid ? "/menu-items/" + mid : null;
  const price = fmtPrice(row);
  const popular = getPopular(row);
  const hasDeal = asBool(row?.has_active_deal);
  const isVegan = asBool(row?.is_vegan);
  const isGF = asBool(row?.is_gluten_free);

  const chips = row?.chips || {};
  const hasIns =
    (Array.isArray(chips?.insights?.items) && chips.insights.items.filter(Boolean).length > 0) ||
    (Array.isArray(chips?.insights?.reasons) && chips.insights.reasons.filter(Boolean).length > 0);
  const nutStatus = asStr(chips?.nutrition_chip?.status).toLowerCase();
  const hasNut = nutStatus && nutStatus !== "unavailable" && nutStatus !== "missing";
  const hasPair =
    Array.isArray(chips?.pairings_chip?.suggestions) &&
    chips.pairings_chip.suggestions.filter(Boolean).length > 0;

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
      {/* Name + inline Deal/Popular badges + price */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
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
                onFocus={(e) => {
                  e.currentTarget.style.outline = "3px solid rgba(18,75,163,0.35)";
                  e.currentTarget.style.borderRadius = "4px";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = "none";
                }}
              >
                {hl(name, query)}
              </Link>
            ) : (
              hl(name, query)
            )}
          </span>
          {hasDeal && <DietBadge label="🏷 Deal" tone="deal" />}
          {popular && <DietBadge label="★ Popular" tone="popular" />}
          {isVegan && <DietBadge label="🌿 Vegan" tone="vegan" />}
          {isGF && <DietBadge label="GF" tone="gf" />}
        </div>

        {price ? (
          <span
            style={{
              fontSize: "var(--text-2, 14px)",
              fontWeight: 800,
              whiteSpace: "nowrap",
              color: "var(--ink, #0f1720)",
              flexShrink: 0,
            }}
          >
            {price}
          </span>
        ) : null}
      </div>

      {/* Chips row — always visible */}
      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Chip
          label="Insights"
          active={openTab === "insights"}
          available={hasIns}
          onClick={() => toggle("insights")}
        />
        <Chip
          label={hasNut ? "Nutrition" : "Nutrition soon"}
          active={openTab === "nutrition"}
          available={hasNut}
          onClick={() => toggle("nutrition")}
        />
        <Chip
          label={hasPair ? "Pairings" : "Pairings soon"}
          active={openTab === "pairings"}
          available={hasPair}
          onClick={() => toggle("pairings")}
        />
      </div>

      {/* Detail panel — opens below chips when a chip is active */}
      {openTab && <DetailPanel tab={openTab} row={row} />}
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
  padding: "14px 16px",
  boxShadow: "var(--shadow-1, 0 6px 18px rgba(16,24,40,0.06))",
  fontFamily: "var(--font-ui)",
};

/* ---- Main export ---- */

export default function SearchResultCard({ restaurant, items, item, query }) {
  const grouped = Array.isArray(items) && items.length > 0;

  if (grouped) {
    const restId = asStr(restaurant?.id);
    const restName = asStr(restaurant?.name) || getRestName(items[0]);
    const restHref = restId ? "/restaurants/" + restId : null;

    return (
      <article style={cardStyle}>
        {/* Restaurant anchor */}
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
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
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

        {/* Item rows */}
        <div>
          {items.map((row) => {
            const mid = getItemId(row);
            const name = getItemName(row);
            return <ItemRow key={mid || name} row={row} query={query} />;
          })}
        </div>

        {/* Footer */}
        {restHref && (
          <div style={{ marginTop: 10 }}>
            <Link
              to={restHref}
              style={{
                fontSize: "var(--text-1, 12px)",
                fontWeight: 700,
                color: "var(--link, #124ba3)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
            >
              View restaurant →
            </Link>
          </div>
        )}
      </article>
    );
  }

  /* ---- Legacy single row ---- */
  const isItemRow = Boolean(item?.menu_item_id || item?.menu_item_name);
  const restIdS = getRestId(item);
  const restNameS = getRestName(item);
  const restHrefS = restIdS ? "/restaurants/" + restIdS : null;

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
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
            >
              {restNameS}
            </Link>
          </div>
        )}
        <ItemRow row={item} query={query} />
      </article>
    );
  }

  /* ---- Restaurant-only row ---- */
  return (
    <article style={cardStyle}>
      <div style={{ fontSize: "var(--text-3, 16px)", fontWeight: 700, color: "var(--ink, #0f1720)" }}>
        {restHrefS ? (
          <Link
            to={restHrefS}
            style={{ color: "var(--link, #124ba3)", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
          >
            {hl(restNameS, query)}
          </Link>
        ) : (
          hl(restNameS, query)
        )}
      </div>
      {restHrefS && (
        <div style={{ marginTop: 8 }}>
          <Link
            to={restHrefS}
            style={{
              fontSize: "var(--text-1, 12px)",
              fontWeight: 700,
              color: "var(--link, #124ba3)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
          >
            View restaurant →
          </Link>
        </div>
      )}
    </article>
  );
}
