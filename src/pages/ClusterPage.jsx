import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import ClusterDirectoryCard from "../components/cluster/ClusterDirectoryCard.jsx";
import { ClusterPageBreadcrumb } from "../components/cluster/ClusterBreadcrumbs.jsx";
import DiscoveryCard from "../components/discovery/DiscoveryCard.jsx";
import {
  ClusterMenuCategorySection,
  ClusterMenuExplorerReservedFilters,
  ClusterMenuRestaurantGroup,
} from "../components/cluster/ClusterMenuExplorer.jsx";
import ShareButton from "../components/share/ShareButton.jsx";
import {
  applyDocumentSocialMetadata,
  buildClusterShareData,
} from "../components/share/shareUtils.js";
import { fetchClusterMetadata, fetchClusterMenuItems, fetchClusterRestaurants, searchCluster } from "../lib/clusterApi.js";
import { clusterTypeLabel } from "../lib/clusterUrl.js";
import {
  getClusterDisclaimer,
  getClusterOverviewDescription,
  getClusterPageHeading,
} from "../lib/clusterLegalCopy.js";
import { CLUSTER_TABS, DEFAULT_CLUSTER_TAB } from "../components/cluster/clusterTabs.js";
import { toConsumerErrorMessage } from "../lib/api.js";

const CANONICAL_BASE = "https://menuply.com";

function ClusterOverviewTab({ cluster }) {
  if (!cluster) return null;

  const areaName = cluster.area_name || cluster.name;
  const overviewText = getClusterOverviewDescription(cluster);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ color: "#666", fontSize: "0.95rem" }}>
        <p style={{ margin: 0 }}>
          {clusterTypeLabel(cluster.type)} near {areaName}, {cluster.city}, {cluster.state}
        </p>
        {cluster.address ? <p style={{ margin: "0.5rem 0 0" }}>{cluster.address}</p> : null}
        <p style={{ margin: "0.75rem 0 0" }}>
          {cluster.restaurant_count} restaurant{cluster.restaurant_count === 1 ? "" : "s"} listed in this area
        </p>
      </div>
      {overviewText ? (
        <p style={{ margin: 0, color: "#444", lineHeight: 1.5 }}>{overviewText}</p>
      ) : null}
    </section>
  );
}

function ClusterRestaurantsTab({ clusterSlug, enabled }) {
  const PAGE_SIZE = 20;
  const [status, setStatus] = useState(enabled ? "loading" : "idle");
  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !clusterSlug) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setRestaurants([]);
    setPagination(null);

    fetchClusterRestaurants(clusterSlug, { limit: PAGE_SIZE, offset: 0, signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load restaurants");
        setRestaurants(Array.isArray(data.restaurants) ? data.restaurants : []);
        setPagination(data.pagination || null);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load restaurants for this cluster."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled]);

  async function loadMore() {
    if (!clusterSlug || !pagination?.has_more || status === "loading-more") return;
    setStatus("loading-more");
    setError("");

    try {
      const data = await fetchClusterRestaurants(clusterSlug, {
        limit: PAGE_SIZE,
        offset: restaurants.length,
      });
      if (!data?.ok) throw new Error(data?.error || "Could not load more restaurants");
      const nextRows = Array.isArray(data.restaurants) ? data.restaurants : [];
      setRestaurants((prev) => {
        const seen = new Set(prev.map((row) => row.restaurant_id));
        return [...prev, ...nextRows.filter((row) => !seen.has(row.restaurant_id))];
      });
      setPagination(data.pagination || null);
      setStatus("ok");
    } catch (err) {
      setError(toConsumerErrorMessage(err, "Could not load more restaurants."));
      setStatus("ok");
    }
  }

  if (!enabled) {
    return <p style={{ color: "#888" }}>Open the Restaurants tab to load venues in this area.</p>;
  }

  if (status === "loading") {
    return <p style={{ color: "#666" }}>Loading restaurants…</p>;
  }

  if (status === "error") {
    return <p style={{ color: "#b91c1c" }}>{error}</p>;
  }

  if (restaurants.length === 0) {
    return <p style={{ color: "#888" }}>No restaurants are assigned to this cluster yet.</p>;
  }

  const totalLabel = pagination?.total_menu_ready ?? restaurants.length;

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
        Showing {restaurants.length} of {totalLabel} restaurant{totalLabel === 1 ? "" : "s"}
      </p>
      {restaurants.map((restaurant) => (
        <DiscoveryCard key={restaurant.restaurant_id} menu={restaurant} />
      ))}
      {pagination?.has_more ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={status === "loading-more"}
          style={{
            marginTop: "0.25rem",
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: status === "loading-more" ? "wait" : "pointer",
          }}
        >
          {status === "loading-more" ? "Loading…" : "Load more restaurants"}
        </button>
      ) : null}
      {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
    </div>
  );
}

