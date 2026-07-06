import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { parseCityStateSlug } from "../lib/cityStateSlug";
import { findItemBySlug } from "../lib/itemSlug";
import { STATE_NAMES } from "../lib/slugs.js";

const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "https://menubloc-backend-production.up.railway.app")
).replace(/\/$/, "");
const CANONICAL_BASE = "https://menuply.com";

function setCanonical(href) {
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

function resolveMarketRouteParams({ slugOrId, state, city }) {
  const fromLegacy = parseCityStateSlug(slugOrId);
  if (fromLegacy && slugOrId) {
    return {
      marketSlug: slugOrId,
      parsed: fromLegacy,
      pathPrefix: `/restaurants/${slugOrId}`,
    };
  }
  if (state && city) {
    const stateCode = Object.entries(STATE_NAMES).find(
      ([, slug]) => slug === String(state).toLowerCase(),
    )?.[0];
    if (stateCode) {
      const marketSlug = `${city}-${stateCode.toLowerCase()}`;
      const parsed = parseCityStateSlug(marketSlug);
      if (parsed) {
        return {
          marketSlug,
          parsed,
          pathPrefix: `/restaurants/${state}/${city}`,
        };
      }
    }
  }
  return {
    marketSlug: slugOrId || null,
    parsed: null,
    pathPrefix: slugOrId ? `/restaurants/${slugOrId}` : null,
  };
}

export default function MarketMenuItemPage() {
  const params = useParams();
  const { restaurantSlug, itemSlug } = params;
  const { marketSlug, parsed, pathPrefix } = resolveMarketRouteParams(params);

  const [status, setStatus] = useState("loading");
  const [item, setItem] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantId, setRestaurantId] = useState(null);

  const canonicalUrl = pathPrefix && itemSlug
    ? `${CANONICAL_BASE}${pathPrefix}/${restaurantSlug}/menu-items/${itemSlug}`
    : null;

  useEffect(() => {
    if (canonicalUrl) setCanonical(canonicalUrl);
  }, [canonicalUrl]);

  useEffect(() => {
    if (!parsed || !marketSlug || !restaurantSlug || !itemSlug) return;
    setStatus("loading");
    setItem(null);

    let cancelled = false;

    async function resolve() {
      try {
        const marketRes = await fetch(
          `${API}/public/market/${encodeURIComponent(marketSlug)}/restaurants/${encodeURIComponent(restaurantSlug)}`,
          { credentials: "include" },
        );
        if (!marketRes.ok) throw new Error("restaurant_not_found");
        const marketData = await marketRes.json();
        if (!marketData.ok) throw new Error("restaurant_not_found");

        const rid = marketData.restaurant_id;
        if (!cancelled) setRestaurantId(rid);
        if (!cancelled) setRestaurantName(marketData.restaurant_name || "");

        const menuRes = await fetch(`${API}/public/restaurants/${rid}/menu`, { credentials: "include" });
        if (!menuRes.ok) throw new Error("menu_not_found");
        const menuData = await menuRes.json();

        const found = findItemBySlug(menuData.sections, itemSlug);
        if (!found) throw new Error("item_not_found");

        const menuItemId = found.menu_item_id;
        if (!menuItemId) throw new Error("menu_item_identity_missing");

        const itemRes = await fetch(`${API}/menu-items/${encodeURIComponent(menuItemId)}`, {
          credentials: "include",
        });
        if (!itemRes.ok) throw new Error("item_detail_not_found");
        const itemData = await itemRes.json();

        if (!cancelled) {
          const fullItem = itemData.item || itemData.menu_item || found;
          setItem({ ...fullItem, _menuItemId: menuItemId });
          setStatus("ok");

          document.title = `${fullItem.name || found.name || "Menu Item"} — ${marketData.restaurant_name || ""} — Menuply`;
        }
      } catch (err) {
        if (!cancelled) setStatus(err.message === "item_not_found" ? "not_found" : "error");
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [marketSlug, restaurantSlug, itemSlug, parsed]);

  const menuUrl = pathPrefix && restaurantSlug ? `${pathPrefix}/${restaurantSlug}/menu` : "/";
  const { city, state: stateCode } = parsed || {};

  const nutrition = useMemo(() => {
    if (!item) return null;
    const nc = item?.chips?.nutrition_chip;
    if (nc?.status === "available") return nc;
    if (item?.calories != null) {
      return { calories_kcal: item.calories, protein_g: item.protein_g, fat_g: item.fat_g, sodium_mg: item.sodium_mg };
    }
    return null;
  }, [item]);

  if (!parsed) {
    return <div style={{ padding: "2rem" }}>Invalid market URL.</div>;
  }

  if (status === "loading") {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  }

  if (status === "not_found") {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Menu item not found.</p>
        <Link to={menuUrl} style={{ color: "#1a56db" }}>← Back to menu</Link>
      </div>
    );
  }

  if (status === "error" || !item) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Could not load this menu item.</p>
        <Link to={menuUrl} style={{ color: "#1a56db" }}>← Back to menu</Link>
      </div>
    );
  }

  const name = item.name || item.item_name || "";
  const description = item.description || item.item_description || "";
  const price = item.price || (item.price_cents ? `$${(item.price_cents / 100).toFixed(2)}` : null);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <nav style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1rem" }}>
        <Link to={pathPrefix || "/restaurants"} style={{ color: "#555" }}>
          {city}, {stateCode}
        </Link>
        {" › "}
        <Link to={menuUrl} style={{ color: "#555" }}>
          {restaurantName || restaurantSlug}
        </Link>
        {" › "}
        <span>{name}</span>
      </nav>

      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.25rem" }}>{name}</h1>
        {price && (
          <p style={{ fontSize: "1.1rem", color: "#444", margin: "0 0 0.5rem" }}>{price}</p>
        )}
        {description && (
          <p style={{ fontSize: "0.95rem", color: "#555", lineHeight: 1.5 }}>{description}</p>
        )}
      </div>

      {nutrition && (
        <div
          style={{
            background: "#f8f9fa",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem", color: "#333" }}>
            Nutrition
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
            {[
              { label: "Calories", value: nutrition.calories_kcal, unit: "" },
              { label: "Protein", value: nutrition.protein_g, unit: "g" },
              { label: "Fat", value: nutrition.fat_g, unit: "g" },
              { label: "Sodium", value: nutrition.sodium_mg, unit: "mg" },
            ].map(({ label, value, unit }) =>
              value != null ? (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                    {Math.round(value)}{unit}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#888" }}>{label}</div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {item._menuItemId && (
        <div style={{ marginBottom: "1rem" }}>
          <Link
            to={`/restaurants/${restaurantSlug}/menu-items/${item._menuItemId}`}
            style={{ fontSize: "0.85rem", color: "#1a56db" }}
          >
            See similar items and full details →
          </Link>
        </div>
      )}

      <Link to={menuUrl} style={{ fontSize: "0.85rem", color: "#888" }}>
        ← Back to menu
      </Link>
    </div>
  );
}
