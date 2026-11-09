import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { trackSearchResults, trackSearchResultTap } from "../lib/engagementTracking.js";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { isClusterFoodByTypeEnabled } from "../lib/featureFlags.js";
import BottomNav from "../components/BottomNav.jsx";
import useEngagementPage from "../hooks/useEngagementPage.js";
import useMatchMedia from "../hooks/useMatchMedia.js";
import useClusterFavs from "../hooks/useClusterFavs.js";
import { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import ClusterGrowingNotice from "../components/cluster/ClusterGrowingNotice.jsx";
import ClusterRestaurantDirectoryCard from "../components/cluster/ClusterRestaurantDirectoryCard.jsx";
import { ClusterPlaceholderSection, ClusterDrinksDirectory } from "../components/cluster/ClusterPlaceholderListingCard.jsx";
import ClusterBackButton from "../components/cluster/ClusterBackButton.jsx";
import ClusterAdSlot, { ClusterAdCreative, useClusterAd } from "../components/cluster/ClusterAdSlot.jsx";
import {
  ClusterDishList,
  ClusterPlaceholderFoodCard,
} from "../components/cluster/ClusterMenuExplorer.jsx";
import SearchResultCard from "../components/SearchResultCard.jsx";
import { ClusterDrinkBoxGrid, ClusterMksCategoryGrid, clusterBoxLook } from "../components/cluster/ClusterMksCategoryBlock.jsx";
import { FoodByTypeChipRow, FoodByTypeDishList } from "../components/cluster/ClusterFoodByTypeParts.jsx";
import useFoodTypeChips from "../hooks/useFoodTypeChips.js";
import ShareButton from "../components/share/ShareButton.jsx";
import {
  CLUSTER_CATEGORY_QUERY_KEY,
  CLUSTER_DRINK_QUERY_KEY,
  CLUSTER_SEARCH_QUERY_KEY,
  normalizeClusterCategoryCode,
  readClusterShareFilters,
} from "../lib/clusterShareFilters.js";
import {
  applyDocumentSocialMetadata,
  buildClusterShareData,
} from "../components/share/shareUtils.js";
import { fetchClusterMetadata, fetchClusterMenuItems, fetchClusterRestaurants, searchCluster } from "../lib/clusterApi.js";
import { liveItemDeal } from "../lib/itemDeal.js";
import { isClusterGrowing, clusterCityPath, clusterDirectoryPath } from "../lib/clusterUrl.js";
import { EXIT_CLUSTER_LABEL, clearClusterExit, resolveClusterExitTo } from "../lib/clusterNavigation.js";
import {
  getClusterDisclaimer,
  getClusterPageHeading,
  getClusterProductTitle,
} from "../lib/clusterLegalCopy.js";
import {
  resolveClusterCardDescription,
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
import "../styles/clusterIndioFestivalTheme.css";
import "../styles/clusterLaLiveTheme.css";
import "../styles/clusterUscTheme.css";
import "../styles/clusterUclaTheme.css";
import { wallName } from "../lib/clusterWallStyles.js";
import {
  buildClusterReturnPath,
  buildClusterRestaurantsReturnPath,
  CLUSTER_FROM,
  clusterReturnLabel as getClusterReturnLabel,
} from "../lib/clusterReturnNavigation.js";
import {
  CLUSTER_DRINK_SUBCATEGORY_ALL,
  isClusterBeveragesCategory,
  isUniversityCluster,
  normalizeClusterDrinkSubcategory,
  resolveAvailableDrinkCategoriesFromResponse,
  sortNonAlcoholicDrinksFirst,
  visibleClusterDrinkSubcategoryChips,
} from "../lib/clusterDrinkSubcategories.js";
import { rememberMenuBrowserVenueSession } from "../lib/menuBrowserVenueContext.js";
import { INDIO_FESTIVAL_GROUNDS_SLUG } from "../lib/clusterSlugAliases.js";
import { clusterShowsDishExcerpt } from "../lib/clusterDishExcerpt.js";
import CampusDiningSection from "../components/cluster/CampusDiningSection.jsx";
import { ClusterWallBand, ClusterWallPanel, ClusterWallProvider } from "../components/clusterWall/ClusterWall.jsx";
import { useClusterWallContext } from "../components/clusterWall/clusterWallContext.js";
import ClusterSubscribeButton from "../components/cluster/ClusterSubscribeButton.jsx";
import ClusterPublicFeed from "../components/cluster/ClusterPublicFeed.jsx";
import ClusterNearbyEvents from "../components/cluster/ClusterNearbyEvents.jsx";
import { ClusterSearchActiveContext, ClusterVideoProvider, useClusterVideos } from "../components/cluster/video/ClusterVideoContext.jsx";
import ClusterVideoHero from "../components/cluster/video/ClusterVideoHero.jsx";
import ClusterVideoPlayButton, { ClusterVideosPill } from "../components/cluster/video/ClusterVideoPlayButton.jsx";

const CANONICAL_BASE = "https://menuply.com";
const CLUSTER_VIEW_MODES = Object.freeze({
  MENU: "menu",
  RESTAURANTS: "restaurants",
});

/** A folded section: one tappable line, like the app's dining halls. Children mount on first open. */
/**
 * Cluster Wall layout (Andre 2026-11-05, plan 24): while the Wall is live the page widens to two
 * columns (food + ads left, Wall right, own scroll). If the Wall API isn't there, nothing changes.
 */
function ClusterWallFrame({ rootRef, style, children, ...rest }) {
  const wallCtx = useClusterWallContext();
  const wide = Boolean(wallCtx?.active);
  return (
    <div ref={rootRef} {...rest} style={{ ...style, maxWidth: wide ? 1240 : style?.maxWidth }}>
      {children}
    </div>
  );
}

function ClusterWallColumns({ children }) {
  const wallCtx = useClusterWallContext();
  if (!wallCtx?.active) return children;
  return (
    <div className="cw-layout">
      <div style={{ minWidth: 0 }}>{children}</div>
      <aside className="cw-layout-aside" aria-label={wallName(wallCtx.clusterLabel)}>
        <ClusterWallPanel />
      </aside>
    </div>
  );
}

/**
 * True while a just-picked food type's first results are still loading. The phone Wall strip sits
 * right under Food by type, so while the short "loading" placeholder is up it would rise into view;
 * keep it back until the type's results are on screen (Andre 2026-11-08).
 */
const ClusterTypeResultsPendingContext = React.createContext(false);

function ClusterWallBandAfterTypeResults() {
  const pending = React.useContext(ClusterTypeResultsPendingContext);
  const [shown, setShown] = useState(!pending);
  // Same timing as the first page load (Andre 2026-11-07): the Wall comes in a beat after the food.
  useEffect(() => {
    if (pending) {
      setShown(false);
      return undefined;
    }
    const t = setTimeout(() => setShown(true), WALL_AFTER_FOOD_MS);
    return () => clearTimeout(t);
  }, [pending]);
  return shown && !pending ? <ClusterWallBand /> : null;
}

/** The Wall replaces the Dining halls section; hall data and endpoints are untouched. */
function HiddenWhileWallLive({ children }) {
  const wallCtx = useClusterWallContext();
  return wallCtx?.active ? null : children;
}

function ClusterFold({ title, meta = null, testId, eager = false, hidden = false, children }) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(eager);
  return (
    <section data-testid={testId} hidden={hidden} style={{ display: hidden ? "none" : "grid", gap: "0.6rem" }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setOpened(true);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
          padding: "0.75rem 0.85rem",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#fff",
          cursor: "pointer",
          font: "inherit",
          textAlign: "left",
          color: "#111827",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</span>
        <span style={{ flex: 1, color: "#6b7280", fontSize: "0.85rem" }}>{meta}</span>
        <span aria-hidden="true" style={{ color: "#6b7280", transform: open ? "rotate(180deg)" : "none" }}>
          ▾
        </span>
      </button>
      {opened ? <div hidden={!open}>{children}</div> : null}
    </section>
  );
}

function ClusterDescription({ cluster }) {
  if (!cluster) return null;
  const intro = resolveClusterCardDescription(cluster);
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

/**
 * Cuisine groups are built from the loaded rows, and newly added restaurants sort last, so a
 * first-page-only load leaves them out of their cuisine (YGF Malatang in USC, 2026-10-20).
 * Load every page up front; the API caps one page at 36 rows.
 */
const MAX_CLUSTER_RESTAURANT_PAGES = 12;

async function fetchAllClusterRestaurantPages(clusterSlug, pageSize, signal) {
  const first = await fetchClusterRestaurants(clusterSlug, { limit: pageSize, offset: 0, signal });
  if (!first?.ok) return first;
  const rows = Array.isArray(first.restaurants) ? [...first.restaurants] : [];
  const seen = new Set(rows.map((row) => row.restaurant_id));
  let pagination = first.pagination || null;
  for (let page = 1; pagination?.has_more && page < MAX_CLUSTER_RESTAURANT_PAGES; page += 1) {
    const next = await fetchClusterRestaurants(clusterSlug, { limit: pageSize, offset: rows.length, signal });
    if (!next?.ok) break;
    const nextRows = Array.isArray(next.restaurants) ? next.restaurants : [];
    if (nextRows.length === 0) break;
    for (const row of nextRows) {
      if (seen.has(row.restaurant_id)) continue;
      seen.add(row.restaurant_id);
      rows.push(row);
    }
    pagination = next.pagination || null;
  }
  return { ...first, restaurants: rows, pagination };
}

const RESTAURANTS_PREVIEW_COUNT = 8;

function ClusterRestaurantsTab({ clusterSlug, cluster, enabled, placeReturnPath, placeReturnLabel, onCount }) {
  // Match BE MAX_CLUSTER_RESTAURANTS_LIMIT so district lists (e.g. LACC ~31) fit one page.
  const PAGE_SIZE = 36;
  const [status, setStatus] = useState(enabled ? "loading" : "idle");
  const [restaurants, setRestaurants] = useState([]);
  const [placeholders, setPlaceholders] = useState([]);
  const [drinksPlaceholders, setDrinksPlaceholders] = useState([]);
  const [placeholderIntro, setPlaceholderIntro] = useState("");
  const [drinksPlaceholderIntro, setDrinksPlaceholderIntro] = useState("");
  const [drinksFilter, setDrinksFilter] = useState("all");
  const { favIds, busyIds, toggleFav } = useClusterFavs();
  const [showAll, setShowAll] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !clusterSlug) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setShowAll(false);
    setRestaurants([]);
    setPlaceholders([]);
    setDrinksPlaceholders([]);
    setPlaceholderIntro("");
    setDrinksPlaceholderIntro("");
    setDrinksFilter("all");
    setPagination(null);

    fetchAllClusterRestaurantPages(clusterSlug, PAGE_SIZE, controller.signal)
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load restaurants");
        setRestaurants(Array.isArray(data.restaurants) ? data.restaurants : []);
        setPlaceholders(Array.isArray(data.placeholders) ? data.placeholders : []);
        setDrinksPlaceholders(Array.isArray(data.drinks_placeholders) ? data.drinks_placeholders : []);
        setPlaceholderIntro(data.placeholder_intro || "");
        setDrinksPlaceholderIntro(data.drinks_placeholder_intro || "");
        setPagination(data.pagination || null);
        setStatus("ok");
        onCount?.(Array.isArray(data.restaurants) ? data.restaurants.length : 0);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load restaurants here."));
        setStatus("error");
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onCount is a display callback
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

  const diningByZoneHeading = getClusterDiningByZoneHeading(cluster);
  // A–Z only, first 8 then "Show all", as the app (Andre 2026-10-25/26).
  const sorted = [...restaurants].sort((a, b) =>
    String(a.name || a.restaurant_name || "").localeCompare(String(b.name || b.restaurant_name || ""), "en", { sensitivity: "base" })
  );
  const shownRestaurants = showAll ? sorted : sorted.slice(0, RESTAURANTS_PREVIEW_COUNT);
  const renderRestaurantCard = (restaurant) => {
    const id = Number(restaurant.restaurant_id);
    return (
      <ClusterRestaurantDirectoryCard
        key={restaurant.restaurant_id}
        restaurant={restaurant}
        placeReturnPath={placeReturnPath}
        placeReturnLabel={placeReturnLabel}
        isFav={favIds.has(id)}
        favBusy={busyIds.has(id)}
        onToggleFav={toggleFav}
      />
    );
  };

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {restaurants.length > 0 ? (
        <>
          <div style={CLUSTER_DIRECTORY_GRID_STYLE}>{shownRestaurants.map(renderRestaurantCard)}</div>
          {sorted.length > RESTAURANTS_PREVIEW_COUNT ? (
            <button
              type="button"
              data-testid="cluster-restaurants-toggle"
              onClick={() => setShowAll((v) => !v)}
              style={{
                justifySelf: "center",
                padding: "0.45rem 0.9rem",
                borderRadius: 999,
                border: "1px solid var(--mp-accent, #0f7a24)",
                background: "#fff",
                color: "var(--mp-accent, #0f7a24)",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
              }}
            >
              {showAll ? "Show fewer" : `Show all ${sorted.length}`}
            </button>
          ) : null}
          {/* Sellable slot (ad marketplace); it sat between cuisine groups before the A–Z list. */}
          <SpacedClusterAdSlot compact clusterSlug={clusterSlug} pageRegion="cluster_events_top" />
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
      <SpacedClusterAdSlot clusterSlug={clusterSlug} pageRegion="cluster_restaurant_footer" />
    </div>
  );
}

/** Cluster food searches/categories open sorted by price, low to high (Andre, 2026-10-11). */
const DEFAULT_CLUSTER_PRICE_SORT = "asc";
/** Cluster search results per page ("Load more" fetches the next page). */
const SEARCH_PAGE_SIZE = 24;

const CLUSTER_SEARCH_GRID_STYLE = {
  display: "grid",
  gap: "0.85rem",
};

const CLUSTER_AD_SPACE_STYLE = {
  padding: "2.75rem 0 3.25rem",
};

const CLUSTER_SEARCH_VIDEO_ROW_STYLE = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.5rem",
  minWidth: 0,
};

function SpacedClusterAdSlot({ compact = false, slim = false, ...props }) {
  return (
    <div
      data-testid="cluster-ad-space"
      data-ad-compact={compact ? "true" : "false"}
      data-ad-slim={slim ? "true" : "false"}
      style={
        slim
          ? { padding: "0.55rem 0 0.7rem" }
          : compact
            ? {
                padding: "1.35rem 0 1.6rem",
                display: "flex",
                justifyContent: "center",
              }
            : CLUSTER_AD_SPACE_STYLE
      }
    >
      <ClusterAdSlot size={slim ? "slim" : compact ? "small" : undefined} {...props} />
    </div>
  );
}

/** Ads sit between results: after the 4th, then every 6th, never as the last row. */
const CLUSTER_SEARCH_AD_FIRST = 4;
const CLUSTER_SEARCH_AD_EVERY = 6;

function shouldInsertClusterSearchAd(index, totalCount) {
  const after = index + 1;
  if (after < CLUSTER_SEARCH_AD_FIRST || totalCount - after < 2) return false;
  return (after - CLUSTER_SEARCH_AD_FIRST) % CLUSTER_SEARCH_AD_EVERY === 0;
}

/** Not boxes on the cluster page, same as the app (Andre 2026-10-26/30); their dishes still show in search. */
const CLUSTER_HIDDEN_BOX_TYPES = new Set(["KIDS", "SIDES", "COMBOS", "SPECIALS", "BREAKFAST"]);

/** Phones: in-result ads use the 16:9 creative; wider rows use the slim one so the artwork isn't cropped. */
const CLUSTER_PHONE_QUERY = "(max-width: 640px)";

const CLUSTER_STICKY_CHROME_STYLE = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "#fff",
  marginLeft: "-1rem",
  marginRight: "-1rem",
  padding: "0.7rem 1rem 0.8rem",
  borderBottom: "1px solid #e5e7eb",
  display: "grid",
  gap: "0.65rem",
  minWidth: 0,
};

/** history state key: this entry is a food type/search step opened from the boxes (Back closes it). */
const CLUSTER_FOOD_STEP_STATE = "clusterFoodStep";

const CLUSTER_FOOD_STICKY_STYLE = {
  position: "sticky",
  zIndex: 14, // under a playing clip (15) and the search (20), so it slides away beneath them
  background: "#fff",
  marginLeft: "-1rem",
  marginRight: "-1rem",
  padding: "0.5rem 1rem",
  borderBottom: "1px solid #e5e7eb",
  display: "grid",
  gap: "0.5rem",
  minWidth: 0,
};

const CLUSTER_SECTION_TITLE_STYLE = { margin: 0, fontSize: "1.15rem", lineHeight: 1.25, color: "#111827" };

const CLUSTER_BACK_ROW_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.6rem",
  padding: "0.2rem 0",
  border: "none",
  background: "none",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
  minWidth: 0,
};

