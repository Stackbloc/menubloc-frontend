import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { getOwnerDinerNetwork } from "../../../lib/ownerApi.js";
import { ProfileRangePicker } from "./DinerIntelligencePanel.jsx";
import { PROFILE_RANGE_OPTIONS, shortDate } from "./profileDisplay.js";
import { bucketLabel, formatSectionValue, sectionCell, sectionFootnote } from "./sectionsDisplay.js";
import { chartIsEmpty, chartMax, drillPath, rangeApiParams, rangeStateFromParams } from "./networkDisplay.js";

/**
 * Diner Intelligence Stage 6 (plan 39, Phase 10): Social Network Health on /owner/diners.
 * Is Menuply building a connected community, or collecting disconnected accounts? Every number opens the
 * diners behind it. Connect totals are "now" (end of period) snapshots; social activity is for the period.
 * No composite score until Andre approves the formula (plan §8).
 */

export const TILE_GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 };
const TONE_COLOR = { value: OWNER_COLORS.ink, zero: OWNER_COLORS.ink, not_tracked: OWNER_COLORS.muted, unavailable: "#9f1239" };
const SERIES_COLORS = [OWNER_COLORS.ink, "#94a3b8"];

/** One number. With a drill-down it's a link to the diners behind it. */
export function NetworkTile({ metric, state }) {
  const cell = sectionCell(metric);
  const foot = sectionFootnote(metric);
  const body = (
    <PageCard style={{ padding: 14, height: "100%", boxSizing: "border-box" }}>
      <div data-testid={`network-metric-${metric.key}`} data-status={metric.status}>
        <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>
          {metric.label}
          {metric.partial ? <span title="Only partly recorded for this period"> *</span> : null}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: TONE_COLOR[cell.tone] }}>{cell.text}</div>
        <div style={{ fontSize: 11, marginTop: 4, color: OWNER_COLORS.muted }}>{metric.kind === "snapshot" ? "Now (end of period)" : "In the period"}</div>
        {foot ? <div style={{ fontSize: 11, marginTop: 6, color: OWNER_COLORS.muted, lineHeight: 1.4 }}>{foot}</div> : null}
        {metric.drill ? <div style={{ fontSize: 12, marginTop: 8, fontWeight: 700, color: OWNER_COLORS.ink, textDecoration: "underline" }}>See diners</div> : null}
      </div>
    </PageCard>
  );
  if (!metric.drill) return body;
  return (
    <Link to={drillPath(metric.drill, state)} data-testid={`network-drill-${metric.key}`} style={{ textDecoration: "none", color: "inherit" }}>
      {body}
    </Link>
  );
}

/** Bars per day/week; two series sit side by side. Blank (not recorded) days have no bar. */
function HistoryChart({ chart, grain }) {
  const max = chartMax(chart);
  const series = chart.series || [];
  const buckets = series[0]?.points || [];
  const empty = chartIsEmpty(chart);
  const fmt = (v) => (v == null ? "not recorded" : formatSectionValue(v, chart.format === "percent" ? "percent" : "people"));
  return (
    <PageCard style={{ padding: 14 }}>
      <div data-testid={`network-chart-${chart.key}`}>
        <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>{chart.label}</div>
        {series.length > 1 ? (
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>
            {series.map((s, i) => (
              <span key={s.label}><span style={{ display: "inline-block", width: 8, height: 8, background: SERIES_COLORS[i], marginRight: 4 }} />{s.label}</span>
            ))}
          </div>
        ) : null}
        {empty ? (
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 12 }}>Not recorded for this period yet.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80, marginTop: 8, borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
            {buckets.map((b, idx) => (
              <div key={b.bucket} style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1, height: "100%" }}
                title={`${bucketLabel(b.bucket, grain)}: ${series.map((s) => `${s.label} ${fmt(s.points[idx]?.value)}`).join(", ")}`}>
                {series.map((s, i) => {
                  const v = s.points[idx]?.value;
                  return <div key={s.label} style={{ flex: 1, minWidth: 1, height: v == null ? 0 : `${Math.max(v ? 3 : 0, (v / max) * 100)}%`, background: SERIES_COLORS[i] }} />;
                })}
              </div>
            ))}
          </div>
        )}
        {!empty && buckets.length ? (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>
            <span>{bucketLabel(buckets[0].bucket, grain)}</span>
            <span>{bucketLabel(buckets[buckets.length - 1].bucket, grain)}</span>
          </div>
        ) : null}
      </div>
    </PageCard>
  );
}

