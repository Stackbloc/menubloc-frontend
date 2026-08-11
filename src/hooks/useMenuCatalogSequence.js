import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";
import { fetchClusterRestaurants } from "../lib/clusterApi.js";
import { dedupeDiscoveryMenus } from "../lib/discoveryFeedGuardrails.js";
import {
  buildMenuCatalogBrowseParams,
  menuCatalogLocationLabel,
  readMenuCatalogAppliedLocation,
} from "../lib/menuCatalogBrowseLocation.js";
import { MENU_CATALOG_BROWSE_PAGE_SIZE } from "../lib/menuCatalogCategories.js";
import {
  filterClusterRestaurantsForMenuBrowser,
  isMenuBrowserClusterScope,
} from "../lib/menuBrowserClusterSequence.js";
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
  const requestRef = useRef(0);

  const scopedClusterSlug = isMenuBrowserClusterScope(clusterSlug)
    ? String(clusterSlug).trim().toLowerCase()
    : null;

  const appliedLocation = useMemo(
    () => readMenuCatalogAppliedLocation(),
    [section, urlCity, urlState, scopedClusterSlug]
  );

  const scopeKey = useMemo(() => {
    if (scopedClusterSlug) {
      // Food category tabs do not re-filter membership — one deck per Place.
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
      if (scopedClusterSlug) return null;
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
    [appliedLocation, autoLocation, drinksMode, scopedClusterSlug, section, urlCity, urlState]
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
    if (scopedClusterSlug) runCluster();
    else runCity();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [buildApiParams, scopeKey, section, scopedClusterSlug]);

  const loadMore = useCallback(async () => {
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
    loading,
    loadingMore,
    scopedClusterSlug,
    section,
  ]);

  const activeIndex = Math.max(0, index);
  const currentEntry = activeIndex < entries.length ? entries[activeIndex] : null;
  const waitingForPage = entries.length > 0 && activeIndex >= entries.length && (hasMore || loadingMore);

  useEffect(() => {
    if (!entries.length || loading || loadingMore || !hasMore) return;
    if (activeIndex >= entries.length - 2) {
      loadMore();
    }
  }, [activeIndex, entries.length, hasMore, loadMore, loading, loadingMore]);

  useEffect(() => {
    if (!waitingForPage || loadingMore) return;
    loadMore();
  }, [loadMore, loadingMore, waitingForPage]);

  const displayTotal = totalCount || entries.length;
  const hasNext = entries.length > 0 && (activeIndex < entries.length - 1 || hasMore);
  const hasPrev = activeIndex > 0;
  const clampToIndex =
    !hasMore && entries.length > 0 && activeIndex >= entries.length ? entries.length - 1 : null;

  return {
    entries,
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
    isEmpty: !loading && entries.length === 0,
    locationPending: scopedClusterSlug
      ? false
      : autoLocation.status === "locating" && !buildApiParams(0),
  };
}