const CLUSTER_BACK_CIRCLE_STYLE = {
  width: 32,
  height: 32,
  flexShrink: 0,
  borderRadius: "50%",
  border: "1.5px solid var(--mp-accent, #0f7a24)",
  color: "var(--mp-accent, #0f7a24)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  lineHeight: 1,
  paddingBottom: 2,
  boxSizing: "border-box",
};

/** While a food type or search is open (app 2026-11-04): compact pill, bottom left, above the tab bar. */
const CLUSTER_FLOAT_BACK_STYLE = {
  position: "fixed",
  left: 16,
  bottom: "calc(84px + env(safe-area-inset-bottom, 0px))",
  zIndex: 40,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "0.5rem 1rem 0.5rem 0.6rem",
  borderRadius: 999,
  border: "none",
  background: "var(--mp-accent, #0f7a24)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  cursor: "pointer",
};

/** Shared with the Food by type screen (same search, same behavior). */
export function ClusterFoodSearchForm({
  searchInput,
  onSearchInputChange,
  searchPlaceholder,
  searchActive,
  onSubmit,
  onClear,
}) {
  return (
    <form
      data-testid="cluster-sticky-search-form"
      onSubmit={onSubmit}
      style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-start" }}
    >
      <div style={{ flex: "1 1 220px", minWidth: 0, display: "grid", gap: "0.3rem" }}>
        <input
          type="search"
          value={searchInput}
          onChange={onSearchInputChange}
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
          onClick={onClear}
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
  );
}

