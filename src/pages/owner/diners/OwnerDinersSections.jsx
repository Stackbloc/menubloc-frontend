import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { SimpleTable } from "../intelligence/intelligenceShared.jsx";
import { downloadOwnerDinerSectionsCsv, getOwnerDinerSections } from "../../../lib/ownerApi.js";
import { ProfileRangePicker } from "./DinerIntelligencePanel.jsx";
import {
  SECTIONS_RANGE_OPTIONS,
  bucketLabel,
  formatSectionValue,
  sectionCell,
  sectionCompare,
  sectionFootnote,
  sectionsApiParams,
  sectionsCaption,
  sectionsStateFromParams,
  sourceLabel,
} from "./sectionsDisplay.js";

/**
 * Diner Intelligence Stage 5 (plan 39): Acquisition · Engagement · Retention · Dining · Food discovery.
 * One period picker + cluster for all five; each number sits beside the previous period of the same length.
 * Numbers marked "Owner Analytics" are read from Owner Analytics, not recomputed. Staff and test diners
 * are left out. A number that couldn't be read says "Unavailable", never 0.
 */

const GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 };
const TONE_COLOR = { value: OWNER_COLORS.ink, zero: OWNER_COLORS.ink, not_tracked: OWNER_COLORS.muted, unavailable: "#9f1239" };
const CHANGE_COLOR = { up: "#1e3a8a", down: "#9f1239", flat: OWNER_COLORS.muted, none: OWNER_COLORS.muted };

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function MetricTile({ metric }) {
  const cell = sectionCell(metric);
  const change = sectionCompare(metric);
  const foot = sectionFootnote(metric);
  const src = sourceLabel(metric.source);
  const small = cell.tone === "unavailable" || cell.tone === "not_tracked";
  return (
    <PageCard style={{ padding: 14 }}>
      <div data-testid={`diner-section-metric-${metric.key}`} data-status={metric.status}>
        <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>
          {metric.label}
          {metric.partial ? <span title="Only partly recorded for this period"> *</span> : null}
        </div>
        <div style={{ fontSize: small ? 18 : 26, fontWeight: 800, marginTop: small ? 10 : 4, color: TONE_COLOR[cell.tone] }}>{cell.text}</div>
        {change ? <div style={{ fontSize: 12, marginTop: 4, color: CHANGE_COLOR[change.tone] }}>{change.text}</div> : null}
        {foot ? <div style={{ fontSize: 11, marginTop: 6, color: OWNER_COLORS.muted, lineHeight: 1.4 }}>{foot}</div> : null}
        {src ? <div style={{ fontSize: 11, marginTop: 4, color: OWNER_COLORS.muted }}>From {src}</div> : null}
      </div>
    </PageCard>
  );
}

/** Simple bars, one per day (or week for long periods). Hover shows the value; both series count people, so under 5 shows "<5". */
function TrendBars({ trend, grain, testId }) {
  const series = trend?.series || [];
  if (!series.length) return null;
  const max = Math.max(1, ...series.map((p) => p.value || 0));
  const first = series[0];
  const last = series[series.length - 1];
  return (
    <div data-testid={testId} style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 6 }}>
        {trend.label} by {grain === "week" ? "week" : "day"}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 90, borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
        {series.map((p) => (
          <div
            key={p.bucket}
            title={`${bucketLabel(p.bucket, grain)}: ${formatSectionValue(p.value, "people")}`}
            style={{
              flex: 1,
              minWidth: 2,
              height: `${Math.max(p.value ? 3 : 0, (p.value / max) * 100)}%`,
              background: OWNER_COLORS.ink,
              opacity: 0.8,
              borderRadius: "2px 2px 0 0",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: OWNER_COLORS.muted, marginTop: 4 }}>
        <span>{bucketLabel(first.bucket, grain)}</span>
        <span>Highest: {formatSectionValue(series.some((p) => p.value) ? max : 0, "people")}</span>
        <span>{bucketLabel(last.bucket, grain)}</span>
      </div>
    </div>
  );
}

function ReferralSources({ sources }) {
  if (!sources) return <div style={{ fontSize: 12, color: "#9f1239", marginTop: 12 }}>Referral sources couldn't be read just now.</div>;
  if (!sources.length) return <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 12 }}>No new diners in this period.</div>;
  return (
    <div style={{ marginTop: 14 }} data-testid="diner-section-sources">
      <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 6 }}>How new diners found Menuply</div>
      <SimpleTable
        columns={[
          ["Source", "label"],
          ["New diners", "diners", (r) => formatSectionValue(r.diners, "people")],
          ["Share", "share", (r) => formatSectionValue(r.share, "percent")],
        ]}
        rows={sources}
        emptyLabel="No new diners in this period."
      />
    </div>
  );
}

