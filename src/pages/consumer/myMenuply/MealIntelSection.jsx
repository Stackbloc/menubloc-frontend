/**
 * Phase 7 — Meal Intel on My Menuply (intent-scoped; not public Deals).
 * Waiter briefing merge is intentionally not wired (Waiter zero-touch).
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMealIntel } from "../../../lib/consumerApi.js";
import { SectionHead } from "./myMenuplyBits.jsx";
import SectionEmptyState from "./SectionEmptyState.jsx";
import * as s from "./myMenuplyStyles.js";

export default function MealIntelSection({ hidden = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hidden) return undefined;
    let cancelled = false;
    setLoading(true);

    listMealIntel({ limit: 8 })
      .then((payload) => {
        if (cancelled) return;
        setData(payload || null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hidden]);

  if (hidden) return null;

  const intents = Array.isArray(data?.intents) ? data.intents : [];
  const dishes = Array.isArray(data?.dishes) ? data.dishes : [];
  const offers = Array.isArray(data?.intent_based_offers) ? data.intent_based_offers : [];
  const restaurantIntel = Array.isArray(data?.restaurant_meal_intel)
    ? data.restaurant_meal_intel
    : [];
  const hasContent = dishes.length > 0 || offers.length > 0 || restaurantIntel.length > 0;

  return (
    <section style={s.section} data-testid="meal-intel">
      <div style={s.presentationBlock}>
        <SectionHead
          kicker="Intent"
          title="Meal Intel"
          to="/waiter"
          subtitle="Picks from your food intent — not public Deals"
        />

        {loading ? (
          <p style={{ ...s.muted, fontSize: 13 }} data-testid="meal-intel-loading">
            Loading Meal Intel…
          </p>
        ) : null}

        {!loading && intents.length === 0 ? (
          <SectionEmptyState testId="meal-intel-no-intent">
            {data?.headline ||
              "Save What I Wanna Eat or What I’m Eating to unlock Meal Intel."}
          </SectionEmptyState>
        ) : null}

        {!loading && intents.length > 0 && !hasContent ? (
          <SectionEmptyState testId="meal-intel-empty">
            {data?.note || "No nearby Meal Intel for your intent yet."}
          </SectionEmptyState>
        ) : null}

        {!loading && intents.length > 0 ? (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}
            data-testid="meal-intel-intents"
          >
            {intents.map((intent) => (
              <span
                key={`${intent.source}-${intent.food_interest_key || intent.food_name}`}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f1720",
                  background: "#f8fafc",
                  border: "1px solid #e4e9f0",
                  borderRadius: 999,
                  padding: "6px 10px",
                }}
              >
                {intent.label || intent.food_name}
              </span>
            ))}
          </div>
        ) : null}

        {!loading && restaurantIntel.length > 0 ? (
          <ul
            style={{ listStyle: "none", margin: "0 0 12px", padding: 0, display: 10 }}
            data-testid="meal-intel-restaurant"
          >
            {restaurantIntel.map((row) => (
              <li key={row.id}>
                <Link
                  to={row.link || `/restaurants/${row.restaurant_id}`}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    border: "1px solid #e4e9f0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#0f1720" }}>
                    {row.icon ? `${row.icon} ` : null}
                    {row.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
                    {[row.restaurant_name, row.detail].filter(Boolean).join(" · ")}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && dishes.length > 0 ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: 10 }} data-testid="meal-intel-dishes">
            {dishes.map((dish) => (
              <li key={dish.menu_item_id}>
                <Link
                  to={dish.link || `/menu-items/${dish.menu_item_id}`}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    border: "1px solid #e4e9f0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#0f1720" }}>
                    {dish.icon ? `${dish.icon} ` : null}
                    {dish.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
                    {[dish.restaurant_name, dish.city && dish.state ? `${dish.city}, ${dish.state}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                    {dish.intent_based_offers_enabled ? " · Intent-Based Offers" : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && offers.length > 0 ? (
          <div style={{ marginTop: dishes.length ? 14 : 0 }} data-testid="meal-intel-ibo">
            <div style={{ fontSize: 12, fontWeight: 800, color: "#667085", marginBottom: 8 }}>
              Nearby Intent-Based Offers
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: 8 }}>
              {offers.slice(0, 4).map((row) => (
                <li key={row.restaurant_id}>
                  <Link
                    to={row.link || `/restaurants/${row.restaurant_id}`}
                    style={{
                      display: "block",
                      textDecoration: "none",
                      color: "#344054",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {row.restaurant_name}
                    <span style={{ fontWeight: 500, color: "#98a2b3" }}> — not a public Deal</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!loading && (intents.length > 0 || hasContent) ? (
          <p style={{ ...s.muted, fontSize: 12, marginTop: 12 }} data-testid="meal-intel-note">
            {data?.note || "Intent-scoped information. Public offers stay on Deals."}{" "}
            <Link to="/waiter" style={{ color: "#0f1720", fontWeight: 700 }}>
              Open Waiter
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
