import React, { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState, OWNER_COLORS, PageCard } from "../OwnerLayout.jsx";
import { usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";
import {
  ErrorBanner,
  IntelligenceSection,
  LoadingState,
  MetricCard,
  SimpleTable,
  AnalyticsScopeNote,
  CityLinkButton,
  CityVisitorInsightPanel,
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

function cityScopeSuffix(selectedCity) {
  return selectedCity ? ` Scoped to ${selectedCity}.` : "";
}

export default function IntelligenceSiteActivity() {
  const { range } = usePlatformIntelligenceRange();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCity = String(searchParams.get("location_label") || "").trim() || null;

  const setSelectedCity = useCallback(
    (nextCity) => {
      const params = new URLSearchParams(searchParams);
      if (nextCity) params.set("location_label", nextCity);
      else params.delete("location_label");
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const fetchParams = useMemo(
    () => ({
      start_date: range.start_date,
      end_date: range.end_date,
      timezone: range.timezone,
      ...(selectedCity ? { location_label: selectedCity } : {}),
    }),
    [range.start_date, range.end_date, range.timezone, selectedCity]
  );

  const { data, error, loading } = useIntelligenceData(
    getOwnerIntelligenceSiteActivity,
    fetchParams
  );

  if (loading) {
    return (
      <LoadingState
        label={
          selectedCity
            ? `Loading site activity for ${selectedCity}…`
            : "Loading site activity…"
        }
      />
    );
  }
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) {
    return (
      <EmptyState>
        {selectedCity
          ? `No site activity for ${selectedCity} in this range.`
          : "No site activity in this range."}
      </EmptyState>
    );
  }

  const browsers = Array.isArray(data.browsers) ? data.browsers : null;
  const operatingSystems = Array.isArray(data.operating_systems) ? data.operating_systems : null;
  const languageByCity = Array.isArray(data.language_intelligence?.language_by_city)
    ? data.language_intelligence.language_by_city
    : null;
  const avgSubtitle =
    data.avg_session_length && typeof data.avg_session_length === "object"
      ? `${data.avg_session_length.avg_page_views ?? "—"} pages / session · ${data.avg_session_length.session_count ?? 0} sessions`
      : null;
  const scopeNote = cityScopeSuffix(selectedCity);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <AnalyticsScopeNote note={data.analytics_scope} />

      {selectedCity ? (
        <PageCard
          style={{
            padding: 16,
            borderColor: OWNER_COLORS.accent,
            background: "#fffaf6",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink }}>
              Showing Site Activity for {selectedCity}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
              {data.city_scope_note ||
                "All metrics below use market-attributed visits for this city (not IP). Visitors by City stays platform-wide so you can switch."}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCity(null)}
            style={{
              flexShrink: 0,
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${OWNER_COLORS.line}`,
              background: "#fff",
              color: OWNER_COLORS.ink,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Clear city
          </button>
        </PageCard>
      ) : null}

      <IntelligenceSection
        title="Visits by Day"
        subtitle={`Visitor sessions (distinct) and consumer page views per day.${scopeNote}`}
      >
        <SimpleTable
          rows={data.visits_by_day}
          columns={[
            ["Day", "day"],
            ["Visitor sessions", "visitor_sessions"],
            ["Page views", "page_views"],
          ]}
        />
      </IntelligenceSection>

      <IntelligenceSection
        title="Visitors by City"
        subtitle="Distinct sessions and page views by market (city/state). Click a city to scope the whole page to that market."
      >
        <SimpleTable
          rows={data.visitors_by_city}
          columns={[
            [
              "City",
              "location_label",
              (row) => (
                <CityLinkButton
                  label={row.location_label}
                  selected={selectedCity === row.location_label}
                  onClick={() =>
                    setSelectedCity(
                      selectedCity === row.location_label ? null : row.location_label
                    )
                  }
                />
              ),
            ],
            ["Visitors", "visitors"],
            ["Page views", "page_views"],
          ]}
        />
      </IntelligenceSection>

      {selectedCity ? (
        <CityVisitorInsightPanel
          locationLabel={selectedCity}
          range={range}
          onClose={() => setSelectedCity(null)}
        />
      ) : null}

      <div
        className="owner-responsive-grid-2"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)", gap: 18, minWidth: 0 }}
      >
        <IntelligenceSection
          title="Top Pages"
          subtitle={`Consumer page views by path. Browse carousel steps (&i=N) are rolled up.${scopeNote}`}
        >
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
        <IntelligenceSection title="Referral Sources" subtitle={`Where traffic originates.${scopeNote}`}>
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
        <IntelligenceSection title="Top Entry Pages" subtitle={`First path in each visitor session.${scopeNote}`}>
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
        <IntelligenceSection title="Top Exit Pages" subtitle={`Last path in each visitor session.${scopeNote}`}>
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

      <IntelligenceSection title="Device Types" subtitle={`Desktop / mobile / tablet with share of visits.${scopeNote}`}>
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
        <IntelligenceSection title="Browsers" subtitle={`From page visit metadata (new visits after enrichment).${scopeNote}`}>
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
        <IntelligenceSection title="Operating Systems" subtitle={`From page visit metadata (new visits after enrichment).${scopeNote}`}>
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
        subtitle={`${data.language_intelligence?.note || "Language capture not yet implemented."}${scopeNote}`}
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
