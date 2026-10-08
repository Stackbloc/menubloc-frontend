import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState, OWNER_COLORS, PageCard } from "../OwnerLayout.jsx";
import { usePlatformIntelligenceRange } from "./PlatformIntelligenceContext.jsx";
import {
  ErrorBanner,
  IntelligenceSection,
  LoadingState,
  MetricCard,
  SimpleTable,
} from "./intelligenceShared.jsx";
import { getOwnerEngagementCluster, getOwnerEngagementOverview } from "../../../lib/ownerApi.js";

const EVENT_OPTIONS = [
  "page_view", "menu_item_click", "menu_category_select", "restaurant_click", "outbound_click",
  "event_click", "restaurant_impression", "deal_impression", "deal_click", "ad_impression", "ad_click",
];
const PLACEMENT_CLASS_OPTIONS = [
  ["organic", "Organic"],
  ["house", "House (Menuply)"],
  ["sponsored_unbilled", "Sponsored — not billable"],
  ["paid", "Paid"],
];

function pct(value) {
  return value == null ? "—" : `${value}%`;
}

function useFetch(fetcher, deps) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fetcher()
      .then((data) => !cancelled && setState({ data, error: "", loading: false }))
      .catch((err) => !cancelled && setState({ data: null, error: err?.message || "Engagement data is unavailable.", loading: false }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function countOf(totals, name) {
  return totals?.find((t) => t.event_name === name)?.events || 0;
}

export default function IntelligenceEngagement() {
  const { range } = usePlatformIntelligenceRange();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    restaurant_id: searchParams.get("restaurant_id") || "",
    cluster_id: searchParams.get("cluster_id") || "",
    event_name: searchParams.get("event_name") || "",
    placement_class: searchParams.get("placement_class") || "",
  };
  const [restaurantInput, setRestaurantInput] = useState(filters.restaurant_id);

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  const params = useMemo(
    () => ({ from: range.start_date, to: range.end_date, ...filters }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range.start_date, range.end_date, filters.restaurant_id, filters.cluster_id, filters.event_name, filters.placement_class]
  );
  const overview = useFetch(() => getOwnerEngagementOverview(params), [params]);
  const clusterReport = useFetch(
    () => (filters.cluster_id ? getOwnerEngagementCluster(filters.cluster_id, { from: params.from, to: params.to }) : Promise.resolve(null)),
    [filters.cluster_id, params.from, params.to]
  );

  if (overview.loading && !overview.data) return <LoadingState label="Loading engagement…" />;
  if (overview.error) return <ErrorBanner message={overview.error} />;
  const payload = overview.data;
  if (!payload?.available) {
    return <EmptyState>{payload?.reason || "Engagement tracking has no data yet."}</EmptyState>;
  }
  const rep = payload.report;
  const views = Object.fromEntries((rep.page_views_by_type || []).map((r) => [r.page_type, r]));
  const totals = rep.event_totals || [];
  const clusterOptions = rep.clusters || [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageCard style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
        <label style={labelStyle}>
          Restaurant ID
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFilter("restaurant_id", restaurantInput.trim());
            }}
          >
            <input
              value={restaurantInput}
              onChange={(e) => setRestaurantInput(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="All"
              style={inputStyle}
            />
          </form>
        </label>
        <label style={labelStyle}>
          Cluster
          <select value={filters.cluster_id} onChange={(e) => setFilter("cluster_id", e.target.value)} style={inputStyle}>
            <option value="">All clusters</option>
            {clusterOptions.map((c) => (
              <option key={c.cluster_id} value={c.cluster_id}>{c.cluster_name || `Cluster ${c.cluster_id}`}</option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Event type
          <select value={filters.event_name} onChange={(e) => setFilter("event_name", e.target.value)} style={inputStyle}>
            <option value="">All events</option>
            {EVENT_OPTIONS.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Placement class
          <select value={filters.placement_class} onChange={(e) => setFilter("placement_class", e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {PLACEMENT_CLASS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </PageCard>

      <div style={metricGrid}>
        <MetricCard label="Unique visitors" value={rep.unique_visitors} subtitle="Distinct browsers, not people" />
        <MetricCard label="Restaurant profile views" value={views.profile?.views || 0} subtitle={`${views.profile?.unique_visitors || 0} unique`} />
        <MetricCard label="Menu page views" value={views.menu?.views || 0} subtitle={`${views.menu?.unique_visitors || 0} unique`} />
        <MetricCard label="Menu item clicks" value={countOf(totals, "menu_item_click")} subtitle="Item details opened" />
        <MetricCard label="Cluster page views" value={views.cluster?.views || 0} subtitle={`${views.cluster?.unique_visitors || 0} unique`} />
        <MetricCard label="Deal impressions / clicks" value={`${countOf(totals, "deal_impression")} / ${countOf(totals, "deal_click")}`} subtitle={`${views.deal?.views || 0} deal detail views`} />
        <MetricCard label="Ad impressions / clicks" value={`${countOf(totals, "ad_impression")} / ${countOf(totals, "ad_click")}`} subtitle="All classes — see placements" />
      </div>

      <IntelligenceSection title="Page views by type" subtitle="Views count every navigation; unique visitors count distinct browsers.">
        <SimpleTable rows={rep.page_views_by_type} columns={[["Page type", "page_type"], ["Views", "views"], ["Unique visitors", "unique_visitors"]]} />
      </IntelligenceSection>

      <IntelligenceSection title="Daily trend">
        <SimpleTable
          rows={rep.series}
          maxHeight={360}
          columns={[["Day", "day"], ["Page views", "page_views"], ["Unique visitors", "unique_visitors"], ["Item clicks", "menu_item_clicks"], ["Other clicks", "other_clicks"]]}
        />
      </IntelligenceSection>

      <IntelligenceSection title="Top restaurants" subtitle="By page views, then menu-item clicks.">
        <SimpleTable
          rows={rep.top_restaurants}
          wrapKeys={["restaurant_name"]}
          columns={[["Restaurant", "restaurant_name"], ["ID", "restaurant_id"], ["Profile views", "profile_views"], ["Menu views", "menu_views"], ["Unique", "unique_visitors"], ["Item clicks", "menu_item_clicks"], ["Other clicks", "other_clicks"]]}
        />
      </IntelligenceSection>

      <IntelligenceSection title="Top menu items by clicks" subtitle="Item exposure (views) is not measured, so no item view or CTR is shown.">
        <SimpleTable
          rows={rep.top_menu_items}
          wrapKeys={["menu_item_name", "restaurant_name"]}
          columns={[
            ["Menu item", "menu_item_name", (r) => `${r.menu_item_name || "—"}${r.item_deleted ? " (deleted)" : ""}`],
            ["Restaurant", "restaurant_name"],
            ["Menu", "menu_id"],
            ["Clicks", "clicks"],
            ["Unique clickers", "unique_clickers"],
            ["From clusters", "cluster_clicks"],
          ]}
        />
      </IntelligenceSection>

      <IntelligenceSection title="Clusters" subtitle="Cluster page activity, and later restaurant activity attributed to a click from the cluster. Select a cluster above for its full report.">
        <SimpleTable
          rows={rep.clusters}
          wrapKeys={["cluster_name"]}
          onRowClick={(row) => setFilter("cluster_id", String(row.cluster_id))}
          columns={[
            ["Cluster", "cluster_name"],
            ["Page views", "page_views"],
            ["Unique", "unique_visitors"],
            ["Restaurant clicks", "restaurant_clicks"],
            ["Item clicks on cluster", "menu_item_clicks_on_cluster"],
            ["Attributed profile views", "attributed_profile_views"],
            ["Attributed menu views", "attributed_menu_views"],
            ["Attributed item clicks", "attributed_menu_item_clicks"],
          ]}
        />
      </IntelligenceSection>

      {filters.cluster_id ? <ClusterReport state={clusterReport} /> : null}

      <IntelligenceSection title="Deals" subtitle="Impressions, detail views, and clicks are separate events. Redemptions are not measured.">
        <SimpleTable
          rows={rep.deals}
          wrapKeys={["deal_title"]}
          columns={[["Deal", "deal_title"], ["Impressions", "impressions"], ["Detail views", "detail_views"], ["Clicks", "clicks"], ["CTR", "ctr_pct", (r) => pct(r.ctr_pct)]]}
        />
      </IntelligenceSection>

      <IntelligenceSection title="Placements" subtitle="CTR = clicks ÷ measured impressions in the same placement. Only 'paid' rows are billable.">
        <PlacementTable rows={rep.placements} />
      </IntelligenceSection>

      <IntelligenceSection title="Traffic sources" subtitle="Source page = the Menuply page whose click led to the view. 'unknown' = not attributable (direct, external, new tab).">
        <div style={{ display: "grid", gap: 18 }}>
          <SimpleTable rows={rep.traffic_sources?.by_source_page_type} columns={[["Source page type", "source_page_type"], ["Page views", "page_views"]]} />
          <SimpleTable rows={rep.traffic_sources?.navigation_paths} columns={[["From", "from_page_type"], ["To", "to_page_type"], ["Page views", "page_views"]]} emptyLabel="No attributed navigation yet." />
          <SimpleTable rows={rep.traffic_sources?.by_referrer_host} wrapKeys={["referrer_host"]} columns={[["Referrer (host)", "referrer_host"], ["Page views", "page_views"]]} />
        </div>
      </IntelligenceSection>

      <IntelligenceSection title="Outbound actions" subtitle="Website, directions, phone, and external ordering link clicks. Completed calls or orders are not measured.">
        <SimpleTable rows={rep.outbound_clicks} columns={[["Action", "action"], ["Clicks", "clicks"], ["Unique visitors", "unique_visitors"]]} />
      </IntelligenceSection>

      <CountingRules rules={payload.counting_rules} range={payload.range} />
    </div>
  );
}

function PlacementTable({ rows }) {
  return (
    <SimpleTable
      rows={rows}
      wrapKeys={["placement"]}
      columns={[
        ["Unit", "unit"],
        ["Page", "page_type"],
        ["Placement", "placement"],
        ["Class", "placement_class"],
        ["Impressions", "impressions"],
        ["Clicks", "clicks"],
        ["CTR", "ctr_pct", (r) => pct(r.ctr_pct)],
        ["Billable impr.", "billable_impressions"],
        ["Billable clicks", "billable_clicks"],
      ]}
    />
  );
}

function ClusterReport({ state }) {
  if (state.loading) return <LoadingState label="Loading cluster report…" />;
  if (state.error) return <ErrorBanner message={state.error} />;
  const rep = state.data?.report;
  if (!rep) return null;
  const o = rep.overview || {};
  return (
    <IntelligenceSection
      title={`Cluster report — ${rep.cluster?.name || ""}`}
      subtitle="Viewing the cluster page and clicking through to a restaurant are counted separately."
    >
      <div style={{ ...metricGrid, marginBottom: 18 }}>
        <MetricCard label="Cluster page views" value={o.page_views} subtitle={`${o.unique_visitors || 0} unique visitors`} />
        <MetricCard label="Restaurant click-throughs" value={o.restaurant_clicks} subtitle={`${o.visitors_who_clicked_a_restaurant || 0} visitors clicked`} />
        <MetricCard label="Restaurant listing impressions" value={o.restaurant_impressions} />
        <MetricCard label="Downstream menu views" value={o.attributed_menu_views} subtitle={`${o.attributed_profile_views || 0} profile views`} />
        <MetricCard label="Downstream item clicks" value={o.attributed_menu_item_clicks} subtitle={`${o.menu_item_clicks_on_cluster || 0} on the cluster page`} />
        <MetricCard label="Ad impressions / clicks" value={`${o.ad_impressions || 0} / ${o.ad_clicks || 0}`} subtitle={`${o.event_clicks || 0} event clicks`} />
      </div>
      <div style={{ display: "grid", gap: 18 }}>
        <SimpleTable
          rows={rep.by_restaurant}
          wrapKeys={["restaurant_name"]}
          columns={[
            ["Restaurant", "restaurant_name"],
            ["Impressions", "impressions"],
            ["Clicks", "clicks"],
            ["CTR", "ctr_pct", (r) => pct(r.ctr_pct)],
            ["Item clicks on cluster", "menu_item_clicks_on_cluster"],
            ["Profile views after", "attributed_profile_views"],
            ["Menu views after", "attributed_menu_views"],
            ["Item clicks after", "attributed_menu_item_clicks"],
          ]}
        />
        <SimpleTable rows={rep.top_menu_items} wrapKeys={["menu_item_name", "restaurant_name"]} columns={[["Menu item", "menu_item_name"], ["Restaurant", "restaurant_name"], ["Clicks", "clicks"]]} emptyLabel="No item clicks from this cluster." />
        <PlacementTable rows={rep.placements} />
        <SimpleTable rows={rep.series} columns={[["Day", "day"], ["Page views", "page_views"], ["Unique", "unique_visitors"], ["Restaurant clicks", "restaurant_clicks"]]} />
      </div>
    </IntelligenceSection>
  );
}

export function CountingRules({ rules, range }) {
  if (!rules?.length) return null;
  return (
    <PageCard style={{ padding: "14px 18px", background: "#faf7f4", border: `1px solid ${OWNER_COLORS.line}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink, marginBottom: 8 }}>
        How these numbers are counted{range?.timezone ? ` (days in ${range.timezone})` : ""}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: OWNER_COLORS.muted, lineHeight: 1.55 }}>
        {rules.map((rule) => <li key={rule}>{rule}</li>)}
      </ul>
    </PageCard>
  );
}

const metricGrid = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" };
const labelStyle = { display: "grid", gap: 4, fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted };
const inputStyle = { padding: "8px 10px", borderRadius: 10, border: "1px solid #d7c5b8", background: "#fff", minWidth: 140 };
