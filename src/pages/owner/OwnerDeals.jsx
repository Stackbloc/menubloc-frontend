import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import CkRestaurantMenuPicker from "../../components/ck/CkRestaurantMenuPicker.jsx";
import OwnerRestaurantDealsPanel from "./OwnerRestaurantDealsPanel.jsx";

/**
 * Restaurant Manager → Deals (2026-10-24, Andre): enter structured deals for a specific
 * restaurant and attach deal videos, without the restaurant's Operator subscription.
 * ?restaurant=<id> opens one restaurant directly (also reachable as a section of
 * /owner/restaurant-manager).
 */
export default function OwnerDeals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramId = Number(searchParams.get("restaurant")) || null;
  const [restaurant, setRestaurant] = useState(() =>
    paramId ? { restaurant_id: paramId, restaurant_name: "" } : null
  );

  function chooseRestaurant(next) {
    setRestaurant(next);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next?.restaurant_id) params.set("restaurant", String(next.restaurant_id));
      else params.delete("restaurant");
      return params;
    });
  }

  const rid = restaurant?.restaurant_id || null;

  return (
    <OwnerLayout
      title="Deals"
      subtitle="Pick a restaurant, then add its deals: terms, menu items, dates, meal time, and an optional deal video."
    >
      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title="Restaurant"
          action={
            rid ? (
              <Link
                to={`/owner/restaurant-manager?restaurant=${rid}&section=details`}
                style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}
              >
                Open in Restaurant Manager →
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
    </OwnerLayout>
  );
}