function ClusterMenuExplorerTab({ clusterSlug, enabled }) {
  const PAGE_SIZE = 40;
  const [status, setStatus] = useState(enabled ? "loading" : "idle");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !clusterSlug) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setCategories([]);
    setItems([]);
    setPagination(null);

    fetchClusterMenuItems(clusterSlug, { limit: PAGE_SIZE, offset: 0, signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load menu items");
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setItems(Array.isArray(data.menu_items) ? data.menu_items : []);
        setPagination(data.pagination || null);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load menu items for this cluster."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled]);

  async function loadMore() {
    if (!clusterSlug || !pagination?.has_more || status === "loading-more") return;
    setStatus("loading-more");
    setError("");

    try {
      const data = await fetchClusterMenuItems(clusterSlug, {
        limit: PAGE_SIZE,
        offset: items.length,
      });
      if (!data?.ok) throw new Error(data?.error || "Could not load more menu items");
      const nextItems = Array.isArray(data.menu_items) ? data.menu_items : [];
      setItems((prev) => {
        const seen = new Set(prev.map((row) => `${row.menu_item_id}-${row.restaurant_id}`));
        return [...prev, ...nextItems.filter((row) => !seen.has(`${row.menu_item_id}-${row.restaurant_id}`))];
      });
      setCategories((prev) => {
        const merged = new Map(prev.map((group) => [group.category || "", { ...group, items: [...group.items] }]));
        for (const group of data.categories || []) {
          const key = group.category || "";
          const existing = merged.get(key);
          if (existing) {
            existing.items.push(...(group.items || []));
          } else {
            merged.set(key, { category: group.category, items: [...(group.items || [])] });
          }
        }
        return Array.from(merged.values());
      });
      setPagination(data.pagination || null);
      setStatus("ok");
    } catch (err) {
      setError(toConsumerErrorMessage(err, "Could not load more menu items."));
      setStatus("ok");
    }
  }

  if (!enabled) {
    return <p style={{ color: "#888" }}>Open Menu Explorer to browse dishes across this area.</p>;
  }

  if (status === "loading") {
    return <p style={{ color: "#666" }}>Loading menu items…</p>;
  }

  if (status === "error") {
    return <p style={{ color: "#b91c1c" }}>{error}</p>;
  }

  if (items.length === 0) {
    return <p style={{ color: "#888" }}>No menu items are available in this cluster yet.</p>;
  }

  const totalLabel = pagination?.total ?? items.length;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
        What can you eat here? Browse {items.length} of {totalLabel} menu items from restaurants in this area.
      </p>
      <ClusterMenuExplorerReservedFilters />
      <div style={{ display: "grid", gap: "1.25rem" }}>
        {categories.map((group) => (
          <ClusterMenuCategorySection
            key={group.category || "menu"}
            category={group.category}
            items={group.items}
          />
        ))}
      </div>
      {pagination?.has_more ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={status === "loading-more"}
          style={{
            marginTop: "0.25rem",
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: status === "loading-more" ? "wait" : "pointer",
          }}
        >
          {status === "loading-more" ? "Loading…" : "Load more menu items"}
        </button>
      ) : null}
      {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
    </div>
  );
}

