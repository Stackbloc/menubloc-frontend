import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import ClusterDirectoryCard, { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import ClusterGrowingNotice from "../components/cluster/ClusterGrowingNotice.jsx";
import ClusterRestaurantDirectoryCard from "../components/cluster/ClusterRestaurantDirectoryCard.jsx";
import { ClusterPlaceholderSection, ClusterDrinksDirectory } from "../components/cluster/ClusterPlaceholderListingCard.jsx";
import { ClusterPageBreadcrumb } from "../components/cluster/ClusterBreadcrumbs.jsx";
import {
  ClusterMenuItemRow,
  ClusterMenuExplorerReservedFilters,
  ClusterMenuRestaurantGroup,
} from "../components/cluster/ClusterMenuExplorer.jsx";
import { ClusterMksCategoryGrid } from "../components/cluster/ClusterMksCategoryBlock.jsx";
import ShareButton from "../components/share/ShareButton.jsx";
import {
  applyDocumentSocialMetadata,
  buildClusterShareData,
} from "../components/share/shareUtils.js";
import { fetchClusterMetadata, fetchClusterMenuItems, fetchClusterRestaurants, searchCluster } from "../lib/clusterApi.js";
import { clusterTypeLabel, isClusterGrowing, resolveClusterDirectoryCount } from "../lib/clusterUrl.js";
import { groupClusterRestaurantsByCuisine } from "../lib/clusterRestaurantCuisineGroups.js";
import {
  getClusterDisclaimer,
  getClusterOverviewDescription,
  getClusterPageHeading,
} from "../lib/clusterLegalCopy.js";
import { toConsumerErrorMessage } from "../lib/api.js";

const CANONICAL_BASE = "https://menuply.com";
const CLUSTER_VIEW_MODES = Object.freeze({
  MENU: "menu",
  RESTAURANTS: "restaurants",
});

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
  const stats = cluster?.listing_stats || {};
  const restaurantCount = resolveClusterDirectoryCount(cluster);
  const deduped = Number(stats.total_deduped ?? stats.total_listed ?? restaurantCount) || restaurantCount;
  const assigned = Number(stats.total_assigned ?? cluster?.restaurant_count) || 0;
  const menuReady = Number(stats.total_menu_ready ?? cluster?.menu_ready_count) || 0;
  const isAirport = String(cluster?.type || "").toLowerCase() === "airport";
  const restaurantLabel = isAirport ? "Dining outlet" : "Restaurant";

  return (
    <div style={{ display: "grid", gap: "0.65rem" }}>
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
            Unique {restaurantLabel.toLowerCase()}s
          </div>
          <div style={{ marginTop: "0.2rem", fontSize: "1.2rem", fontWeight: 600, color: "#111827" }}>
            {deduped.toLocaleString()}
          </div>
        </div>
        {assigned > deduped ? (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Assigned locations
            </div>
            <div style={{ marginTop: "0.2rem", fontSize: "1.2rem", fontWeight: 600, color: "#111827" }}>
              {assigned.toLocaleString()}
            </div>
          </div>
        ) : null}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "0.78rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Menus on Menuply
          </div>
          <div style={{ marginTop: "0.2rem", fontSize: "1.2rem", fontWeight: 600, color: "#111827" }}>
            {menuReady.toLocaleString()}
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
      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.45 }}>
        Unique venues dedupe duplicate chains (e.g. multiple Starbucks count once). Menu items include all visible
        dishes from cluster members, not only menu-ready venues.
      </p>
    </div>
  );
}

function ClusterViewToggle({ viewMode, onChange, disabled }) {
  const options = [
    { id: CLUSTER_VIEW_MODES.MENU, label: "Menu Items" },
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
  const listedTotal = pagination?.total_listed ?? restaurants.length;
  const assignedTotal = pagination?.total_assigned ?? listedTotal;
  const menuReadyCount = pagination?.total_menu_ready ?? 0;
  const isAirport = String(cluster?.type || "").toLowerCase() === "airport";
  const outletNoun = isAirport ? "dining outlet" : "restaurant";
  const cuisineGroups = groupClusterRestaurantsByCuisine(restaurants);

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
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.45 }}>
            {listedTotal} unique {outletNoun}
            {listedTotal === 1 ? "" : "s"} in this cluster
            {assignedTotal > listedTotal
              ? ` · ${assignedTotal} assigned location${assignedTotal === 1 ? "" : "s"}`
              : ""}
            {menuReadyCount > 0 && menuReadyCount < listedTotal
              ? ` · ${menuReadyCount} with menus on Menuply`
              : ""}
          </p>
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

