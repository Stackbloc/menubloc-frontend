import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import {
  getDistributorRestaurant,
  requestRestaurantConnection,
} from "../../lib/distributorApi.js";

export default function DistributorRestaurantProfile() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

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

  async function requestConnect() {
    setMsg("");
    try {
      await requestRestaurantConnection(restaurantId);
      setMsg("Connection request sent.");
      const data = await getDistributorRestaurant(restaurantId);
      setRestaurant(data.restaurant);
    } catch (err) {
      setMsg(err.message || "Request failed");
    }
  }

  const status = restaurant?.relationship?.status;
  const canRequest =
    !status || ["reported", "declined", "disconnected"].includes(status);

  return (
    <DistributorLayout title="Restaurant profile">
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
                <div style={{ display: "flex", gap: 8 }}>
                  {restaurant.public_menu_path ? (
                    <a
                      href={restaurant.public_menu_path}
                      target="_blank"
                      rel="noreferrer"
                      style={secondaryBtn}
                    >
                      Public menu
                    </a>
                  ) : null}
                  {canRequest ? (
                    <button type="button" onClick={requestConnect} style={primaryBtn}>
                      Request connection
                    </button>
                  ) : null}
                  {status === "connected" ? (
                    <Link
                      to={`/distributor/messages/${restaurant.relationship.id}`}
                      style={primaryBtn}
                    >
                      Message
                    </Link>
                  ) : null}
                </div>
              }
            />
            {msg ? <div style={{ marginBottom: 12, color: DIST_COLORS.muted }}>{msg}</div> : null}
            <dl style={{ display: "grid", gap: 10, margin: 0 }}>
              <Row label="Relationship" value={status || "none"} />
              <Row label="Type" value={restaurant.restaurant_type || "—"} />
              <Row label="Category" value={restaurant.category || "—"} />
              <Row
                label="Contact"
                value={
                  restaurant.contact_visible
                    ? [restaurant.phone, restaurant.email, restaurant.address_line1]
                        .filter(Boolean)
                        .join(" · ") || "—"
                    : "Visible after connection"
                }
              />
              <Row label="Website" value={restaurant.website || "—"} />
            </dl>
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
  padding: "9px 12px",
  background: DIST_COLORS.accent,
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
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
