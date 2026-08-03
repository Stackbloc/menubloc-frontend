import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import ClusterGrowingNotice from "../components/cluster/ClusterGrowingNotice.jsx";
import ClusterRestaurantDirectoryCard from "../components/cluster/ClusterRestaurantDirectoryCard.jsx";
import { ClusterPlaceholderSection, ClusterDrinksDirectory } from "../components/cluster/ClusterPlaceholderListingCard.jsx";
import ClusterBackButton from "../components/cluster/ClusterBackButton.jsx";
import {
  ClusterDishList,
  ClusterPlaceholderFoodCard,
} from "../components/cluster/ClusterMenuExplorer.jsx";
import SearchResultCard from "../components/SearchResultCard.jsx";
import { ClusterMksCategoryGrid } from "../components/cluster/ClusterMksCategoryBlock.jsx";
import ShareButton from "../components/share/ShareButton.jsx";
import {
  applyDocumentSocialMetadata,
  buildClusterShareData,
} from "../components/share/shareUtils.js";
import { fetchClusterMetadata, fetchClusterMenuItems, fetchClusterRestaurants, searchCluster } from "../lib/clusterApi.js";
import { isClusterGrowing, clusterCityPath, clusterDirectoryPath } from "../lib/clusterUrl.js";
import { groupClusterRestaurantsByCuisine } from "../lib/clusterRestaurantCuisineGroups.js";
import {
  getClusterDisclaimer,
  getClusterPageHeading,
} from "../lib/clusterLegalCopy.js";
import {
  resolveClusterIntro,
  resolveClusterSearchPlaceholder,
  resolveClusterDocumentMeta,
} from "../lib/clusterSeoContent.js";
import { toConsumerErrorMessage } from "../lib/api.js";
import { getConsumerDisplayPrice } from "../lib/pricingDisplay.js";
import {
  applyClusterZoneAndPriceSort,
  collectClusterZones,
  getClusterDiningByZoneHeading,
  getClusterZoneNoun,
} from "../lib/clusterZoneBrowse.js";
import {
  buildClusterReturnPath,
  buildClusterRestaurantsReturnPath,
  CLUSTER_FROM,
  clusterReturnLabel as getClusterReturnLabel,
} from "../lib/clusterReturnNavigation.js";

const CANONICAL_BASE = "https://menuply.com";
const CLUSTER_VIEW_MODES = Object.freeze({
  MENU: "menu",
  RESTAURANTS: "restaurants",
});

function ClusterDescription({ cluster }) {
  if (!cluster) return null;
  const intro = resolveClusterIntro(cluster);
  if (!intro) return null;

  return (
    <p
      style={{
        margin: 0,
        color: "#374151",
        lineHeight: 1.55,
        fontSize: "0.98rem",
      }}
    >
      {intro}
    </p>
  );
}

