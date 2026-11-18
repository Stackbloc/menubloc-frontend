import React, { useCallback, useEffect, useMemo, useState } from "react";
import { OWNER_COLORS, PageCard, SectionTitle, EmptyState } from "./OwnerLayout.jsx";
import { getOwnerDealsOverview } from "../../lib/ownerApi.js";

/**
 * Owner → Deals default view (2026-11-18, Andre: "make this page show the status of all current
 * deals and any analytical data that relates to the deals — that should be the default view.
 * search capabilities are good as well").
 *
 * One read (GET /api/owner/deals/overview): every deal across all restaurants with its live status,
 * deal views / taps (engagement_events, bots + staff out) and deal clip metrics, for 7/30/90/365 days.
 * Status tiles filter the table; search matches title, restaurant, city, type and deal id.
 * Numbers are actions on Menuply, not purchases or redemptions.
 */

export const DEAL_STATUS = {
  live: { label: "Live", color: "#16A34A" },
  scheduled: { label: "Scheduled", color: "#2563EB" },
  paused: { label: "Paused", color: "#D97706" },
  draft: { label: "Draft", color: "#667085" },
  ended: { label: "Ended", color: "#9CA3AF" },
};
const STATUS_ORDER = ["live", "scheduled", "paused", "draft", "ended"];

const DEAL_TYPE_LABELS = {
  percent_off: "% off",
  amount_off: "$ off",
  fixed_price: "Special price",
  bogo: "Buy one, get one",
  bundle: "Combo",
  combo: "Combo",
  other: "General deal",
};

const WINDOWS = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
  { days: 365, label: "Last 12 months" },
];

const fmtInt = (v) => Number(v || 0).toLocaleString("en-US");
const fmtPct = (v) => (v == null ? "—" : `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`);

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtRelative(value) {
  if (!value) return "—";
  const ms = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ms)) return "—";
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : fmtDate(value);
}

function dealValueLabel(deal) {
  const type = deal.deal_type;
  if (type === "percent_off" && deal.discount_percent != null) return `${Number(deal.discount_percent)}% off`;
  if (type === "amount_off" && deal.discount_amount_cents != null) {
    return `$${(deal.discount_amount_cents / 100).toFixed(2).replace(/\.00$/, "")} off`;
  }
  if (type === "fixed_price" && deal.fixed_price_cents != null) {
    return `$${(deal.fixed_price_cents / 100).toFixed(2).replace(/\.00$/, "")}`;
  }
  return DEAL_TYPE_LABELS[type] || "Deal";
}

/** Search text for one deal (exported for the contract test). */
export function dealSearchText(deal) {
  return [
    deal.id,
    `#${deal.id}`,
    deal.title,
    deal.description,
    deal.restaurant_name,
    deal.city,
    deal.state,
    DEAL_TYPE_LABELS[deal.deal_type],
    DEAL_STATUS[deal.live_status]?.label,
    deal.schedule_label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterDeals(deals, { q = "", status = "all" } = {}) {
  const words = String(q).toLowerCase().split(/\s+/).filter(Boolean);
  return deals.filter((d) => {
    if (status === "ending_soon" ? !d.ending_soon : status !== "all" && d.live_status !== status) return false;
    if (!words.length) return true;
    const text = dealSearchText(d);
    return words.every((w) => text.includes(w));
  });
}

const SORTS = {
  status: (a, b) => STATUS_ORDER.indexOf(a.live_status) - STATUS_ORDER.indexOf(b.live_status),
  views: (a, b) => b.metrics.impressions - a.metrics.impressions,
  taps: (a, b) => b.metrics.taps - a.metrics.taps,
  tap_rate: (a, b) => (b.metrics.tap_rate ?? -1) - (a.metrics.tap_rate ?? -1),
  clip_views: (a, b) => b.clip.views - a.clip.views,
  ends: (a, b) => new Date(a.expires_at || 0) - new Date(b.expires_at || 0),
  restaurant: (a, b) => String(a.restaurant_name || "").localeCompare(String(b.restaurant_name || "")),
};

function sortDeals(deals, key) {
  const primary = SORTS[key] || SORTS.status;
  return [...deals].sort((a, b) => primary(a, b) || b.metrics.impressions - a.metrics.impressions || b.id - a.id);
}

function StatusLabel({ status }) {
  const s = DEAL_STATUS[status] || DEAL_STATUS.draft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, color: OWNER_COLORS.ink, whiteSpace: "nowrap" }}>
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 4, background: s.color, flex: "0 0 auto" }} />
      {s.label}
    </span>
  );
}

