import React, { useEffect, useMemo, useState } from "react";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { MetricCard, SimpleTable } from "./intelligence/intelligenceShared.jsx";
import {
  getOwnerDinerAccounts,
  getOwnerDinerCapabilityStats,
} from "../../lib/ownerApi.js";
import OwnerDinerHubDialog from "./OwnerDinerHubDialog.jsx";

const METRIC_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const INTERVAL_OPTIONS = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "Week"],
  ["30d", "Month"],
  ["365d", "Year"],
];

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

function formatMetricCount(metric) {
  if (metric?.is_average) {
    return Number(metric.count || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return Number(metric?.count || 0).toLocaleString();
}

function metricSubtitle(metric) {
  if (metric?.is_average) {
    const parts = [];
    if (metric.accepted_connects_total != null) {
      parts.push(`${metric.accepted_connects_total} accepted total`);
    }
    if (metric.active_diners != null) {
      parts.push(`${metric.active_diners} active diners`);
    }
    return parts.join(" · ") || null;
  }
  if (metric?.unique_diners != null) {
    return `${metric.unique_diners} unique diners`;
  }
  return null;
}

export default function OwnerDiners() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [query, setQuery] = useState("");
  const [interval, setInterval] = useState("today");
  const [selectedDinerId, setSelectedDinerId] = useState(null);

  useEffect(() => {
    getOwnerDinerAccounts({ limit: 2000 })
      .then(setData)
      .catch(() => setError("Diner accounts are temporarily unavailable."));
  }, []);

  useEffect(() => {
    setStatsError("");
    getOwnerDinerCapabilityStats({ interval })
      .then(setStats)
      .catch(() => setStatsError("Diner capability stats are temporarily unavailable."));
  }, [interval]);

  const counts = data?.counts || { total: 0, active: 0, pending_phone_verification: 0, closed: 0 };
  const rows = useMemo(() => {
    const list = Array.isArray(data?.rows) ? data.rows : [];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((row) => {
      const hay = [row.name, row.email, row.geographic_market, row.referral_source_label, row.status]
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
        subtitle="Lifetime consumer accounts with capability activity for the selected window. Referral source is Direct, QR code, or Website referral when captured at signup. Personal diner QR scans are not logged — QR connects and codes created are reported instead. Platform staff accounts excluded (ids 2, 3, 4, 29)."
      />

      {error ? (
        <PageCard style={{ padding: 18, color: "#9f1239" }}>{error}</PageCard>
      ) : null}

      <PageCard style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>Activity window</span>
          {INTERVAL_OPTIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              data-testid={`diner-stats-interval-${key}`}
              onClick={() => setInterval(key)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: `1px solid ${interval === key ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                background: interval === key ? OWNER_COLORS.accentSoft || "#eef6f1" : "#fff",
                color: interval === key ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {stats?.from && stats?.to ? (
          <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>
            {stats.from} through {stats.to}
          </div>
        ) : null}
        {statsError ? (
          <div style={{ marginTop: 12, color: "#9f1239", fontSize: 13 }}>{statsError}</div>
        ) : null}
        {stats?.notes?.length ? (
          <div style={{ marginTop: 12, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
            {stats.notes.join(" ")}
          </div>
        ) : null}
        <div style={{ ...METRIC_GRID, marginTop: 16 }} data-testid="diner-capability-metrics">
          {(stats?.metrics || []).map((metric) => (
            <MetricCard
              key={metric.key}
              label={metric.label}
              value={stats ? formatMetricCount(metric) : "—"}
              subtitle={metricSubtitle(metric)}
            />
          ))}
          {!stats && !statsError
            ? Array.from({ length: 6 }).map((_, idx) => (
                <MetricCard key={`loading-${idx}`} label="Loading…" value="—" />
              ))
            : null}
        </div>
      </PageCard>

      <div style={METRIC_GRID}>
        <MetricCard label="Total diners" value={counts.total} />
        <MetricCard label="Active" value={counts.active} />
        <MetricCard label="Pending phone verification" value={counts.pending_phone_verification} />
        <MetricCard label="Closed" value={counts.closed} />
      </div>

      <PageCard style={{ padding: 18, marginTop: 18 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>
          Filter by email, name, market, or status
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email, name, market, referral source, or status"
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
        <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>
          Click a diner row to open a read-only My Menuply snapshot.
        </div>
        <div style={{ marginTop: 16 }} data-testid="diner-accounts-table">
          <SimpleTable
            rows={rows}
            columns={[
              ["Name", "name", (row) => row.name || "—"],
              ["Email", "email", (row) => row.email || "—"],
              ["Account opened", "opened_at", (row) => formatDateTime(row.opened_at)],
              ["Referral source", "referral_source_label", (row) => row.referral_source_label || "Direct"],
              ["Account closed", "closed_at", (row) => formatDateTime(row.closed_at)],
              ["Geographic market", "geographic_market", (row) => row.geographic_market || "—"],
              ["Status", "status", (row) => row.status || "—"],
            ]}
            emptyLabel={data ? "No diner accounts match this filter." : "Loading diner accounts…"}
            onRowClick={(row) => row?.id && setSelectedDinerId(row.id)}
          />
        </div>
        {data?.rows?.length ? (
          <div style={{ marginTop: 12, fontSize: 12, color: OWNER_COLORS.muted }}>
            Showing {rows.length} of {data.rows.length} listed accounts
            {counts.total > data.rows.length ? ` (${counts.total} total)` : ""}.
          </div>
        ) : null}
      </PageCard>

      {selectedDinerId ? (
        <OwnerDinerHubDialog
          dinerId={selectedDinerId}
          interval={interval}
          onClose={() => setSelectedDinerId(null)}
        />
      ) : null}
    </OwnerLayout>
  );
}