function ClusterViewToggle({ viewMode, onChange, disabled }) {
  const options = [
    { id: CLUSTER_VIEW_MODES.MENU, label: "Food" },
    { id: CLUSTER_VIEW_MODES.RESTAURANTS, label: "Restaurants" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Cluster view"
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
  );
}

function ClusterRestaurantsTab({ clusterSlug, cluster, enabled, placeReturnPath, placeReturnLabel }) {
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
        setError(toConsumerErrorMessage(err, "Could not load restaurants here."));
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
    return <p style={{ color: "#888" }}>Select Restaurants to see who is here.</p>;
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
        Menuply is still adding restaurants here. Check back soon.
      </p>
    );
  }

  const cuisineGroups = groupClusterRestaurantsByCuisine(restaurants);
  const diningByZoneHeading = getClusterDiningByZoneHeading(cluster);

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {restaurants.length > 0 ? (
        <>
          {cuisineGroups.map((group) => (
            <section key={group.id} style={{ display: "grid", gap: "0.65rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#111827" }}>{group.label}</h3>
              <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
                {group.restaurants.map((restaurant) => (
                  <ClusterRestaurantDirectoryCard
                    key={restaurant.restaurant_id}
                    restaurant={restaurant}
                    placeReturnPath={placeReturnPath}
                    placeReturnLabel={placeReturnLabel}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      ) : null}
      {placeholders.length > 0 ? (
        <div style={{ display: "grid", gap: "1rem", marginTop: restaurants.length > 0 ? "0.5rem" : 0 }}>
          <h3
            data-testid="cluster-dining-by-zone-heading"
            style={{ margin: 0, fontSize: "1.05rem", color: "#111827" }}
          >
            {diningByZoneHeading}
          </h3>
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
  const [priceSort, setPriceSort] = useState("default");
  const [selectedZone, setSelectedZone] = useState(null);

  const searchActive = Boolean(submittedSearch.trim());

  const availableZones = useMemo(() => collectClusterZones(items), [items]);
  const zoneNoun = useMemo(() => getClusterZoneNoun(cluster), [cluster]);

  useEffect(() => {
    if (selectedZone && availableZones.length > 0 && !availableZones.includes(selectedZone)) {
      setSelectedZone(null);
    }
  }, [selectedZone, availableZones]);

  const displayItems = useMemo(
    () =>
      applyClusterZoneAndPriceSort(items, {
        zone: selectedZone,
        priceSort,
        getPriceCents: getConsumerDisplayPrice,
      }),
    [items, selectedZone, priceSort],
  );

  const clusterReturnTo = useMemo(
    () => (cluster ? buildClusterReturnPath(cluster, { view: CLUSTER_VIEW_MODES.MENU }) : null),
    [cluster],
  );
  const clusterDestinationLabel = useMemo(
    () => (cluster ? getClusterReturnLabel(cluster) : "destination"),
    [cluster],
  );
  const searchPlaceholder = useMemo(
    () => resolveClusterSearchPlaceholder(cluster),
    [cluster],
  );
  const returnNavigation = useMemo(
    () => (clusterReturnTo ? {
      returnTo: clusterReturnTo,
      label: clusterDestinationLabel,
      from: CLUSTER_FROM,
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
        if (!data?.ok) throw new Error(data?.error || "Could not load food categories");
        setMksCategories(Array.isArray(data.mks_categories) ? data.mks_categories : []);
        setPagination(data.pagination || null);
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load food here."));
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
    setPriceSort("default");
    setSelectedZone(null);

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
        setSearchError(toConsumerErrorMessage(err, "Could not search food here."));
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
        const seen = new Set(
          prev.map((row) => row.placeholder_key || `${row.menu_item_id}-${row.restaurant_id}`)
        );
        return [
          ...prev,
          ...nextItems.filter(
            (row) => !seen.has(row.placeholder_key || `${row.menu_item_id}-${row.restaurant_id}`)
          ),
        ];
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
    return <p style={{ color: "#888" }}>Select Food to browse what you can eat here.</p>;
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
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
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
          {searchStatus === "ok" && searchMenuItems.length > 0 ? (
            <p
              data-testid="cluster-food-search-result-count"
              style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}
              aria-live="polite"
            >
              Showing {searchMenuItems.length}{" "}
              {searchMenuItems.length === 1 ? "result" : "results"}
            </p>
          ) : null}
          <div style={CLUSTER_SEARCH_GRID_STYLE}>
            {searchMenuItems.map((row) => {
              if (row?.placeholder_item) {
                return (
                  <ClusterPlaceholderFoodCard
                    key={`cluster-search-ph-${row.placeholder_key || row.name}`}
                    item={row}
                  />
                );
              }

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
              ← All food
            </button>
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
              {categoryTitle}
            </h2>
            <div
              role="group"
              aria-label="Sort by price"
              style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginLeft: "auto" }}
            >
              <button
                type="button"
                data-testid="cluster-food-price-sort-asc"
                aria-pressed={priceSort === "asc"}
                onClick={() => setPriceSort((prev) => (prev === "asc" ? "default" : "asc"))}
                style={{
                  padding: "0.4rem 0.65rem",
                  borderRadius: 8,
                  border: priceSort === "asc" ? "1px solid #111827" : "1px solid #d1d5db",
                  background: priceSort === "asc" ? "#111827" : "#fff",
                  color: priceSort === "asc" ? "#fff" : "#111827",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                }}
              >
                Price: Low–High
              </button>
              <button
                type="button"
                data-testid="cluster-food-price-sort-desc"
                aria-pressed={priceSort === "desc"}
                onClick={() => setPriceSort((prev) => (prev === "desc" ? "default" : "desc"))}
                style={{
                  padding: "0.4rem 0.65rem",
                  borderRadius: 8,
                  border: priceSort === "desc" ? "1px solid #111827" : "1px solid #d1d5db",
                  background: priceSort === "desc" ? "#111827" : "#fff",
                  color: priceSort === "desc" ? "#fff" : "#111827",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                }}
              >
                High–Low
              </button>
            </div>
          </div>
          {availableZones.length > 0 ? (
            <div
              role="group"
              aria-label={`Filter by ${zoneNoun.toLowerCase()}`}
              data-testid="cluster-food-zone-filter"
              style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}
            >
              <button
                type="button"
                data-testid="cluster-food-zone-all"
                aria-pressed={selectedZone == null}
                onClick={() => setSelectedZone(null)}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: 999,
                  border: selectedZone == null ? "1px solid #111827" : "1px solid #d1d5db",
                  background: selectedZone == null ? "#111827" : "#fff",
                  color: selectedZone == null ? "#fff" : "#111827",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                All {zoneNoun.toLowerCase()}s
              </button>
              {availableZones.map((zone) => {
                const selected = selectedZone === zone;
                const zoneTestId = `cluster-food-zone-${zone.replace(/\s+/g, "-").toLowerCase()}`;
                return (
                  <button
                    key={zone}
                    type="button"
                    data-testid={zoneTestId}
                    aria-pressed={selected}
                    onClick={() => setSelectedZone((prev) => (prev === zone ? null : zone))}
                    style={{
                      padding: "0.35rem 0.65rem",
                      borderRadius: 999,
                      border: selected ? "1px solid #111827" : "1px solid #d1d5db",
                      background: selected ? "#111827" : "#fff",
                      color: selected ? "#fff" : "#111827",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          ) : null}
          {status === "loading" ? <p style={{ color: "#666" }}>Loading {categoryTitle}…</p> : null}
          {status === "error" ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
          {status === "ok" && items.length === 0 ? (
            <p style={{ color: "#6b7280", margin: 0 }}>
              No items are listed in {categoryTitle} yet for this area.
            </p>
          ) : null}
          {status === "ok" && items.length > 0 && displayItems.length === 0 ? (
            <p style={{ color: "#6b7280", margin: 0 }} data-testid="cluster-food-zone-empty">
              No {categoryTitle} items in {selectedZone || "this zone"} yet.
            </p>
          ) : null}
          {displayItems.length > 0 ? (
            <ClusterDishList
              items={displayItems}
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
          {status === "loading" ? <p style={{ color: "#666" }}>Loading food…</p> : null}
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
        setError(toConsumerErrorMessage(err, "Could not load this Cluster."));
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
    const seoMeta = resolveClusterDocumentMeta(cluster);
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: cluster.name,
      description:
        seoMeta.description ||
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
        <p>Loading…</p>
      </div>
    );
  }

  if (status === "error" || !cluster) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <p>{error || "Cluster not found."}</p>
      </div>
    );
  }

  const pageHeading = getClusterPageHeading(cluster);
  const disclaimer = getClusterDisclaimer(cluster);
  const showGrowingNotice = isClusterGrowing(cluster);
  const clusterLabel = getClusterReturnLabel(cluster);
  const clusterCityBack = clusterCityPath(cluster) || clusterDirectoryPath();
  const cityBackLabel = cluster.city ? `Back to ${cluster.city}` : "All clusters";
  const restaurantsReturnPath = cluster ? buildClusterRestaurantsReturnPath(cluster) : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem 5rem", width: "100%", boxSizing: "border-box", overflowX: "clip" }}>
      <header style={{ marginBottom: "1rem", minWidth: 0, display: "grid", gap: "0.75rem" }}>
        <ClusterBackButton fallbackTo={clusterCityBack} label={cityBackLabel} />
        <h1
          style={{
            margin: 0,
            fontSize: "1.85rem",
            lineHeight: 1.15,
            minWidth: 0,
            overflowWrap: "anywhere",
            letterSpacing: "-0.02em",
          }}
        >
          {pageHeading}
        </h1>
        <ClusterDescription cluster={cluster} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "0.55rem",
            flexWrap: "wrap",
            minWidth: 0,
            marginTop: "1.5rem",
            paddingTop: "0.25rem",
          }}
        >
          <ClusterViewToggle viewMode={resolvedViewMode} onChange={setViewMode} disabled={false} />
          {shareData ? (
            <ShareButton
              shareData={shareData}
              analyticsContext={{
                pageType: "cluster",
                clusterSlug: cluster.slug,
                clusterName: cluster.name,
              }}
              label="Share"
              iconOnly
              tone="ghost"
              size="compact"
            />
          ) : null}
        </div>
      </header>

      <main
        aria-label="Cluster content"
        style={{
          display: "grid",
          gap: "0.75rem",
          minWidth: 0,
          paddingTop: "0.25rem",
          paddingBottom: "1.5rem",
        }}
      >
        {resolvedViewMode === CLUSTER_VIEW_MODES.MENU ? (
          <ClusterMenuExplorerTab clusterSlug={cluster.slug} cluster={cluster} enabled />
        ) : (
          <ClusterRestaurantsTab
            clusterSlug={cluster.slug}
            cluster={cluster}
            enabled
            placeReturnPath={restaurantsReturnPath}
            placeReturnLabel={clusterLabel}
          />
        )}
      </main>

      {showGrowingNotice ? <ClusterGrowingNotice /> : null}

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
