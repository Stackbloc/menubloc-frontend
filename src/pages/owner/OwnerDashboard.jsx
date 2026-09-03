import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerDashboardSummary, getOwnerGrowthDetails } from "../../lib/ownerApi.js";
import { SimpleTable } from "./intelligence/intelligenceShared.jsx";

const METRIC_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 14,
};

const INTERVAL_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "7 days",
  "30d": "30 days",
};

const GROWTH_METRIC_LABELS = {
  abandoned_checkouts: "Abandoned checkouts",
  restaurant_logins: "Restaurant logins",
  diner_logins: "Diner logins",
  new_diner_accounts: "New diner accounts",
  new_subscriptions: "New subscriptions",
};

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOwnerDashboardSummary()
      .then(setData)
      .catch(() => setError("Dashboard data is temporarily unavailable."));
  }, []);

  return (
    <OwnerLayout
      title="Platform Overview"
      actions={
        <Link
          to="/owner/intelligence?preset=30d"
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: `1px solid ${OWNER_COLORS.line}`,
            background: "#fff",
            color: OWNER_COLORS.ink,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Full intelligence →
        </Link>
      }
    >
      {error ? <ErrorBanner message={error} /> : null}

      <PageCard style={{ padding: "18px 22px", marginBottom: 22 }}>
        <div style={{ fontSize: 14, color: OWNER_COLORS.ink, lineHeight: 1.55 }}>
          Real consumer visitors. Each person is counted once in the selected window — not how many times they opened the same page. Owner console and internal routes are excluded.
        </div>
        {data?.analytics_scope ? (
          <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
            {data.analytics_scope}
          </div>
        ) : null}
        {data?.as_of ? (
          <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
            Data as of {data.as_of}. Click any tracked metric to explore.
          </div>
        ) : null}
      </PageCard>

      {!data && !error ? <LoadingState /> : null}

      {data?.sections?.map((section) => (
        <section key={section.id} style={{ marginBottom: 28 }}>
          <SectionTitle title={section.title} subtitle={section.subtitle} />
          <div style={METRIC_GRID}>
            {section.metrics.map((item) => (
              <DrillDownMetric key={item.id} metric={item} />
            ))}
          </div>
        </section>
      ))}

      {data?.growth ? (
        <section style={{ marginBottom: 28 }}>
          <SectionTitle
            title="Growth & conversion"
            subtitle="Abandoned restaurant Stripe checkouts, new subscriptions by plan, logins, and new diner accounts. Click any metric name or count to open details."
            action={
              <Link
                to="/owner/diners"
                data-testid="view-all-diner-accounts"
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: `1px solid ${OWNER_COLORS.line}`,
                  background: "#fff",
                  color: OWNER_COLORS.ink,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                View all diner accounts →
              </Link>
            }
          />
          <GrowthMetricsPanel growth={data.growth} />
        </section>
      ) : null}

      {data?.market_snapshot ? (
        <section style={{ marginBottom: 28 }}>
          <SectionTitle
            title="Today's markets"
            subtitle="Top cities for visitors and searches (market/restaurant city — not IP). Unattributed means no city on the visit. Full breakdown in Geo / Site Activity."
          />
          <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: OWNER_COLORS.ink }}>Visitors by city</div>
              <SimpleTable
                rows={data.market_snapshot.visitors_by_city?.slice(0, 8)}
                columns={[
                  ["City", "location_label"],
                  ["Visitors", "visitors"],
                ]}
                emptyLabel="No visitor geo data for today yet."
              />
              {data.market_snapshot.unique_visitors != null ? (
                <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
                  Unique visitors today: {Number(data.market_snapshot.unique_visitors) || 0}
                  {data.market_snapshot.unattributed_visitors != null
                    ? ` · Unattributed: ${Number(data.market_snapshot.unattributed_visitors) || 0}`
                    : ""}
                </div>
              ) : null}
            </PageCard>
            <PageCard style={{ padding: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: OWNER_COLORS.ink }}>Searches by city</div>
              <SimpleTable
                rows={data.market_snapshot.searches_by_city?.slice(0, 8)}
                columns={[
                  ["City", "location_label"],
                  ["Searches", "searches"],
                  ["Zero results", "zero_results"],
                ]}
                emptyLabel="No search geo data for today yet."
              />
            </PageCard>
          </div>
        </section>
      ) : null}

      {data?.placeholders?.length ? (
        <section style={{ marginTop: 8 }}>
          <SectionTitle
            title="Coming soon"
            subtitle="These need more than simple SQL — shown as placeholders until event tracking ships."
          />
          <div style={METRIC_GRID}>
            {data.placeholders.map((item) => (
              <PlaceholderMetric key={item.id} metric={item} />
            ))}
          </div>
        </section>
      ) : null}
    </OwnerLayout>
  );
}

function selectionKey(sel) {
  if (!sel) return "";
  return `${sel.metric}|${sel.interval}|${sel.plan_code || ""}`;
}

