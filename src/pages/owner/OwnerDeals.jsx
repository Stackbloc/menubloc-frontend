import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import CkRestaurantMenuPicker from "../../components/ck/CkRestaurantMenuPicker.jsx";
import OwnerRestaurantDealsPanel from "./OwnerRestaurantDealsPanel.jsx";
import OwnerDealsOverview from "./OwnerDealsOverview.jsx";

/**
 * Restaurant Manager → Deals (2026-10-24, Andre): enter structured deals for a specific
 * restaurant and attach deal videos, without the restaurant's Operator subscription.
 * ?restaurant=<id> opens one restaurant directly (also reachable as a section of
 * /owner/restaurant-manager).
 *
 * Updated 2026-11-18 (Andre): the default view is now the Overview — status of every deal plus
 * deal analytics, with search (?q=, ?status=). "Manage by restaurant" (?view=manage, or any
 * ?restaurant=) is the previous picker + deal editor, unchanged.
 */
const VIEWS = [
  { key: "overview", label: "Overview" },
  { key: "manage", label: "Manage by restaurant" },
];

export default function OwnerDeals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramId = Number(searchParams.get("restaurant")) || null;
  const view = paramId || searchParams.get("view") === "manage" ? "manage" : "overview";
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";
  const [restaurant, setRestaurant] = useState(() =>
    paramId ? { restaurant_id: paramId, restaurant_name: "" } : null
  );

  function updateParams(mutate) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        mutate(params);
        return params;
      },
      { replace: true }
    );
  }

  function setView(next) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === "manage") {
        params.set("view", "manage");
        if (restaurant?.restaurant_id) params.set("restaurant", String(restaurant.restaurant_id));
      } else {
        params.delete("view");
        params.delete("restaurant");
      }
      return params;
    });
  }

  function chooseRestaurant(next) {
    setRestaurant(next);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("view", "manage");
      if (next?.restaurant_id) params.set("restaurant", String(next.restaurant_id));
      else params.delete("restaurant");
      return params;
    });
  }

  const rid = view === "manage" ? restaurant?.restaurant_id || null : null;

  return (
    <OwnerLayout title="Deals">
      <nav aria-label="Deals views" style={{ display: "flex", gap: 22, marginBottom: 16, borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
        {VIEWS.map((v) => {
          const on = view === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              aria-current={on ? "page" : undefined}
              data-testid={`owner-deals-view-${v.key}`}
              style={{
                background: "none",
                border: "none",
                borderBottom: `2px solid ${on ? OWNER_COLORS.ink : "transparent"}`,
                padding: "8px 0",
                marginBottom: -1,
                font: "inherit",
                fontSize: 14,
                fontWeight: 700,
                color: on ? OWNER_COLORS.ink : OWNER_COLORS.muted,
                cursor: "pointer",
              }}
            >
              {v.label}
            </button>
          );
        })}
      </nav>

      {view === "overview" ? (
        <OwnerDealsOverview
          q={q}
          onQueryChange={(next) => updateParams((p) => (next ? p.set("q", next) : p.delete("q")))}
          status={status}
          onStatusChange={(next) => updateParams((p) => (next && next !== "all" ? p.set("status", next) : p.delete("status")))}
          onManageRestaurant={chooseRestaurant}
        />
      ) : (
        <>
          <PageCard style={{ padding: 18, marginBottom: 16 }}>
            <SectionTitle
              title="Restaurant"
              subtitle="Pick a restaurant, then add its deals: terms, menu items, dates, meal time, and an optional deal video."
              action={
                rid ? (
                  <Link
                    to={`/owner/restaurant-manager?restaurant=${rid}&section=details`}
                    style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}
                  >
                    Open in Profiles & Menus →
                  </Link>
                ) : null
              }
            />
            <div style={{ maxWidth: 560 }}>
              <CkRestaurantMenuPicker
                restaurant={restaurant}
                onRestaurantChange={chooseRestaurant}
                dish={null}
                onDishChange={() => {}}
                allowMenuItem={false}
                restaurantRequired
                testIdPrefix="owner-deals-restaurant"
              />
            </div>
          </PageCard>

          {rid ? (
            <OwnerRestaurantDealsPanel
              key={rid}
              restaurantId={rid}
              restaurantName={restaurant?.restaurant_name || ""}
              onRestaurantLoaded={(row) => {
                if (!restaurant?.restaurant_name && row?.restaurant_name) {
                  setRestaurant((prev) =>
                    prev && Number(prev.restaurant_id) === Number(row.id)
                      ? { ...prev, restaurant_name: row.restaurant_name }
                      : prev
                  );
                }
              }}
            />
          ) : null}
        </>
      )}
    </OwnerLayout>
  );
}
