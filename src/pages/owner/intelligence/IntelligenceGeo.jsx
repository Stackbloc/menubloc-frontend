import React, { useEffect, useState } from "react";
import { EmptyState } from "../OwnerLayout.jsx";
import { usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";
import {
  ErrorBanner,
  IntelligenceSection,
  LoadingState,
  SimpleTable,
  AnalyticsScopeNote,
  CityLinkButton,
  CityVisitorInsightPanel,
  StateSearchInsightPanel,
  formatMetricValue,
  useIntelligenceData,
} from "./intelligenceShared.jsx";
import { getOwnerIntelligenceGeo } from "../../../lib/ownerApi.js";

export default function IntelligenceGeo() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceGeo, range);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    setSelectedCity(null);
    setSelectedState(null);
  }, [range.start_date, range.end_date, range.timezone]);

  if (loading) return <LoadingState label="Loading geo intelligence…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) return <EmptyState>No geo data in this range.</EmptyState>;

  const searchesByCountry = Array.isArray(data.searches_by_country) ? data.searches_by_country : [];
  const visitsByCountry = Array.isArray(data.visits_by_country) ? data.visits_by_country : [];
  const searchesByState = Array.isArray(data.searches_by_state) ? data.searches_by_state : [];
  const visitsByState = Array.isArray(data.visits_by_state) ? data.visits_by_state : [];
  const languageByGeography = Array.isArray(data.language_preference_by_geography)
    ? data.language_preference_by_geography
    : null;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <AnalyticsScopeNote note={data.analytics_scope} />
      {data.country_attribution_note ? (
        <AnalyticsScopeNote note={data.country_attribution_note} />
      ) : null}

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection
          title="Searches by Country"
          subtitle="Derived from known US state codes on search requests (not IP geolocation)."
        >
          {Array.isArray(data.searches_by_country) ? (
            <SimpleTable
              rows={searchesByCountry}
              columns={[
                ["Country", "country"],
                ["Searches", "searches"],
              ]}
              emptyLabel="No searches with a known US state in this range."
            />
          ) : (
            <EmptyState>{formatMetricValue(data.searches_by_country)}</EmptyState>
          )}
        </IntelligenceSection>
        <IntelligenceSection
          title="Visitors by Country"
          subtitle="Derived from market/restaurant US state on page visits (not IP geolocation)."
        >
          {Array.isArray(data.visits_by_country) ? (
            <SimpleTable
              rows={visitsByCountry}
              columns={[
                ["Country", "country"],
                ["Visitors", "visitors"],
                ["Page views", "visits"],
              ]}
              emptyLabel="No visits with a known US state in this range."
            />
          ) : (
            <EmptyState>{formatMetricValue(data.visits_by_country)}</EmptyState>
          )}
        </IntelligenceSection>
      </div>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection
          title="Searches by State"
          subtitle="Consumer searches rolled up by US state. Click a state to see search terms."
        >
          <SimpleTable
            rows={searchesByState}
            columns={[
              [
                "State",
                "state",
                (row) => (
                  <CityLinkButton
                    label={row.state}
                    selected={selectedState === row.state}
                    onClick={() =>
                      setSelectedState((prev) => (prev === row.state ? null : row.state))
                    }
                  />
                ),
              ],
              ["Searches", "searches"],
            ]}
            emptyLabel="No searches with state in this range."
          />
        </IntelligenceSection>
        <IntelligenceSection
          title="Visitors by State"
          subtitle="Distinct visitor sessions and page views by state (from market or restaurant)."
        >
          <SimpleTable
            rows={visitsByState}
            columns={[
              ["State", "state"],
              ["Visitors", "visitors"],
              ["Page views", "visits"],
            ]}
            emptyLabel="No visits with state in this range."
          />
        </IntelligenceSection>
      </div>

      {selectedState ? (
        <StateSearchInsightPanel
          state={selectedState}
          range={range}
          onClose={() => setSelectedState(null)}
        />
      ) : null}

      <IntelligenceSection
        title="Language by Geography"
        subtitle="Menuply UI language preference from page visits with language metadata, by market."
      >
        {languageByGeography ? (
          <SimpleTable
            rows={languageByGeography}
            columns={[
              ["City", "location_label"],
              ["Language", "language"],
              ["Visits", "visits"],
            ]}
            emptyLabel="No language-by-city rows in this range."
          />
        ) : (
          <EmptyState>{formatMetricValue(data.language_preference_by_geography)}</EmptyState>
        )}
      </IntelligenceSection>

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
        <IntelligenceSection
          title="Visitors by City"
          subtitle="Distinct visitor sessions and page views by market. Click a city to see how those visitors arrived."
        >
          <SimpleTable
            rows={data.visits_by_city}
            columns={[
              [
                "City",
                "location_label",
                (row) => (
                  <CityLinkButton
                    label={row.location_label}
                    selected={selectedCity === row.location_label}
                    onClick={() =>
                      setSelectedCity((prev) =>
                        prev === row.location_label ? null : row.location_label
                      )
                    }
                  />
                ),
              ],
              ["Visitors", "visitors"],
              ["Page views", "visits"],
            ]}
          />
        </IntelligenceSection>
      </div>

      {selectedCity ? (
        <CityVisitorInsightPanel
          locationLabel={selectedCity}
          range={range}
          onClose={() => setSelectedCity(null)}
        />
      ) : null}

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

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection
          title="Trending Brands by City"
          subtitle="Brand-name searches rising vs the prior equal-length period, by market."
        >
          <SimpleTable
            rows={data.trending_brands_by_city?.rising || []}
            columns={[
              ["City", "location_label"],
              ["Brand", "brand"],
              ["Current", "current_count"],
              ["Prior", "prior_count"],
              ["Change", "change_pct", (row) => `${row.change_pct}%`],
            ]}
            emptyLabel="No rising brand searches by city in this range."
          />
        </IntelligenceSection>
        <IntelligenceSection title="Declining Brands by City" subtitle="Brand searches losing volume by market.">
          <SimpleTable
            rows={data.trending_brands_by_city?.declining || []}
            columns={[
              ["City", "location_label"],
              ["Brand", "brand"],
              ["Current", "current_count"],
              ["Prior", "prior_count"],
              ["Change", "change_pct", (row) => `${row.change_pct}%`],
            ]}
            emptyLabel="No declining brand searches by city in this range."
          />
        </IntelligenceSection>
      </div>

      <IntelligenceSection title="Top Brands by City (this period)" subtitle="Brand-name search volume by market.">
        <SimpleTable
          rows={data.trending_brands_by_city?.top_current || []}
          columns={[
            ["City", "location_label"],
            ["Brand", "brand"],
            ["Searches", "count"],
          ]}
          emptyLabel="No brand-name searches with city in this range."
        />
      </IntelligenceSection>

      <IntelligenceSection title="Device Type by Geography" subtitle="Device mix per city from page visits.">
        <SimpleTable
          rows={data.device_type_by_geography}
          columns={[["City", "location_label"], ["Device", "device_type"], ["Visits", "visits"]]}
        />
      </IntelligenceSection>
    </div>
  );
}
