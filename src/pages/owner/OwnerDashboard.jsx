import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { getOwnerDashboardSummary } from "../../lib/ownerApi.js";
import { SimpleTable } from "./intelligence/intelligenceShared.jsx";

const METRIC_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 14,
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
          Real consumer traffic and search for today. Visitor sessions are distinct browsers —
          page views count every route change. Owner console and internal routes are excluded.
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

      {data?.market_snapshot ? (
        <section style={{ marginBottom: 28 }}>
          <SectionTitle
            title="Today's markets"
            subtitle="Top cities for visitors and searches — full breakdown in Geo Intelligence."
          />
          <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: OWNER_COLORS.ink }}>Visitors by city</div>
              <SimpleTable
                rows={data.market_snapshot.visitors_by_city?.slice(0, 8)}
                columns={[
                  ["City", "location_label"],
                  ["Visitors", "visitors"],
                  ["Page views", "page_views"],
                ]}
                emptyLabel="No visitor geo data for today yet."
              />
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
