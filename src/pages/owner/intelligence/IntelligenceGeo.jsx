import React from "react";
import { EmptyState } from "../OwnerLayout.jsx";
import { usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";
import {
  ErrorBanner,
  IntelligenceSection,
  LoadingState,
  MetricCard,
  SimpleTable,
  AnalyticsScopeNote,
  useIntelligenceData,
} from "./intelligenceShared.jsx";
import { getOwnerIntelligenceGeo } from "../../../lib/ownerApi.js";

export default function IntelligenceGeo() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceGeo, range);

  if (loading) return <LoadingState label="Loading geo intelligence…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) return <EmptyState>No geo data in this range.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <AnalyticsScopeNote note={data.analytics_scope} />

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <MetricCard label="Searches by Country" value={data.searches_by_country} />
        <MetricCard label="Visits by Country" value={data.visits_by_country} />
        <MetricCard label="Searches by State" value={data.searches_by_state} />
        <MetricCard label="Visits by State" value={data.visits_by_state} />
        <MetricCard label="Language by Geography" value={data.language_preference_by_geography} />
      </div>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection title="Searches by City" subtitle="Consumer searches by market (city/state).">
          <SimpleTable
            rows={data.searches_by_city}
            columns={[
              ["City", "location_label"],
              ["Searches", "searches"],
            ]}
          />
        </IntelligenceSection>
        <IntelligenceSection title="Visitors by City" subtitle="Distinct visitor sessions and page views by market.">
          <SimpleTable
            rows={data.visits_by_city}
            columns={[
              ["City", "location_label"],
              ["Visitors", "visitors"],
              ["Page views", "visits"],
            ]}
          />
        </IntelligenceSection>
      </div>

      <IntelligenceSection title="Zero Result Rate by City" subtitle="Cities with at least 5 searches in range.">
        <SimpleTable
          rows={data.zero_result_rate_by_city}
          columns={[
            ["City", "location_label"],
            ["Searches", "searches"],
            ["Zero Results", "zero_results"],
            ["Rate", "zero_result_rate_pct", (row) => `${row.zero_result_rate_pct}%`],
          ]}
        />
      </IntelligenceSection>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection title="Top Searches by City" subtitle="Successful searches.">
          <SimpleTable
            rows={data.top_searches_by_city}
            columns={[["City", "location_label"], ["Query", "query"], ["Count", "count"]]}
          />
        </IntelligenceSection>
        <IntelligenceSection title="Top Failed Searches by City" subtitle="Zero-result queries.">
          <SimpleTable
            rows={data.top_failed_searches_by_city}
            columns={[["City", "location_label"], ["Query", "query"], ["Count", "count"]]}
          />
        </IntelligenceSection>
      </div>

      <IntelligenceSection title="Device Type by Geography" subtitle="Device mix per city from page visits.">
        <SimpleTable
          rows={data.device_type_by_geography}
          columns={[["City", "location_label"], ["Device", "device_type"], ["Visits", "visits"]]}
        />
      </IntelligenceSection>
    </div>
  );
}
