import React from "react";
import { EmptyState } from "../OwnerLayout.jsx";
import { usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";
import {
  ErrorBanner,
  IntelligenceSection,
  LoadingState,
  MetricCard,
  SimpleTable,
  useIntelligenceData,
} from "./intelligenceShared.jsx";
import { getOwnerIntelligenceOverview } from "../../../lib/ownerApi.js";

export default function IntelligenceOverview() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceOverview, range);

  if (loading) return <LoadingState />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) {
    return <EmptyState>No platform activity recorded in this date range yet.</EmptyState>;
  }

  const s = data.summary || {};
  const t = data.trends || {};
  const c = data.charts || {};

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
        <MetricCard label="Total Visits" value={s.total_visits} />
        <MetricCard label="Unique Visitors" value={s.unique_visitors} />
        <MetricCard label="Total Searches" value={s.total_searches} />
        <MetricCard label="Unique Searchers" value={s.unique_searchers} />
        <MetricCard label="Search Success Rate" value={`${s.search_success_rate_pct}%`} />
        <MetricCard label="Zero Result Rate" value={`${s.zero_result_rate_pct}%`} />
        <MetricCard label="Menu Views" value={s.menu_views} />
        <MetricCard label="Restaurant Views" value={s.restaurant_views} />
        <MetricCard label="Menu Item Views" value={s.menu_item_views} />
        <MetricCard label="Order Clicks" value={s.order_clicks} />
        <MetricCard label="Call Clicks" value={s.call_clicks} />
        <MetricCard label="Directions Clicks" value={s.directions_clicks} />
        <MetricCard label="Share Clicks" value={s.share_clicks} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
        <MetricCard label="Visits Today" value={t.visits_today} />
        <MetricCard label="Searches Today" value={t.searches_today} />
        <MetricCard label="7-Day Growth" value={`${t.growth_7_day_pct}%`} />
        <MetricCard label="30-Day Growth" value={`${t.growth_30_day_pct}%`} />
        <MetricCard label="Avg Searches / User" value={t.avg_searches_per_user} />
        <MetricCard label="Avg Response Time" value={t.avg_response_time_ms != null ? `${t.avg_response_time_ms} ms` : t.avg_response_time_ms} />
      </div>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection title="Visits by Day" subtitle="Daily page visits.">
          <SimpleTable rows={c.visits_by_day} columns={[["Day", "day"], ["Visits", "visits"]]} />
        </IntelligenceSection>
        <IntelligenceSection title="Searches by Day" subtitle="Daily search volume.">
          <SimpleTable rows={c.searches_by_day} columns={[["Day", "day"], ["Searches", "searches"]]} />
        </IntelligenceSection>
      </div>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection title="Top Queries" subtitle="What diners are searching for.">
          <SimpleTable rows={c.top_queries} columns={[["Query", "query"], ["Count", "count"]]} />
        </IntelligenceSection>
        <IntelligenceSection title="Top Cities" subtitle="Search demand by city (reporting-normalized).">
          <SimpleTable rows={c.top_cities} columns={[["City", "location_label"], ["Searches", "count"]]} />
        </IntelligenceSection>
      </div>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection title="Top Menus" subtitle="Restaurant menu page views (by restaurant_id).">
          <SimpleTable
            rows={c.top_menus}
            columns={[["Restaurant ID", "restaurant_id"], ["Views", "views"]]}
          />
        </IntelligenceSection>
        <IntelligenceSection title="Top Menu Items" subtitle="Menu item page views.">
          <SimpleTable rows={c.top_menu_items} columns={[["Menu Item ID", "menu_item_id"], ["Views", "views"]]} />
        </IntelligenceSection>
      </div>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection title="Top Referrers" subtitle="Traffic sources.">
          <SimpleTable rows={c.top_referrers} columns={[["Source", "source"], ["Visits", "visits"]]} />
        </IntelligenceSection>
        <IntelligenceSection title="Device Breakdown" subtitle="Captured device types.">
          <SimpleTable rows={c.device_breakdown} columns={[["Device", "device_type"], ["Visits", "visits"]]} />
        </IntelligenceSection>
      </div>
    </div>
  );
}