function Tile({ label, value, hint, onClick, selected, accent, testId }) {
  const clickable = typeof onClick === "function";
  const Tag = clickable ? "button" : "div";
  return (
    <Tag
      type={clickable ? "button" : undefined}
      onClick={onClick}
      aria-pressed={clickable ? Boolean(selected) : undefined}
      data-testid={testId}
      style={{
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        background: OWNER_COLORS.panel,
        border: `1px solid ${selected ? OWNER_COLORS.ink : OWNER_COLORS.line}`,
        borderRadius: 14,
        padding: "12px 14px",
        cursor: clickable ? "pointer" : "default",
        font: "inherit",
        color: OWNER_COLORS.ink,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>
        {accent ? <span aria-hidden style={{ width: 8, height: 8, borderRadius: 4, background: accent }} /> : null}
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {hint ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2 }}>{hint}</div> : null}
    </Tag>
  );
}

const tileGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 };

/** Daily deal views (one series) with a per-day tooltip carrying taps + clip views. */
function DailyViewsChart({ daily, days }) {
  const [hover, setHover] = useState(null);
  const series = useMemo(() => {
    const byDay = new Map((daily || []).map((d) => [d.day, d]));
    const out = [];
    const span = Math.min(days, 90);
    const today = new Date();
    for (let i = span - 1; i >= 0; i -= 1) {
      const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      out.push(byDay.get(key) || { day: key, impressions: 0, taps: 0, clip_views: 0 });
    }
    return out;
  }, [daily, days]);

  const max = Math.max(1, ...series.map((d) => d.impressions));
  const W = 720;
  const H = 140;
  const pad = { top: 8, bottom: 20, left: 0, right: 0 };
  const step = W / series.length;
  const barW = Math.max(2, step - 2);
  const plotH = H - pad.top - pad.bottom;
  const hovered = hover != null ? series[hover] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Daily deal views, ${series.length} days`}
        onMouseLeave={() => setHover(null)}
      >
        <line x1={0} x2={W} y1={H - pad.bottom} y2={H - pad.bottom} stroke={OWNER_COLORS.line} />
        {series.map((d, i) => {
          const h = d.impressions > 0 ? Math.max(2, (d.impressions / max) * plotH) : 0;
          const x = i * step + 1;
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)}>
              <rect x={i * step} y={pad.top} width={step} height={plotH} fill="transparent" />
              {h > 0 ? (
                <rect
                  x={x}
                  y={H - pad.bottom - h}
                  width={barW}
                  height={h}
                  rx={Math.min(4, barW / 2)}
                  fill={OWNER_COLORS.accent}
                  opacity={hover == null || hover === i ? 1 : 0.45}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: OWNER_COLORS.muted }}>
        <span>{fmtDate(series[0]?.day + "T12:00:00")}</span>
        <span>Peak {fmtInt(max === 1 && !series.some((d) => d.impressions) ? 0 : max)} views/day</span>
        <span>Today</span>
      </div>
      {hovered ? (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: 0,
            left: `${Math.min(80, Math.max(0, (hover / series.length) * 100))}%`,
            background: OWNER_COLORS.ink,
            color: "#fff",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 12,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontWeight: 700 }}>{fmtDate(hovered.day + "T12:00:00")}</div>
          <div>{fmtInt(hovered.impressions)} views · {fmtInt(hovered.taps)} taps · {fmtInt(hovered.clip_views)} clip views</div>
        </div>
      ) : null}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  fontSize: 12,
  fontWeight: 700,
  color: OWNER_COLORS.muted,
  padding: "8px 10px",
  borderBottom: `1px solid ${OWNER_COLORS.line}`,
  whiteSpace: "nowrap",
};
const tdStyle = { padding: "10px", borderBottom: `1px solid ${OWNER_COLORS.line}`, fontSize: 14, verticalAlign: "top" };
const numTd = { ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

function SortHeader({ k, label, sort, setSort, align = "left" }) {
  const on = sort === k;
  return (
    <th style={{ ...thStyle, textAlign: align }} aria-sort={on ? "descending" : "none"}>
      <button
        type="button"
        onClick={() => setSort(k)}
        style={{ background: "none", border: "none", padding: 0, font: "inherit", color: on ? OWNER_COLORS.ink : OWNER_COLORS.muted, cursor: "pointer" }}
      >
        {label}{on ? " ↓" : ""}
      </button>
    </th>
  );
}

export default function OwnerDealsOverview({ q, onQueryChange, status, onStatusChange, onManageRestaurant }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("status");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getOwnerDealsOverview({ days });
      setData(res);
    } catch (err) {
      setError(err?.message || "Could not load deals.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const deals = data?.deals || [];
  const filtered = useMemo(() => sortDeals(filterDeals(deals, { q, status }), sort), [deals, q, status, sort]);
  const summary = data?.summary || {};
  const totals = data?.totals || {};
  const windowLabel = WINDOWS.find((w) => w.days === days)?.label || `Last ${days} days`;
  const toggleStatus = (s) => onStatusChange(status === s ? "all" : s);

  return (
    <div data-testid="owner-deals-overview">
      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title="Deal status"
          subtitle={data ? `${fmtInt(summary.total)} deals across all restaurants · tap a box to filter` : null}
          action={
            <button
              type="button"
              onClick={load}
              disabled={loading}
              style={{ background: "none", border: "none", color: "#16A34A", fontWeight: 700, cursor: "pointer", font: "inherit", fontSize: 13 }}
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          }
        />
        <div style={tileGrid}>
          {STATUS_ORDER.map((s) => (
            <Tile
              key={s}
              testId={`deals-status-${s}`}
              label={DEAL_STATUS[s].label}
              accent={DEAL_STATUS[s].color}
              value={data ? fmtInt(summary[s]) : "—"}
              hint={s === "live" && data ? `${fmtInt(summary.live_open_now)} in hours now` : null}
              selected={status === s}
              onClick={() => toggleStatus(s)}
            />
          ))}
          <Tile
            testId="deals-status-ending_soon"
            label="Ending in 7 days"
            value={data ? fmtInt(summary.ending_soon) : "—"}
            hint={data ? `${fmtInt(summary.with_video)} deals have a clip` : null}
            selected={status === "ending_soon"}
            onClick={() => toggleStatus("ending_soon")}
          />
        </div>
      </PageCard>

      <PageCard style={{ padding: 18, marginBottom: 16 }}>
        <SectionTitle
          title="Deal analytics"
          subtitle="Views and taps on Menuply, bots and staff left out. Not purchases or redemptions."
          action={
            <label style={{ fontSize: 13, color: OWNER_COLORS.muted, display: "inline-flex", gap: 6, alignItems: "center" }}>
              <span className="sr-only">Time range</span>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                data-testid="deals-window"
                style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 8, padding: "6px 8px", font: "inherit", fontSize: 13, background: OWNER_COLORS.panel }}
              >
                {WINDOWS.map((w) => (
                  <option key={w.days} value={w.days}>{w.label}</option>
                ))}
              </select>
            </label>
          }
        />
        <div style={tileGrid}>
          <Tile label="Deal views" value={data ? fmtInt(totals.impressions) : "—"} hint={windowLabel} />
          <Tile label="Unique viewers" value={data ? fmtInt(totals.unique_viewers) : "—"} hint="Summed per deal" />
          <Tile
            label="Taps"
            value={data ? fmtInt(totals.taps) : "—"}
            hint={data ? `${fmtInt(totals.clicks)} open · ${fmtInt(totals.menu_opens)} menu · ${fmtInt(totals.order_clicks)} order` : null}
          />
          <Tile label="Tap rate" value={data ? fmtPct(totals.tap_rate) : "—"} hint="Taps ÷ views" />
          <Tile
            label="Deal clip views"
            value={data ? fmtInt(totals.clip_views) : "—"}
            hint={data ? `${fmtPct(totals.clip_completion_rate)} watched to the end` : null}
          />
        </div>
        {data ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Deal views per day</div>
            <DailyViewsChart daily={data.daily} days={days} />
          </div>
        ) : null}
        {data?.analytics_errors?.length ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "#B45309" }}>
            Some numbers could not load ({data.analytics_errors.join(", ")}); they show as 0.
          </div>
        ) : null}
      </PageCard>

      <PageCard style={{ padding: 18 }}>
        <SectionTitle title="All deals" subtitle={data ? `${fmtInt(filtered.length)} of ${fmtInt(deals.length)} shown` : null} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <input
            type="search"
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search deal, restaurant, city, type or #id"
            aria-label="Search deals"
            data-testid="deals-search"
            style={{ flex: "1 1 260px", maxWidth: 480, padding: "9px 12px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 14, boxSizing: "border-box" }}
          />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Status"
            data-testid="deals-status-filter"
            style={{ padding: "9px 10px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 14, background: OWNER_COLORS.panel }}
          >
            <option value="all">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{DEAL_STATUS[s].label}</option>
            ))}
            <option value="ending_soon">Ending in 7 days</option>
          </select>
        </div>

        {error ? <div style={{ color: "#B91C1C", marginBottom: 12 }}>{error}</div> : null}
        {data?.truncated ? (
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 8 }}>Showing the 1,000 most recently updated deals.</div>
        ) : null}

        {!loading && data && !filtered.length ? (
          <EmptyState>{deals.length ? "No deals match." : "No deals yet. Pick a restaurant under Manage to add one."}</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }} data-testid="deals-table">
              <thead>
                <tr>
                  <th style={thStyle}>Deal</th>
                  <SortHeader k="restaurant" label="Restaurant" sort={sort} setSort={setSort} />
                  <SortHeader k="status" label="Status" sort={sort} setSort={setSort} />
                  <SortHeader k="ends" label="Runs" sort={sort} setSort={setSort} />
                  <SortHeader k="views" label="Views" sort={sort} setSort={setSort} align="right" />
                  <SortHeader k="taps" label="Taps" sort={sort} setSort={setSort} align="right" />
                  <SortHeader k="tap_rate" label="Tap rate" sort={sort} setSort={setSort} align="right" />
                  <SortHeader k="clip_views" label="Clip views" sort={sort} setSort={setSort} align="right" />
                  <th style={thStyle}>Last activity</th>
                  <th style={thStyle} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} data-testid={`deal-row-${d.id}`}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{d.title || "Untitled deal"}</div>
                      <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                        #{d.id} · {dealValueLabel(d)}{d.has_video ? " · Clip" : ""}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div>{d.restaurant_name || `Restaurant ${d.restaurant_id}`}</div>
                      <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{[d.city, d.state].filter(Boolean).join(", ")}</div>
                    </td>
                    <td style={tdStyle}>
                      <StatusLabel status={d.live_status} />
                      {d.live_status === "live" && d.schedule_label ? (
                        <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                          {d.schedule_label}{d.open_now ? " · in hours now" : " · outside hours"}
                        </div>
                      ) : null}
                      {d.ending_soon ? <div style={{ fontSize: 12, color: "#B45309", fontWeight: 700 }}>Ends soon</div> : null}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 13 }}>
                      {fmtDate(d.starts_at)} – {fmtDate(d.expires_at)}
                    </td>
                    <td style={numTd}>{fmtInt(d.metrics.impressions)}</td>
                    <td style={numTd}>{fmtInt(d.metrics.taps)}</td>
                    <td style={numTd}>{fmtPct(d.metrics.tap_rate)}</td>
                    <td style={numTd} title={d.has_video ? `${fmtInt(d.clip.all_time_views)} all time` : undefined}>
                      {d.has_video ? fmtInt(d.clip.views) : "—"}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 13, whiteSpace: "nowrap", color: OWNER_COLORS.muted }}>{fmtRelative(d.last_activity_at)}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => onManageRestaurant({ restaurant_id: d.restaurant_id, restaurant_name: d.restaurant_name || "" })}
                        style={{ background: "none", border: "none", padding: 0, color: "#16A34A", fontWeight: 700, cursor: "pointer", font: "inherit", fontSize: 13, whiteSpace: "nowrap" }}
                      >
                        Edit ›
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </div>
  );
}