function GrowthMetricsPanel({ growth }) {
  const intervals = growth?.intervals?.length
    ? growth.intervals
    : ["today", "yesterday", "7d", "30d"];

  const [selection, setSelection] = useState(null);

  const rows = [
    {
      id: "abandoned_checkouts",
      label: "Abandoned checkouts",
      hint: "Restaurant Stripe plan sessions expired or left open >24h",
      values: growth.abandoned_checkouts || {},
    },
    {
      id: "restaurant_logins",
      label: "Restaurant logins",
      hint: "Operator portal sign-ins",
      values: growth.logins?.restaurant || {},
    },
    {
      id: "diner_logins",
      label: "Diner logins",
      hint: "Consumer account sign-ins",
      values: growth.logins?.diner || {},
    },
    {
      id: "new_diner_accounts",
      label: "New diner accounts",
      hint: "From market signup log — includes market area when known",
      values: growth.new_diner_accounts || {},
    },
  ];

  function toggleSelection(next) {
    setSelection((prev) => (selectionKey(prev) === selectionKey(next) ? null : next));
  }

  return (
    <PageCard style={{ padding: 22 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={TH_STYLE}>Metric</th>
              {intervals.map((key) => (
                <th key={key} style={{ ...TH_STYLE, textAlign: "right" }}>
                  {INTERVAL_LABELS[key] || key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={TD_STYLE}>
                  <button
                    type="button"
                    onClick={() => toggleSelection({ metric: row.id, interval: "today" })}
                    data-testid={`growth-metric-${row.id}`}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color:
                          selection?.metric === row.id && !selection?.plan_code
                            ? OWNER_COLORS.accent
                            : OWNER_COLORS.ink,
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                      }}
                    >
                      {row.label}
                    </div>
                    {row.hint ? (
                      <div style={{ marginTop: 4, fontSize: 12, color: OWNER_COLORS.muted }}>{row.hint}</div>
                    ) : null}
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent }}>
                      View details →
                    </div>
                  </button>
                </td>
                {intervals.map((key) => {
                  const active =
                    selection?.metric === row.id &&
                    selection?.interval === key &&
                    !selection?.plan_code;
                  return (
                    <td key={key} style={{ ...TD_STYLE, textAlign: "right" }}>
                      <GrowthCountButton
                        active={active}
                        value={row.values?.[key]}
                        onClick={() => toggleSelection({ metric: row.id, interval: key })}
                        testId={`growth-count-${row.id}-${key}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td style={TD_STYLE} colSpan={intervals.length + 1}>
                <div style={{ fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 10 }}>
                  New subscriptions by plan
                </div>
                <div
                  className="owner-responsive-grid-2"
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}
                >
                  {intervals.map((key) => {
                    const plans = growth.new_subscriptions_by_plan?.[key] || [];
                    const total = plans.reduce((sum, p) => sum + (Number(p.count) || 0), 0);
                    const totalActive =
                      selection?.metric === "new_subscriptions" &&
                      selection?.interval === key &&
                      !selection?.plan_code;
                    return (
                      <div
                        key={key}
                        style={{
                          border: `1px solid ${totalActive ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                          borderRadius: 10,
                          padding: "10px 12px",
                          background: "#fff",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {INTERVAL_LABELS[key] || key}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <GrowthCountButton
                            active={totalActive}
                            value={total}
                            large
                            onClick={() =>
                              toggleSelection({ metric: "new_subscriptions", interval: key })
                            }
                            testId={`growth-count-new_subscriptions-${key}`}
                          />
                        </div>
                        {plans.length === 0 ? (
                          <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>No new paid plans</div>
                        ) : (
                          <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none" }}>
                            {plans.map((plan) => {
                              const planActive =
                                selection?.metric === "new_subscriptions" &&
                                selection?.interval === key &&
                                selection?.plan_code === plan.plan_code;
                              return (
                                <li
                                  key={`${key}-${plan.plan_code}`}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    fontSize: 12,
                                    color: OWNER_COLORS.ink,
                                    padding: "3px 0",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleSelection({
                                        metric: "new_subscriptions",
                                        interval: key,
                                        plan_code: plan.plan_code,
                                      })
                                    }
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      padding: 0,
                                      cursor: "pointer",
                                      color: planActive ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                                      fontWeight: planActive ? 800 : 500,
                                      textAlign: "left",
                                    }}
                                  >
                                    {plan.plan_name || plan.plan_code}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleSelection({
                                        metric: "new_subscriptions",
                                        interval: key,
                                        plan_code: plan.plan_code,
                                      })
                                    }
                                    data-testid={`growth-count-new_subscriptions-${key}-${plan.plan_code}`}
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      padding: 0,
                                      cursor: "pointer",
                                      fontWeight: 700,
                                      fontVariantNumeric: "tabular-nums",
                                      color: planActive ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                                    }}
                                  >
                                    {formatCount(plan.count)}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {selection ? <GrowthDetailPanel selection={selection} onClose={() => setSelection(null)} /> : null}

      {growth.notes ? (
        <div style={{ marginTop: 14, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
          {growth.notes}
        </div>
      ) : null}
    </PageCard>
  );
}

function GrowthCountButton({ value, onClick, active, large = false, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      title="View details for this period"
      aria-pressed={active ? "true" : "false"}
      style={{
        border: active ? `1px solid ${OWNER_COLORS.accent}` : `1px solid ${OWNER_COLORS.line}`,
        background: active ? "#eef6f1" : "#fff",
        padding: large ? "6px 10px" : "4px 8px",
        margin: 0,
        cursor: "pointer",
        fontWeight: 800,
        fontVariantNumeric: "tabular-nums",
        fontSize: large ? 22 : 13,
        color: OWNER_COLORS.accent,
        textDecoration: "underline",
        textUnderlineOffset: 2,
        borderRadius: 8,
        minWidth: large ? 64 : 40,
      }}
    >
      {formatCount(value)}
    </button>
  );
}

function GrowthDetailPanel({ selection, onClose }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setPayload(null);
    getOwnerGrowthDetails({
      metric: selection.metric,
      interval: selection.interval,
      plan_code: selection.plan_code || undefined,
    })
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load growth details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selection.metric, selection.interval, selection.plan_code]);

  const title = GROWTH_METRIC_LABELS[selection.metric] || selection.metric;
  const intervalLabel = INTERVAL_LABELS[selection.interval] || selection.interval;
  const columns = (payload?.columns || []).map((col) => [col.label, col.key]);
  const rows = payload?.rows || [];

  return (
    <div
      data-testid="growth-detail-panel"
      style={{
        marginTop: 18,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${OWNER_COLORS.line}`,
        background: "#faf7f4",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink }}>
            {title} · {intervalLabel}
            {selection.plan_code ? ` · ${selection.plan_code}` : ""}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: OWNER_COLORS.muted }}>
            {loading
              ? "Loading details…"
              : `${formatCount(payload?.total)} total${rows.length && payload?.total > rows.length ? ` (showing ${rows.length})` : ""}`}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px solid ${OWNER_COLORS.line}`,
            background: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            color: OWNER_COLORS.ink,
          }}
        >
          Close
        </button>
      </div>
      {error ? (
        <div style={{ marginTop: 12, color: "#8b2e1a", fontSize: 13 }}>{error}</div>
      ) : null}
      {!loading && !error ? (
        <div style={{ marginTop: 12, overflowX: "auto", background: "#fff", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}` }}>
          <SimpleTable
            rows={rows}
            columns={columns.length ? columns : [["Detail", "id"]]}
            emptyLabel="No events in this window."
          />
        </div>
      ) : null}
    </div>
  );
}

const TH_STYLE = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: `1px solid ${OWNER_COLORS.line}`,
  color: OWNER_COLORS.muted,
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const TD_STYLE = {
  padding: "12px 10px",
  borderBottom: `1px solid ${OWNER_COLORS.line}`,
  verticalAlign: "top",
};

function formatCount(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString();
}

function DrillDownMetric({ metric }) {
  const isLink = metric.status === "tracked" && metric.drill_down;
  const card = (
    <PageCard
      style={{
        padding: 18,
        height: "100%",
        cursor: isLink ? "pointer" : "default",
        transition: "box-shadow 0.15s, border-color 0.15s",
        border: isLink ? `1px solid ${OWNER_COLORS.line}` : `1px dashed ${OWNER_COLORS.line}`,
      }}
    >
      <div style={{ color: OWNER_COLORS.muted, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {metric.label}
      </div>
      <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", color: OWNER_COLORS.ink }}>
        {formatMetricValue(metric.value)}
      </div>
      {metric.hint ? (
        <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
          {metric.hint}
        </div>
      ) : null}
      {isLink ? (
        <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent }}>
          View details →
        </div>
      ) : null}
    </PageCard>
  );

  if (!isLink) return card;

  return (
    <Link to={metric.drill_down} style={{ textDecoration: "none", display: "block", color: "inherit" }}>
      {card}
    </Link>
  );
}

function PlaceholderMetric({ metric }) {
  return (
    <PageCard style={{ padding: 18, height: "100%", border: `1px dashed #d7c5b8`, background: "#faf7f4" }}>
      <div style={{ color: OWNER_COLORS.muted, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {metric.label}
      </div>
      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: OWNER_COLORS.muted }}>
        Not tracked yet
      </div>
      {metric.hint ? (
        <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
          {metric.hint}
        </div>
      ) : null}
    </PageCard>
  );
}

function formatMetricValue(value) {
  if (value == null || value === "") return "—";
  return value;
}

function LoadingState() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: OWNER_COLORS.muted, fontSize: 14 }}>
      Loading platform overview…
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>
      {message}
    </div>
  );
}
