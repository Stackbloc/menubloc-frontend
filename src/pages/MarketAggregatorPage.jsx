import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { parseCityStateSlug } from "../lib/cityStateSlug";
import { restaurantMenuPathFromRow, restaurantPathFromRow } from "../lib/canonicalUrl.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const CANONICAL_BASE = "https://menuply.com";

export default function MarketAggregatorPage() {
  const { slugOrId } = useParams();
  const parsed = parseCityStateSlug(slugOrId);

  const [state, setState] = useState({ status: "loading", market: null, restaurants: [] });

  // Canonical URL
  useEffect(() => {
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = `${CANONICAL_BASE}/restaurants/${slugOrId}`;
  }, [slugOrId]);

  // Page title
  useEffect(() => {
    if (parsed) {
      document.title = `Restaurants in ${parsed.city}, ${parsed.state} — Menuply`;
    }
  }, [parsed]);

  useEffect(() => {
    if (!slugOrId) return;
    setState({ status: "loading", market: null, restaurants: [] });

    fetch(`${API}/public/market/${encodeURIComponent(slugOrId)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setState({ status: "ok", market: data.market, restaurants: data.restaurants });
        } else {
          setState({ status: "error", market: null, restaurants: [] });
        }
      })
      .catch(() => setState({ status: "error", market: null, restaurants: [] }));
  }, [slugOrId]);

  if (!parsed) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Invalid market URL.</p>
      </div>
    );
  }

  const { city, state: stateCode } = parsed;

  if (state.status === "loading") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading restaurants in {city}, {stateCode}…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Could not load restaurants for this market.</p>
      </div>
    );
  }

  const { market, restaurants } = state;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        Restaurants in {market.city}, {market.state}
      </h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        {market.restaurant_count} restaurant{market.restaurant_count !== 1 ? "s" : ""}
      </p>

      {restaurants.length === 0 ? (
        <p style={{ color: "#888" }}>No restaurants found in this market yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {restaurants.map((r) => (
            <li
              key={r.restaurant_id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "1rem 0",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>{r.restaurant_name}</span>
                  {r.cuisine && (
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#888" }}>
                      {r.cuisine}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  {restaurantPathFromRow(r) && (
                    <Link
                      to={restaurantPathFromRow(r)}
                      style={{ fontSize: "0.8rem", color: "#555", textDecoration: "underline" }}
                    >
                      Profile
                    </Link>
                  )}
                  {r.has_menu && restaurantMenuPathFromRow(r) && (
                    <Link
                      to={restaurantMenuPathFromRow(r)}
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#1a56db",
                        textDecoration: "none",
                        border: "1px solid #1a56db",
                        borderRadius: 4,
                        padding: "2px 8px",
                      }}
                    >
                      View Menu
                    </Link>
                  )}
                </div>
              </div>
              {r.address_line1 && (
                <span style={{ fontSize: "0.8rem", color: "#777" }}>{r.address_line1}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
