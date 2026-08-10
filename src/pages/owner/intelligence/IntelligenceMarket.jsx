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

  const markets = data?.markets || [];
  const distributors = data?.new_distributors || { count: 0, rows: [] };
  const hasMarkets = markets.length > 0;
  const hasDistributors = Number(distributors.count) > 0 || (distributors.rows || []).length > 0;

  if (!data?.available && !hasMarkets && !hasDistributors) {
    return <EmptyState>No market demand data in this range.</EmptyState>;
  }

  const distributorCount = Number(distributors.count) || 0;

  return (
    <>
      <IntelligenceSection
        title="Market Priorities"
        subtitle="Operational onboarding priorities derived from demand, coverage, and zero-result rates."
      >
        <SimpleTable
          rows={markets}
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
          emptyLabel="No market demand rows in this range."
        />
      </IntelligenceSection>

      <IntelligenceSection
        title="New distributors"
        subtitle={`${distributorCount.toLocaleString()} distributor profile${distributorCount === 1 ? "" : "s"} added in the selected range (self-serve join / catalog).`}
      >
        <SimpleTable
          rows={distributors.rows || []}
          columns={[
            ["Added", "created_at", (row) => formatWhen(row.created_at)],
            ["Distributor", "display_name"],
            ["Slug", "slug"],
            ["City", "city"],
            ["State", "state"],
            ["Markets", "geographic_markets_label"],
            ["Claim", "profile_claim_status"],
            ["Public", "is_public_profile", (row) => (row.is_public_profile ? "Yes" : "No")],
            ["Category", "category_label"],
          ]}
          emptyLabel="No distributors added in this range."
        />
      </IntelligenceSection>
    </>
  );
}

function formatWhen(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}