function ClusterSearchTab({ clusterSlug, enabled }) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !clusterSlug || !submittedQuery.trim()) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");

    searchCluster(clusterSlug, { q: submittedQuery.trim(), signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Search failed");
        setGroups(Array.isArray(data.groups) ? data.groups : []);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not search menus in this cluster."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled, submittedQuery]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSubmittedQuery(trimmed);
  }

  if (!enabled) {
    return <p style={{ color: "#888" }}>Search runs only after you enter a query in this tab.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search menu items in this area (burger, pizza, salad…)"
          aria-label="Search menus in this cluster"
          style={{
            flex: "1 1 220px",
            minWidth: 0,
            padding: "0.65rem 0.75rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        />
        <button
          type="submit"
          disabled={!query.trim()}
          style={{
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "none",
            background: query.trim() ? "#111827" : "#9ca3af",
            color: "#fff",
            cursor: query.trim() ? "pointer" : "not-allowed",
          }}
        >
          Search
        </button>
      </form>

      {status === "loading" ? <p style={{ color: "#666" }}>Searching {submittedQuery}…</p> : null}
      {status === "error" ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {status === "ok" && submittedQuery ? (
        groups.length === 0 ? (
          <p style={{ color: "#888" }}>No menu matches in this cluster for “{submittedQuery}”.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {groups.map((group) => (
              <ClusterMenuRestaurantGroup key={group.restaurant_id} group={group} />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

export default function ClusterPage() {
  const { stateSlug, citySlug, clusterSlug } = useParams();
  const [activeTab, setActiveTab] = useState(DEFAULT_CLUSTER_TAB);
  const [status, setStatus] = useState("loading");
  const [cluster, setCluster] = useState(null);
  const [error, setError] = useState("");

  const shareData = useMemo(
    () => (cluster ? buildClusterShareData({ cluster, origin: CANONICAL_BASE }) : null),
    [cluster]
  );

  useEffect(() => {
    if (!clusterSlug) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");

    fetchClusterMetadata(clusterSlug, {
      stateSlug,
      citySlug,
      signal: controller.signal,
    })
      .then((data) => {
        if (!data?.ok || !data.cluster) throw new Error(data?.error || "Cluster not found");
        setCluster(data.cluster);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load this destination."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, stateSlug, citySlug]);

  useEffect(() => {
    if (!shareData) return undefined;
    return applyDocumentSocialMetadata({
      title: shareData.title,
      description: shareData.description || shareData.text,
      url: shareData.url,
      image: shareData.image,
    });
  }, [shareData]);

  useEffect(() => {
    if (cluster?.page_heading && !shareData?.title) {
      document.title = cluster.share_title || `${cluster.page_title || cluster.page_heading} | Menuply`;
    }
  }, [cluster?.page_heading, cluster?.page_title, cluster?.share_title, shareData?.title]);

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <p>Loading destination…</p>
      </div>
    );
  }

  if (status === "error" || !cluster) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <p>{error || "Destination not found."}</p>
      </div>
    );
  }

  const pageHeading = getClusterPageHeading(cluster);
  const disclaimer = getClusterDisclaimer(cluster);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <ClusterPageBreadcrumb cluster={cluster} />
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginTop: "0.25rem",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.75rem", lineHeight: 1.2, flex: 1 }}>{pageHeading}</h1>
          {shareData ? (
            <ShareButton
              shareData={shareData}
              analyticsContext={{
                pageType: "cluster",
                clusterSlug: cluster.slug,
                clusterName: cluster.name,
              }}
              label="Share destination"
              iconOnly
              tone="ghost"
              size="compact"
            />
          ) : null}
        </div>
      </header>

      <nav
        aria-label="Cluster sections"
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          marginBottom: "1rem",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {CLUSTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const disabled = !tab.enabled;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) setActiveTab(tab.id);
              }}
              style={{
                flex: "0 0 auto",
                padding: "0.5rem 0.85rem",
                borderRadius: 999,
                border: isActive ? "1px solid #111827" : "1px solid #d1d5db",
                background: isActive ? "#111827" : "#fff",
                color: disabled ? "#9ca3af" : isActive ? "#fff" : "#111827",
                cursor: disabled ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
              title={tab.comingSoon ? "Coming soon" : undefined}
            >
              {tab.label}
              {tab.comingSoon ? " (soon)" : ""}
            </button>
          );
        })}
      </nav>

      <main>
        {activeTab === "overview" ? <ClusterOverviewTab cluster={cluster} /> : null}
        {activeTab === "menu-explorer" ? (
          <ClusterMenuExplorerTab clusterSlug={cluster.slug} enabled={activeTab === "menu-explorer"} />
        ) : null}
        {activeTab === "restaurants" ? (
          <ClusterRestaurantsTab clusterSlug={cluster.slug} enabled={activeTab === "restaurants"} />
        ) : null}
        {activeTab === "search" ? (
          <ClusterSearchTab clusterSlug={cluster.slug} enabled={activeTab === "search"} />
        ) : null}
        {activeTab === "compare" || activeTab === "deals" || activeTab === "map" ? (
          <p style={{ color: "#888" }}>This tab is reserved for a future cluster release.</p>
        ) : null}
      </main>

      {Array.isArray(cluster.related_clusters) && cluster.related_clusters.length > 0 ? (
        <section style={{ marginTop: "2rem" }}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.15rem" }}>Nearby Clusters</h2>
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            }}
          >
            {cluster.related_clusters.map((related) => (
              <ClusterDirectoryCard key={related.slug} cluster={related} />
            ))}
          </div>
        </section>
      ) : null}

      <footer
        style={{
          marginTop: "2rem",
          paddingTop: "1rem",
          borderTop: "1px solid #e5e7eb",
          color: "#6b7280",
          fontSize: "0.8rem",
          lineHeight: 1.5,
        }}
      >
        <p style={{ margin: 0 }}>{disclaimer}</p>
      </footer>

      <BottomNav />
    </div>
  );
}
