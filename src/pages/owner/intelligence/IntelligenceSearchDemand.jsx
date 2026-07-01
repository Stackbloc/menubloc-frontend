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
import { getOwnerIntelligenceSearchDemand } from "../../../lib/ownerApi.js";

export default function IntelligenceSearchDemand() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceSearchDemand, range);

  if (loading) return <LoadingState label="Loading search demand…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) return <EmptyState>No search demand data in this range.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <IntelligenceSection
        title="Top Raw Queries"
        subtitle="Uncorrected user queries — source of truth for demand signals."
      >
        <SimpleTable rows={data.top_raw_queries} columns={[["Query", "query"], ["Count", "count"]]} />
      </IntelligenceSection>

      <IntelligenceSection
        title="Normalized Food Demand"
        subtitle={
          data.normalized_demand_status === "todo_normalized_food_taxonomy"
            ? "TODO: wire food taxonomy normalization (burger → Burgers). Showing corrected_query rollup when available."
            : "Partial rollup from corrected_query field."
        }
      >
        {data.normalized_food_demand?.length ? (
          <SimpleTable
            rows={data.normalized_food_demand}
            columns={[["Normalized Query", "normalized_query"], ["Count", "count"]]}
          />
        ) : (
          <EmptyState>Normalized food demand taxonomy not yet complete. Raw queries shown above.</EmptyState>
        )}
      </IntelligenceSection>

      <div className="owner-responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 14 }}>
        <MetricCard label="Cuisine Demand" value={data.cuisine_demand} />
        <MetricCard label="Meal-Time Demand" value={data.meal_time_demand} />
        <MetricCard label="Diet / Health Searches" value={data.diet_health_searches} />
        <MetricCard label="Ingredient Searches" value={data.ingredient_searches} />
        <MetricCard label="Restaurant Name Searches" value={data.restaurant_name_searches} />
        <MetricCard label="Deal Searches" value={data.deal_searches} />
      </div>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection title="Fastest Growing Searches" subtitle="Period-over-period growth.">
          <SimpleTable
            rows={data.search_trends?.fastest_growing || []}
            columns={[
              ["Query", "query"],
              ["Current", "current_count"],
              ["Prior", "prior_count"],
              ["Change", "change_pct", (row) => `${row.change_pct}%`],
            ]}
          />
        </IntelligenceSection>
        <IntelligenceSection title="Declining Searches" subtitle="Queries losing volume.">
          <SimpleTable
            rows={data.search_trends?.declining || []}
            columns={[
              ["Query", "query"],
              ["Current", "current_count"],
              ["Prior", "prior_count"],
              ["Change", "change_pct", (row) => `${row.change_pct}%`],
            ]}
          />
        </IntelligenceSection>
      </div>

      <IntelligenceSection title="Search Intent" subtitle="How people use Menuply search (conservative classification).">
        <SimpleTable
          rows={data.search_intent || []}
          columns={[
            ["Intent", "label"],
            ["Count", "count"],
            ["Share", "pct", (row) => `${row.pct}%`],
          ]}
        />
      </IntelligenceSection>

      <IntelligenceSection
        title="Zero Result Intelligence"
        subtitle="Engineering repair queue — failure reasons default to Unknown until automated diagnosis ships."
      >
        <SimpleTable
          rows={data.zero_result_intelligence || []}
          columns={[
            ["Query", "query"],
            ["Count", "count"],
            ["Location", "location_label"],
            ["Intent", "detected_intent"],
            ["Last Seen", "last_seen"],
            ["Failure Reason", "likely_failure_reason"],
            ["Suggested Resolution", "suggested_resolution"],
          ]}
        />
      </IntelligenceSection>

      <div className="owner-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <IntelligenceSection title="Zero Results by City" subtitle="Grouped repair queue.">
          <SimpleTable
            rows={data.zero_result_groupings?.by_city || []}
            columns={[["City", "label"], ["Total Count", "total_count"], ["Distinct Queries", "queries"]]}
          />
        </IntelligenceSection>
        <IntelligenceSection title="Zero Results by Intent" subtitle="Grouped by detected intent.">
          <SimpleTable
            rows={data.zero_result_groupings?.by_intent || []}
            columns={[["Intent", "label"], ["Total Count", "total_count"], ["Distinct Queries", "queries"]]}
          />
        </IntelligenceSection>
      </div>
    </div>
  );
}
