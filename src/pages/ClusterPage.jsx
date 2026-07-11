import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import ClusterGrowingNotice from "../components/cluster/ClusterGrowingNotice.jsx";
import ClusterRestaurantDirectoryCard from "../components/cluster/ClusterRestaurantDirectoryCard.jsx";
import { ClusterPlaceholderSection, ClusterDrinksDirectory } from "../components/cluster/ClusterPlaceholderListingCard.jsx";
import { ClusterPageBreadcrumb } from "../components/cluster/ClusterBreadcrumbs.jsx";
import ClusterBackButton from "../components/cluster/ClusterBackButton.jsx";
import {
  ClusterDishList,
} from "../components/cluster/ClusterMenuExplorer.jsx";
import SearchResultCard from "../components/SearchResultCard.jsx";
import { ClusterMksCategoryGrid } from "../components/cluster/ClusterMksCategoryBlock.jsx";
import ShareButton from "../components/share/ShareButton.jsx";
import {
  applyDocumentSocialMetadata,
  buildClusterShareData,
} from "../components/share/shareUtils.js";
import { fetchClusterMetadata, fetchClusterMenuItems, fetchClusterRestaurants, searchCluster } from "../lib/clusterApi.js";
import { clusterTypeLabel, isClusterGrowing, clusterCityPath, clusterDirectoryPath } from "../lib/clusterUrl.js";
import { groupClusterRestaurantsByCuisine } from "../lib/clusterRestaurantCuisineGroups.js";
import {
  getClusterDisclaimer,
  getClusterPageHeading,
} from "../lib/clusterLegalCopy.js";
import { toConsumerErrorMessage } from "../lib/api.js";
import {
  buildClusterFoodReturnPath,
  clusterReturnLabel as getClusterReturnLabel,
} from "../lib/clusterReturnNavigation.js";

const CANONICAL_BASE = "https://menuply.com";
const CLUSTER_VIEW_MODES = Object.freeze({
  MENU: "menu",
  RESTAURANTS: "restaurants",
});

function ClusterDescription({ cluster }) {
  if (!cluster) return null;

  const areaName = cluster.area_name || cluster.name;
  const shortDescription = cluster.short_description || cluster.description || null;

  return (
    <section style={{ display: "grid", gap: "0.65rem", minWidth: 0 }}>
      {shortDescription ? (
        <p style={{ margin: 0, color: "#374151", lineHeight: 1.55, fontSize: "0.98rem" }}>{shortDescription}</p>
      ) : null}
      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.92rem", lineHeight: 1.45, overflowWrap: "anywhere" }}>
        {clusterTypeLabel(cluster.type)} near {areaName}
        {cluster.address ? ` · ${cluster.address}` : ""}
      </p>
      {cluster.placeholder_intro ? (
        <p style={{ margin: 0, color: "#444", lineHeight: 1.5, fontSize: "0.92rem" }}>{cluster.placeholder_intro}</p>
      ) : null}
      <p style={{ margin: 0, color: "#444", lineHeight: 1.5, fontSize: "0.92rem" }}>
        Browse what you can eat across every restaurant here — like one big combined menu.
      </p>
    </section>
  );
}