function ClusterMenuExplorerTab({ clusterSlug, clusterName, enabled }) {
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
  const [searchGroups, setSearchGroups] = useState([]);
  const [searchError, setSearchError] = useState("");

  const searchActive = Boolean(submittedSearch.trim());

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
        setError(toConsumerErrorMessage(err, "Could not load menu items for this cluster."));
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
        if (!data?.ok) throw new Error(data?.error || "Could not load menu items");
        setItems(Array.isArray(data.menu_items) ? data.menu_items : []);
        setPagination(data.pagination || null);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load menu items for this category."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled, selectedCategory?.code, searchActive]);

  useEffect(() => {
    if (!enabled || !clusterSlug || !searchActive) {
      setSearchStatus("idle");
      setSearchGroups([]);
      setSearchError("");
      return undefined;
    }

    const controller = new AbortController();
    setSearchStatus("loading");
    setSearchError("");

    searchCluster(clusterSlug, { q: submittedSearch.trim(), signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Search failed");
        setSearchGroups(Array.isArray(data.groups) ? data.groups : []);
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
      if (!data?.ok) throw new Error(data?.error || "Could not load more menu items");
      const nextItems = Array.isArray(data.menu_items) ? data.menu_items : [];
      setItems((prev) => {
        const seen = new Set(prev.map((row) => `${row.menu_item_id}-${row.restaurant_id}`));
        return [...prev, ...nextItems.filter((row) => !seen.has(`${row.menu_item_id}-${row.restaurant_id}`))];
      });
      setPagination(data.pagination || null);
      setStatus("ok");
    } catch (err) {
      setError(toConsumerErrorMessage(err, "Could not load more menu items."));
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
    return <p style={{ color: "#888" }}>Select Menu Items to browse dishes across this area.</p>;
  }

  const totalItems = pagination?.total ?? 0;
  const categoryTitle = selectedCategory?.label || null;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search menu items in this cluster (burger, pizza, salad…)"
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

      {searchActive ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {searchStatus === "loading" ? <p style={{ color: "#666", margin: 0 }}>Searching {submittedSearch}…</p> : null}
          {searchStatus === "error" ? <p style={{ color: "#b91c1c", margin: 0 }}>{searchError}</p> : null}
          {searchStatus === "ok" && searchGroups.length === 0 ? (
            <p style={{ color: "#888", margin: 0 }}>No menu matches in this cluster for “{submittedSearch}”.</p>
          ) : null}
          {searchGroups.map((group) => (
            <ClusterMenuRestaurantGroup key={group.restaurant_id} group={group} />
          ))}
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
              {categoryTitle} in the {clusterName} Cluster
            </h2>
          </div>
          {status === "loading" ? <p style={{ color: "#666" }}>Loading {categoryTitle}…</p> : null}
          {status === "error" ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
          {items.length > 0 ? (
            <div style={{ display: "grid" }}>
              {items.map((item) => (
                <ClusterMenuItemRow key={`${item.menu_item_id}-${item.restaurant_id}`} item={item} />
              ))}
            </div>
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
              {status === "loading-more" ? "Loading…" : "Load more items"}
            </button>
          ) : null}
          {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
            What can you eat here? Browse {totalItems.toLocaleString()} menu items by category.
          </p>
          <ClusterMenuExplorerReservedFilters />
          {status === "loading" ? <p style={{ color: "#666" }}>Loading menu categories…</p> : null}
          {status === "error" ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
          {mksCategories.length === 0 && status === "ok" ? (
            <p style={{ color: "#888" }}>No menu items are available in this cluster yet.</p>
          ) : null}
          <ClusterMksCategoryGrid
            categories={mksCategories}
            clusterName={clusterName}
            onSelect={setSelectedCategory}
          />
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
  const [menuItemCount, setMenuItemCount] = useState(null);
  const [menuItemCountStatus, setMenuItemCountStatus] = useState("idle");
  const [defaultViewResolved, setDefaultViewResolved] = useState(false);

  const viewMode = useMemo(() => {
    const raw = String(searchParams.get("view") || "").trim().toLowerCase();
    if (raw === CLUSTER_VIEW_MODES.RESTAURANTS) return CLUSTER_VIEW_MODES.RESTAURANTS;
    if (raw === CLUSTER_VIEW_MODES.MENU || raw === "menu-items") return CLUSTER_VIEW_MODES.MENU;
    return null;
  }, [searchParams]);

  const resolvedViewMode =
    viewMode ||
    (defaultViewResolved
      ? (menuItemCount ?? 0) > 0
        ? CLUSTER_VIEW_MODES.MENU
        : CLUSTER_VIEW_MODES.RESTAURANTS
      : CLUSTER_VIEW_MODES.MENU);

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
    if (!cluster?.slug) return undefined;

    const controller = new AbortController();
    setMenuItemCountStatus("loading");

    fetchClusterMenuItems(cluster.slug, { summary: true, limit: 1, offset: 0, signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load menu item count");
        setMenuItemCount(Number(data.pagination?.total ?? 0));
        setMenuItemCountStatus("ok");
        setDefaultViewResolved(true);
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
          <ClusterMenuExplorerTab
            clusterSlug={cluster.slug}
            clusterName={cluster.area_name || cluster.name}
            enabled
          />
        ) : (
          <ClusterRestaurantsTab clusterSlug={cluster.slug} cluster={cluster} enabled />
        )}
      </main>

      {Array.isArray(cluster.related_clusters) && cluster.related_clusters.length > 0 ? (
        <section
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem 1rem",
            borderRadius: 14,
            border: "1px solid #dbeafe",
            background: "linear-gradient(180deg, #f8fbff 0%, #f1f5f9 100%)",
          }}
        >
          <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.15rem" }}>Explore Other Restaurant Clusters</h2>
          <p style={{ margin: "0 0 0.85rem", color: "#64748b", fontSize: "0.92rem" }}>
            Nearby destinations with their own restaurant directories and combined menus.
          </p>
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
