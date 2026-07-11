import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import ClusterDirectoryCard, { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import ClusterGrowingNotice from "../components/cluster/ClusterGrowingNotice.jsx";
import ClusterRestaurantListingCard from "../components/cluster/ClusterRestaurantListingCard.jsx";
import { ClusterPlaceholderSection, ClusterDrinksDirectory } from "../components/cluster/ClusterPlaceholderListingCard.jsx";
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
import { clusterTypeLabel, isClusterGrowing, resolveClusterDirectoryCount } from "../lib/clusterUrl.js";
import {
  getClusterDisclaimer,
  getClusterOverviewDescription,
  getClusterPageHeading,
} from "../lib/clusterLegalCopy.js";
import { toConsumerErrorMessage } from "../lib/api.js";

const CANONICAL_BASE = "https://menuply.com";
const CLUSTER_VIEW_MODES = Object.freeze({
  MENU_ITEMS: "menu-items",
  RESTAURANTS: "restaurants",
});

function formatCountLabel(count, singular, plural = `${singular}s`) {
  const value = Number(count) || 0;
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

function ClusterDescription({ cluster }) {
  if (!cluster) return null;

  const areaName = cluster.area_name || cluster.name;
  const overviewText = getClusterOverviewDescription(cluster);
  const shortDescription = cluster.short_description || cluster.description || null;

  return (
    <section style={{ display: "grid", gap: "0.65rem", minWidth: 0 }}>
      {shortDescription ? (
        <p style={{ margin: 0, color: "#374151", lineHeight: 1.55, fontSize: "0.98rem" }}>{shortDescription}</p>
      ) : null}
      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.92rem", lineHeight: 1.45, overflowWrap: "anywhere" }}>
        {clusterTypeLabel(cluster.type)} near {areaName}, {cluster.city}, {cluster.state}
        {cluster.address ? ` · ${cluster.address}` : ""}
      </p>
      {cluster.placeholder_intro ? (
        <p style={{ margin: 0, color: "#444", lineHeight: 1.5, fontSize: "0.92rem" }}>{cluster.placeholder_intro}</p>
      ) : null}
      {overviewText ? (
        <p style={{ margin: 0, color: "#444", lineHeight: 1.5, fontSize: "0.92rem" }}>{overviewText}</p>
      ) : null}
    </section>
  );
}

function ClusterStatCounts({ cluster, menuItemCount, menuItemCountStatus }) {
  const restaurantCount = resolveClusterDirectoryCount(cluster);
  const isAirport = String(cluster?.type || "").toLowerCase() === "airport";
  const restaurantLabel = isAirport ? "Dining outlet" : "Restaurant";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem 1.25rem",
        padding: "0.85rem 1rem",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.78rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {restaurantLabel} count
        </div>
        <div style={{ marginTop: "0.2rem", fontSize: "1.2rem", fontWeight: 600, color: "#111827" }}>
          {restaurantCount.toLocaleString()}
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.78rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Menu item count
        </div>
        <div style={{ marginTop: "0.2rem", fontSize: "1.2rem", fontWeight: 600, color: "#111827" }}>
          {menuItemCountStatus === "loading" ? "…" : (menuItemCount ?? 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function ClusterViewToggle({ viewMode, onChange, disabled }) {
  const options = [
    { id: CLUSTER_VIEW_MODES.MENU_ITEMS, label: "Menu Items" },
    { id: CLUSTER_VIEW_MODES.RESTAURANTS, label: "Restaurants" },
  ];

  return (
    <div style={{ display: "grid", gap: "0.45rem" }}>
      <div style={{ fontSize: "0.82rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        View
      </div>
      <div
        role="radiogroup"
        aria-label="Cluster content view"
        style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
      >
        {options.map((option) => {
          const selected = viewMode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 0.9rem",
                borderRadius: 999,
                border: selected ? "1px solid #111827" : "1px solid #d1d5db",
                background: selected ? "#111827" : "#fff",
                color: disabled ? "#9ca3af" : selected ? "#fff" : "#111827",
                cursor: disabled ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: selected ? "3px solid #fff" : "1px solid #9ca3af",
                  boxSizing: "border-box",
                  background: selected ? "#111827" : "#fff",
                }}
              />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClusterRestaurantsTab({ clusterSlug, cluster, enabled }) {
  const PAGE_SIZE = 20;
  const [status, setStatus] = useState(enabled ? "loading" : "idle");
  const [restaurants, setRestaurants] = useState([]);
  const [placeholders, setPlaceholders] = useState([]);
  const [drinksPlaceholders, setDrinksPlaceholders] = useState([]);
  const [placeholderIntro, setPlaceholderIntro] = useState("");
  const [drinksPlaceholderIntro, setDrinksPlaceholderIntro] = useState("");
  const [drinksFilter, setDrinksFilter] = useState("all");
  const [progressiveListing, setProgressiveListing] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !clusterSlug) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setRestaurants([]);
    setPlaceholders([]);
    setDrinksPlaceholders([]);
    setPlaceholderIntro("");
    setDrinksPlaceholderIntro("");
    setDrinksFilter("all");
    setProgressiveListing(false);
    setPagination(null);

    fetchClusterRestaurants(clusterSlug, { limit: PAGE_SIZE, offset: 0, signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load restaurants");
        setRestaurants(Array.isArray(data.restaurants) ? data.restaurants : []);
        setPlaceholders(Array.isArray(data.placeholders) ? data.placeholders : []);
        setDrinksPlaceholders(Array.isArray(data.drinks_placeholders) ? data.drinks_placeholders : []);
        setPlaceholderIntro(data.placeholder_intro || "");
        setDrinksPlaceholderIntro(data.drinks_placeholder_intro || "");
        setProgressiveListing(
          data.progressive_listing === true || data.cluster?.progressive_listing === true
        );
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
    return <p style={{ color: "#888" }}>Select Restaurants to load venues in this area.</p>;
  }

  if (status === "loading") {
    return <p style={{ color: "#666" }}>Loading restaurants…</p>;
  }

  if (status === "error") {
    return <p style={{ color: "#b91c1c" }}>{error}</p>;
  }

  if (restaurants.length === 0 && placeholders.length === 0 && drinksPlaceholders.length === 0) {
    return (
      <p style={{ color: "#888" }}>
        Menuply is building the dining directory for this destination. Check back soon as outlets are
        published.
      </p>
    );
  }

  const diningTotal =
    pagination?.total_dining_placeholders ??
    placeholders.reduce(
      (sum, section) => sum + (Array.isArray(section?.listings) ? section.listings.length : 0),
      0
    );
  const drinksTotal =
    pagination?.total_drinks_placeholders ??
    drinksPlaceholders.reduce(
      (sum, section) => sum + (Array.isArray(section?.listings) ? section.listings.length : 0),
      0
    );
  const directoryTotal = pagination?.total_placeholders ?? diningTotal + drinksTotal;
  const verifiedTotal = pagination?.total_listed ?? restaurants.length;
  const menuReadyCount = pagination?.total_menu_ready ?? 0;
  const isAirport = String(cluster?.type || "").toLowerCase() === "airport";
  const outletNoun = isAirport ? "dining outlet" : "restaurant";
  const CardComponent = progressiveListing ? ClusterRestaurantListingCard : DiscoveryCard;

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {directoryTotal > 0 ? (
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.45, overflowWrap: "anywhere" }}>
          {diningTotal > 0
            ? `${diningTotal} ${outletNoun}${diningTotal === 1 ? "" : "s"}`
            : null}
          {drinksTotal > 0
            ? `${diningTotal > 0 ? " · " : ""}${drinksTotal} drink spot${drinksTotal === 1 ? "" : "s"}`
            : ""}
          {menuReadyCount > 0 ? ` · ${menuReadyCount} with menus on Menuply` : ""}
        </p>
      ) : null}
      {restaurants.length > 0 ? (
        <>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
            {verifiedTotal} verified profile{verifiedTotal === 1 ? "" : "s"} with Menuply data
          </p>
          {restaurants.map((restaurant) => (
            <CardComponent key={restaurant.restaurant_id} restaurant={restaurant} menu={restaurant} />
          ))}
        </>
      ) : null}
      {placeholders.length > 0 ? (
        <div style={{ display: "grid", gap: "1rem", marginTop: restaurants.length > 0 ? "0.5rem" : 0 }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#111827" }}>Dining by terminal</h3>
          {placeholderIntro ? (
            <p style={{ margin: 0, color: "#444", fontSize: "0.9rem", lineHeight: 1.45 }}>{placeholderIntro}</p>
          ) : null}
          {placeholders.map((section) => (
            <ClusterPlaceholderSection key={section.area} section={section} />
          ))}
        </div>
      ) : placeholderIntro ? (
        <p style={{ margin: 0, color: "#444", fontSize: "0.9rem", lineHeight: 1.45 }}>{placeholderIntro}</p>
      ) : null}
      {drinksPlaceholders.length > 0 ? (
        <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#111827" }}>Drinks — coffee, cocktails &amp; wine</h3>
          {drinksPlaceholderIntro ? (
            <p style={{ margin: 0, color: "#444", fontSize: "0.9rem", lineHeight: 1.45 }}>
              {drinksPlaceholderIntro}
            </p>
          ) : null}
          <ClusterDrinksDirectory
            sections={drinksPlaceholders}
            beverageFilter={drinksFilter}
            onFilterChange={setDrinksFilter}
          />
        </div>
      ) : null}
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
    return <p style={{ color: "#888" }}>Select Menu Items to browse dishes across this area.</p>;
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

function ClusterSearchResults({ clusterSlug, query }) {
  const [status, setStatus] = useState("idle");
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clusterSlug || !query.trim()) {
      setStatus("idle");
      setGroups([]);
      setError("");
      return undefined;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError("");

    searchCluster(clusterSlug, { q: query.trim(), signal: controller.signal })
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
  }, [clusterSlug, query]);

  if (!query.trim()) return null;

  if (status === "loading") {
    return <p style={{ color: "#666", margin: 0 }}>Searching {query}…</p>;
  }

  if (status === "error") {
    return <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p>;
  }

  if (groups.length === 0) {
    return <p style={{ color: "#888", margin: 0 }}>No menu matches in this cluster for “{query}”.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
        {formatCountLabel(groups.reduce((sum, group) => sum + (group.menu_items?.length || 0), 0), "result")} for “{query}”
      </p>
      {groups.map((group) => (
        <ClusterMenuRestaurantGroup key={group.restaurant_id} group={group} />
      ))}
    </div>
  );
}

export default function ClusterPage() {
  const { stateSlug, citySlug, clusterSlug } = useParams();
  const [viewMode, setViewMode] = useState(CLUSTER_VIEW_MODES.MENU_ITEMS);
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState("loading");
  const [cluster, setCluster] = useState(null);
  const [error, setError] = useState("");
  const [menuItemCount, setMenuItemCount] = useState(null);
  const [menuItemCountStatus, setMenuItemCountStatus] = useState("idle");

  const shareData = useMemo(
    () => (cluster ? buildClusterShareData({ cluster, origin: CANONICAL_BASE }) : null),
    [cluster]
  );

  const searchActive = Boolean(submittedSearch.trim());

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
    if (!cluster?.slug) return undefined;

    const controller = new AbortController();
    setMenuItemCountStatus("loading");

    fetchClusterMenuItems(cluster.slug, { limit: 1, offset: 0, signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load menu item count");
        setMenuItemCount(Number(data.pagination?.total ?? 0));
        setMenuItemCountStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setMenuItemCount(null);
        setMenuItemCountStatus("error");
      });

    return () => controller.abort();
  }, [cluster?.slug]);

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
    if (!cluster || !isClusterGrowing(cluster)) return undefined;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-cluster-growing-schema", "true");
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: cluster.name,
      description:
        cluster.share_description ||
        cluster.short_description ||
        `Restaurants and menus around ${cluster.area_name || cluster.name}.`,
      url: shareData?.url || undefined,
      isPartOf: {
        "@type": "WebSite",
        name: "Menuply",
        url: CANONICAL_BASE,
      },
    });
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [cluster, shareData?.url]);

  useEffect(() => {
    if (cluster?.page_heading && !shareData?.title) {
      document.title = cluster.share_title || `${cluster.page_title || cluster.page_heading} | Menuply`;
    }
  }, [cluster?.page_heading, cluster?.page_title, cluster?.share_title, shareData?.title]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setSubmittedSearch(trimmed);
  }

  function clearSearch() {
    setSearchInput("");
    setSubmittedSearch("");
  }

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
  const showGrowingNotice = isClusterGrowing(cluster);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem 5rem", width: "100%", boxSizing: "border-box", overflowX: "clip" }}>
      <header style={{ marginBottom: "1rem", minWidth: 0, display: "grid", gap: "0.85rem" }}>
        <ClusterPageBreadcrumb cluster={cluster} />
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.75rem",
            minWidth: 0,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.75rem",
              lineHeight: 1.2,
              flex: 1,
              minWidth: 0,
              overflowWrap: "anywhere",
            }}
          >
            {pageHeading}
          </h1>
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
        <ClusterDescription cluster={cluster} />
      </header>

      {showGrowingNotice ? <ClusterGrowingNotice /> : null}

      <section style={{ display: "grid", gap: "1rem", marginBottom: "1.25rem" }}>
        <ClusterStatCounts
          cluster={cluster}
          menuItemCount={menuItemCount}
          menuItemCountStatus={menuItemCountStatus}
        />

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
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
            disabled={!searchInput.trim()}
            style={{
              padding: "0.65rem 1rem",
              borderRadius: 8,
              border: "none",
              background: searchInput.trim() ? "#111827" : "#9ca3af",
              color: "#fff",
              cursor: searchInput.trim() ? "pointer" : "not-allowed",
            }}
          >
            Search
          </button>
          {searchActive ? (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                padding: "0.65rem 1rem",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          ) : null}
        </form>

        <ClusterViewToggle
          viewMode={viewMode}
          onChange={setViewMode}
          disabled={searchActive}
        />
      </section>

      <main
        aria-label="Cluster dynamic content"
        style={{
          display: "grid",
          gap: "0.75rem",
          minWidth: 0,
          paddingTop: "0.25rem",
          paddingBottom: "1.5rem",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        {searchActive ? (
          <ClusterSearchResults clusterSlug={cluster.slug} query={submittedSearch} />
        ) : viewMode === CLUSTER_VIEW_MODES.MENU_ITEMS ? (
          <ClusterMenuExplorerTab clusterSlug={cluster.slug} enabled />
        ) : (
          <ClusterRestaurantsTab clusterSlug={cluster.slug} cluster={cluster} enabled />
        )}
      </main>

      {Array.isArray(cluster.related_clusters) && cluster.related_clusters.length > 0 ? (
        <section style={{ marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.15rem" }}>Nearby Clusters</h2>
          <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
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
