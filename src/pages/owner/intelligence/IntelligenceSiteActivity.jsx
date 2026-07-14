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
  formatMetricValue,
  useIntelligenceData,
} from "./intelligenceShared.jsx";
import { getOwnerIntelligenceSiteActivity } from "../../../lib/ownerApi.js";

function formatAvgSession(value) {
  if (value && typeof value === "object" && value.label) {
    return value.label;
  }
  return formatMetricValue(value);
}

export default function IntelligenceSiteActivity() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceSiteActivity, range);

  if (loading) return <LoadingState label="Loading site activity…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) return <EmptyState>No site activity in this range.</EmptyState>;

  const browsers = Array.isArray(data.browsers) ? data.browsers : null;
  const operatingSystems = Array.isArray(data.operating_systems) ? data.operating_systems : null;
  const languageByCity = Array.isArray(data.language_intelligence?.language_by_city)
    ? data.language_intelligence.language_by_city
    : null;
  const avgSubtitle =
    data.avg_session_length && typeof data.avg_session_length === "object"
      ? `${data.avg_session_length.avg_page_views ?? "—"} pages / session · ${data.avg_session_length.session_count ?? 0} sessions`
      : null;

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

      <div
        className="owner-responsive-grid-2"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)", gap: 18, minWidth: 0 }}
      >
        <IntelligenceSection title="Top Pages" subtitle="Consumer page views by path. Browse carousel steps (&i=N) are rolled up.">
          <SimpleTable
            rows={data.top_pages}
            columns={[
              ["Path", "path"],
              ["Page views", "visits"],
              ["Sessions", "sessions"],
            ]}
            wrapKeys={["path"]}
          />
        </IntelligenceSection>
        <IntelligenceSection title="Referral Sources" subtitle="Where traffic originates.">
          <SimpleTable
            rows={data.referral_sources}
            columns={[
              ["Source", "source"],
              ["Visits", "visits"],
            ]}
            wrapKeys={["source"]}
          />
        </IntelligenceSection>
      </div>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18, minWidth: 0, alignItems: "start" }}>
        <IntelligenceSection title="Top Entry Pages" subtitle="First path in each visitor session.">
          <SimpleTable
            rows={data.top_entry_pages}
            columns={[
              ["Path", "path"],
              ["Sessions", "sessions"],
            ]}
            wrapKeys={["path"]}
            maxHeight={360}
          />
        </IntelligenceSection>
        <IntelligenceSection title="Top Exit Pages" subtitle="Last path in each visitor session.">
          <SimpleTable
            rows={data.top_exit_pages}
            columns={[
              ["Path", "path"],
              ["Sessions", "sessions"],
            ]}
            wrapKeys={["path"]}
            maxHeight={360}
          />
        </IntelligenceSection>
      </div>

      <div className="owner-responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 14 }}>
        <MetricCard
          label="Avg Session Length"
          value={formatAvgSession(data.avg_session_length)}
          subtitle={avgSubtitle}
        />
        <MetricCard
          label="Primary Language"
          value={data.language_intelligence?.primary_language}
        />
        <MetricCard
          label="Browsers / OS"
          value={
            browsers || operatingSystems
              ? `${browsers?.[0]?.browser || "—"} / ${operatingSystems?.[0]?.os || "—"}`
              : data.browsers
          }
          subtitle="Top browser and OS from recent enriched visits"
        />
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

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18, minWidth: 0 }}>
        <IntelligenceSection title="Browsers" subtitle="From page visit metadata (new visits after enrichment).">
          {browsers ? (
            <SimpleTable
              rows={browsers}
              columns={[
                ["Browser", "browser"],
                ["Visits", "visits"],
              ]}
            />
          ) : (
            <EmptyState>{formatMetricValue(data.browsers)}</EmptyState>
          )}
        </IntelligenceSection>
        <IntelligenceSection title="Operating Systems" subtitle="From page visit metadata (new visits after enrichment).">
          {operatingSystems ? (
            <SimpleTable
              rows={operatingSystems}
              columns={[
                ["OS", "os"],
                ["Visits", "visits"],
              ]}
            />
          ) : (
            <EmptyState>{formatMetricValue(data.operating_systems)}</EmptyState>
          )}
        </IntelligenceSection>
      </div>

      <IntelligenceSection
        title="Language Intelligence"
        subtitle={data.language_intelligence?.note || "Language capture not yet implemented."}
      >
        {languageByCity ? (
          <SimpleTable
            rows={languageByCity}
            columns={[
              ["City", "location_label"],
              ["Language", "language"],
              ["Visits", "visits"],
            ]}
          />
        ) : (
          <MetricCard
            label="Language by City"
            value={data.language_intelligence?.language_by_city}
          />
        )}
      </IntelligenceSection>
    </div>
  );
}
