import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";
import { fetchClusterRestaurants } from "../lib/clusterApi.js";
import { dedupeDiscoveryMenus } from "../lib/discoveryFeedGuardrails.js";
import {
  FEED_MENU_LIBRARY_CHANGED,
  purgeExpiredRecent,
  readFeedMenuLibrary,
} from "../lib/feedMenuLibrary.js";
import {
  buildMenuCatalogBrowseParams,
  menuCatalogLocationLabel,
  readMenuCatalogAppliedLocation,
} from "../lib/menuCatalogBrowseLocation.js";
import {
  MENU_CATALOG_BROWSE_PAGE_SIZE,
  isMenuCatalogPersonalSection,
} from "../lib/menuCatalogCategories.js";
import {
  filterClusterRestaurantsForMenuBrowser,
  isMenuBrowserClusterScope,
} from "../lib/menuBrowserClusterSequence.js";
import { filterClusterEntriesByFoodSection } from "../lib/menuBrowserClusterCuisineFilter.js";
import { getMenuBrowserVenueCover } from "../lib/menuBrowserVenueCover.js";
import useDiscoveryAutoLocation from "./useDiscoveryAutoLocation.js";

const PAGE_SIZE = MENU_CATALOG_BROWSE_PAGE_SIZE;

function extractMenus(response) {
  if (Array.isArray(response?.menus)) return response.menus;
  const firstRow = Array.isArray(response?.rows) ? response.rows[0] : null;
  return Array.isArray(firstRow?.menus) ? firstRow.menus : [];
}

function readErrorMessage(error) {
  return toConsumerErrorMessage(
    error,
    "We couldn't load menus right now. Please try again in a moment."
  );
}

function libraryRowsToBrowseEntries(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.restaurant_id != null && String(row.restaurant_id).trim() !== "")
    .map((row) => ({
      restaurant_id: String(row.restaurant_id),
      restaurant_name: String(row.restaurant_name || "").trim() || "Restaurant",
      slug: String(row.slug || "").trim(),
      city: String(row.city || "").trim(),
      state: String(row.state || "").trim(),
    }));
}

function readPersonalLibraryEntries(section) {
  const lib = purgeExpiredRecent(readFeedMenuLibrary());
  if (section === "bookmarked") {
    return libraryRowsToBrowseEntries(
      [...(lib.saved || [])].sort(
        (a, b) =>
          Number(b?.last_opened_at || b?.bookmarked_at || 0) -
          Number(a?.last_opened_at || a?.bookmarked_at || 0)
      )
    );
  }
  if (section === "recent_viewed") {
    const savedIds = new Set((lib.saved || []).map((row) => String(row.restaurant_id)));
    return libraryRowsToBrowseEntries(
      [...(lib.recent || [])]
        .filter((row) => row?.restaurant_id && !savedIds.has(String(row.restaurant_id)))
        .sort((a, b) => Number(b?.last_opened_at || 0) - Number(a?.last_opened_at || 0))
    );
  }
  return [];
}

