import React from "react";
import { EmptyState } from "../OwnerLayout.jsx";
import { usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";
import {
  ErrorBanner,
  IntelligenceSection,
  LoadingState,
  SimpleTable,
  useIntelligenceData,
} from "./intelligenceShared.jsx";
import { getOwnerIntelligenceMarket } from "../../../lib/ownerApi.js";

export default function IntelligenceMarket() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceMarket, range);

  if (loading) return <LoadingState label="Loading market intelligence…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) return <EmptyState>No market demand data in this range.</EmptyState>;

  return (
    <IntelligenceSection
      title="Market Priorities"
      subtitle="Operational onboarding priorities derived from demand, coverage, and zero-result rates."
    >
      <SimpleTable
        rows={data.markets || []}
        columns={[
          ["Market", "location_label"],
          ["Population", "population"],
          ["Restaurants", "restaurants_onboarded"],
          ["Menus", "menus_onboarded"],
          ["Items Indexed", "menu_items_indexed"],
          ["Searches", "total_searches"],
          ["Visits", "total_visits"],
          ["Zero Results", "zero_result_searches"],
          ["Zero Rate", "zero_result_rate_pct", (row) => `${row.zero_result_rate_pct}%`],
          ["Coverage", "coverage_pct"],
          ["Recommended Action", "recommended_action"],
        ]}
      />
    </IntelligenceSection>
  );
}
