import React from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle, EmptyState } from "../OwnerLayout.jsx";
import { PlatformIntelligenceProvider, usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";

export const INTELLIGENCE_TABS = [
  { to: "/owner/intelligence", label: "Overview", end: true },
  { to: "/owner/intelligence/search-demand", label: "Search Demand" },
  { to: "/owner/intelligence/site-activity", label: "Site Activity" },
  { to: "/owner/intelligence/geo", label: "Geo Intelligence" },
  { to: "/owner/intelligence/menu", label: "Menu Intelligence" },
  { to: "/owner/intelligence/restaurant", label: "Restaurant Intelligence" },
  { to: "/owner/intelligence/market", label: "Market Intelligence" },
  { to: "/owner/intelligence/revenue", label: "Revenue Intelligence" },
];

export function PlatformIntelligenceShell({ children }) {
  return (
    <PlatformIntelligenceProvider>
      <OwnerLayout title="Platform Intelligence" actions={<IntelligenceDateRange />}>
        <IntelligenceSubNav />
        {children}
      </OwnerLayout>
    </PlatformIntelligenceProvider>
  );
}

function IntelligenceSubNav() {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : "";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 22,
      }}
    >
      {INTELLIGENCE_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={`${tab.to}${suffix}`}
          end={tab.end}
          style={({ isActive }) => ({
            padding: "8px 14px",
            borderRadius: 999,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            color: isActive ? OWNER_COLORS.accent : OWNER_COLORS.ink,
            background: isActive ? OWNER_COLORS.accentSoft : "#fff",
            border: `1px solid ${isActive ? OWNER_COLORS.line : "#ead9ce"}`,
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

export function IntelligenceDateRange() {
  const { range, setRange, setPreset } = usePlatformIntelligenceRange();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {[
        ["today", "Today"],
        ["yesterday", "Yesterday"],
        ["7d", "Last 7 Days"],
        ["30d", "Last 30 Days"],
      ].map(([preset, label]) => (
        <button
          key={preset}
          type="button"
          onClick={() => setPreset(preset)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${range.preset === preset ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
            background: range.preset === preset ? OWNER_COLORS.accentSoft : "#fff",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
      <input
        type="date"
        value={range.start_date}
        onChange={(e) => setRange({ start_date: e.target.value, preset: "custom" })}
        style={inputStyle}
      />
      <input
        type="date"
        value={range.end_date}
        onChange={(e) => setRange({ end_date: e.target.value, preset: "custom" })}
        style={inputStyle}
      />
    </div>
  );
}

export function MetricCard({ label, value, subtitle = null }) {
  return (
    <PageCard style={{ padding: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10, color: OWNER_COLORS.ink }}>
        {formatMetricValue(value)}
      </div>
      {subtitle ? <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>{subtitle}</div> : null}
    </PageCard>
  );
}

export function formatMetricValue(value) {
  if (value === "not_tracked_yet") return "Not tracked yet";
  if (value === "insufficient_data") return "Insufficient data";
  if (value == null || value === "") return "0";
  return value;
}

export function SimpleTable({ rows, columns, emptyLabel = "No rows for this range." }) {
  if (!rows?.length) return <EmptyState>{emptyLabel}</EmptyState>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map(([label]) => (
              <th key={label} style={thStyle}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map(([label, key, formatter]) => (
                <td key={label} style={tdStyle}>
                  {formatter ? formatter(row) : formatCell(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value) {
  if (value === "not_tracked_yet") return "Not tracked yet";
  if (value === "insufficient_data") return "Insufficient data";
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

export function ErrorBanner({ message }) {
  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>
      {message}
    </div>
  );
}

export function LoadingState({ label = "Loading intelligence…" }) {
  return <div style={{ padding: 40, textAlign: "center", color: OWNER_COLORS.muted, fontSize: 14 }}>{label}</div>;
}

export function IntelligenceSection({ title, subtitle, children }) {
  return (
    <PageCard style={{ padding: 22 }}>
      <SectionTitle title={title} subtitle={subtitle} />
      {children}
    </PageCard>
  );
}

export function useIntelligenceData(fetcher, range) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetcher(range)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError("Platform Intelligence data is temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetcher, range.start_date, range.end_date, range.timezone]);

  return { data, error, loading };
}

const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1px solid #d7c5b8", background: "#fff" };
const thStyle = { textAlign: "left", padding: "0 0 12px", fontSize: 12, color: "#667085", whiteSpace: "nowrap" };
const tdStyle = { padding: "12px 8px 12px 0", borderTop: "1px solid #ead9ce", fontSize: 14, verticalAlign: "top" };

export function formatCents(cents) {
  const n = Number(cents) || 0;
  return `$${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
