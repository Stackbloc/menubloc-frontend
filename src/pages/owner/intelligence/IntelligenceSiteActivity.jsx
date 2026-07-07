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
import { getOwnerIntelligenceSiteActivity } from "../../../lib/ownerApi.js";

export default function IntelligenceSiteActivity() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceSiteActivity, range);

  if (loading) return <LoadingState label="Loading site activity…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) return <EmptyState>No site activity in this range.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <AnalyticsScopeNote note={data.analytics_scope} />

      <IntelligenceSection title="Visits by Day" subtitle="Visitor sessions (distinct) and consumer page views per day.">
        <SimpleTable
          rows={data.visits_by_day}
          columns={[
            ["Day", "day"],
            ["Visitor sessions", "visitor_sessions"],
            ["Page views", "page_views"],
          ]}
        />
      </IntelligenceSection>

      <IntelligenceSection title="Visitors by City" subtitle="Distinct sessions and page views by market (city/state).">
        <SimpleTable
          rows={data.visitors_by_city}
          columns={[
            ["City", "location_label"],
            ["Visitors", "visitors"],
            ["Page views", "page_views"],
          ]}
        />
      </IntelligenceSection>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection title="Top Pages" subtitle="Consumer page views by path. Browse carousel steps (&i=N) are rolled up.">
          <SimpleTable
            rows={data.top_pages}
            columns={[
              ["Path", "path"],
              ["Page views", "visits"],
              ["Sessions", "sessions"],
            ]}
          />
        </IntelligenceSection>
        <IntelligenceSection title="Referral Sources" subtitle="Where traffic originates.">
          <SimpleTable rows={data.referral_sources} columns={[["Source", "source"], ["Visits", "visits"]]} />
        </IntelligenceSection>
      </div>

      <div className="owner-responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 14 }}>
        <MetricCard label="Top Entry Pages" value={data.top_entry_pages} />
        <MetricCard label="Top Exit Pages" value={data.top_exit_pages} />
        <MetricCard label="Avg Session Length" value={data.avg_session_length} />
        <MetricCard label="Browsers" value={data.browsers} />
        <MetricCard label="Operating Systems" value={data.operating_systems} />
        <MetricCard label="Primary Language" value={data.language_intelligence?.primary_language} />
      </div>

      <IntelligenceSection title="Device Types" subtitle="Desktop / mobile / tablet with share of visits.">
        <SimpleTable
          rows={data.device_types || []}
          columns={[
            ["Device", "device_type"],
            ["Visits", "visits"],
            ["Share", "pct", (row) => `${row.pct}%`],
          ]}
        />
      </IntelligenceSection>

      <IntelligenceSection
        title="Language Intelligence"
        subtitle={data.language_intelligence?.note || "Language capture not yet implemented."}
      >
        <MetricCard label="Language by City" value={data.language_intelligence?.language_by_city} />
      </IntelligenceSection>
    </div>
  );
}
