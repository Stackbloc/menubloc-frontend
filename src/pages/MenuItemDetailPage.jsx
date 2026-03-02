// src/pages/MenuItemDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

const BACKEND_BASE = import.meta?.env?.VITE_BACKEND_URL || "http://localhost:3001";

function moneyFromMinor(priceMinor) {
  if (priceMinor == null || Number.isNaN(Number(priceMinor))) return null;
  const dollars = Number(priceMinor) / 100;
  return dollars.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function moneyFromFloat(price) {
  if (price == null || Number.isNaN(Number(price))) return null;
  const dollars = Number(price);
  return dollars.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function pickFirstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return null;
}

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

  const reasons =
    raw?.insight?.reasons ||
    raw?.match_reasons ||
    raw?.reasons ||
    raw?.why ||
    [];

  const confidence =
    pickFirstDefined(raw?.insight?.confidence, raw?.confidence, raw?.match_confidence, null);

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
    badges: {
      vegan,
      glutenFree,
      deal,
    },
    insight: {
      reasons: Array.isArray(reasons) ? reasons : [String(reasons)],
      confidence: confidence == null ? null : Number(confidence),
    },
    nutrition: raw?.nutrition || null,
    pairings: raw?.pairings || null,
    ingredients: raw?.ingredients || raw?.ingredient_list || null,
  };
}

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
        padding: "6px 10px",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function MenuItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rawItem, setRawItem] = useState(null);
  const [tab, setTab] = useState("insights");

  const item = useMemo(() => (rawItem ? normalizeResultItem(rawItem) : null), [rawItem]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");
      setRawItem(null);

      try {
        // Preferred: a dedicated endpoint (add later)
        // GET /public/menu-items/:id  (or similar)
        const tryUrls = [
          `${BACKEND_BASE}/public/menu-items/${encodeURIComponent(id)}`,
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
            // ignore and continue
          }
        }

        // Fallback: if no endpoint exists yet, show a helpful message
        if (!found) {
          throw new Error(
            "No item-detail endpoint found yet. Create GET /public/menu-items/:id (or /public/items/:id) to power this page."
          );
        }

        if (!cancelled) setRawItem(found);
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
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            border: "1px solid rgba(0,0,0,0.14)",
            background: "white",
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          ← Back
        </button>

        <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.06)", border: "1px solid rgba(255,0,0,0.18)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Item detail not available yet</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>{err}</div>
        </div>
      </div>
    );
  }

  const priceLabel =
    item?.priceMinor != null ? moneyFromMinor(item.priceMinor) : (item?.price != null ? moneyFromFloat(item.price) : null);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            border: "1px solid rgba(0,0,0,0.14)",
            background: "white",
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <Link to="/discover" style={{ fontSize: 13, opacity: 0.8, textDecoration: "none" }}>
          Back to Discovery
        </Link>
      </div>

      {/* Single-item card (detail mode) */}
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 16,
          padding: 16,
          background: "white",
          boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{item.name}</div>
            <div style={{ fontSize: 14, opacity: 0.75 }}>{item.restaurant.name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{priceLabel || "—"}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {item.badges.vegan && <Chip>Vegan</Chip>}
          {item.badges.glutenFree && <Chip>Gluten-Free</Chip>}
          {item.badges.deal && <Chip>Deal</Chip>}
        </div>

        {item.description && (
          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>{item.description}</div>
        )}

        <div style={{ marginTop: 14, borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <TabButton active={tab === "insights"} onClick={() => setTab("insights")}>
              Insights
            </TabButton>
            <TabButton active={tab === "nutrition"} onClick={() => setTab("nutrition")}>
              Nutrition
            </TabButton>
            <TabButton active={tab === "pairings"} onClick={() => setTab("pairings")}>
              Pairings
            </TabButton>
            <TabButton active={tab === "ingredients"} onClick={() => setTab("ingredients")}>
              Ingredients
            </TabButton>
          </div>

          {tab === "insights" && (
            <div style={{ fontSize: 14 }}>
              {item.insight.confidence != null && (
                <div style={{ marginBottom: 10, opacity: 0.85 }}>
                  Confidence: <b>{Math.round(item.insight.confidence * 100)}%</b>
                </div>
              )}
              {item.insight.reasons?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {item.insight.reasons.map((r, idx) => (
                    <li key={idx} style={{ marginBottom: 6, opacity: 0.9 }}>
                      {String(r)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ opacity: 0.75 }}>No insights yet.</div>
              )}
            </div>
          )}

          {tab === "nutrition" && (
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              {item.nutrition ? (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(item.nutrition, null, 2)}</pre>
              ) : (
                <div style={{ opacity: 0.75 }}>Nutrition coming soon.</div>
              )}
            </div>
          )}

          {tab === "pairings" && (
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              {item.pairings ? (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(item.pairings, null, 2)}</pre>
              ) : (
                <div style={{ opacity: 0.75 }}>Pairings coming soon.</div>
              )}
            </div>
          )}

          {tab === "ingredients" && (
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              {item.ingredients ? (
                Array.isArray(item.ingredients) ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {item.ingredients.map((ing, idx) => (
                      <li key={idx} style={{ marginBottom: 6 }}>
                        {String(ing)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>{String(item.ingredients)}</div>
                )
              ) : (
                <div style={{ opacity: 0.75 }}>
                  Ingredients coming soon (this will be powered by your ingredient-aware layer).
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => alert("TODO: Save/bookmark")}
            style={{
              border: "1px solid rgba(0,0,0,0.14)",
              background: "white",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Save
          </button>

          <button
            type="button"
            onClick={() => alert("TODO: Route to restaurant profile")}
            style={{
              border: "1px solid rgba(0,0,0,0.14)",
              background: "white",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            View Restaurant
          </button>
        </div>
      </div>
    </div>
  );
}