export default function useMenuCatalogSequence({
  section,
  drinksMode = false,
  urlCity = "",
  urlState = "",
  index = 0,
  clusterSlug = null,
}) {
  const autoLocation = useDiscoveryAutoLocation();
  const [entries, setEntries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [libraryTick, setLibraryTick] = useState(0);
  const requestRef = useRef(0);

  const isPersonalSection = isMenuCatalogPersonalSection(section);
  const scopedClusterSlug =
    !isPersonalSection && isMenuBrowserClusterScope(clusterSlug)
      ? String(clusterSlug).trim().toLowerCase()
      : null;

  const appliedLocation = useMemo(
    () => readMenuCatalogAppliedLocation(),
    [section, urlCity, urlState, scopedClusterSlug]
  );

  useEffect(() => {
    if (!isPersonalSection) return undefined;
    function onLibraryChange() {
      setLibraryTick((tick) => tick + 1);
    }
    window.addEventListener(FEED_MENU_LIBRARY_CHANGED, onLibraryChange);
    window.addEventListener("storage", onLibraryChange);
    return () => {
      window.removeEventListener(FEED_MENU_LIBRARY_CHANGED, onLibraryChange);
      window.removeEventListener("storage", onLibraryChange);
    };
  }, [isPersonalSection]);

  const scopeKey = useMemo(() => {
    if (isPersonalSection) {
      return ["personal", section, libraryTick].join("::");
    }
    if (scopedClusterSlug) {
      return ["cluster", scopedClusterSlug, drinksMode ? "drinks" : "food"].join("::");
    }
    return [
      urlCity || autoLocation.city || appliedLocation || "pending",
      urlState || autoLocation.state || "",
      autoLocation.lat ?? "",
      autoLocation.lng ?? "",
      autoLocation.status,
      ...(drinksMode ? ["drinks"] : []),
      section,
    ].join("::");
  }, [
    appliedLocation,
    autoLocation.city,
    autoLocation.lat,
    autoLocation.lng,
    autoLocation.state,
    autoLocation.status,
    drinksMode,
    isPersonalSection,
    libraryTick,
    scopedClusterSlug,
    section,
    urlCity,
    urlState,
  ]);

  const locationLabel = useMemo(() => {
    if (scopedClusterSlug) {
      return getMenuBrowserVenueCover(scopedClusterSlug).brandLine;
    }
    return menuCatalogLocationLabel({
      urlCity,
      urlState,
      appliedLocation,
      autoLocation,
    });
  }, [appliedLocation, autoLocation, scopedClusterSlug, urlCity, urlState]);

  const buildApiParams = useCallback(
    (loadMoreOffset = 0) => {
      if (scopedClusterSlug || isPersonalSection) return null;
      return buildMenuCatalogBrowseParams({
        urlCity,
        urlState,
        appliedLocation,
        autoLocation,
        loadMoreOffset,
        section,
        drinksMode,
      });
    },
    [
      appliedLocation,
      autoLocation,
      drinksMode,
      isPersonalSection,
      scopedClusterSlug,
      section,
      urlCity,
      urlState,
    ]
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    async function runCluster() {
      setLoading(true);
      setError("");
      setEntries([]);
      setBrowseOffset(0);
      setHasMore(false);
      setTotalCount(0);

      try {
        const response = await fetchClusterRestaurants(scopedClusterSlug, {
          limit: PAGE_SIZE,
          offset: 0,
          signal: controller.signal,
        });
        if (cancelled || requestId !== requestRef.current) return;
        if (response && response.ok === false) {
          throw new Error(response.error || "Could not load cluster restaurants");
        }

        const rows = Array.isArray(response?.restaurants) ? response.restaurants : [];
        const extracted = filterClusterRestaurantsForMenuBrowser(rows);
        const pagination = response?.pagination || {};
        const nextOffset = (pagination.offset ?? 0) + (pagination.returned ?? rows.length);
        const totalAssigned = pagination.total_deduped ?? pagination.total_assigned ?? nextOffset;

        setEntries(extracted);
        setBrowseOffset(nextOffset);
        setTotalCount(pagination.total_menu_ready ?? extracted.length);
        setHasMore(Boolean(pagination.has_more) || nextOffset < totalAssigned);
      } catch (fetchError) {
        if (cancelled || fetchError?.name === "AbortError") return;
        setError(readErrorMessage(fetchError));
      } finally {
        if (!cancelled && requestId === requestRef.current) setLoading(false);
      }
    }

    async function runCity() {
      setLoading(true);
      setError("");
      setEntries([]);
      setBrowseOffset(0);
      setHasMore(false);
      setTotalCount(0);

      try {
        const apiParams = buildApiParams(0);
        if (!apiParams) return;
        if (cancelled) return;

        const response = await getBrowseMenus(apiParams, { signal: controller.signal });
        if (cancelled || requestId !== requestRef.current) return;

        const extracted = dedupeDiscoveryMenus(extractMenus(response));
        const newOffset = response?.pagination?.next_offset ?? extracted.length;
        const newTotal = response?.total_count ?? extracted.length;

        setEntries(extracted);
        setBrowseOffset(newOffset);
        setTotalCount(newTotal);
        setHasMore(response?.pagination?.has_more ?? newOffset < newTotal);
      } catch (fetchError) {
        if (cancelled || fetchError?.name === "AbortError") return;
        setError(readErrorMessage(fetchError));
      } finally {
        if (!cancelled && requestId === requestRef.current) setLoading(false);
      }
    }

    if (!section) return undefined;

    if (isPersonalSection) {
      setLoading(true);
      setError("");
      const personal = readPersonalLibraryEntries(section);
      setEntries(personal);
      setBrowseOffset(personal.length);
      setTotalCount(personal.length);
      setHasMore(false);
      setLoading(false);
      return undefined;
    }

    if (scopedClusterSlug) runCluster();
    else runCity();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [buildApiParams, isPersonalSection, scopeKey, section, scopedClusterSlug]);

  const loadMore = useCallback(async () => {
    if (isPersonalSection) return false;
    if (!section || loading || loadingMore || !hasMore) return false;
    setLoadingMore(true);
    const requestId = requestRef.current;
    try {
      if (scopedClusterSlug) {
        const response = await fetchClusterRestaurants(scopedClusterSlug, {
          limit: PAGE_SIZE,
          offset: browseOffset,
        });
        if (requestId !== requestRef.current) return false;
        if (response && response.ok === false) {
          throw new Error(response.error || "Could not load more cluster restaurants");
        }
        const rows = Array.isArray(response?.restaurants) ? response.restaurants : [];
        const more = filterClusterRestaurantsForMenuBrowser(rows);
        const pagination = response?.pagination || {};
        const nextOffset = (pagination.offset ?? browseOffset) + (pagination.returned ?? rows.length);
        const totalAssigned = pagination.total_deduped ?? pagination.total_assigned ?? nextOffset;
        setEntries((prev) => {
          const seen = new Set(prev.map((e) => String(e.restaurant_id)));
          const merged = [...prev];
          for (const entry of more) {
            const key = String(entry.restaurant_id);
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(entry);
          }
          return merged;
        });
        setBrowseOffset(nextOffset);
        setTotalCount((prev) => pagination.total_menu_ready ?? Math.max(prev, nextOffset));
        setHasMore(Boolean(pagination.has_more) || nextOffset < totalAssigned);
        return true;
      }

      const apiParams = buildApiParams(browseOffset);
      if (!apiParams) return false;
      const response = await getBrowseMenus(apiParams);
      if (requestId !== requestRef.current) return false;
      const more = dedupeDiscoveryMenus(extractMenus(response));
      const newTotal = response?.total_count ?? browseOffset + more.length;
      const newOffset = response?.pagination?.next_offset ?? browseOffset + more.length;
      setEntries((prev) => dedupeDiscoveryMenus([...prev, ...more]));
      setBrowseOffset(newOffset);
      setTotalCount(newTotal);
      setHasMore(response?.pagination?.has_more ?? newOffset < newTotal);
      return true;
    } catch (fetchError) {
      setError(readErrorMessage(fetchError));
      return false;
    } finally {
      setLoadingMore(false);
    }
  }, [
    browseOffset,
    buildApiParams,
    hasMore,
    isPersonalSection,
    loading,
    loadingMore,
    scopedClusterSlug,
    section,
  ]);

  const activeIndex = Math.max(0, index);
  const displayEntries = useMemo(() => {
    if (isPersonalSection || !scopedClusterSlug || drinksMode) return entries;
    return filterClusterEntriesByFoodSection(entries, section);
  }, [drinksMode, entries, isPersonalSection, scopedClusterSlug, section]);
  const currentEntry = activeIndex < displayEntries.length ? displayEntries[activeIndex] : null;
  const waitingForPage =
    displayEntries.length > 0 && activeIndex >= displayEntries.length && (hasMore || loadingMore);

  useEffect(() => {
    if (!displayEntries.length || loading || loadingMore || !hasMore) return;
    if (activeIndex >= displayEntries.length - 2) {
      loadMore();
    }
  }, [activeIndex, displayEntries.length, hasMore, loadMore, loading, loadingMore]);

  useEffect(() => {
    if (!waitingForPage || loadingMore) return;
    loadMore();
  }, [loadMore, loadingMore, waitingForPage]);

  const displayTotal =
    scopedClusterSlug && !drinksMode ? displayEntries.length : totalCount || displayEntries.length;
  const hasNext = displayEntries.length > 0 && (activeIndex < displayEntries.length - 1 || hasMore);
  const hasPrev = activeIndex > 0;
  const clampToIndex =
    !hasMore && displayEntries.length > 0 && activeIndex >= displayEntries.length
      ? displayEntries.length - 1
      : null;

  return {
    entries: displayEntries,
    currentEntry,
    activeIndex,
    totalCount: displayTotal,
    loading,
    loadingMore,
    error,
    locationLabel,
    hasNext,
    hasPrev,
    hasMore,
    waitingForPage,
    clampToIndex,
    isEmpty: !loading && displayEntries.length === 0,
    isPersonalSection,
    locationPending:
      isPersonalSection || scopedClusterSlug
        ? false
        : autoLocation.status === "locating" && !buildApiParams(0),
  };
}
