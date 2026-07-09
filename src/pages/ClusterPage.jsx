import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { CLUSTER_TABS, DEFAULT_CLUSTER_TAB } from "../components/cluster/clusterTabs.js";
import { toConsumerErrorMessage } from "../lib/api.js";

const CANONICAL_BASE = "https://menuply.com";
const CLUSTER_SECTION_SCROLL_MARGIN = 88;
const ENABLED_CLUSTER_TABS = CLUSTER_TABS.filter((tab) => tab.enabled);

function clusterSectionId(tabId) {
  return `cluster-section-${tabId}`;
}

function ClusterOverviewTab({ cluster }) {
  if (!cluster) return null;

  const areaName = cluster.area_name || cluster.name;
  const overviewText = getClusterOverviewDescription(cluster);
  const progressive = cluster.progressive_listing === true;
  const placeholderCount = Number(cluster.placeholder_count || cluster.listing_stats?.total_placeholders || 0);
  const menuReadyCount = Number(cluster.menu_ready_count ?? cluster.listing_stats?.total_menu_ready ?? 0);
  const directoryCount = resolveClusterDirectoryCount(cluster);
  const diningCount = Number(cluster.dining_count ?? cluster.listing_stats?.total_dining_placeholders) || 0;
  const drinksCount = Number(cluster.drinks_count ?? cluster.listing_stats?.total_drinks_placeholders) || 0;
  const verifiedCount = Number(cluster.verified_profile_count ?? cluster.listing_stats?.total_listed ?? 0);
  const isAirport = String(cluster.type || "").toLowerCase() === "airport";
  const outletNoun = isAirport ? "dining outlet" : "restaurant";

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ color: "#666", fontSize: "0.95rem" }}>
        <p style={{ margin: 0 }}>
          {clusterTypeLabel(cluster.type)} near {areaName}, {cluster.city}, {cluster.state}
        </p>
        {cluster.address ? <p style={{ margin: "0.5rem 0 0" }}>{cluster.address}</p> : null}
        {progressive || placeholderCount > 0 ? (
          <p style={{ margin: "0.75rem 0 0" }}>
            {directoryCount > 0
              ? `${directoryCount} ${outletNoun}${directoryCount === 1 ? "" : "s"} in this directory`
              : null}
            {drinksCount > 0
              ? ` · ${drinksCount} drink spot${drinksCount === 1 ? "" : "s"} (coffee, cocktails, wine)`
              : ""}
            {menuReadyCount > 0 ? ` · ${menuReadyCount} with menus on Menuply` : ""}
            {verifiedCount > 0 && verifiedCount < directoryCount
              ? ` · ${verifiedCount} verified profile${verifiedCount === 1 ? "" : "s"} linked`
              : ""}
          </p>
        ) : (
          <p style={{ margin: "0.75rem 0 0" }}>
            {directoryCount} {outletNoun}
            {directoryCount === 1 ? "" : "s"} listed in this area
          </p>
        )}
      </div>
      {cluster.placeholder_intro ? (
        <p style={{ margin: 0, color: "#444", lineHeight: 1.5 }}>{cluster.placeholder_intro}</p>
      ) : null}
      {overviewText ? (
        <p style={{ margin: 0, color: "#444", lineHeight: 1.5 }}>{overviewText}</p>
      ) : null}
    </section>
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
    return <p style={{ color: "#888" }}>Open the Restaurants tab to load venues in this area.</p>;
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
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.45 }}>
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
  const [enabledTabs, setEnabledTabs] = useState(
    () => new Set(ENABLED_CLUSTER_TABS.filter((tab) => !tab.lazy).map((tab) => tab.id))
  );
  const [status, setStatus] = useState("loading");
  const [cluster, setCluster] = useState(null);
  const [error, setError] = useState("");
  const navRef = useRef(null);
  const sectionRefs = useRef({});
  const scrollLockRef = useRef(false);

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

  useEffect(() => {
    if (!cluster) return undefined;
    setEnabledTabs(new Set(ENABLED_CLUSTER_TABS.map((tab) => tab.id)));
  }, [cluster]);

  useEffect(() => {
    if (!cluster) return undefined;

    const sections = ENABLED_CLUSTER_TABS
      .map((tab) => sectionRefs.current[tab.id])
      .filter(Boolean);

    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollLockRef.current) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const nextTab = visible[0]?.target?.dataset?.sectionId;
        if (nextTab) {
          setActiveTab(nextTab);
        }
      },
      {
        root: null,
        rootMargin: `-${CLUSTER_SECTION_SCROLL_MARGIN}px 0px -55% 0px`,
        threshold: [0, 0.15, 0.35],
      }
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, [cluster]);

  useEffect(() => {
    const button = navRef.current?.querySelector(`[data-tab-id="${activeTab}"]`);
    button?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeTab]);

  function scrollToSection(tabId) {
    const section = sectionRefs.current[tabId];
    if (!section) return;

    scrollLockRef.current = true;
    setActiveTab(tabId);
    setEnabledTabs((current) => new Set([...current, tabId]));
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      scrollLockRef.current = false;
    }, 700);
  }

  function registerSectionRef(tabId) {
    return (node) => {
      if (node) sectionRefs.current[tabId] = node;
      else delete sectionRefs.current[tabId];
    };
  }

  const sectionShellStyle = {
    scrollMarginTop: CLUSTER_SECTION_SCROLL_MARGIN,
    paddingTop: "0.25rem",
    paddingBottom: "2rem",
  };

  const sectionHeadingStyle = {
    margin: "0 0 0.85rem",
    fontSize: "1.15rem",
    lineHeight: 1.25,
    color: "#111827",
  };

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

      {showGrowingNotice ? <ClusterGrowingNotice /> : null}

      <nav
        ref={navRef}
        aria-label="Cluster sections"
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          marginBottom: "1rem",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#fff",
        }}
      >
        {CLUSTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const disabled = !tab.enabled;
          return (
            <button
              key={tab.id}
              type="button"
              data-tab-id={tab.id}
              disabled={disabled}
              aria-current={isActive ? "true" : undefined}
              onClick={() => {
                if (!disabled) scrollToSection(tab.id);
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

      <main style={{ display: "grid", gap: "0.5rem" }}>
        <section
          id={clusterSectionId("overview")}
          ref={registerSectionRef("overview")}
          data-section-id="overview"
          aria-labelledby="cluster-heading-overview"
          style={sectionShellStyle}
        >
          <h2 id="cluster-heading-overview" style={sectionHeadingStyle}>
            Overview
          </h2>
          <ClusterOverviewTab cluster={cluster} />
        </section>

        <section
          id={clusterSectionId("menu-explorer")}
          ref={registerSectionRef("menu-explorer")}
          data-section-id="menu-explorer"
          aria-labelledby="cluster-heading-menu-explorer"
          style={sectionShellStyle}
        >
          <h2 id="cluster-heading-menu-explorer" style={sectionHeadingStyle}>
            Menu Explorer
          </h2>
          <ClusterMenuExplorerTab
            clusterSlug={cluster.slug}
            enabled={enabledTabs.has("menu-explorer")}
          />
        </section>

        <section
          id={clusterSectionId("restaurants")}
          ref={registerSectionRef("restaurants")}
          data-section-id="restaurants"
          aria-labelledby="cluster-heading-restaurants"
          style={sectionShellStyle}
        >
          <h2 id="cluster-heading-restaurants" style={sectionHeadingStyle}>
            Restaurants
          </h2>
          <ClusterRestaurantsTab
            clusterSlug={cluster.slug}
            cluster={cluster}
            enabled={enabledTabs.has("restaurants")}
          />
        </section>

        <section
          id={clusterSectionId("search")}
          ref={registerSectionRef("search")}
          data-section-id="search"
          aria-labelledby="cluster-heading-search"
          style={sectionShellStyle}
        >
          <h2 id="cluster-heading-search" style={sectionHeadingStyle}>
            Search Menus
          </h2>
          <ClusterSearchTab
            clusterSlug={cluster.slug}
            enabled={enabledTabs.has("search")}
          />
        </section>
      </main>

      {Array.isArray(cluster.related_clusters) && cluster.related_clusters.length > 0 ? (
        <section style={{ marginTop: "2rem" }}>
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
