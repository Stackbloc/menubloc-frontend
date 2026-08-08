import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import { getDistributorRestaurant } from "../../lib/distributorApi.js";

/**
 * Distributor view of a restaurant — public business identity only.
 * No Connect / Message CTAs in V1. Reported distributors only when server-gated visible.
 */
export default function DistributorRestaurantProfile() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDistributorRestaurant(restaurantId)
      .then((data) => {
        if (!cancelled) setRestaurant(data.restaurant);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load restaurant");
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const reportedVisible = restaurant?.reported_usage_visible === true;
  const reported = Array.isArray(restaurant?.reported_distributors)
    ? restaurant.reported_distributors
    : [];
  const publicProfilePath =
    restaurant?.public_profile_path ||
    (restaurant?.slug
      ? `/restaurants/${restaurant.slug}`
      : restaurant
        ? `/restaurants/${restaurant.id}`
        : null);

  return (
    <DistributorLayout title="Restaurant">
      <PageCard>
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
        {!restaurant && !error ? <div>Loading…</div> : null}
        {restaurant ? (
          <>
            <SectionTitle
              title={restaurant.restaurant_name}
              subtitle={[
                restaurant.menuply_public_id,
                [restaurant.city, restaurant.state].filter(Boolean).join(", "),
              ]
                .filter(Boolean)
                .join(" · ")}
              action={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {publicProfilePath ? (
                    <a
                      href={publicProfilePath}
                      target="_blank"
                      rel="noreferrer"
                      style={secondaryBtn}
                    >
                      View Restaurant
                    </a>
                  ) : null}
                  {restaurant.public_menu_path ? (
                    <a
                      href={restaurant.public_menu_path}
                      target="_blank"
                      rel="noreferrer"
                      style={primaryBtn}
                    >
                      View Menu
                    </a>
                  ) : null}
                </div>
              }
            />
            <dl style={{ display: "grid", gap: 10, margin: 0 }}>
              <Row label="Menuply Restaurant ID" value={restaurant.menuply_public_id || "—"} />
              <Row
                label="Location"
                value={
                  [restaurant.city, restaurant.state, restaurant.postal_code]
                    .filter(Boolean)
                    .join(", ") || "—"
                }
              />
              <Row label="Restaurant type" value={restaurant.restaurant_type || "—"} />
              <Row label="Category" value={restaurant.category || restaurant.cuisine_type || "—"} />
              <Row label="Website" value={restaurant.website || "—"} />
            </dl>

            {reportedVisible ? (
              <div style={{ marginTop: 24 }}>
                <h3
                  style={{
                    margin: "0 0 10px",
                    fontSize: 14,
                    fontWeight: 800,
                    color: DIST_COLORS.ink,
                  }}
                >
                  Reported distributors
                </h3>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: DIST_COLORS.muted }}>
                  Distributors this restaurant explicitly reported during Menuply onboarding.
                </p>
                {reported.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {reported.map((d) => (
                      <li key={d.slug || d.id || d.display_name} style={{ fontWeight: 600 }}>
                        {d.display_name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color: DIST_COLORS.muted, fontSize: 13 }}>
                    No distributors reported for this restaurant.
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ marginTop: 24 }}>
              <Link to="/distributor/restaurants" style={{ color: DIST_COLORS.accent, fontWeight: 700 }}>
                ← Back to restaurants
              </Link>
            </div>
          </>
        ) : null}
      </PageCard>
    </DistributorLayout>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <dt style={{ fontSize: 11, color: DIST_COLORS.muted, fontWeight: 700 }}>{label}</dt>
      <dd style={{ margin: "4px 0 0", fontWeight: 600 }}>{value}</dd>
    </div>
  );
}

const primaryBtn = {
  display: "inline-block",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  background: DIST_COLORS.accent,
  color: "#fff",
  fontWeight: 700,
  textDecoration: "none",
  fontFamily: "inherit",
  fontSize: 13,
};

const secondaryBtn = {
  ...primaryBtn,
  background: "#fff",
  color: DIST_COLORS.ink,
  border: `1px solid ${DIST_COLORS.line}`,
};
