/**
 * ============================================================
 * File: MenuItemDetailPage.jsx
 * Path: menubloc-frontend/src/pages/MenuItemDetailPage.jsx
 * Date: 2026-03-25
 * Purpose:
 *   Full-page detail view for a single menu item.
 *
 *   This revision:
 *     - replaces sparse tabs with visible stacked intelligence cards
 *     - keeps Pro photo support near the top without leaving blank holes
 *     - preserves the existing similar-items data flow and label:
 *       "Something Similar"
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const BACKEND_BASE = (import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");

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
  for (const value of vals) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function toSlug(str) {
  if (!str) return null;
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function hasRenderableImage(url) {
  const value = String(url || "").trim();
  if (!value) return false;
  return /^(https?:)?\/\//i.test(value) || value.startsWith("/");
}

function useIsMobile(breakpoint = 840) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

function resolveNutritionChip(raw) {
  if (raw?.chips?.nutrition_chip && typeof raw.chips.nutrition_chip === "object") {
    return raw.chips.nutrition_chip;
  }
  return raw?.nutrition || raw?.signal_nutrition || raw?.signals?.nutrition || null;
}

function normalizeResultItem(raw) {
  const exactPriceMinor = pickFirstDefined(
    raw?.exact_price_minor,
    raw?.price_minor,
    raw?.priceMinor,
    raw?.price_minor_units,
    raw?.price_cents,
    null
  );
  const exactPrice = pickFirstDefined(
    raw?.exact_price,
    raw?.price,
    raw?.price_float,
    raw?.priceFloat,
    null
  );

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

  const restaurantLogoUrl =
    raw?.restaurant_logo_url ||
    raw?.restaurant?.logo_url ||
    raw?.restaurant?.logoUrl ||
    raw?.logo_url ||
    null;

  const restaurantSubscription =
    raw?.restaurant?.subscription ||
    raw?.subscription ||
    null;

  const itemPhotoUrl =
    raw?.item_photo_url ||
    raw?.itemPhotoUrl ||
    raw?.photo_url ||
    raw?.image_url ||
    null;

  return {
    id: raw?.menu_item_id || raw?.id || null,
    name: raw?.name || raw?.item_name || raw?.title || "Untitled Item",
    description: raw?.description || raw?.notes || raw?.snippet || "",
    priceMinor: exactPriceMinor,
    price: exactPrice,
    itemPhotoUrl,
    intelligence: raw?.intelligence || null,
    nutritionChip: resolveNutritionChip(raw),
    ingredients: Array.isArray(raw?.ingredients) ? raw.ingredients : [],
    badges: {
      vegan:
        Boolean(raw?.badges?.vegan) ||
        Boolean(raw?.badges?.is_vegan) ||
        Boolean(raw?.is_vegan) ||
        Boolean(raw?.vegan),
      glutenFree:
        Boolean(raw?.badges?.gluten_free) ||
        Boolean(raw?.badges?.glutenFree) ||
        Boolean(raw?.gluten_free) ||
        Boolean(raw?.is_gluten_free),
      deal:
        Boolean(raw?.badges?.deal) ||
        Boolean(raw?.badges?.deals) ||
        Boolean(raw?.deal) ||
        Boolean(raw?.is_deal),
    },
    restaurant: {
      id: restaurantId,
      name: restaurantName || "Unknown Restaurant",
      slug: raw?.restaurant_slug || raw?.restaurant?.slug || raw?.slug || null,
      city: raw?.restaurant?.city || raw?.city || null,
      cuisine: raw?.restaurant?.cuisine || raw?.cuisine || null,
      logoUrl: restaurantLogoUrl,
      subscription: restaurantSubscription,
      isPro:
        raw?.restaurant?.is_pro === true ||
        raw?.restaurant?.isPro === true ||
        restaurantSubscription?.is_pro === true ||
        restaurantSubscription?.isPro === true ||
        false,
    },
  };
}

function formatMetricValue(value, suffix = "") {
  if (value == null || Number.isNaN(Number(value))) return null;
  return `${Math.round(Number(value))}${suffix}`;
}

function nutritionPairs(intelligenceNutrition, nutritionChip) {
  const source = intelligenceNutrition || nutritionChip || {};
  return [
    { label: "Calories", value: formatMetricValue(source?.calories_kcal) },
    { label: "Protein", value: formatMetricValue(source?.protein_g, "g") },
    { label: "Carbs", value: formatMetricValue(source?.carbs_g, "g") },
    { label: "Fat", value: formatMetricValue(source?.fat_g, "g") },
    { label: "Fiber", value: formatMetricValue(source?.fiber_g, "g") },
    { label: "Sugar", value: formatMetricValue(source?.sugar_g, "g") },
    { label: "Sodium", value: formatMetricValue(source?.sodium_mg, "mg") },
  ].filter((entry) => entry.value);
}

function PageShell({ children, isMobile, navigate }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(255,241,214,0.85), rgba(255,255,255,0) 34%), linear-gradient(180deg, #fbf7ee 0%, #f6f1e7 45%, #f8f7f2 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: isMobile ? "18px 14px 56px" : "28px 24px 72px",
          boxSizing: "border-box",
          color: "#14211b",
          fontFamily: 'var(--font-ui, "Avenir Next", "Segoe UI", sans-serif)',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: isMobile ? 16 : 22,
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "#163426",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              fontSize: isMobile ? 20 : 24,
            }}
          >
            Grubbid
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              border: "1px solid rgba(22,52,38,0.12)",
              background: "rgba(255,255,255,0.72)",
              color: "#163426",
              borderRadius: 999,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(20,33,27,0.06)",
            }}
          >
            Back
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Surface({ children, style }) {
  return (
    <section
      style={{
        background: "rgba(255,255,255,0.88)",
        border: "1px solid rgba(20,33,27,0.08)",
        borderRadius: 24,
        boxShadow: "0 16px 44px rgba(20,33,27,0.08)",
        backdropFilter: "blur(8px)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children, color = "#7a5b20" }) {
  return (
    <div
      style={{
        fontSize: 11,
        lineHeight: 1.2,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontWeight: 900,
        color,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function BadgePill({ children, tone = "default" }) {
  const tones = {
    default: {
      background: "rgba(20,33,27,0.06)",
      color: "#23352d",
      border: "1px solid rgba(20,33,27,0.08)",
    },
    positive: {
      background: "rgba(38,120,74,0.12)",
      color: "#1c6a43",
      border: "1px solid rgba(38,120,74,0.16)",
    },
    caution: {
      background: "rgba(176,96,0,0.12)",
      color: "#9b5c00",
      border: "1px solid rgba(176,96,0,0.14)",
    },
    accent: {
      background: "rgba(18,75,163,0.10)",
      color: "#124ba3",
      border: "1px solid rgba(18,75,163,0.14)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "7px 12px",
        fontSize: 12,
        lineHeight: 1,
        fontWeight: 800,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

function SectionCard({ title, eyebrow, children, style }) {
  return (
    <Surface style={{ padding: 22, ...style }}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          color: "#16241d",
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: 16 }}>{children}</div>
    </Surface>
  );
}

function KeyValueGrid({ rows }) {
  if (!rows?.length) return null;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            paddingBottom: 10,
            borderBottom: "1px solid rgba(20,33,27,0.08)",
          }}
        >
          <div style={{ fontSize: 13, color: "#5a695f", fontWeight: 700 }}>{row.label}</div>
          <div style={{ fontSize: 14, color: "#15241d", fontWeight: 800, textAlign: "right" }}>{row.value}</div>
        </div>
      ))}
    </div>
  );
}

function SignalList({ title, values }) {
  if (!values?.length) return null;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {values.map((value) => (
          <BadgePill key={`${title}-${value}`} tone="default">
            {value}
          </BadgePill>
        ))}
      </div>
    </div>
  );
}

function NutritionCard({ intelligenceNutrition, nutritionChip }) {
  const pairs = nutritionPairs(intelligenceNutrition, nutritionChip);
  if (!pairs.length) return null;

  const satiety = intelligenceNutrition?.satiety_label || nutritionChip?.satiety_label || null;
  const glycemic = intelligenceNutrition?.glycemic_label || nutritionChip?.glycemic_label || null;
  const confidence = intelligenceNutrition?.confidence || null;

  return (
    <SectionCard title="Nutrition" eyebrow="Decision Data">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
        {pairs.map((entry) => (
          <div
            key={entry.label}
            style={{
              borderRadius: 18,
              border: "1px solid rgba(20,33,27,0.08)",
              background: "#fbfaf6",
              padding: "14px 12px",
            }}
          >
            <div style={{ fontSize: 12, color: "#617167", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {entry.label}
            </div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: "#15241d" }}>
              {entry.value}
            </div>
          </div>
        ))}
      </div>

      {(satiety || glycemic || confidence) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {satiety ? <BadgePill tone="positive">{satiety}</BadgePill> : null}
          {glycemic ? <BadgePill tone="accent">{glycemic}</BadgePill> : null}
          {confidence ? <BadgePill tone="default">{`${String(confidence).replace(/^\w/, (c) => c.toUpperCase())} confidence`}</BadgePill> : null}
        </div>
      )}

      {intelligenceNutrition?.interpretation ? (
        <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5, color: "#425149", fontWeight: 700 }}>
          {intelligenceNutrition.interpretation}
        </div>
      ) : null}
    </SectionCard>
  );
}

function IngredientsProcessingCard({ section }) {
  if (!section) return null;

  return (
    <SectionCard title="Ingredients & Processing" eyebrow="What Is In It">
      {section.processing_level ? (
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: section.processing_level.includes("Highly")
              ? "linear-gradient(135deg, rgba(184,94,21,0.13), rgba(255,255,255,0.75))"
              : section.processing_level.includes("Whole")
                ? "linear-gradient(135deg, rgba(38,120,74,0.12), rgba(255,255,255,0.75))"
                : "linear-gradient(135deg, rgba(18,75,163,0.10), rgba(255,255,255,0.75))",
            border: "1px solid rgba(20,33,27,0.08)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f" }}>
            Processing level
          </div>
          <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "#15241d" }}>
            {section.processing_level}
          </div>
          {section.processing_reason ? (
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.45, color: "#425149" }}>
              {section.processing_reason}
            </div>
          ) : null}
          {section.user_impact ? (
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5, color: "#425149", fontWeight: 700 }}>
              What this means: {section.user_impact}
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 14 }}>
        <SignalList title="Artificial additives detected" values={section.artificial_additives} />
        <SignalList title="Artificial colors detected" values={section.artificial_colors} />
        <SignalList title="Preservatives detected" values={section.preservatives} />
        <SignalList title="Flavor enhancers detected" values={section.flavor_enhancers} />
      </div>
    </SectionCard>
  );
}

function PreparationCard({ section }) {
  if (!section) return null;

  const rows = [
    section.cooking_method ? { label: "Cooking method", value: section.cooking_method } : null,
    section.coating ? { label: "Coating", value: section.coating } : null,
    section.sauce_style ? { label: "Sauce style", value: section.sauce_style } : null,
  ].filter(Boolean);

  if (!rows.length) return null;

  return (
    <SectionCard title="Preparation Details" eyebrow="Why It Eats Heavier Or Lighter">
      <KeyValueGrid rows={rows} />
      {section.impact_line ? (
        <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5, color: "#425149", fontWeight: 700 }}>
          Impact: {section.impact_line}
        </div>
      ) : null}
      {section.why_it_matters ? (
        <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5, color: "#425149" }}>
          {section.why_it_matters}.
        </div>
      ) : null}
    </SectionCard>
  );
}

function AllergenCard({ section }) {
  if (!section?.items?.length) return null;

  return (
    <SectionCard title="Allergen Alert" eyebrow="Sensitivity Intelligence">
      {section.alert ? (
        <div
          style={{
            borderRadius: 16,
            background: "rgba(176,96,0,0.10)",
            border: "1px solid rgba(176,96,0,0.14)",
            padding: 14,
            fontSize: 15,
            lineHeight: 1.45,
            color: "#6e4708",
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          {section.alert}
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {section.items.map((entry) => (
          <BadgePill key={entry.label} tone="caution">
            {`${entry.confidence} ${entry.label}`}
          </BadgePill>
        ))}
      </div>

      {section.why_it_matters ? (
        <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5, color: "#425149", fontWeight: 700 }}>
          Why it matters: {section.why_it_matters}
        </div>
      ) : null}

      {section.disclosure ? (
        <div style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.45, color: "#627067" }}>
          {section.disclosure}
        </div>
      ) : null}
    </SectionCard>
  );
}

function EuropeCard({ section }) {
  if (!section) return null;

  return (
    <SectionCard title="European Standards" eyebrow="Standards Intelligence">
      <div
        style={{
          borderRadius: 18,
          padding: 16,
          background:
            section.restricted_ingredients?.length
              ? "linear-gradient(135deg, rgba(176,96,0,0.12), rgba(255,255,255,0.78))"
              : section.scrutiny_ingredients?.length
                ? "linear-gradient(135deg, rgba(18,75,163,0.10), rgba(255,255,255,0.78))"
                : "linear-gradient(135deg, rgba(38,120,74,0.10), rgba(255,255,255,0.78))",
          border: "1px solid rgba(20,33,27,0.08)",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", color: "#15241d" }}>
          {section.headline}
        </div>
        {section.note ? (
          <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.45, color: "#425149", fontWeight: 700 }}>
            {section.note}
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
        <SignalList title="More tightly restricted in Europe" values={section.restricted_ingredients} />
        <SignalList title="Facing European scrutiny" values={section.scrutiny_ingredients} />
      </div>
    </SectionCard>
  );
}

function ValueCard({ section, priceLabel }) {
  if (!section) return null;

  return (
    <SectionCard title="Value / Pricing Intelligence" eyebrow="Worth The Price?">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 16,
          alignItems: "end",
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#15241d" }}>
            {section.label}
          </div>
          <div style={{ marginTop: 6, fontSize: 15, color: "#425149", fontWeight: 800 }}>
            {section.explanation || section.interpretation}
          </div>
          {priceLabel ? <div style={{ marginTop: 6, fontSize: 13, color: "#5a695f", fontWeight: 700 }}>{priceLabel}</div> : null}
        </div>
        <div
          style={{
            minWidth: 72,
            textAlign: "center",
            borderRadius: 16,
            padding: "12px 10px",
            background: "rgba(20,33,27,0.05)",
            border: "1px solid rgba(20,33,27,0.08)",
          }}
        >
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, color: "#5a695f" }}>
            Score
          </div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em", color: "#15241d" }}>
            {section.score}
          </div>
        </div>
      </div>

      {section.basis?.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {section.basis.map((reason) => (
            <BadgePill key={reason} tone="default">
              {reason}
            </BadgePill>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}

function ConfidenceCard({ section }) {
  if (!section?.notes?.length) return null;

  return (
    <SectionCard title="Confidence / Trust Notes" eyebrow="What To Trust">
      <div style={{ display: "grid", gap: 10 }}>
        {section.notes.map((note) => (
          <div
            key={note}
            style={{
              borderRadius: 16,
              border: "1px solid rgba(20,33,27,0.08)",
              background: "#fbfaf6",
              padding: "12px 14px",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#33443b",
            }}
          >
            {note}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SomethingSimilar({ itemId }) {
  const [similar, setSimilar] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!itemId) return undefined;
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

  const groups = [];
  const seenRestaurants = new Map();
  for (const row of similar) {
    const key = String(row.restaurant_id ?? row.restaurant_name ?? "");
    if (seenRestaurants.has(key)) {
      groups[seenRestaurants.get(key)].items.push(row);
    } else {
      seenRestaurants.set(key, groups.length);
      groups.push({ restaurant_name: row.restaurant_name, items: [row] });
    }
  }

  return (
    <SectionCard title="Something Similar" eyebrow="Keep Exploring" style={{ marginTop: 24 }}>
      <div style={{ display: "grid", gap: 14 }}>
        {groups.map((group, index) => (
          <div
            key={`${group.restaurant_name || "restaurant"}-${index}`}
            style={{
              borderRadius: 18,
              border: "1px solid rgba(20,33,27,0.08)",
              background: "#fbfaf6",
              padding: 16,
            }}
          >
            {group.restaurant_name ? (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#5a695f",
                  marginBottom: 10,
                }}
              >
                {group.restaurant_name}
              </div>
            ) : null}
            <div style={{ display: "grid", gap: 8 }}>
              {group.items.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/menu-items/${entry.id}`}
                  style={{
                    textDecoration: "none",
                    color: "#124ba3",
                    fontWeight: 800,
                    fontSize: 15,
                    lineHeight: 1.35,
                  }}
                >
                  {entry.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default function MenuItemDetailPage() {
  const { id, restaurantSlug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rawItem, setRawItem] = useState(null);

  const item = useMemo(() => (rawItem ? normalizeResultItem(rawItem) : null), [rawItem]);

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
            const response = await fetch(url, { credentials: "include" });
            if (!response.ok) continue;
            const json = await response.json();
            if (json?.ok && (json?.item || json?.menu_item)) {
              found = json.item || json.menu_item;
              break;
            }
          } catch (_) {
            // try next endpoint
          }
        }

        if (!found) {
          throw new Error("No item-detail endpoint found yet. Create GET /menu-items/:id to power this page.");
        }

        if (!cancelled) {
          setRawItem(found);
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
      } catch (error) {
        if (!cancelled) setErr(String(error?.message || error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate, restaurantSlug]);

  const priceLabel =
    item?.priceMinor != null
      ? moneyFromMinor(item.priceMinor)
      : item?.price != null
        ? moneyFromFloat(item.price)
        : null;

  if (loading) {
    return (
      <PageShell isMobile={isMobile} navigate={navigate}>
        <Surface style={{ padding: 22 }}>
          <div style={{ fontSize: 14, color: "#53635a", fontWeight: 700 }}>Loading item...</div>
        </Surface>
      </PageShell>
    );
  }

  if (err || !item) {
    return (
      <PageShell isMobile={isMobile} navigate={navigate}>
        <Surface style={{ padding: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#15241d" }}>Item not available</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#53635a", lineHeight: 1.5 }}>{err || "This item could not be loaded."}</div>
        </Surface>
      </PageShell>
    );
  }

  const intelligence = item.intelligence || {};
  const showRestaurantLogo = hasRenderableImage(item.restaurant.logoUrl);
  const showItemPhoto = item.restaurant.isPro === true && hasRenderableImage(item.itemPhotoUrl);

  const heroGridColumns = isMobile
    ? "1fr"
    : showItemPhoto
      ? "minmax(0, 1.4fr) minmax(280px, 0.95fr)"
      : "1fr";

  return (
    <PageShell isMobile={isMobile} navigate={navigate}>
      <Surface style={{ padding: isMobile ? 18 : 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: heroGridColumns, gap: isMobile ? 18 : 24, alignItems: "stretch" }}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <Eyebrow>Menu Item Intelligence</Eyebrow>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {showRestaurantLogo ? (
                  <img
                    src={item.restaurant.logoUrl}
                    alt={`${item.restaurant.name} logo`}
                    style={{
                      width: 62,
                      height: 62,
                      objectFit: "contain",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.75)",
                      border: "1px solid rgba(20,33,27,0.08)",
                      padding: 8,
                    }}
                  />
                ) : null}
                <div>
                  <div style={{ fontSize: 13, color: "#617167", fontWeight: 800 }}>
                    <Link
                      to={`/restaurants/${item.restaurant.slug || item.restaurant.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {item.restaurant.name}
                    </Link>
                  </div>
                  {item.restaurant.city || item.restaurant.cuisine ? (
                    <div style={{ marginTop: 4, fontSize: 13, color: "#6a786f" }}>
                      {[item.restaurant.city, item.restaurant.cuisine].filter(Boolean).join(" · ")}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? 34 : 46,
                  lineHeight: 0.96,
                  letterSpacing: "-0.05em",
                  color: "#15241d",
                  maxWidth: 760,
                }}
              >
                {item.name}
              </h1>
              {priceLabel ? (
                <div style={{ marginTop: 10, fontSize: isMobile ? 24 : 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#7a5b20" }}>
                  {priceLabel}
                </div>
              ) : null}
            </div>

            {item.description ? (
              <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "#405048", maxWidth: 760 }}>
                {item.description}
              </div>
            ) : null}

            {(item.badges.vegan || item.badges.glutenFree || item.badges.deal) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {item.badges.vegan ? <BadgePill tone="positive">Vegan</BadgePill> : null}
                {item.badges.glutenFree ? <BadgePill tone="accent">Gluten Free</BadgePill> : null}
                {item.badges.deal ? <BadgePill tone="caution">Deal</BadgePill> : null}
              </div>
            )}

          </div>

          {showItemPhoto ? (
            <div
              style={{
                minHeight: isMobile ? 280 : 100,
                borderRadius: 22,
                overflow: "hidden",
                border: "1px solid rgba(20,33,27,0.08)",
                background: "#efe9dc",
              }}
            >
              <img
                src={item.itemPhotoUrl}
                alt={`${item.name} photo`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          ) : null}
        </div>
      </Surface>

      {intelligence.quick_verdict?.summary ? (
        <Surface
          style={{
            marginTop: 20,
            padding: isMobile ? 22 : 28,
            background: "linear-gradient(135deg, rgba(18,28,23,0.98), rgba(38,58,47,0.96))",
            color: "#f8f6ef",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.72)" }}>
            Quick Verdict
          </div>
          <div style={{ marginTop: 12, fontSize: isMobile ? 34 : 52, fontWeight: 900, lineHeight: 0.94, letterSpacing: "-0.06em", maxWidth: 900 }}>
            {intelligence.quick_verdict.summary}
          </div>
          {intelligence.quick_verdict.interpretation ? (
            <div style={{ marginTop: 12, fontSize: isMobile ? 16 : 18, lineHeight: 1.45, color: "rgba(255,255,255,0.84)", maxWidth: 760, fontWeight: 700 }}>
              {intelligence.quick_verdict.interpretation}
            </div>
          ) : null}
          {intelligence.quick_verdict.recommendation_line ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginTop: 16,
                borderRadius: 999,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.16)",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {intelligence.quick_verdict.recommendation_line}
            </div>
          ) : null}
        </Surface>
      ) : null}

      {intelligence.decision_tags?.length ? (
        <Surface style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Decision Tags</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {intelligence.decision_tags.map((tag) => (
              <BadgePill
                key={tag}
                tone={
                  /High Sodium|Very High Sodium|Highly Processed|Weak Value/.test(tag)
                    ? "caution"
                    : /High Protein|Good Value|Minimally Processed/.test(tag)
                      ? "positive"
                      : "accent"
                }
              >
                {tag}
              </BadgePill>
            ))}
          </div>
        </Surface>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
          gap: 18,
          marginTop: 22,
        }}
      >
        <NutritionCard intelligenceNutrition={intelligence.nutrition} nutritionChip={item.nutritionChip} />
        <IngredientsProcessingCard section={intelligence.ingredients_processing} />
        <PreparationCard section={intelligence.preparation} />
        <AllergenCard section={intelligence.allergen_alerts} />
        <EuropeCard section={intelligence.europe_standards} />
        <ValueCard section={intelligence.value} priceLabel={priceLabel} />
        <ConfidenceCard section={intelligence.confidence} />
      </div>

      <SomethingSimilar itemId={item.id} />
    </PageShell>
  );
}
