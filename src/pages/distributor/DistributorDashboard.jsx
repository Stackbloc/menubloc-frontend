import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DistributorLayout, { DIST_COLORS, PageCard, SectionTitle } from "./DistributorLayout.jsx";
import { useDistributor } from "../../context/DistributorContext.jsx";
import { getDistributorDashboard } from "../../lib/distributorApi.js";

function StatLink({ to, label, value }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        padding: 16,
        borderRadius: 14,
        border: `1px solid ${DIST_COLORS.line}`,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 12, color: DIST_COLORS.muted, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: DIST_COLORS.ink }}>
        {value}
      </div>
    </Link>
  );
}

export default function DistributorDashboard() {
  const { distributor, operator } = useDistributor();
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDistributorDashboard()
      .then((data) => {
        if (!cancelled) setCounts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load dashboard");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DistributorLayout title="Dashboard">
      <PageCard>
        <SectionTitle
          title={distributor?.display_name || "Distributor"}
          subtitle={`${operator?.email || ""} · Network overview`}
        />
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          <StatLink to="/distributor/connected" label="Connected" value={counts?.connected_count ?? "—"} />
          <StatLink to="/distributor/pending" label="Pending" value={counts?.pending_count ?? "—"} />
          <StatLink to="/distributor/reported" label="Reported" value={counts?.reported_count ?? "—"} />
          <StatLink
            to="/distributor/messages"
            label="Unread messages"
            value={counts?.unread_message_count ?? "—"}
          />
        </div>
        <div style={{ marginTop: 20 }}>
          <Link
            to="/distributor/search"
            style={{
              display: "inline-block",
              background: DIST_COLORS.accent,
              color: "#fff",
              fontWeight: 700,
              padding: "10px 16px",
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            Search restaurants
          </Link>
        </div>
      </PageCard>
    </DistributorLayout>
  );
}
