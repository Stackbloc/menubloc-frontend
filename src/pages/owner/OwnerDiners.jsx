import React, { useEffect, useMemo, useState } from "react";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { MetricCard, SimpleTable } from "./intelligence/intelligenceShared.jsx";
import { getOwnerDinerAccounts } from "../../lib/ownerApi.js";

const METRIC_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OwnerDiners() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    getOwnerDinerAccounts({ limit: 2000 })
      .then(setData)
      .catch(() => setError("Diner accounts are temporarily unavailable."));
  }, []);

  const counts = data?.counts || { total: 0, active: 0, pending_phone_verification: 0, closed: 0 };
  const rows = useMemo(() => {
    const list = Array.isArray(data?.rows) ? data.rows : [];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((row) => {
      const hay = [row.name, row.email, row.geographic_market, row.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [data, query]);

  return (
    <OwnerLayout title="Diner accounts">
      <SectionTitle
        title="All diner accounts"
        subtitle="Lifetime consumer accounts (not restaurant Stripe subscribers). Opened/closed show date and time of day. Platform staff accounts currently excluded from counts and this list (ids 2, 3, 4, 29 only — not future name matches). Closed times appear only when status is closed, disabled, deleted, inactive, or cancelled."
      />

      {error ? (
        <PageCard style={{ padding: 18, color: "#9f1239" }}>{error}</PageCard>
      ) : null}

      <div style={METRIC_GRID}>
        <MetricCard label="Total diners" value={counts.total} />
        <MetricCard label="Active" value={counts.active} />
        <MetricCard label="Pending phone verification" value={counts.pending_phone_verification} />
        <MetricCard label="Closed" value={counts.closed} />
      </div>

      <PageCard style={{ padding: 18, marginTop: 18 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>
          Filter this list
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email, market, or status"
            data-testid="diner-accounts-filter"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 420,
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${OWNER_COLORS.line}`,
              fontSize: 14,
            }}
          />
        </label>
        <div style={{ marginTop: 16 }} data-testid="diner-accounts-table">
          <SimpleTable
            rows={rows}
            columns={[
              ["Name", "name", (row) => row.name || "—"],
              ["Email", "email", (row) => row.email || "—"],
              ["Account opened", "opened_at", (row) => formatDateTime(row.opened_at)],
              ["Account closed", "closed_at", (row) => formatDateTime(row.closed_at)],
              ["Geographic market", "geographic_market", (row) => row.geographic_market || "—"],
              ["Status", "status", (row) => row.status || "—"],
            ]}
            emptyLabel={data ? "No diner accounts match this filter." : "Loading diner accounts…"}
            wrapKeys={["name", "email", "geographic_market"]}
          />
        </div>
        {data?.rows?.length ? (
          <div style={{ marginTop: 12, fontSize: 12, color: OWNER_COLORS.muted }}>
            Showing {rows.length} of {data.rows.length} listed accounts
            {counts.total > data.rows.length ? ` (${counts.total} total)` : ""}.
          </div>
        ) : null}
      </PageCard>
    </OwnerLayout>
  );
}