/** Price sort key: a live deal ranks by its deal price (Andre 2026-11-04), same as the server. */
function clusterSortPriceCents(item) {
  const deal = liveItemDeal(item);
  return deal?.dealCents != null ? deal.dealCents : getConsumerDisplayPrice(item);
}

function ClusterMenuExplorerTab({
  clusterSlug,
  cluster,
  enabled,
  stickyLead = null,
  preContent = null,
  postContent = null,
  onFoodShown = null,
}) {
  const PAGE_SIZE = 40;
  const [status, setStatus] = useState(enabled ? "loading" : "idle");
  const [mksCategories, setMksCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");
  // Search (?q=), tapped category (?category=) and drink chip (?drink=) live in the URL
  // so Share / reload reproduce the same results.
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const submittedSearch = String(searchParams.get(CLUSTER_SEARCH_QUERY_KEY) || "").trim();
  const urlCategoryCode = normalizeClusterCategoryCode(searchParams.get(CLUSTER_CATEGORY_QUERY_KEY));
  const [searchInput, setSearchInput] = useState(submittedSearch);
  const [searchStatus, setSearchStatus] = useState("idle");
  const [searchMenuItems, setSearchMenuItems] = useState([]);
  const [searchQueryMeta, setSearchQueryMeta] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const lastTrackedSearchRef = useRef(null);
  const [priceSort, setPriceSort] = useState(DEFAULT_CLUSTER_PRICE_SORT);
  const [selectedZone, setSelectedZone] = useState(null);
  const { index: videoIndex } = useClusterVideos();
  // One fetch for every ad between search results (house "Eating is Social" until one is sold).
  // Phones get the 16:9 inline creative; wide rows get the slim one so the artwork isn't cropped.
  const resultAdRegion = useMatchMedia(CLUSTER_PHONE_QUERY) ? "cluster_search_inline" : "cluster_search_top";
  const searchInlineAd = useClusterAd({ clusterSlug, pageRegion: resultAdRegion });
  const [drinkSubcategory, setDrinkSubcategory] = useState(() =>
    normalizeClusterDrinkSubcategory(searchParams.get(CLUSTER_DRINK_QUERY_KEY))
  );
  const [availableDrinkCategories, setAvailableDrinkCategories] = useState([]);
  // Nutrition chips above the boxes, as in the app (clusters with food-by-type data only: USC today).
  const foodChips = useFoodTypeChips(clusterSlug, { enabled: enabled && isClusterFoodByTypeEnabled() });
  const chipsOn = foodChips.chips.length > 0;
  // Chips path: FoodByTypeDishList reports when its first page for the type is still loading.
  const [dishListPending, setDishListPending] = useState(false);

  function updateFoodParams(mutate, { push = false } = {}) {
    const params = new URLSearchParams(searchParams);
    mutate(params);
    // A pushed step (opening a type or a search from the boxes) is marked, so Back closes it.
    if (push) setSearchParams(params, { state: { [CLUSTER_FOOD_STEP_STATE]: true } });
    else setSearchParams(params, { replace: true, state: location.state });
  }

  function selectCategory(category) {
    setDrinkSubcategory(CLUSTER_DRINK_SUBCATEGORY_ALL);
    setSelectedCategory(category);
    // Andre 2026-11-05: Back from a food type returns to this cluster's boxes, not the page before.
    const push = Boolean(category?.code) && !selectedCategory && !searchActive;
    updateFoodParams(
      (params) => {
        if (category?.code) params.set(CLUSTER_CATEGORY_QUERY_KEY, category.code);
        else params.delete(CLUSTER_CATEGORY_QUERY_KEY);
        params.delete(CLUSTER_DRINK_QUERY_KEY);
      },
      { push },
    );
  }

  /** Back to every food type (the back circle, the floating "All types" pill, a cleared search). */
  function backToAllTypes() {
    if (location.state?.[CLUSTER_FOOD_STEP_STATE]) {
      // This type/search was a step we added: going back pops it, so browser Back stays in step.
      setSearchInput("");
      navigate(-1);
    } else if (searchActive) {
      setSearchInput("");
      const params = new URLSearchParams(searchParams);
      params.delete(CLUSTER_SEARCH_QUERY_KEY);
      params.delete(CLUSTER_CATEGORY_QUERY_KEY);
      params.delete(CLUSTER_DRINK_QUERY_KEY);
      setSearchParams(params, { replace: true });
      setSelectedCategory(null);
    } else {
      selectCategory(null);
    }
    document.getElementById("cluster-food")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  function selectDrinkSubcategory(id) {
    const next = normalizeClusterDrinkSubcategory(id);
    setDrinkSubcategory(next);
    updateFoodParams((params) => {
      if (next === CLUSTER_DRINK_SUBCATEGORY_ALL) params.delete(CLUSTER_DRINK_QUERY_KEY);
      else params.set(CLUSTER_DRINK_QUERY_KEY, next);
    });
  }

  const searchActive = Boolean(submittedSearch.trim());
  const drinksCategorySelected = isClusterBeveragesCategory(selectedCategory);
  // College clusters (USC, UCLA, …): coffee, tea and other non-alcoholic drinks before alcohol.
  const nonAlcoholicDrinksFirst = isUniversityCluster(cluster);
  const visibleDrinkChips = useMemo(
    () => visibleClusterDrinkSubcategoryChips(availableDrinkCategories, { nonAlcoholicFirst: nonAlcoholicDrinksFirst }),
    [availableDrinkCategories, nonAlcoholicDrinksFirst],
  );

  const availableZones = useMemo(() => collectClusterZones(items), [items]);
  const zoneNoun = useMemo(() => getClusterZoneNoun(cluster), [cluster]);

  useEffect(() => {
    if (selectedZone && availableZones.length > 0 && !availableZones.includes(selectedZone)) {
      setSelectedZone(null);
    }
  }, [selectedZone, availableZones]);

  // Shared/reloaded ?category= link: open that category once the cluster's categories load.
  // Applied once per URL code: going back clears the selection a render before the URL catches up,
  // and re-applying the stale code then reopened the type (seen 2026-11-05).
  const appliedUrlCategoryRef = useRef(null);
  // Browser Back took ?q= away: empty the search box too.
  useEffect(() => {
    if (!submittedSearch) setSearchInput("");
  }, [submittedSearch]);
  // The food filters pin just under the sticky search — and under a playing clip, which pins there
  // too — so track both heights (the search wraps on phones; the clip band comes and goes).
  const [chromeNode, chromeRef] = useState(null);
  const [filtersTop, setFiltersTop] = useState(0);
  const measureFiltersTop = useRef(() => {});
  measureFiltersTop.current = () => {
    if (!chromeNode) return;
    const panel = chromeNode.closest?.('[data-testid="cluster-view-panel-menu"]') || document;
    const band = panel.querySelector?.('[data-testid="cluster-video-hero-band"][data-sticky="1"]');
    const bandHeight = band ? band.getBoundingClientRect().height : 0;
    setFiltersTop(Math.round(chromeNode.getBoundingClientRect().height + bandHeight));
  };
  useLayoutEffect(() => {
    measureFiltersTop.current();
  });
  useEffect(() => {
    if (!chromeNode) return undefined;
    const measure = () => measureFiltersTop.current();
    const panel = chromeNode.closest?.('[data-testid="cluster-view-panel-menu"]') || document.body;
    window.addEventListener("resize", measure);
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(chromeNode);
    const observeBand = () => {
      const band = panel.querySelector?.('[data-testid="cluster-video-hero-band"]');
      if (band) resize?.observe(band);
    };
    observeBand();
    // A clip starting or stopping flips the band's data-sticky; the band may also mount late.
    const mutations =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => {
            observeBand();
            measure();
          });
    mutations?.observe(panel, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-sticky"] });
    return () => {
      window.removeEventListener("resize", measure);
      resize?.disconnect();
      mutations?.disconnect();
    };
  }, [chromeNode]);
  useEffect(() => {
    if (!urlCategoryCode) {
      appliedUrlCategoryRef.current = null;
      // Browser Back took ?category= away: show the boxes again.
      if (selectedCategory && !searchActive) setSelectedCategory(null);
      return;
    }
    if (searchActive || appliedUrlCategoryRef.current === urlCategoryCode) return;
    if (selectedCategory?.code === urlCategoryCode) {
      appliedUrlCategoryRef.current = urlCategoryCode;
      return;
    }
    const match = mksCategories.find((category) => String(category?.code || "").toUpperCase() === urlCategoryCode);
    if (match) {
      appliedUrlCategoryRef.current = urlCategoryCode;
      setSelectedCategory(match);
    }
  }, [urlCategoryCode, mksCategories, searchActive, selectedCategory?.code]);

  useEffect(() => {
    if (
      drinkSubcategory !== CLUSTER_DRINK_SUBCATEGORY_ALL &&
      availableDrinkCategories.length > 0 &&
      !availableDrinkCategories.includes(drinkSubcategory)
    ) {
      setDrinkSubcategory(CLUSTER_DRINK_SUBCATEGORY_ALL);
    }
  }, [drinkSubcategory, availableDrinkCategories]);

  const displayItems = useMemo(() => {
    const sorted = applyClusterZoneAndPriceSort(items, {
      zone: selectedZone,
      priceSort,
      getPriceCents: clusterSortPriceCents,
    });
    return drinksCategorySelected && nonAlcoholicDrinksFirst ? sortNonAlcoholicDrinksFirst(sorted) : sorted;
  }, [items, selectedZone, priceSort, drinksCategorySelected, nonAlcoholicDrinksFirst]);

  /** Same price-sort infrastructure as category browse — applies on search for every cluster. */
  const displaySearchItems = useMemo(
    () =>
      applyClusterZoneAndPriceSort(searchMenuItems, {
        zone: null,
        priceSort,
        getPriceCents: clusterSortPriceCents,
      }),
    [searchMenuItems, priceSort],
  );

  const renderClusterFoodPriceSortControls = () => (
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
    setAvailableDrinkCategories([]);

    fetchClusterMenuItems(clusterSlug, { summary: true, signal: controller.signal })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load food categories");
        const cats = Array.isArray(data.mks_categories) ? data.mks_categories : [];
        setMksCategories(
          cats.filter(
            (c) =>
              !CLUSTER_HIDDEN_BOX_TYPES.has(c?.code) &&
              (Number(c?.item_count || 0) > 0 || c?.item_count == null)
          )
        );
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
    // Chips on: the matching dishes come from FoodByTypeDishList instead.
    if (!enabled || !clusterSlug || !selectedCategory?.code || searchActive || chipsOn) return undefined;

    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setItems([]);
    setPagination(null);
    setPriceSort(DEFAULT_CLUSTER_PRICE_SORT);
    setSelectedZone(null);
    if (!isClusterBeveragesCategory(selectedCategory)) {
      setAvailableDrinkCategories([]);
    }

    const drinkCategory =
      isClusterBeveragesCategory(selectedCategory) &&
      drinkSubcategory !== CLUSTER_DRINK_SUBCATEGORY_ALL
        ? drinkSubcategory
        : null;

    fetchClusterMenuItems(clusterSlug, {
      mksCategory: selectedCategory.code,
      drinkCategory,
      priceSort,
      limit: PAGE_SIZE,
      offset: 0,
      signal: controller.signal,
    })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Could not load food for this category.");
        setItems(Array.isArray(data.menu_items) ? data.menu_items : []);
        setPagination(data.pagination || null);
        if (isClusterBeveragesCategory(selectedCategory)) {
          setAvailableDrinkCategories(resolveAvailableDrinkCategoriesFromResponse(data));
        }
        setStatus("ok");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(toConsumerErrorMessage(err, "Could not load food for this category."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled, selectedCategory?.code, drinkSubcategory, searchActive, priceSort, chipsOn]);

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
    setSearchHasMore(false);

    searchCluster(clusterSlug, {
      q: submittedSearch.trim(),
      limit: SEARCH_PAGE_SIZE,
      priceSort,
      signal: controller.signal,
    })
      .then((data) => {
        if (!data?.ok) throw new Error(data?.error || "Search failed");
        setSearchMenuItems(Array.isArray(data.menu_items) ? data.menu_items : []);
        setSearchQueryMeta(data.query || null);
        setSearchHasMore(Boolean(data.pagination?.has_more));
        setSearchStatus("ok");
        // Owner Analytics: one finished search with its result count (sorting re-fetches aren't new searches).
        const searchKey = submittedSearch.trim().toLowerCase();
        if (lastTrackedSearchRef.current !== searchKey) {
          lastTrackedSearchRef.current = searchKey;
          trackSearchResults({ resultCount: (data.menu_items || []).filter((row) => !row?.placeholder_item).length });
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setSearchError(toConsumerErrorMessage(err, "Could not search food here."));
        setSearchStatus("error");
      });

    return () => controller.abort();
  }, [clusterSlug, enabled, searchActive, submittedSearch, priceSort]);

  // A new search starts on the default price order (changing the sort re-fetches above).
  useEffect(() => {
    if (searchActive) setPriceSort(DEFAULT_CLUSTER_PRICE_SORT);
  }, [submittedSearch, searchActive]);

  async function loadMoreSearchItems() {
    if (!clusterSlug || !searchActive || !searchHasMore || searchLoadingMore) return;
    setSearchLoadingMore(true);
    setSearchError("");
    try {
      const data = await searchCluster(clusterSlug, {
        q: submittedSearch.trim(),
        limit: SEARCH_PAGE_SIZE,
        offset: searchMenuItems.length,
        priceSort,
      });
      if (!data?.ok) throw new Error(data?.error || "Could not load more food");
      const nextItems = Array.isArray(data.menu_items) ? data.menu_items : [];
      setSearchMenuItems((prev) => {
        const seen = new Set(prev.map((row) => `${row.menu_item_id ?? row.id}-${row.restaurant_id}`));
        return [...prev, ...nextItems.filter((row) => !seen.has(`${row.menu_item_id ?? row.id}-${row.restaurant_id}`))];
      });
      setSearchHasMore(Boolean(data.pagination?.has_more));
    } catch (err) {
      setSearchError(toConsumerErrorMessage(err, "Could not load more food."));
    } finally {
      setSearchLoadingMore(false);
    }
  }

  async function loadMoreCategoryItems() {
    if (!clusterSlug || !selectedCategory?.code || !pagination?.has_more || status === "loading-more") return;
    setStatus("loading-more");
    setError("");

    try {
      const drinkCategory =
        isClusterBeveragesCategory(selectedCategory) &&
        drinkSubcategory !== CLUSTER_DRINK_SUBCATEGORY_ALL
          ? drinkSubcategory
          : null;
      const data = await fetchClusterMenuItems(clusterSlug, {
        mksCategory: selectedCategory.code,
        drinkCategory,
        limit: PAGE_SIZE,
        offset: items.length,
        priceSort,
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
    const params = new URLSearchParams(searchParams);
    params.set(CLUSTER_SEARCH_QUERY_KEY, trimmed);
    params.delete(CLUSTER_CATEGORY_QUERY_KEY);
    params.delete(CLUSTER_DRINK_QUERY_KEY);
    // From the boxes, a search is a step Back closes; a new search over one replaces it.
    if (!searchActive && !selectedCategory) {
      setSearchParams(params, { state: { [CLUSTER_FOOD_STEP_STATE]: true } });
    } else {
      setSearchParams(params, { replace: true, state: location.state });
    }
    setSelectedCategory(null);
  }

  function clearSearch() {
    setSearchInput("");
    if (location.state?.[CLUSTER_FOOD_STEP_STATE]) {
      navigate(-1);
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.delete(CLUSTER_SEARCH_QUERY_KEY);
    setSearchParams(params, { replace: true });
  }

  // Tell the page once the food boxes (or search results / an open type) have had their first paint,
  // so the Wall can come in after them.
  const foodShownRef = useRef(false);
  useEffect(() => {
    if (foodShownRef.current || !onFoodShown) return;
    if (status === "loading" && !searchActive) return;
    foodShownRef.current = true;
    onFoodShown();
  }, [status, searchActive, onFoodShown]);

  if (!enabled) {
    return <p style={{ color: "#888" }}>Select Food to browse what you can eat here.</p>;
  }

  const categoryTitle = selectedCategory?.label || null;
  const typeOpen = searchActive || Boolean(selectedCategory);
  const typeResultsPending =
    Boolean(selectedCategory) && !searchActive && (chipsOn ? dishListPending : status === "loading");
  // Nutrition chips + the open type's back/title/price sort (or the search result count/sort) pin
  // under the sticky search while the dish list scrolls, and let go where Food by type ends.
  let foodStickyRow = null;
  if (searchActive) {
    if (searchStatus === "ok" && searchMenuItems.length > 0) {
      foodStickyRow = (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <p
            data-testid="cluster-food-search-result-count"
            style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}
            aria-live="polite"
          >
            Showing {displaySearchItems.length}{" "}
            {displaySearchItems.length === 1 ? "result" : "results"}
          </p>
          {renderClusterFoodPriceSortControls()}
        </div>
      );
    }
  } else if (selectedCategory) {
    foodStickyRow = (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={backToAllTypes}
          aria-label="All food types"
          data-testid="cluster-types-back"
          style={CLUSTER_BACK_ROW_STYLE}
        >
          <span aria-hidden="true" style={CLUSTER_BACK_CIRCLE_STYLE}>‹</span>
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#111827" }}>
            {`${clusterBoxLook(selectedCategory.code).emoji} ${categoryTitle}`}
          </h2>
        </button>
        {chipsOn ? null : renderClusterFoodPriceSortControls()}
      </div>
    );
  }
  const results = (
    <div style={{ display: "grid", gap: "1rem" }} id="cluster-food" data-testid="cluster-food">
      <h2 style={CLUSTER_SECTION_TITLE_STYLE}>Food by type</h2>
      {foodStickyRow || (!searchActive && foodChips.availableChips.length) ? (
        <div
          data-testid="cluster-food-sticky"
          style={{ ...CLUSTER_FOOD_STICKY_STYLE, top: filtersTop }}
        >
          {!searchActive ? (
            <FoodByTypeChipRow
              chips={foodChips.chips}
              availableChips={foodChips.availableChips}
              onToggle={foodChips.onToggle}
            />
          ) : null}
          {foodStickyRow}
        </div>
      ) : null}
      {searchActive ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {searchStatus === "loading" ? <p style={{ color: "#666", margin: 0 }}>Searching {submittedSearch}…</p> : null}
          {searchStatus === "error" ? <p style={{ color: "#b91c1c", margin: 0 }}>{searchError}</p> : null}
          {searchStatus === "ok" && searchMenuItems.length === 0 ? (
            <p style={{ color: "#888", margin: 0 }}>No food in this area matches “{submittedSearch}”.</p>
          ) : null}
          <div
            style={CLUSTER_SEARCH_GRID_STYLE}
            onClickCapture={(event) => {
              if (event.target?.closest?.("a, button") && !event.target.closest("[data-ad-result]")) trackSearchResultTap("dish");
            }}
          >
            {displaySearchItems.map((row, index) => {
              const inlineSlot = shouldInsertClusterSearchAd(index, displaySearchItems.length) ? (
                <div data-testid="cluster-ad-space" data-ad-result="true">
                  <ClusterAdCreative
                    {...searchInlineAd}
                    pageRegion={resultAdRegion}
                    size="result"
                  />
                </div>
              ) : null;

              if (row?.placeholder_item) {
                return (
                  <React.Fragment key={`cluster-search-ph-${row.placeholder_key || row.name}`}>
                    <ClusterPlaceholderFoodCard item={row} />
                    {inlineSlot}
                  </React.Fragment>
                );
              }

              const rowId = row?.menu_item_id ?? row?.id;
              const rowName = row?.search_display_name || row?.menu_item_name || row?.name || "item";
              const card = (
                <SearchResultCard
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
              const rowVideos = videoIndex.forDish(row);
              return (
                <React.Fragment key={`cluster-search-${rowId || rowName}`}>
                  {rowVideos.length > 0 ? (
                    <div data-testid="cluster-search-video-row" style={CLUSTER_SEARCH_VIDEO_ROW_STYLE}>
                      <div style={{ paddingTop: 12 }}>
                        <ClusterVideoPlayButton
                          videos={rowVideos}
                          trigger="dish_icon"
                          item={{ ...row, name: rowName }}
                          label={`Play clip of ${rowName}`}
                          testId="cluster-search-video-play"
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>{card}</div>
                    </div>
                  ) : (
                    card
                  )}
                  {inlineSlot}
                </React.Fragment>
              );
            })}
          </div>
          {searchStatus === "ok" && searchHasMore ? (
            <button
              type="button"
              data-testid="cluster-food-search-load-more"
              onClick={loadMoreSearchItems}
              disabled={searchLoadingMore}
              style={{
                marginTop: "0.25rem",
                padding: "0.65rem 1rem",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: searchLoadingMore ? "wait" : "pointer",
              }}
            >
              {searchLoadingMore ? "Loading…" : "Load more"}
            </button>
          ) : null}
          {searchStatus === "ok" && searchError ? <p style={{ color: "#b91c1c", margin: 0 }}>{searchError}</p> : null}
        </div>
      ) : selectedCategory ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {!chipsOn && availableZones.length > 0 ? (
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
          {drinksCategorySelected && !chipsOn && visibleDrinkChips.length > 0 ? (
            <ClusterDrinkBoxGrid
              chips={visibleDrinkChips.map((chip) =>
                chip.id === CLUSTER_DRINK_SUBCATEGORY_ALL ? { ...chip, label: "All drinks" } : chip
              )}
              selectedId={drinkSubcategory}
              onSelect={selectDrinkSubcategory}
            />
          ) : null}
          {chipsOn ? (
            <FoodByTypeDishList
              clusterSlug={clusterSlug}
              category={selectedCategory.code}
              chips={foodChips.chips}
              activeKey={foodChips.activeKey}
              returnTo={clusterReturnTo}
              listAd={<SpacedClusterAdSlot slim clusterSlug={clusterSlug} pageRegion="cluster_search_top" />}
              onPendingChange={setDishListPending}
            />
          ) : (
          <>
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
              showExcerpt={clusterShowsDishExcerpt(clusterSlug)}
              insertAfterIndex={
                displayItems.length >= 4 ? Math.min(3, displayItems.length - 2) : null
              }
              midListAd={
                displayItems.length >= 4 ? (
                  <SpacedClusterAdSlot
                    slim
                    clusterSlug={clusterSlug}
                    pageRegion={
                      drinksCategorySelected ? "cluster_deals_top" : "cluster_search_top"
                    }
                  />
                ) : null
              }
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
          </>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {status === "loading" ? <p style={{ color: "#666" }}>Loading food…</p> : null}
          {status === "error" ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
          {mksCategories.length === 0 && status === "ok" ? (
            <p style={{ color: "#888" }}>No food is listed in this area yet.</p>
          ) : null}
          <ClusterMksCategoryGrid
            categories={mksCategories}
            onSelect={(category) => selectCategory(category)}
            counts={chipsOn ? foodChips.counts : null}
            refreshing={foodChips.refreshing}
          />
          <SpacedClusterAdSlot compact clusterSlug={clusterSlug} pageRegion="cluster_landing_footer" />
        </div>
      )}
    </div>
  );


  return (
    <>
      <div ref={chromeRef} data-testid="cluster-sticky-chrome" style={CLUSTER_STICKY_CHROME_STYLE}>
        {stickyLead}
        <div data-testid="cluster-sticky-search">
          <ClusterFoodSearchForm
            searchInput={searchInput}
            onSearchInputChange={(event) => setSearchInput(event.target.value)}
            searchPlaceholder={searchPlaceholder}
            searchActive={searchActive}
            onSubmit={handleSearchSubmit}
            onClear={clearSearch}
          />
        </div>
      </div>
      <div style={{ overflowX: "clip", minWidth: 0 }}>
        <ClusterSearchActiveContext.Provider value={searchActive}>{preContent}</ClusterSearchActiveContext.Provider>
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
          {results}
        </main>
        {typeOpen ? (
          <button
            type="button"
            onClick={backToAllTypes}
            aria-label="Back to all food types"
            data-testid="cluster-types-float-back"
            style={CLUSTER_FLOAT_BACK_STYLE}
          >
            <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>‹</span>
            All types
          </button>
        ) : null}
        <ClusterTypeResultsPendingContext.Provider value={typeResultsPending}>
          {postContent}
        </ClusterTypeResultsPendingContext.Provider>
      </div>
    </>
  );
}

/** Wall timing on the cluster page: a beat after the food boxes paint; never later than the cap. */
const WALL_AFTER_FOOD_MS = 900;
const WALL_MAX_WAIT_MS = 20000;

export default function ClusterPage() {
  const { stateSlug, citySlug, clusterSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [cluster, setCluster] = useState(null);
  /** Campus live: venue filter shared by glance tiles, On campus rows and posts. */
  const [campusVenueFilter, setCampusVenueFilter] = useState(null);
  const [error, setError] = useState("");

  // Old ?view=restaurants links (the Food/Restaurants toggle is gone): open at Restaurants A–Z.
  const wantsRestaurants = String(searchParams.get("view") || "").trim().toLowerCase() === CLUSTER_VIEW_MODES.RESTAURANTS;
  const [restaurantCount, setRestaurantCount] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  // Wall comes in last (Andre 2026-11-07): Food by type and the clips show first, then the Wall
  // previews (phone strip / desktop column). A Wall link (?wall=1 / ?wall=write) skips the wait;
  // a slow food load never keeps the Wall away for more than WALL_MAX_WAIT_MS.
  const [wallReleased, setWallReleased] = useState(() => Boolean(searchParams.get("wall")));
  const wallTimerRef = useRef(null);
  const releaseWall = React.useCallback(() => {
    if (wallTimerRef.current) return;
    wallTimerRef.current = setTimeout(() => setWallReleased(true), WALL_AFTER_FOOD_MS);
  }, []);
  useEffect(() => {
    if (wallReleased) return undefined;
    const t = setTimeout(() => setWallReleased(true), WALL_MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [wallReleased]);
  useEffect(() => () => clearTimeout(wallTimerRef.current), []);

  // Set only when the cluster was opened from the search page pill / location panel.
  const exitTo = useMemo(() => resolveClusterExitTo(searchParams, clusterSlug), [searchParams, clusterSlug]);

  const shareData = useMemo(
    () => (cluster ? buildClusterShareData({ cluster, origin: CANONICAL_BASE }) : null),
    [cluster]
  );
  // Share button only: carries the active food search. Page metadata/canonical stay on the base cluster URL.
  const shareFilters = useMemo(() => readClusterShareFilters(searchParams), [searchParams]);
  const shareButtonData = useMemo(
    () =>
      cluster && shareFilters.label
        ? buildClusterShareData({ cluster, origin: CANONICAL_BASE, filters: shareFilters })
        : shareData,
    [cluster, shareFilters, shareData]
  );

  useEffect(() => {
    if (!clusterSlug) return undefined;

    rememberMenuBrowserVenueSession(clusterSlug);

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
    if (!wantsRestaurants || restaurantCount == null) return;
    document.getElementById("cluster-restaurants")?.scrollIntoView?.({ block: "start" });
  }, [wantsRestaurants, restaurantCount]);

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

  const engagementRootRef = useRef(null);
  useEngagementPage(engagementRootRef, {
    pageType: "cluster",
    ready: status !== "loading" && status !== "error" && Boolean(cluster?.id),
    clusterId: cluster?.id,
  });

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
  const productTitle = getClusterProductTitle(cluster);
  const disclaimer = getClusterDisclaimer(cluster);
  const showGrowingNotice = isClusterGrowing(cluster);
  const clusterLabel = getClusterReturnLabel(cluster);
  const clusterCityBack = clusterCityPath(cluster) || clusterDirectoryPath();
  const cityBackLabel = cluster.city ? `Back to ${cluster.city}` : "All clusters";
  const restaurantsReturnPath = cluster ? buildClusterRestaurantsReturnPath(cluster) : null;

  // Fresh element tree per call — both Food and Restaurants panels stay mounted,
  // so a single React element object must not be reused in two places.
  function renderStickyLead() {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem", minWidth: 0 }}>
          <h2
            data-testid="cluster-sticky-title"
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "1.2rem",
              lineHeight: 1.2,
              fontWeight: 700,
              minWidth: 0,
              overflowWrap: "anywhere",
              letterSpacing: "-0.02em",
            }}
          >
            {productTitle}
          </h2>
          <ClusterVideosPill />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "0.55rem",
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          {shareData ? (
            <ShareButton
              shareData={shareButtonData}
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
      </>
    );
  }

  // Video first; falls back to the delivered hero ad (see ClusterVideoHero for slot rules).
  // display: contents so a playing clip can stick below the search bar over the food list;
  // the hero owns its own spacing.
  const clusterFoodHero = (
    <div data-testid="cluster-ad-space" data-ad-compact="false" data-ad-slim="false" style={{ display: "contents" }}>
      <ClusterVideoHero clusterSlug={cluster.slug} />
    </div>
  );

  const clusterDisclaimer = (
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
  );

  const clusterFoodTail = (
    <>
      {showGrowingNotice ? <ClusterGrowingNotice /> : null}
      {clusterDisclaimer}
    </>
  );

  // Web-only cluster info, folded at the bottom like the app's dining halls (Andre 2026-11-05):
  // dining halls, today's reports, events. Restaurants are what Menuply sells, so they come first.
  const clusterExtras = (
    <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }} data-testid="cluster-extras">
      {/* University clusters only — hidden when no campus dining members. Replaced by the Wall where it's live. */}
      <HiddenWhileWallLive>
      <CampusDiningSection
        cluster={cluster}
        showGlance={false}
        onSelectVenue={(venue) => {
          setCampusVenueFilter(venue);
          document.getElementById("cluster-live-posts")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      />
      </HiddenWhileWallLive>

      {/* Public cluster dashboard — clock, hotspots, popular, comments. */}
      {cluster.slug ? (
        <ClusterFold title={`Today at ${clusterLabel}`} meta="Reports, comments" testId="cluster-today-fold">
          <ClusterPublicFeed
            cluster={cluster}
            venueFilter={campusVenueFilter}
            onVenueFilterChange={setCampusVenueFilter}
          />
        </ClusterFold>
      ) : null}

      {cluster.slug ? (
        // Mounted closed so it can report its count; no events = no fold line.
        <ClusterFold
          title="Events nearby"
          meta={eventCount ? String(eventCount) : null}
          testId="cluster-events-fold"
          eager
          hidden={!eventCount}
        >
          <ClusterNearbyEvents cluster={cluster} onCount={setEventCount} />
        </ClusterFold>
      ) : null}
    </div>
  );

  const clusterRestaurantsSection = (
    <section
      id="cluster-restaurants"
      data-testid="cluster-restaurants"
      style={{ display: "grid", gap: "0.65rem", marginTop: "0.5rem", scrollMarginTop: 180 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
        <h2 style={CLUSTER_SECTION_TITLE_STYLE}>Restaurants A–Z</h2>
        {restaurantCount ? <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>{restaurantCount}</span> : null}
      </div>
      <ClusterRestaurantsTab
        clusterSlug={cluster.slug}
        cluster={cluster}
        enabled
        placeReturnPath={restaurantsReturnPath}
        placeReturnLabel={clusterLabel}
        onCount={setRestaurantCount}
      />
    </section>
  );

  const themeSlug = String(cluster.slug || "").toLowerCase();
  const isIndioFestivalGrounds = themeSlug === INDIO_FESTIVAL_GROUNDS_SLUG;
  const isLaLive = themeSlug === "la-live";
  const isUsc = themeSlug === "usc";
  const isUcla = themeSlug === "ucla";
  const themeClass = isIndioFestivalGrounds
    ? "cluster-theme-indio-festival-grounds"
    : isLaLive
      ? "cluster-theme-la-live"
      : isUsc
        ? "cluster-theme-usc"
        : isUcla
          ? "cluster-theme-ucla"
          : undefined;

  return (
    <ClusterVideoProvider cluster={cluster}>
    <ClusterWallProvider
      clusterSlug={cluster.slug}
      clusterLabel={isUsc ? "USC" : cluster.name || pageHeading}
      hold={!wallReleased}
    >
    <ClusterWallFrame
      rootRef={engagementRootRef}
      className={themeClass}
      data-cluster-slug={cluster.slug}
      style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem 5rem", width: "100%", boxSizing: "border-box" }}
    >
      <header style={{ marginBottom: "0.85rem", minWidth: 0, display: "grid", gap: "0.75rem" }}>
        {exitTo ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", minWidth: 0 }}>
            <ClusterBackButton fallbackTo={clusterCityBack} label={cityBackLabel} />
            <Link
              to={exitTo}
              onClick={clearClusterExit}
              style={{
                flexShrink: 0,
                padding: "0.3rem 0.75rem",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                lineHeight: 1.2,
              }}
            >
              {EXIT_CLUSTER_LABEL}
            </Link>
          </div>
        ) : (
          <ClusterBackButton fallbackTo={clusterCityBack} label={cityBackLabel} />
        )}
        {isIndioFestivalGrounds ? (
          <div className="cluster-indio-festival-hero" data-testid="cluster-indio-festival-hero">
            <p className="cluster-indio-festival-eyebrow" data-testid="cluster-indio-festival-eyebrow">
              Menuply Place · Indio, California
            </p>
            <p className="cluster-indio-festival-kicker">Food &amp; drink in Indio&apos;s festival grounds</p>
            <p className="cluster-indio-festival-sub">
              Search vendor menus, browse food by area, and explore destination advertising —
              the same Menuply Place platform used for L.A. LIVE.
            </p>
          </div>
        ) : null}
        {isLaLive ? (
          <div className="cluster-lalive-hero" data-testid="cluster-lalive-hero">
            <p className="cluster-lalive-powered" data-testid="cluster-lalive-powered">
              L.A. LIVE powered by Menuply
            </p>
            <p className="cluster-lalive-kicker">Downtown&apos;s sports &amp; entertainment district</p>
            <p className="cluster-lalive-sub">
              Browse restaurants, menus, and drinks around Crypto.com Arena, Peacock Theater, and the
              Figueroa corridor — before the tip-off, show, or night out.
            </p>
          </div>
        ) : null}
        {isUsc ? (
          <div className="cluster-campus-hero" data-testid="cluster-usc-hero">
            <p className="cluster-campus-powered">USC powered by Menuply</p>
            {/* USC: the hero line is the page H1 (generic heading + intro were duplicative). */}
            <h1 className="cluster-campus-kicker">Food around University Park</h1>
            <p className="cluster-campus-sub">
              Nearby spots, dining halls, and what Trojans are eating right now, without digging
              through menus.
            </p>
          </div>
        ) : null}
        {isUcla ? (
          <div className="cluster-ucla-hero" data-testid="cluster-ucla-hero">
            <div className="cluster-ucla-hero-body">
              <p className="cluster-ucla-powered">UCLA powered by Menuply</p>
              <p className="cluster-ucla-kicker">Westwood dining, in one Place</p>
              <p className="cluster-ucla-sub">
                Campus halls and nearby food signals — what&apos;s happening with food here,
                without digging venue menus.
              </p>
            </div>
          </div>
        ) : null}
        {!isUsc ? (
          <>
            <h1
              style={{
                margin: 0,
                color: "#111827",
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
          </>
        ) : null}
        {cluster.id ? (
          <ClusterSubscribeButton clusterId={cluster.id} clusterName={cluster.name || pageHeading} />
        ) : null}
      </header>

      {/* One page, the app's order (Andre 2026-11-05): clips, food by type, restaurants A–Z, then the
          folded cluster info. The old Food/Restaurants toggle is gone. */}
      <ClusterWallColumns>
      <div data-testid="cluster-view-panel-menu">
        <ClusterMenuExplorerTab
          clusterSlug={cluster.slug}
          cluster={cluster}
          enabled
          stickyLead={renderStickyLead()}
          preContent={clusterFoodHero}
          onFoodShown={releaseWall}
          postContent={
            <>
              {/* Phone: the Wall as a sideways strip right after the food boxes (desktop shows the side column). */}
              <ClusterWallBandAfterTypeResults />
              {clusterRestaurantsSection}
              {clusterExtras}
              {clusterFoodTail}
            </>
          }
        />
      </div>
      </ClusterWallColumns>

      <BottomNav />
    </ClusterWallFrame>
    </ClusterWallProvider>
    </ClusterVideoProvider>
  );
}