function ClusterViewToggle({ viewMode, onChange, disabled }) {
  const options = [
    { id: CLUSTER_VIEW_MODES.MENU, label: "Food" },
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
    setPagination(null);

    fetchClusterRestaurants(clusterSlug, { limit: PAGE_SIZE, offset: 0, signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load restaurants");
        setRestaurants(Array.isArray(data.restaurants) ? data.restaurants : []);
        setPlaceholders(Array.isArray(data.placeholders) ? data.placeholders : []);
        setDrinksPlaceholders(Array.isArray(data.drinks_placeholders) ? data.drinks_placeholders : []);
        setPlaceholderIntro(data.placeholder_intro || "");
        setDrinksPlaceholderIntro(data.drinks_placeholder_intro || "");
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

  const cuisineGroups = groupClusterRestaurantsByCuisine(restaurants);

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {restaurants.length > 0 ? (
        <>
          {cuisineGroups.map((group) => (
            <section key={group.id} style={{ display: "grid", gap: "0.65rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#111827" }}>{group.label}</h3>
              <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
                {group.restaurants.map((restaurant) => (
                  <ClusterRestaurantDirectoryCard key={restaurant.restaurant_id} restaurant={restaurant} />
                ))}
              </div>
            </section>
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

const CLUSTER_SEARCH_GRID_STYLE = {
  display: "grid",
  gap: "0.85rem",
};

function ClusterMenuExplorerTab({ clusterSlug, cluster, enabled }) {
  const PAGE_SIZE = 40;
  const [status, setStatus] = useState(enabled ? "loading" : "idle");
  const [mksCategories, setMksCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle");
  const [searchMenuItems, setSearchMenuItems] = useState([]);
  const [searchQueryMeta, setSearchQueryMeta] = useState(null);
  const [searchError, setSearchError] = useState("");

  const searchActive = Boolean(submittedSearch.trim());

  const clusterReturnTo = useMemo(
    () => (cluster ? buildClusterFoodReturnPath(cluster) : null),
    [cluster],
  );
  const clusterDestinationLabel = useMemo(
    () => (cluster ? getClusterReturnLabel(cluster) : "destination"),
    [cluster],
  );
  const returnNavigation = useMemo(
    () => (clusterReturnTo ? {
      returnTo: clusterReturnTo,
      label: clusterDestinationLabel,
      from: "cluster",
    } : null),
    [clusterReturnTo, clusterDestinationLabel],
  );

  useEffect(() => {
    if (!enabled || !clusterSlug || searchActive) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setMksCategories([]);
    setSelectedCategory(null);
    setItems([]);
    setPagination(null);

    fetchClusterMenuItems(clusterSlug, { summary: true, signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load menu categories");
        setMksCategories(Array.isArray(data.mks_categories) ? data.mks_categories : []);
        setPagination(data.pagination || null);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load food for this cluster."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled, searchActive]);

  useEffect(() => {
    if (!enabled || !clusterSlug || !selectedCategory?.code || searchActive) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setItems([]);
    setPagination(null);

    fetchClusterMenuItems(clusterSlug, {
      mksCategory: selectedCategory.code,
      limit: PAGE_SIZE,
      offset: 0,
      signal: controller.signal,
    })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load food for this category.");
        setItems(Array.isArray(data.menu_items) ? data.menu_items : []);
        setPagination(data.pagination || null);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load food for this category."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled, selectedCategory?.code, searchActive]);

  useEffect(() => {
    if (!enabled || !clusterSlug || !searchActive) {
      setSearchStatus("idle");
      setSearchMenuItems([]);
      setSearchQueryMeta(null);
      setSearchError("");
      return undefined;
    }

    const controller = new AbortController();
    setSearchStatus("loading");
    setSearchError("");

    searchCluster(clusterSlug, { q: submittedSearch.trim(), signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Search failed");
        setSearchMenuItems(Array.isArray(data.menu_items) ? data.menu_items : []);
        setSearchQueryMeta(data.query || null);
        setSearchStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setSearchError(toConsumerErrorMessage(err, "Could not search menus in this cluster."));
        setSearchStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled, searchActive, submittedSearch]);

  async function loadMoreCategoryItems() {
    if (!clusterSlug || !selectedCategory?.code || !pagination?.has_more || status === "loading-more") return;
    setStatus("loading-more");
    setError("");

    try {
      const data = await fetchClusterMenuItems(clusterSlug, {
        mksCategory: selectedCategory.code,
        limit: PAGE_SIZE,
        offset: items.length,
      });
      if (!data?.ok) throw new Error(data?.error || "Could not load more food");
      const nextItems = Array.isArray(data.menu_items) ? data.menu_items : [];
      setItems((prev) => {
        const seen = new Set(prev.map((row) => `${row.menu_item_id}-${row.restaurant_id}`));
        return [...prev, ...nextItems.filter((row) => !seen.has(`${row.menu_item_id}-${row.restaurant_id}`))];
      });
      setPagination(data.pagination || null);
      setStatus("ok");
    } catch (err) {
      setError(toConsumerErrorMessage(err, "Could not load more food."));
      setStatus("ok");
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setSubmittedSearch(trimmed);
    setSelectedCategory(null);
  }

  function clearSearch() {
    setSearchInput("");
    setSubmittedSearch("");
  }

  if (!enabled) {
    return <p style={{ color: "#888" }}>Select Food to browse what you can eat in this area.</p>;
  }

  const categoryTitle = selectedCategory?.label || null;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 220px", minWidth: 0, display: "grid", gap: "0.3rem" }}>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search food in this area"
            aria-label="Search food in this area. Examples: burger, low calories, high protein."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "0.65rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: "1rem",
            }}
          />
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280", lineHeight: 1.35 }}>
            e.g. burger, low calories, high protein
          </p>
        </div>
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
            alignSelf: "flex-start",
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
              alignSelf: "flex-start",
            }}
          >
            Clear
          </button>
        ) : null}
      </form>

      {searchActive ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {searchStatus === "loading" ? <p style={{ color: "#666", margin: 0 }}>Searching {submittedSearch}…</p> : null}
          {searchStatus === "error" ? <p style={{ color: "#b91c1c", margin: 0 }}>{searchError}</p> : null}
          {searchStatus === "ok" && searchMenuItems.length === 0 ? (
            <p style={{ color: "#888", margin: 0 }}>No food in this area matches “{submittedSearch}”.</p>
          ) : null}
          <div style={CLUSTER_SEARCH_GRID_STYLE}>
            {searchMenuItems.map((row) => {
              const rowId = row?.menu_item_id ?? row?.id;
              const rowName = row?.search_display_name || row?.menu_item_name || row?.name || "item";
              return (
                <SearchResultCard
                  key={`cluster-search-${rowId || rowName}`}
                  item={row}
                  query={submittedSearch}
                  queryMeta={searchQueryMeta}
                  geo={{
                    city: cluster?.city || null,
                    state: cluster?.state || null,
                  }}
                  returnNavigation={returnNavigation}
                />
              );
            })}
          </div>
        </div>
      ) : selectedCategory ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              ← All categories
            </button>
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
              {categoryTitle}
            </h2>
          </div>
          {status === "loading" ? <p style={{ color: "#666" }}>Loading {categoryTitle}…</p> : null}
          {status === "error" ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
          {items.length > 0 ? (
            <ClusterDishList
              items={items}
              clusterReturnTo={clusterReturnTo}
              clusterReturnLabel={clusterDestinationLabel}
            />
          ) : null}
          {pagination?.has_more ? (
            <button
              type="button"
              onClick={loadMoreCategoryItems}
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
              {status === "loading-more" ? "Loading…" : "Load more"}
            </button>
          ) : null}
          {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
            What can you eat here? Pick a category to browse food from every restaurant in this area.
          </p>
          {status === "loading" ? <p style={{ color: "#666" }}>Loading food categories…</p> : null}
          {status === "error" ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
          {mksCategories.length === 0 && status === "ok" ? (
            <p style={{ color: "#888" }}>No food is listed in this area yet.</p>
          ) : null}
          <ClusterMksCategoryGrid categories={mksCategories} onSelect={setSelectedCategory} />
        </div>
      )}
    </div>
  );
}

export default function ClusterPage() {
  const { stateSlug, citySlug, clusterSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [cluster, setCluster] = useState(null);
  const [error, setError] = useState("");

  const viewMode = useMemo(() => {
    const raw = String(searchParams.get("view") || "").trim().toLowerCase();
    if (raw === CLUSTER_VIEW_MODES.RESTAURANTS) return CLUSTER_VIEW_MODES.RESTAURANTS;
    if (raw === CLUSTER_VIEW_MODES.MENU || raw === "menu-items") return CLUSTER_VIEW_MODES.MENU;
    return null;
  }, [searchParams]);

  const resolvedViewMode = viewMode || CLUSTER_VIEW_MODES.MENU;

  const shareData = useMemo(
    () => (cluster ? buildClusterShareData({ cluster, origin: CANONICAL_BASE }) : null),
    [cluster]
  );

  function setViewMode(nextView) {
    const params = new URLSearchParams(searchParams);
    params.set("view", nextView);
    setSearchParams(params, { replace: true });
  }

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
  const clusterBackFallback = clusterCityPath(cluster) || clusterDirectoryPath();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem 5rem", width: "100%", boxSizing: "border-box", overflowX: "clip" }}>
      <header style={{ marginBottom: "1rem", minWidth: 0, display: "grid", gap: "0.85rem" }}>
        <ClusterBackButton fallbackTo={clusterBackFallback} label="Back" />
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
        <ClusterViewToggle viewMode={resolvedViewMode} onChange={setViewMode} disabled={false} />
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
        {resolvedViewMode === CLUSTER_VIEW_MODES.MENU ? (
          <ClusterMenuExplorerTab clusterSlug={cluster.slug} cluster={cluster} enabled />
        ) : (
          <ClusterRestaurantsTab clusterSlug={cluster.slug} cluster={cluster} enabled />
        )}
      </main>

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
