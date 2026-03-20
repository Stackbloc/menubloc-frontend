/**
 * ============================================================
 * File: MenuItemDetailPage.jsx
 * Path: menubloc-frontend/src/pages/MenuItemDetailPage.jsx
 * Date: 2026-03-13
 * Purpose:
 *   Full-page detail view for a single menu item.
 *
 *   Data flow:
 *     GET /menu-items/:id         — item detail (name, badges, price, etc.)
 *     GET /menu-items/:id/similar — Find Similar Nearby results
 *
 *   Product rule:
 *     - Grubbid intelligence belongs on the item detail page
 *     - Restaurant-owned menu pages stay restaurant-first by default
 *
 *   This revision:
 *     - removes InsightsRolodex from the item detail page
 *     - restores card-based insights via MenuItemInsightsPanel
 *     - keeps Find Similar on the item detail page only
 *     - preserves existing tabs for Nutrition / Pairings / Ingredients
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { buildInsightCards } from "../components/InsightCardDeck.jsx";

const BACKEND_BASE = (import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");

/* ---- Formatting helpers ---- */

function moneyFromMinor(priceMinor) {
  if (priceMinor == null || Number.isNaN(Number(priceMinor))) return null;
  return (Number(priceMinor) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function moneyFromFloat(price) {
  if (price == null || Number.isNaN(Number(price))) return null;
  return Number(price).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function pickFirstDefined(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null) return v;
  }
  return null;
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

/* ---- Item normalizer ---- */

function normalizeResultItem(raw) {
  const restaurantName =
    raw?.restaurant_name ||
    raw?.restaurant?.name ||
    raw?.restaurant?.restaurant_name ||
    raw?.restaurantName ||
    raw?.restaurant;

  const restaurantId =
    raw?.restaurant_id ||
    raw?.restaurant?.id ||
    raw?.restaurantId ||
    null;

  const priceMinor = pickFirstDefined(raw?.price_minor, raw?.priceMinor, null);
  const price = pickFirstDefined(raw?.price, raw?.price_float, raw?.priceFloat, null);

  const vegan =
    Boolean(raw?.badges?.vegan) ||
    Boolean(raw?.badges?.is_vegan) ||
    Boolean(raw?.is_vegan) ||
    Boolean(raw?.isVegan) ||
    Boolean(raw?.vegan);

  const glutenFree =
    Boolean(raw?.badges?.gluten_free) ||
    Boolean(raw?.badges?.glutenFree) ||
    Boolean(raw?.is_gluten_free) ||
    Boolean(raw?.isGlutenFree) ||
    Boolean(raw?.gluten_free) ||
    Boolean(raw?.glutenFree);

  const deal =
    Boolean(raw?.badges?.deal) ||
    Boolean(raw?.badges?.deals) ||
    Boolean(raw?.deal) ||
    Boolean(raw?.is_deal) ||
    Boolean(raw?.isDeal);

  return {
    id: raw?.menu_item_id || raw?.id || null,
    name: raw?.name || raw?.item_name || raw?.title || "Untitled Item",
    description: raw?.description || raw?.notes || raw?.snippet || "",
    restaurant: {
      id: restaurantId,
      name: restaurantName || "Unknown Restaurant",
      slug: raw?.restaurant_slug || raw?.slug || null,
    },
    priceMinor,
    price,
    badges: { vegan, glutenFree, deal },
    nutrition: raw?.nutrition || raw?.signal_nutrition || raw?.signals?.nutrition || null,
    pairings: raw?.pairings || null,
    ingredients: raw?.ingredients || raw?.ingredient_list || null,
    chips: raw?.chips || null,
    signals: raw?.signals || null,
    signal_nutrition: raw?.signal_nutrition || null,
  };
}

/* ============================================================
   FindSimilar
   ============================================================ */
function FindSimilar({ itemId, isMobile }) {
  const [similar, setSimilar] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;

    fetch(`${BACKEND_BASE}/menu-items/${encodeURIComponent(itemId)}/similar`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!cancelled) setSimilar(Array.isArray(json?.similar) ? json.similar : []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  if (failed || similar === null || similar.length === 0) return null;

  // Group items by restaurant so each restaurant appears once
  const groups = [];
  const seenRest = new Map(); // restaurant key → group index
  for (const s of similar) {
    const key = String(s.restaurant_id ?? s.restaurant_name ?? "");
    if (seenRest.has(key)) {
      groups[seenRest.get(key)].items.push(s);
    } else {
      seenRest.set(key, groups.length);
      groups.push({ restaurant_name: s.restaurant_name, items: [s] });
    }
  }

  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 16,
        borderTop: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color: "#1447a8",
          marginBottom: 12,
        }}
      >
        Find Similar Nearby
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {groups.map((g, gi) => (
          <div
            key={g.restaurant_name ?? gi}
            style={{
              paddingBottom: gi < groups.length - 1 ? 14 : 0,
              borderBottom: gi < groups.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
            }}
          >
            {g.restaurant_name && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#5b6675",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {g.restaurant_name}
              </div>
            )}
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {g.items.map((s) => (
                <li key={s.id} style={{ marginBottom: 4 }}>
                  <Link
                    to={`/menu-items/${s.id}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#124ba3",
                      textDecoration: "none",
                      wordBreak: "break-word",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Shared sub-components ---- */

function Chip({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        lineHeight: "16px",
        background: "rgba(0,0,0,0.03)",
        userSelect: "none",
      }}
    >
      {children}
    </span>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid rgba(0,0,0,0.14)",
        background: active ? "rgba(0,0,0,0.08)" : "white",
        borderRadius: 999,
        padding: "8px 12px",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ---- Slug helper ---- */

function toSlug(str) {
  if (!str) return null;
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* ---- Shared bar row ---- */

function BarRow({ label, pct, valueLabel, color }) {
  const fill = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0", maxWidth: 300 }}>
      <div style={{ width: 88, fontSize: 11, color: "#93a0b2", flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ width: 100, height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: `${fill}%`, height: "100%", background: color, opacity: 0.7, borderRadius: 2 }} />
      </div>
      <div style={{ width: 44, fontSize: 11, color: "#475467", textAlign: "right", flexShrink: 0 }}>
        {valueLabel}
      </div>
    </div>
  );
}

/* ---- Nutrition bar panel ---- */

function NutritionBarPanel({ chip }) {
  const n = (v) => (v != null && Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
  const cal = chip ? n(chip.calories_kcal) : null;
  const pro = chip ? n(chip.protein_g) : null;
  const fat = chip ? n(chip.fat_g) : null;
  const sod = chip ? n(chip.sodium_mg) : null;
  const sug = chip ? n(chip.sugar_g) : null;

  const rows = [
    cal !== null && { label: "Calories", pct: Math.min(100, (cal / 2000) * 100), value: String(cal), color: "#e07b39" },
    pro !== null && { label: "Protein",  pct: Math.min(100, (pro / 50)   * 100), value: `${pro}g`,   color: "#1a9a4a" },
    fat !== null && { label: "Fat",      pct: Math.min(100, (fat / 65)   * 100), value: `${fat}g`,   color: "#b87a00" },
    sod !== null && { label: "Sodium",   pct: Math.min(100, (sod / 2300) * 100), value: `${sod}mg`,  color: "#c0392b" },
    sug !== null && { label: "Sugar",    pct: Math.min(100, (sug / 50)   * 100), value: `${sug}g`,   color: "#8b5cf6" },
  ].filter(Boolean);

  if (!rows.length) return <div style={{ fontSize: 12, opacity: 0.55 }}>Not available yet.</div>;

  return (
    <div style={{ paddingTop: 4 }}>
      {rows.map((r) => <BarRow key={r.label} label={r.label} pct={r.pct} valueLabel={r.value} color={r.color} />)}
      {chip?.allergen_alert && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: "#b36000", fontWeight: 600 }}>
          ⚠ {chip.allergen_alert}
        </div>
      )}
      {chip?.disclosure && (
        <div style={{ marginTop: 4, fontSize: 11, color: "#93a0b2", fontStyle: "italic", lineHeight: 1.4 }}>
          {chip.disclosure}
        </div>
      )}
    </div>
  );
}

/* ---- Insights bar panel ---- */

const SCORE_NORMALIZE = {
  protein_strength: { max: 1,    color: "#8b5cf6" },
  glycemic_impact:  { max: 150,  color: "#c0392b" },
  sodium_risk:      { max: 2300, color: "#e07b39" },
  lasting_energy:   { max: 200,  color: "#1a9a4a" },
};

const SCORE_LABELS = {
  protein_strength: "Protein Strength",
  glycemic_impact:  "Glycemic Impact",
  sodium_risk:      "Sodium Risk",
  lasting_energy:   "Lasting Energy",
};

function InsightBarPanel({ item }) {
  const chips = item?.chips || {};
  const scores = chips?.insights?.scores || {};
  const rows = [];

  for (const [key, meta] of Object.entries(SCORE_NORMALIZE)) {
    const s = scores[key];
    if (!s || s.score == null || !Number.isFinite(Number(s.score))) continue;
    const pct = Math.min(100, (Number(s.score) / meta.max) * 100);
    rows.push({ key, label: SCORE_LABELS[key], pct, valueLabel: s.level || "", color: meta.color });
  }

  if (!rows.length) return <div style={{ fontSize: 12, opacity: 0.55 }}>No insight data yet.</div>;

  return (
    <div style={{ paddingTop: 4 }}>
      {rows.map((r) => <BarRow key={r.key} label={r.label} pct={r.pct} valueLabel={r.valueLabel} color={r.color} />)}
    </div>
  );
}

/* ---- Page component ---- */

export default function MenuItemDetailPage() {
  const { id, restaurantSlug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rawItem, setRawItem] = useState(null);
  const [tab, setTab] = useState(null);

  const item = useMemo(
    () => (rawItem ? normalizeResultItem(rawItem) : null),
    [rawItem]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");
      setRawItem(null);

      try {
        const tryUrls = [
          `${BACKEND_BASE}/menu-items/${encodeURIComponent(id)}`,
          `${BACKEND_BASE}/public/items/${encodeURIComponent(id)}`,
        ];

        let found = null;

        for (const url of tryUrls) {
          try {
            const resp = await fetch(url, { credentials: "include" });
            if (!resp.ok) continue;
            const json = await resp.json();
            if (json?.ok && (json?.item || json?.menu_item)) {
              found = json.item || json.menu_item;
              break;
            }
          } catch (_) {
            // ignore and try next url
          }
        }

        if (!found) {
          throw new Error(
            "No item-detail endpoint found yet. Create GET /menu-items/:id to power this page."
          );
        }

        if (!cancelled) {
          setRawItem(found);
          // Redirect to slug URL if we're on the bare /menu-items/:id route
          if (!restaurantSlug) {
            const slug =
              found?.restaurant_slug ||
              found?.restaurant?.slug ||
              toSlug(found?.restaurant_name || found?.restaurant?.name || found?.restaurant);
            if (slug) {
              navigate(`/restaurants/${slug}/menu-items/${id}`, { replace: true });
            }
          }
        }
      } catch (e) {
        if (!cancelled) setErr(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const pageStyle = {
    minHeight: "100vh",
  };
  const wrapStyle = {
    maxWidth: 820,
    margin: "0 auto",
    padding: isMobile ? "20px 14px 48px" : "36px 24px 72px",
    boxSizing: "border-box",
    fontFamily: "var(--font-ui, Inter, system-ui, sans-serif)",
    color: "#101828",
  };
  const topRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: isMobile ? 16 : 22,
  };
  const wordmarkStyle = {
    fontSize: isMobile ? 17 : 19,
    fontWeight: 900,
    color: "#11211a",
    textDecoration: "none",
    letterSpacing: "-0.02em",
  };
  const backBtnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 13,
    fontWeight: 600,
    color: "#475467",
    background: "rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.09)",
    borderRadius: 999,
    padding: "5px 12px",
    cursor: "pointer",
    textDecoration: "none",
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={wrapStyle}>
          <div style={topRowStyle}>
            <Link to="/" style={wordmarkStyle}>Grubbid</Link>
            <button onClick={() => navigate(-1)} style={backBtnStyle}>← Back</button>
          </div>
          <div style={{ fontSize: 14, color: "#667085" }}>Loading item…</div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={pageStyle}>
        <div style={wrapStyle}>
          <div style={topRowStyle}>
            <Link to="/" style={wordmarkStyle}>Grubbid</Link>
            <button onClick={() => navigate(-1)} style={backBtnStyle}>← Back</button>
          </div>
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              background: "#fff",
              border: "1px solid rgba(18,34,28,0.08)",
              color: "#475467",
              fontWeight: 600,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 4, color: "#11211a" }}>Item not available</div>
            <div style={{ fontSize: 13, wordBreak: "break-word" }}>{err}</div>
          </div>
        </div>
      </div>
    );
  }

  const priceLabel =
    item?.priceMinor != null
      ? moneyFromMinor(item.priceMinor)
      : item?.price != null
        ? moneyFromFloat(item.price)
        : null;

  const insightsItem = rawItem
    ? {
        ...rawItem,
        id: rawItem?.id ?? item?.id ?? null,
        name: rawItem?.name ?? item?.name ?? "Untitled Item",
        description: rawItem?.description ?? item?.description ?? "",
        price: rawItem?.price ?? item?.price ?? null,
        price_minor: rawItem?.price_minor ?? item?.priceMinor ?? null,
        nutrition:
          rawItem?.nutrition ??
          rawItem?.signal_nutrition ??
          rawItem?.signals?.nutrition ??
          null,
        pairings: rawItem?.pairings ?? null,
        chips: rawItem?.chips ?? null,
        signals: rawItem?.signals ?? null,
        signal_nutrition: rawItem?.signal_nutrition ?? null,
      }
    : null;

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>

        {/* Nav bar */}
        <div style={topRowStyle}>
          <Link to="/" style={wordmarkStyle}>Grubbid</Link>
          <button onClick={() => navigate(-1)} style={backBtnStyle}>← Back</button>
        </div>

        {/* Item card */}
        <div
          style={{
            border: "1px solid var(--border, #e4e9f0)",
            borderRadius: 16,
            padding: isMobile ? "12px 14px" : "16px 20px",
            background: "#fff",
            boxShadow: "var(--shadow-1, 0 6px 18px rgba(16,24,40,0.06))",
          }}
        >
          {/* Name + price inline */}
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 16px" }}>
            <span
              style={{
                fontSize: isMobile ? 18 : 20,
                fontWeight: 800,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
                color: "#11211a",
                wordBreak: "break-word",
              }}
            >
              {item.name}
            </span>
            {priceLabel && (
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  color: "#667085",
                }}
              >
                {priceLabel}
              </span>
            )}
          </div>

          {/* Restaurant link */}
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: "#667085" }}>
            <Link
              to={`/restaurants/${item.restaurant.slug || item.restaurant.id}`}
              style={{ color: "#667085", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; e.currentTarget.style.textUnderlineOffset = "3px"; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
            >
              {item.restaurant.name}
            </Link>
          </div>

          {/* Badges */}
          {(item.badges.vegan || item.badges.glutenFree || item.badges.deal) && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {item.badges.vegan      && <Chip>🌿 Vegan</Chip>}
              {item.badges.glutenFree && <Chip>GF</Chip>}
              {item.badges.deal       && <Chip>🏷 Deal</Chip>}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div style={{ marginTop: 10, fontSize: 14, color: "#475467", lineHeight: 1.5, wordBreak: "break-word" }}>
              {item.description}
            </div>
          )}

          {/* Tabs */}
          <div style={{ marginTop: 16, borderTop: "1px solid #e4e7ec", paddingTop: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <TabButton active={tab === "insights"} onClick={() => setTab(t => t === "insights" ? null : "insights")}>
                Insights
              </TabButton>
              <TabButton active={tab === "nutrition"} onClick={() => setTab(t => t === "nutrition" ? null : "nutrition")}>
                Nutrition
              </TabButton>
              <TabButton active={tab === "similar"} onClick={() => setTab(t => t === "similar" ? null : "similar")}>
                Similar
              </TabButton>
            </div>

            {tab === "insights"  && <InsightBarPanel item={insightsItem} />}
            {tab === "nutrition" && <NutritionBarPanel chip={insightsItem?.chips?.nutrition_chip || null} />}
            {tab === "similar"   && <FindSimilar itemId={item?.id} isMobile={isMobile} />}
          </div>
        </div>

      </div>
    </div>
  );
}