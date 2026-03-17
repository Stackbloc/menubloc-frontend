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
import InsightCardDeck from "../components/InsightCardDeck.jsx";

const BACKEND_BASE = import.meta?.env?.VITE_BACKEND_URL || "http://localhost:3001";

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

      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {similar.map((s, i) => (
          <li
            key={s.id ?? i}
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "baseline",
              gap: isMobile ? 4 : 6,
              paddingBottom: 9,
              marginBottom: 9,
              borderBottom:
                i < similar.length - 1
                  ? "1px solid rgba(0,0,0,0.05)"
                  : "none",
            }}
          >
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

            {s.restaurant_name && (
              <span
                style={{
                  fontSize: 12,
                  color: "#5b6675",
                  wordBreak: "break-word",
                }}
              >
                — {s.restaurant_name}
              </span>
            )}
          </li>
        ))}
      </ul>
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

/* ---- Collapsible Nutrition Card ---- */

function CollapsibleNutritionCard({ chip }) {
  const [open, setOpen] = useState(false);

  const cal = chip?.calories_kcal != null ? Math.round(Number(chip.calories_kcal)) : null;
  const pro = chip?.protein_g != null ? Math.round(Number(chip.protein_g)) : null;
  const fat = chip?.fat_g != null ? Math.round(Number(chip.fat_g)) : null;
  const sod = chip?.sodium_mg != null ? Math.round(Number(chip.sodium_mg)) : null;
  const sug = chip?.sugar_g != null ? Math.round(Number(chip.sugar_g)) : null;

  const summary = [
    cal !== null ? `${cal} cal` : null,
    pro !== null ? `${pro}g protein` : null,
    fat !== null ? `${fat}g fat` : null,
  ].filter(Boolean).join(" · ");

  if (!summary && !chip?.allergen_alert) {
    return <div style={{ fontSize: 14, opacity: 0.65 }}>Nutrition info not available for this item yet.</div>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "rgba(0,0,0,0.03)",
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: open ? "12px 12px 0 0" : 12,
          padding: "10px 14px",
          cursor: "pointer",
          textAlign: "left",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f1720" }}>
          {summary || "Allergen info available"}
        </span>
        <span style={{ fontSize: 12, color: "#5b6675", flexShrink: 0 }}>
          {open ? "Hide ▲" : "Details ▼"}
        </span>
      </button>

      {open && (
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.10)",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            padding: "12px 14px",
            background: "white",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
              gap: 8,
              marginBottom: 10,
            }}
          >
            {[
              cal !== null && { label: "Calories", value: String(cal) },
              pro !== null && { label: "Protein", value: `${pro}g` },
              fat !== null && { label: "Fat", value: `${fat}g` },
              sod !== null && { label: "Sodium", value: `${sod}mg` },
              sug !== null && { label: "Sugar", value: `${sug}g` },
            ].filter(Boolean).map((row) => (
              <div
                key={row.label}
                style={{
                  background: "#f4f7fb",
                  border: "1px solid #e4e9f0",
                  borderRadius: 10,
                  padding: "8px 10px",
                }}
              >
                <div style={{ fontSize: 11, color: "#5b6675", marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1720" }}>{row.value}</div>
              </div>
            ))}
          </div>

          {chip?.calories_pct_women != null && (
            <div style={{ fontSize: 11.5, color: "#5b6675", lineHeight: 1.5, marginBottom: 6 }}>
              Approx. {Math.round(Number(chip.calories_pct_women))}% of a 2,000 cal diet
              {chip?.calories_pct_men != null ? ` · ${Math.round(Number(chip.calories_pct_men))}% of a 2,500 cal diet` : ""}.
            </div>
          )}

          {chip?.allergen_alert && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 6,
                padding: "4px 8px",
                background: "rgba(230,130,0,0.10)",
                border: "1px solid rgba(230,130,0,0.22)",
                borderRadius: 999,
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 900, color: "#b36000" }}>⚠ Allergen Alert</span>
              <span style={{ fontSize: 11.5, color: "#0f1720", lineHeight: 1.35 }}>{chip.allergen_alert}</span>
            </div>
          )}

          {chip?.disclosure && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#93a0b2", fontStyle: "italic", lineHeight: 1.45 }}>
              {chip.disclosure}
            </div>
          )}
        </div>
      )}
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
  const [tab, setTab] = useState("insights");

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

  if (loading) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
        <div style={{ fontSize: 14, opacity: 0.75 }}>Loading item…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,0,0,0.06)",
            border: "1px solid rgba(255,0,0,0.18)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Item detail not available yet</div>
          <div style={{ fontSize: 13, opacity: 0.9, wordBreak: "break-word" }}>{err}</div>
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
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: isMobile ? 14 : 16,
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 16,
          padding: isMobile ? 14 : 16,
          background: "white",
          boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 0, width: isMobile ? "100%" : "auto" }}>
            <div
              style={{
                fontSize: isMobile ? 20 : 22,
                fontWeight: 900,
                marginBottom: 4,
                lineHeight: 1.15,
                wordBreak: "break-word",
              }}
            >
              {item.name}
            </div>

            <div style={{ fontSize: 14, opacity: 0.75, wordBreak: "break-word" }}>
              <Link
                to={`/restaurants/${item.restaurant.slug || item.restaurant.id}`}
                style={{ color: "inherit", textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
              >
                {item.restaurant.name}
              </Link>
            </div>
          </div>

          <div
            style={{
              textAlign: isMobile ? "left" : "right",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900 }}>
              {priceLabel || "—"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {item.badges.vegan && <Chip>Vegan</Chip>}
          {item.badges.glutenFree && <Chip>Gluten-Free</Chip>}
          {item.badges.deal && <Chip>Deal</Chip>}
        </div>

        {item.description && (
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              opacity: 0.9,
              wordBreak: "break-word",
            }}
          >
            {item.description}
          </div>
        )}

        <div style={{ marginTop: 14, borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <TabButton active={tab === "insights"} onClick={() => setTab("insights")}>
              Insights
            </TabButton>
            <TabButton active={tab === "nutrition"} onClick={() => setTab("nutrition")}>
              Nutrition
            </TabButton>
            <TabButton active={tab === "ingredients"} onClick={() => setTab("ingredients")}>
              Ingredients
            </TabButton>
          </div>

          {tab === "insights" && (
            <>
              <InsightCardDeck item={insightsItem} />
              <FindSimilar itemId={item?.id} isMobile={isMobile} />
            </>
          )}

          {tab === "nutrition" && (
            <CollapsibleNutritionCard chip={insightsItem?.chips?.nutrition_chip || null} />
          )}

          {tab === "ingredients" && (
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              {item.ingredients ? (
                Array.isArray(item.ingredients) ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {item.ingredients.map((ing, idx) => (
                      <li key={idx} style={{ marginBottom: 6, wordBreak: "break-word" }}>
                        {typeof ing === "object" && ing !== null ? String(ing.name || "") : String(ing)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ wordBreak: "break-word" }}>{String(item.ingredients)}</div>
                )
              ) : (
                <div style={{ opacity: 0.75 }}>Ingredients coming soon.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}