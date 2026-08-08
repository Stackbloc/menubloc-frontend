import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import { useDistributor } from "../../context/DistributorContext.jsx";
import { getDistributorDashboard } from "../../lib/distributorApi.js";

function EntryCard({ to, title, body }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        padding: 18,
        borderRadius: 14,
        border: `1px solid ${DIST_COLORS.line}`,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: DIST_COLORS.ink }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: DIST_COLORS.muted, lineHeight: 1.45 }}>
        {body}
      </div>
    </Link>
  );
}

export default function DistributorDashboard() {
  const { distributor } = useDistributor();
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDistributorDashboard()
      .then((data) => {
        if (!cancelled) setCounts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load workspace");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const name = distributor?.display_name || "Distributor";
  const reportedVisible = counts?.reported_usage_visible === true;
  const reportedCount =
    reportedVisible && typeof counts?.reported_count === "number"
      ? counts.reported_count
      : null;

  return (
    <DistributorLayout title="Home">
      <PageCard>
        <SectionTitle
          title={`${name} on Menuply`}
          subtitle="Explore Menuply restaurant profiles and menus. Manage your public company profile."
        />
        {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}

        {reportedVisible && reportedCount != null ? (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              borderRadius: 12,
              background: "#f8faf8",
              border: `1px solid ${DIST_COLORS.line}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: DIST_COLORS.muted }}>
              Menuply restaurant network
            </div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: DIST_COLORS.ink }}>
              {reportedCount} Menuply restaurants report {name}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: DIST_COLORS.muted }}>
              Based on restaurants that explicitly selected {name} during Menuply onboarding — not a
              verified customer count.
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <EntryCard
            to="/distributor/profile"
            title="Your Profile"
            body="Manage your public company profile on Menuply."
          />
          <EntryCard
            to="/distributor/restaurants"
            title="Restaurants"
            body="Search and explore restaurants on Menuply — profiles, menus, and location."
          />
        </div>
      </PageCard>
    </DistributorLayout>
  );
}
