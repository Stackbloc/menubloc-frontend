import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle, EmptyState } from "../OwnerLayout.jsx";
import { PlatformIntelligenceProvider, usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";
import { getOwnerIntelligenceSiteActivityCity } from "../../../lib/ownerApi.js";

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
  const { search } = useLocation();

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
          to={{ pathname: tab.to, search }}
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

export function AnalyticsScopeNote({ note }) {
  if (!note) return null;
  return (
    <PageCard style={{ padding: "14px 18px", background: "#faf7f4", border: `1px solid ${OWNER_COLORS.line}` }}>
      <div style={{ fontSize: 13, color: OWNER_COLORS.muted, lineHeight: 1.5 }}>{note}</div>
    </PageCard>
  );
}

export function SimpleTable({
  rows,
  columns,
  emptyLabel = "No rows for this range.",
  wrapKeys = [],
  maxHeight = null,
}) {
  if (!rows?.length) return <EmptyState>{emptyLabel}</EmptyState>;
  const wrapSet = new Set(wrapKeys);
  const hasWrap = wrapSet.size > 0;
  return (
    <div
      style={{
        overflowX: "auto",
        overflowY: maxHeight ? "auto" : "visible",
        maxWidth: "100%",
        minWidth: 0,
        maxHeight: maxHeight || undefined,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: hasWrap ? "fixed" : "auto" }}>
        <thead>
          <tr>
            {columns.map(([label, key]) => (
              <th
                key={label}
                style={
                  wrapSet.has(key)
                    ? thStyle
                    : hasWrap
                      ? { ...thMetricStyle }
                      : thStyle
                }
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map(([label, key, formatter]) => {
                const cell = formatter ? formatter(row) : formatCell(row[key]);
                const wraps = wrapSet.has(key);
                return (
                  <td
                    key={label}
                    style={
                      wraps
                        ? { ...tdStyle, ...tdWrapStyle }
                        : hasWrap
                          ? { ...tdStyle, ...tdMetricStyle }
                          : tdStyle
                    }
                    title={wraps && typeof cell === "string" ? cell : undefined}
                  >
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CityLinkButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        color: OWNER_COLORS.accent,
        fontWeight: selected ? 800 : 700,
        fontSize: 14,
        textAlign: "left",
        textDecoration: selected ? "underline" : "none",
      }}
    >
      {label}
    </button>
  );
}

/**
 * On-page city acquisition drill-down for Site Activity / Geo Visitors by City.
 */
export function CityVisitorInsightPanel({ locationLabel, range, onClose }) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!locationLabel) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);
    getOwnerIntelligenceSiteActivityCity({
      start_date: range.start_date,
      end_date: range.end_date,
      timezone: range.timezone,
      location_label: locationLabel,
    })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError("City insight is temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locationLabel, range.start_date, range.end_date, range.timezone]);

  return (
    <PageCard
      style={{
        padding: 22,
        minWidth: 0,
        borderColor: OWNER_COLORS.accent,
        background: "#fffaf6",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <SectionTitle
            title={`Visitors in ${locationLabel}`}
            subtitle="How these market-attributed visitor sessions arrived and what they searched or viewed."
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            flexShrink: 0,
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${OWNER_COLORS.line}`,
            background: "#fff",
            color: OWNER_COLORS.ink,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Close
        </button>
      </div>

      {loading ? <LoadingState label={`Loading insight for ${locationLabel}…`} /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!loading && !error && data ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.5 }}>
            {data.attribution_note ||
              "City is market attribution (page market or restaurant city), not IP geolocation."}
          </div>

          {!data.available ? (
            <EmptyState>No visitor sessions attributed to this city in the selected range.</EmptyState>
          ) : (
            <>
              <div
                className="owner-responsive-grid-2"
                style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 12 }}
              >
                <MetricCard label="Visitor sessions" value={data.summary?.visitors ?? 0} />
                <MetricCard label="Page views" value={data.summary?.page_views ?? 0} />
              </div>

              <div
                className="owner-responsive-grid-2"
                style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14, minWidth: 0 }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: OWNER_COLORS.ink }}>
                    How they arrived — referrals
                  </div>
                  <SimpleTable
                    rows={data.referrers || []}
                    columns={[
                      ["Source", "source"],
                      ["Entry sessions", "visits"],
                    ]}
                    wrapKeys={["source"]}
                    emptyLabel="No referral data for these sessions."
                    maxHeight={280}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: OWNER_COLORS.ink }}>
                    How they arrived — entry paths
                  </div>
                  <SimpleTable
                    rows={data.entry_paths || []}
                    columns={[
                      ["Path", "path"],
                      ["Sessions", "sessions"],
                    ]}
                    wrapKeys={["path"]}
                    emptyLabel="No entry paths for these sessions."
                    maxHeight={280}
                  />
                </div>
              </div>

              <div
                className="owner-responsive-grid-2"
                style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14, minWidth: 0 }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: OWNER_COLORS.ink }}>
                    Restaurant / brand searches
                  </div>
                  <SimpleTable
                    rows={data.brand_searches || []}
                    columns={[
                      ["Query", "query"],
                      ["Count", "count"],
                    ]}
                    wrapKeys={["query"]}
                    emptyLabel="No restaurant/brand searches linked to these sessions."
                    maxHeight={280}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: OWNER_COLORS.ink }}>
                    Other searches (same sessions)
                  </div>
                  <SimpleTable
                    rows={data.other_searches || []}
                    columns={[
                      ["Query", "query"],
                      ["Intent", "intent"],
                      ["Count", "count"],
                    ]}
                    wrapKeys={["query"]}
                    emptyLabel="No other searches linked to these sessions."
                    maxHeight={280}
                  />
                </div>
              </div>

              <div
                className="owner-responsive-grid-2"
                style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14, minWidth: 0 }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: OWNER_COLORS.ink }}>
                    Restaurants viewed
                  </div>
                  <SimpleTable
                    rows={data.restaurants_viewed || []}
                    columns={[
                      ["Restaurant", "restaurant_name"],
                      ["Views", "views"],
                      ["Sessions", "sessions"],
                    ]}
                    wrapKeys={["restaurant_name"]}
                    emptyLabel="No restaurant page views in these sessions."
                    maxHeight={280}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: OWNER_COLORS.ink }}>
                    Menu paths viewed
                  </div>
                  <SimpleTable
                    rows={data.menu_paths || []}
                    columns={[
                      ["Path", "path"],
                      ["Views", "visits"],
                      ["Sessions", "sessions"],
                    ]}
                    wrapKeys={["path"]}
                    emptyLabel="No menu paths in these sessions."
                    maxHeight={280}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </PageCard>
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

export function IntelligenceSection({ id, title, subtitle, children }) {
  return (
    <PageCard
      id={id}
      style={{
        padding: 22,
        minWidth: 0,
        // overflowX only — full overflow:hidden zeroes CSS grid auto min-height and
        // lets tall tables paint over sections below (entry/exit pages regression).
        overflowX: "hidden",
        overflowY: "visible",
      }}
    >
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
const thMetricStyle = {
  textAlign: "right",
  padding: "0 0 12px 12px",
  fontSize: 12,
  color: "#667085",
  whiteSpace: "nowrap",
  width: 88,
  minWidth: 72,
};
const tdStyle = { padding: "12px 8px 12px 0", borderTop: "1px solid #ead9ce", fontSize: 14, verticalAlign: "top" };
const tdMetricStyle = {
  textAlign: "right",
  padding: "12px 0 12px 12px",
  whiteSpace: "nowrap",
  width: 88,
  minWidth: 72,
  fontVariantNumeric: "tabular-nums",
};
const tdWrapStyle = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  whiteSpace: "normal",
  maxWidth: "100%",
};

export function formatCents(cents) {
  const n = Number(cents) || 0;
  return `$${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
