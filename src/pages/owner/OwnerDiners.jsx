import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { SimpleTable } from "./intelligence/intelligenceShared.jsx";
import {
  getOwnerDinerAccounts,
  getOwnerDinerCapabilityStats,
} from "../../lib/ownerApi.js";
import {
  DINER_INTERVAL_LABELS,
  DINER_INTERVAL_OPTIONS,
  dinerProfilePath,
  displayDinerMetric,
} from "./diners/dinerMetricDisplay.js";

/**
 * /owner/diners. Diner Intelligence Stage 1 (plan 39, Andre 2026-11-12):
 *  - each card shows its status: a count, "Unavailable" (read failed) or "Not tracked". A failure is never 0.
 *  - Los Angeles days; staff accounts and seeded test diners are left out everywhere.
 *  - the roster is searched and paged on the server; a row opens /owner/diners/:id.
 */

const METRIC_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const TONE_COLOR = {
  count: OWNER_COLORS.ink,
  zero: OWNER_COLORS.ink,
  unavailable: "#9f1239",
  not_tracked: OWNER_COLORS.muted,
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

function DinerMetricCard({ metric, loading = false }) {
  const shown = loading ? { value: "—", subtitle: null, tone: "count" } : displayDinerMetric(metric);
  const small = shown.tone === "unavailable" || shown.tone === "not_tracked";
  return (
    <div data-testid={`diner-metric-${metric?.key || "loading"}`} data-status={metric?.status || "loading"}>
      <PageCard style={{ padding: 18, height: "100%", boxSizing: "border-box" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>{loading ? "Loading…" : metric.label}</div>
        <div
          style={{
            fontSize: small ? 18 : 28,
            fontWeight: 800,
            marginTop: small ? 14 : 10,
            color: TONE_COLOR[shown.tone] || OWNER_COLORS.ink,
          }}
        >
          {shown.value}
        </div>
        {shown.subtitle ? (
          <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.4 }}>{shown.subtitle}</div>
        ) : null}
      </PageCard>
    </div>
  );
}

function CountCard({ label, value }) {
  return (
    <PageCard style={{ padding: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10, color: value == null ? OWNER_COLORS.muted : OWNER_COLORS.ink }}>
        {value == null ? "—" : Number(value).toLocaleString("en-US")}
      </div>
    </PageCard>
  );
}

function PagerButton({ disabled, onClick, children, testId }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${OWNER_COLORS.line}`,
        background: "#fff",
        color: disabled ? OWNER_COLORS.muted : OWNER_COLORS.ink,
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function OwnerDiners() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedInterval = searchParams.get("interval");
  const interval = DINER_INTERVAL_LABELS[requestedInterval] ? requestedInterval : "today";

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  const [roster, setRoster] = useState(null);
  const [rosterError, setRosterError] = useState("");
  const [rosterLoading, setRosterLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setStatsError("");
    getOwnerDinerCapabilityStats({ interval })
      .then((payload) => {
        if (!cancelled) setStats(payload);
      })
      .catch(() => {
        if (!cancelled) setStatsError("Diner activity numbers couldn't be loaded just now.");
      });
    return () => {
      cancelled = true;
    };
  }, [interval]);

  // Debounce typing, then search on the server from page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(queryText.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [queryText]);

  useEffect(() => {
    let cancelled = false;
    setRosterLoading(true);
    setRosterError("");
    getOwnerDinerAccounts({ page, page_size: PAGE_SIZE, q: query || undefined })
      .then((payload) => {
        if (!cancelled) setRoster(payload);
      })
      .catch(() => {
        if (!cancelled) setRosterError("Diner accounts couldn't be loaded just now.");
      })
      .finally(() => {
        if (!cancelled) setRosterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, query]);

  const changeInterval = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === "today") params.delete("interval");
    else params.set("interval", next);
    setSearchParams(params, { replace: true });
  };

  const counts = roster?.counts || null;
  const rows = Array.isArray(roster?.rows) ? roster.rows : [];
  const matched = roster?.paging?.matched ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(matched / PAGE_SIZE));
  const firstShown = matched ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastShown = Math.min(matched, (page - 1) * PAGE_SIZE + rows.length);
  const openDiner = (row) => row?.id && navigate(dinerProfilePath(row.id, interval));

  return (
    <OwnerLayout title="Diner accounts">
      <SectionTitle
        title="All diner accounts"
        subtitle="Lifetime diner accounts, with what they did in the selected window. Days are Los Angeles days. Platform staff accounts and seeded test diners are left out of every number. Referral source is Direct, QR code, or Website referral when captured at signup."
      />

      <PageCard style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>Activity window</span>
          {DINER_INTERVAL_OPTIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              data-testid={`diner-stats-interval-${key}`}
              aria-pressed={interval === key}
              onClick={() => changeInterval(key)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                // Selected chip = dark fill + white text; never a green pill (Andre 2026-11-06).
                border: `1px solid ${interval === key ? OWNER_COLORS.ink : OWNER_COLORS.line}`,
                background: interval === key ? OWNER_COLORS.ink : "#fff",
                color: interval === key ? "#fff" : OWNER_COLORS.ink,
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
            {stats.from} through {stats.to} (Los Angeles days)
          </div>
        ) : null}
        {statsError ? <div style={{ marginTop: 12, color: "#9f1239", fontSize: 13 }}>{statsError}</div> : null}
        {stats?.notes?.length ? (
          <div style={{ marginTop: 12, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
            {stats.notes.join(" ")}
          </div>
        ) : null}
        <div style={{ ...METRIC_GRID, marginTop: 16 }} data-testid="diner-capability-metrics">
          {(stats?.metrics || []).map((metric) => (
            <DinerMetricCard key={metric.key} metric={metric} />
          ))}
          {!stats && !statsError
            ? Array.from({ length: 6 }).map((_, idx) => <DinerMetricCard key={`loading-${idx}`} loading />)
            : null}
        </div>
      </PageCard>

      <div style={METRIC_GRID}>
        <CountCard label="Total diners" value={counts?.total} />
        <CountCard label="Active" value={counts?.active} />
        <CountCard label="Pending phone verification" value={counts?.pending_phone_verification} />
        <CountCard label="Closed" value={counts?.closed} />
      </div>

      <PageCard style={{ padding: 18, marginTop: 18 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>
          Search by email, name, market, or status
          <input
            type="search"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Email, name, market, or status"
            data-testid="diner-accounts-filter"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 420,
              boxSizing: "border-box",
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${OWNER_COLORS.line}`,
              fontSize: 14,
            }}
          />
        </label>
        <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>
          Click a diner to open their profile.
        </div>
        {rosterError ? <div style={{ marginTop: 12, color: "#9f1239", fontSize: 13 }}>{rosterError}</div> : null}
        <div style={{ marginTop: 16, opacity: rosterLoading && roster ? 0.6 : 1 }} data-testid="diner-accounts-table">
          <SimpleTable
            rows={rows}
            columns={[
              [
                "Name",
                "name",
                (row) => (
                  <Link
                    to={dinerProfilePath(row.id, interval)}
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`diner-row-link-${row.id}`}
                    style={{ color: OWNER_COLORS.ink, fontWeight: 700, textDecoration: "none" }}
                  >
                    {row.name || "—"}
                  </Link>
                ),
              ],
              ["Email", "email", (row) => row.email || "—"],
              ["Account opened", "opened_at", (row) => formatDateTime(row.opened_at)],
              ["Referral source", "referral_source_label", (row) => row.referral_source_label || "Direct"],
              ["Account closed", "closed_at", (row) => formatDateTime(row.closed_at)],
              ["Geographic market", "geographic_market", (row) => row.geographic_market || "—"],
              ["Status", "status", (row) => row.status || "—"],
            ]}
            emptyLabel={
              rosterLoading && !roster
                ? "Loading diner accounts…"
                : query
                  ? "No diner accounts match this search."
                  : "No diner accounts yet."
            }
            onRowClick={openDiner}
          />
        </div>
        {roster && matched > 0 ? (
          <div
            style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}
            data-testid="diner-accounts-pager"
          >
            <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
              {firstShown}–{lastShown} of {matched.toLocaleString("en-US")}
              {query && counts?.total != null ? ` matching (${counts.total.toLocaleString("en-US")} total)` : ""}
            </span>
            <PagerButton testId="diner-accounts-prev" disabled={page <= 1 || rosterLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </PagerButton>
            <PagerButton
              testId="diner-accounts-next"
              disabled={page >= pageCount || rosterLoading}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next
            </PagerButton>
          </div>
        ) : null}
      </PageCard>
    </OwnerLayout>
  );
}