function Section({ section, grain }) {
  return (
    <PageCard style={{ padding: 18, marginBottom: 14 }}>
      <div data-testid={`diner-section-${section.key}`}>
        <div style={{ fontSize: 16, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 12 }}>{section.title}</div>
        <div style={GRID}>
          {(section.metrics || []).map((m) => <MetricTile key={m.key} metric={m} />)}
        </div>
        {section.trend ? <TrendBars trend={section.trend} grain={grain} testId={`diner-section-trend-${section.key}`} /> : null}
        {section.key === "acquisition" ? <ReferralSources sources={section.sources} /> : null}
      </div>
    </PageCard>
  );
}

export default function OwnerDinersSections() {
  const [params, setParams] = useSearchParams();
  const state = sectionsStateFromParams(params);
  const apiParams = sectionsApiParams(state);
  const paramKey = JSON.stringify(apiParams);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError("");
    setData(null);
    getOwnerDinerSections(apiParams)
      .then((payload) => !cancelled && setData(payload))
      .catch((err) => !cancelled && setError(err?.message && err.status === 400 ? err.message : "These numbers couldn't be loaded just now."));
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
  const changeRange = (r) => update({ srange: r.key, sfrom: r.key === "custom" ? r.from : null, sto: r.key === "custom" ? r.to : null });

  const downloadCsv = async () => {
    setBusy(true);
    try {
      const name = `menuply-diners-${state.clusterId || "all"}-${data?.range?.from || "period"}-to-${data?.range?.to || ""}.csv`;
      saveBlob(await downloadOwnerDinerSectionsCsv(apiParams), name);
    } catch {
      window.alert("The CSV couldn't be made. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="diner-sections">
      <SectionTitle
        title="Growth and activity"
        subtitle="Acquisition, engagement, retention, dining and food discovery for the period, each beside the period before it. Staff and test diners are left out. * = only partly recorded for this period."
      />
      <PageCard style={{ padding: 18, marginBottom: 14 }}>
        <ProfileRangePicker range={state.range} onChange={changeRange} options={SECTIONS_RANGE_OPTIONS} testPrefix="diner-sections-range" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted }}>
            Cluster{" "}
            <select
              data-testid="diner-sections-cluster"
              value={state.clusterId}
              onChange={(e) => update({ scluster: Number(e.target.value) || null })}
              style={{ padding: "6px 8px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13 }}
            >
              <option value={0}>Menuply-wide</option>
              {(data?.clusters || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button
            type="button"
            data-testid="diner-sections-csv"
            onClick={downloadCsv}
            disabled={busy || !data}
            style={{ border: 0, background: "none", padding: 0, fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink, textDecoration: "underline", cursor: busy || !data ? "default" : "pointer" }}
          >
            {busy ? "Making CSV…" : "Download CSV"}
          </button>
        </div>
        {data ? <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>{sectionsCaption(data)}</div> : null}
        {error ? <div style={{ marginTop: 10, fontSize: 13, color: "#9f1239" }}>{error}</div> : null}
        {!data && !error ? <div style={{ marginTop: 10, fontSize: 13, color: OWNER_COLORS.muted }}>Loading…</div> : null}
      </PageCard>
      {(data?.sections || []).map((s) => <Section key={s.key} section={s} grain={data.grain} />)}
    </div>
  );
}
