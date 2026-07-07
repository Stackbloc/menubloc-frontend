import React from "react";
import { Link, useLocation } from "react-router-dom";
import { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";
import {
  ErrorBanner,
  INTELLIGENCE_TABS,
  LoadingState,
  MetricCard,
  AnalyticsScopeNote,
  SimpleTable,
  useIntelligenceData,
} from "./intelligenceShared.jsx";
import { getOwnerIntelligenceOverview } from "../../../lib/ownerApi.js";

const DRILL_DOWN_AREAS = [
  {
    id: "search-demand",
    title: "Search Demand",
    description: "Top queries, zero-result repair queue, intent breakdown, and search trends.",
    path: "search-demand",
  },
  {
    id: "site-activity",
    title: "Site Activity",
    description: "Page visits, top pages, referrers, and device mix.",
    path: "site-activity",
  },
  {
    id: "geo",
    title: "Geo Intelligence",
    description: "Searches and visits by city, zero-result rates, and top queries per market.",
    path: "geo",
  },
  {
    id: "menu",
    title: "Menu Intelligence",
    description: "Most-viewed menus and menu items.",
    path: "menu",
  },
  {
    id: "restaurant",
    title: "Restaurant Intelligence",
    description: "Per-restaurant profile and menu views.",
    path: "restaurant",
  },
  {
    id: "market",
    title: "Market Intelligence",
    description: "Market onboarding priorities and coverage gaps.",
    path: "market",
  },
  {
    id: "revenue",
    title: "Revenue Intelligence",
    description: "Subscription MRR, billing history, and payment failures.",
    path: "revenue",
  },
];

function rangeLabel(range) {
  if (range.preset === "today") return "today";
  if (range.preset === "yesterday") return "yesterday";
  if (range.preset === "7d") return "the last 7 days";
  if (range.preset === "30d") return "the last 30 days";
  return `${range.start_date} – ${range.end_date}`;
}

export default function IntelligenceOverview() {
  const { search } = useLocation();
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceOverview, range);

  const s = data?.summary || {};
  const c = data?.charts || {};

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <PageCard style={{ padding: "18px 22px" }}>
        <div style={{ fontSize: 14, color: OWNER_COLORS.ink, lineHeight: 1.55 }}>
          Summary for <strong>{rangeLabel(range)}</strong>. Use the date presets above to change the range —
          data on this page and all intelligence tabs updates in place. For today&apos;s executive snapshot,
          see the{" "}
          <Link to="/owner" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>
            Platform Overview
          </Link>
          {" "}dashboard.
        </div>
      </PageCard>

      {loading ? <LoadingState label="Loading summary for this range…" /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!loading && !error && !data?.available ? (
        <EmptyState>No platform activity recorded for {rangeLabel(range)}.</EmptyState>
      ) : null}

      {!loading && data?.available ? (
        <>
          <AnalyticsScopeNote note={data.analytics_scope} />

          <SectionTitle
            title="Range summary"
            subtitle={`Consumer traffic and search for ${rangeLabel(range)}. Click a number to drill down.`}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            <LinkedMetric
              label="Visitor sessions"
              value={s.unique_visitors}
              to={{ pathname: "/owner/intelligence/site-activity", search }}
            />
            <LinkedMetric
              label="Page views"
              value={s.total_visits}
              to={{ pathname: "/owner/intelligence/site-activity", search }}
            />
            <LinkedMetric
              label="Searches"
              value={s.total_searches}
              to={{ pathname: "/owner/intelligence/search-demand", search }}
            />
            <LinkedMetric
              label="Zero-result rate"
              value={`${s.zero_result_rate_pct}%`}
              to={{ pathname: "/owner/intelligence/search-demand", search, hash: "zero-results" }}
            />
            <LinkedMetric
              label="Menu views"
              value={s.menu_views}
              to={{ pathname: "/owner/intelligence/menu", search }}
            />
            <LinkedMetric
              label="Restaurant views"
              value={s.restaurant_views}
              to={{ pathname: "/owner/intelligence/restaurant", search }}
            />
          </div>

          <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Top queries" subtitle="For this date range." />
              <SimpleTable rows={c.top_queries?.slice(0, 8)} columns={[["Query", "query"], ["Count", "count"]]} />
              <div style={{ marginTop: 12 }}>
                <TabLink path="search-demand" search={search} label="All search demand →" />
              </div>
            </PageCard>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Top search cities" subtitle="Where diners are searching." />
              <SimpleTable
                rows={c.top_cities?.slice(0, 8)}
                columns={[["City", "location_label"], ["Searches", "count"]]}
              />
              <div style={{ marginTop: 12 }}>
                <TabLink path="geo" search={search} label="Geo intelligence →" />
              </div>
            </PageCard>
          </div>

          <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <PageCard style={{ padding: 22 }}>
              <SectionTitle title="Top visitor cities" subtitle="Distinct sessions by market." />
              <SimpleTable
                rows={c.visitors_by_city?.slice(0, 8)}
                columns={[
                  ["City", "location_label"],
                  ["Visitors", "visitors"],
                  ["Page views", "page_views"],
                ]}
              />
              <div style={{ marginTop: 12 }}>
                <TabLink path="site-activity" search={search} label="Site activity →" />
              </div>
            </PageCard>
          </div>
        </>
      ) : null}

      <SectionTitle
        title="Explore by area"
        subtitle="Pick a category for full detail in this date range."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {DRILL_DOWN_AREAS.map((area) => (
          <Link
            key={area.id}
            to={{ pathname: `/owner/intelligence/${area.path}`, search }}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <PageCard style={{ padding: 20, height: "100%", cursor: "pointer" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: OWNER_COLORS.ink }}>{area.title}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: OWNER_COLORS.muted, lineHeight: 1.5 }}>
                {area.description}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent }}>
                Open →
              </div>
            </PageCard>
          </Link>
        ))}
      </div>

      <EmptyState>
        Tabs above mirror these categories: {INTELLIGENCE_TABS.filter((t) => !t.end).map((t) => t.label).join(", ")}.
      </EmptyState>
    </div>
  );
}

function LinkedMetric({ label, value, to }) {
  return (
    <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
      <MetricCard label={label} value={value} />
    </Link>
  );
}

function TabLink({ path, search, label }) {
  return (
    <Link
      to={{ pathname: `/owner/intelligence/${path}`, search }}
      style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent }}
    >
      {label}
    </Link>
  );
}
