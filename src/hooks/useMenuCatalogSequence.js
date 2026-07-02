import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";
import { dedupeDiscoveryMenus } from "../lib/discoveryFeedGuardrails.js";
import {
  buildMenuCatalogBrowseParams,
  menuCatalogLocationLabel,
  readMenuCatalogAppliedLocation,
} from "../lib/menuCatalogBrowseLocation.js";
import useDiscoveryAutoLocation from "./useDiscoveryAutoLocation.js";

const PAGE_SIZE = 24;

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
  urlCity = "",
  urlState = "",
  index = 0,
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

  const appliedLocation = useMemo(() => readMenuCatalogAppliedLocation(), [section, urlCity, urlState]);

  const scopeKey = useMemo(
    () => [
      urlCity || autoLocation.city || appliedLocation || "pending",
      urlState || autoLocation.state || "",
      autoLocation.lat ?? "",
      autoLocation.lng ?? "",
      autoLocation.status,
      section,
    ].join("::"),
    [appliedLocation, autoLocation.city, autoLocation.lat, autoLocation.lng, autoLocation.state, autoLocation.status, section, urlCity, urlState]
  );

  const locationLabel = useMemo(
    () => menuCatalogLocationLabel({
      urlCity,
      urlState,
      appliedLocation,
      autoLocation,
    }),
    [appliedLocation, autoLocation, urlCity, urlState]
  );

  const buildApiParams = useCallback((loadMoreOffset = 0) => {
    return buildMenuCatalogBrowseParams({
      urlCity,
      urlState,
      appliedLocation,
      autoLocation,
      loadMoreOffset,
      section,
    });
  }, [appliedLocation, autoLocation, section, urlCity, urlState]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    async function run() {
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
        setHasMore(response?.pagination?.has_more ?? (newOffset < newTotal));
      } catch (fetchError) {
        if (cancelled || fetchError?.name === "AbortError") return;
        setError(readErrorMessage(fetchError));
      } finally {
        if (!cancelled && requestId === requestRef.current) setLoading(false);
      }
    }

    if (section) run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [buildApiParams, scopeKey, section]);

  const loadMore = useCallback(async () => {
    if (!section || loading || loadingMore || !hasMore) return false;
    setLoadingMore(true);
    const requestId = requestRef.current;
    try {
      const apiParams = buildApiParams(browseOffset);
      if (!apiParams) return false;
      const response = await getBrowseMenus(apiParams);
      if (requestId !== requestRef.current) return false;
      const more = dedupeDiscoveryMenus(extractMenus(response));
      const newTotal = response?.total_count ?? (browseOffset + more.length);
      const newOffset = response?.pagination?.next_offset ?? (browseOffset + more.length);
      setEntries((prev) => dedupeDiscoveryMenus([...prev, ...more]));
      setBrowseOffset(newOffset);
      setTotalCount(newTotal);
      setHasMore(response?.pagination?.has_more ?? (newOffset < newTotal));
      return true;
    } catch (fetchError) {
      setError(readErrorMessage(fetchError));
      return false;
    } finally {
      setLoadingMore(false);
    }
  }, [browseOffset, buildApiParams, hasMore, loading, loadingMore, section]);

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
  const clampToIndex = !hasMore && entries.length > 0 && activeIndex >= entries.length
    ? entries.length - 1
    : null;

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
    // Only hold the splash while geo is actively resolving. If location is
    // "unavailable" or "ready" but yields no usable city, let the browse
    // page surface its empty/error state instead of staying hidden forever.
    locationPending: autoLocation.status === "locating" && !buildApiParams(0),
  };
}
