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
import { getOwnerIntelligenceRestaurant } from "../../../lib/ownerApi.js";

export default function IntelligenceRestaurant() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceRestaurant, range);

  if (loading) return <LoadingState label="Loading restaurant intelligence…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) return <EmptyState>No restaurant analytics in this range.</EmptyState>;

  return (
    <IntelligenceSection
      title="Restaurant Performance"
      subtitle="Platform-wide restaurant analytics. Eventually visible to restaurant owners."
    >
      <SimpleTable
        rows={data.restaurants || []}
        columns={[
          ["Restaurant", "restaurant_name"],
          ["Profile Views", "restaurant_views"],
          ["Menu Views", "menu_views"],
          ["Search Appearances", "search_appearances"],
          ["Search CTR", "search_ctr"],
          ["Call Clicks", "call_clicks"],
          ["Directions", "directions_clicks"],
          ["Website Clicks", "website_clicks"],
          ["Order Clicks", "order_clicks"],
          ["Shares", "shares"],
          ["Favorites", "favorites"],
          ["Avg Search Position", "avg_search_position"],
          ["City", "city"],
          ["State", "state"],
        ]}
      />
    </IntelligenceSection>
  );
}