function Group({ title, subtitle, metrics, state, testId }) {
  return (
    <div style={{ marginTop: 16 }} data-testid={testId}>
      <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2, marginBottom: 8, lineHeight: 1.4 }}>{subtitle}</div> : <div style={{ height: 8 }} />}
      <div style={TILE_GRID}>{metrics.map((x) => <NetworkTile key={x.key} metric={x} state={state} />)}</div>
    </div>
  );
}

export default function OwnerDinersNetwork() {
  const [params, setParams] = useSearchParams();
  const state = rangeStateFromParams(params, "n");
  const apiParams = rangeApiParams(state);
  const paramKey = JSON.stringify(apiParams);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    getOwnerDinerNetwork(apiParams)
      .then((payload) => !cancelled && setData(payload))
      .catch((err) => !cancelled && setError(err?.status === 400 && err.message ? err.message : "Social Network Health couldn't be loaded just now."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "" || v === 0) next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: true });
  };

  return (
    <div data-testid="diner-network">
      <SectionTitle
        title="Social Network Health"
        subtitle="Is Menuply building a connected dining community, or collecting accounts? Connects are accepted pairs, counted once; staff, test diners and blocked pairs are left out. Tap any number to see the diners behind it. * = only partly recorded for this period."
      />
      <PageCard style={{ padding: 18, marginBottom: 14 }}>
        <ProfileRangePicker
          range={state.range}
          options={PROFILE_RANGE_OPTIONS}
          testPrefix="network-range"
          onChange={(r) => update({ nrange: r.key, nfrom: r.key === "custom" ? r.from : null, nto: r.key === "custom" ? r.to : null })}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>
            Cluster{" "}
            <select
              data-testid="network-cluster"
              value={state.clusterId}
              onChange={(e) => update({ ncluster: Number(e.target.value) || null })}
              style={{ padding: "6px 8px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13 }}
            >
              <option value={0}>Menuply-wide</option>
              {(data?.clusters || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <Link to="/owner/diners/usc" data-testid="network-usc-link" style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>
            USC launch view
          </Link>
        </div>
        {data ? (
          <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>
            {shortDate(data.range.from)} through {shortDate(data.range.to)} (Los Angeles days)
          </div>
        ) : null}
        {error ? <div style={{ marginTop: 10, fontSize: 13, color: "#9f1239" }}>{error}</div> : null}
        {!data && !error ? <div style={{ marginTop: 10, fontSize: 13, color: OWNER_COLORS.muted }}>Loading…</div> : null}
      </PageCard>

      {data ? (
        <PageCard style={{ padding: 18, marginBottom: 14 }}>
          <Group title="The network" metrics={data.core} state={state} testId="network-core" />
          <Group title="How connected it is" metrics={data.density} state={state} testId="network-density" />
          <Group
            title="Health inputs"
            subtitle={data.score?.note}
            metrics={data.score_inputs}
            state={state}
            testId="network-score-inputs"
          />
          <div style={{ marginTop: 18 }} data-testid="network-history">
            <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink }}>Over time</div>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2, marginBottom: 8, lineHeight: 1.4 }}>
              {data.history.note}
              {data.history.recorded_since ? ` Recorded since ${shortDate(data.history.recorded_since)}.` : " Snapshots haven't started yet."}
            </div>
            <div style={TILE_GRID}>
              {data.history.charts.map((c) => <HistoryChart key={c.key} chart={c} grain={data.history.grain} />)}
            </div>
          </div>
        </PageCard>
      ) : null}
    </div>
  );
}
