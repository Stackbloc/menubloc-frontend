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
import { getOwnerIntelligenceMenu } from "../../../lib/ownerApi.js";

const MENU_ITEM_COLUMNS = [
  ["Name / ID", "restaurant_name", (row) => row.restaurant_name || row.menu_item_id],
  ["Views", "views"],
  ["Search Appearances", "search_appearances"],
  ["CTR", "ctr"],
  ["Shares", "shares"],
  ["Saves", "saves"],
  ["Order Clicks", "order_clicks"],
  ["Call Clicks", "call_clicks"],
  ["Directions", "directions"],
  ["City", "city"],
  ["State", "state"],
];

export default function IntelligenceMenu() {
  const { range } = usePlatformIntelligenceRange();
  const { data, error, loading } = useIntelligenceData(getOwnerIntelligenceMenu, range);

  if (loading) return <LoadingState label="Loading menu intelligence…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!data?.available) return <EmptyState>No menu view data in this range.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <IntelligenceSection title="Top Menus" subtitle="Menu page views with engagement metrics where tracked.">
        <SimpleTable rows={data.top_menus} columns={MENU_ITEM_COLUMNS} />
      </IntelligenceSection>

      <IntelligenceSection title="Top Restaurant Profiles" subtitle="Restaurant profile page views.">
        <SimpleTable rows={data.top_restaurant_profiles} columns={MENU_ITEM_COLUMNS} />
      </IntelligenceSection>

      <IntelligenceSection title="Top Menu Items" subtitle="Item-level page views.">
        <SimpleTable
          rows={data.top_menu_items}
          columns={[
            ["Menu Item ID", "menu_item_id"],
            ["Views", "views"],
            ["Search Appearances", "search_appearances"],
            ["CTR", "ctr"],
            ["Shares", "shares"],
            ["Saves", "saves"],
            ["Order Clicks", "order_clicks"],
          ]}
        />
      </IntelligenceSection>

      <div className="owner-responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 14 }}>
        <MetricCard label="Top Menu Sections" value={data.top_menu_sections} />
        <MetricCard label="Top Shared Menu Items" value={data.top_shared_menu_items} />
        <MetricCard label="Top Saved Menu Items" value={data.top_saved_menu_items} />
        <MetricCard label="Top Ordered Menu Items" value={data.top_ordered_menu_items} />
        <MetricCard label="Top Call Clicks" value={data.top_call_clicks} />
        <MetricCard label="Top Direction Clicks" value={data.top_direction_clicks} />
      </div>
    </div>
  );
}
