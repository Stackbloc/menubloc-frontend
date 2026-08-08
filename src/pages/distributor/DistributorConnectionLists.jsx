import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import {
  getConnectedRestaurants,
  getPendingRestaurants,
  getReportedRestaurants,
} from "../../lib/distributorApi.js";

function ListPage({ title, subtitle, loader, mode }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((data) => {
        if (cancelled) return;
        if (mode === "reported") setRows(data.restaurants || []);
        else setRows(data.relationships || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [loader, mode]);

  return (
    <DistributorLayout title={title}>
      <PageCard>
        <SectionTitle title={title} subtitle={subtitle} />
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((r) => {
            const restaurantId = r.restaurant_id || r.id;
            return (
              <Link
                key={r.relationship_id || r.id || restaurantId}
                to={`/distributor/restaurants/${restaurantId}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: `1px solid ${DIST_COLORS.line}`,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  {r.restaurant_name || `Restaurant #${restaurantId}`}
                </div>
                <div style={{ fontSize: 12, color: DIST_COLORS.muted, marginTop: 4 }}>
                  {r.menuply_public_id || "—"}
                  {r.city || r.state
                    ? ` · ${[r.city, r.state].filter(Boolean).join(", ")}`
                    : ""}
                  {r.status || r.relationship_status
                    ? ` · ${r.status || r.relationship_status}`
                    : ""}
                </div>
              </Link>
            );
          })}
          {!error && rows.length === 0 ? (
            <div style={{ color: DIST_COLORS.muted }}>No restaurants in this list yet.</div>
          ) : null}
        </div>
      </PageCard>
    </DistributorLayout>
  );
}

export function DistributorConnectedPage() {
  return (
    <ListPage
      title="Connected restaurants"
      subtitle="Restaurants that accepted your connection request."
      loader={getConnectedRestaurants}
      mode="connected"
    />
  );
}

export function DistributorPendingPage() {
  return (
    <ListPage
      title="Pending requests"
      subtitle="Waiting for the restaurant to accept or decline."
      loader={getPendingRestaurants}
      mode="pending"
    />
  );
}

export function DistributorReportedPage() {
  return (
    <ListPage
      title="Reported by restaurants"
      subtitle="Restaurants that listed your company as a distributor they use (usage report — not consent)."
      loader={getReportedRestaurants}
      mode="reported"
    />
  );
}
