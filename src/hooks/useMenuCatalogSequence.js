import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";
import { dedupeDiscoveryMenus } from "../lib/discoveryFeedGuardrails.js";
import { buildBrowseLocationParams, reverseGeocode } from "../lib/locationUtils.js";

const PAGE_SIZE = 24;

function extractMenus(response) {
  if (Array.isArray(response?.menus)) return response.menus;
  const firstRow = Array.isArray(response?.rows) ? response.rows[0] : null;
  return Array.isArray(firstRow?.menus) ? firstRow.menus : [];
}

function getUserCoords() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      resolve({ lat: null, lng: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);
        resolve(
          Number.isFinite(lat) && Number.isFinite(lng)
            ? { lat, lng }
            : { lat: null, lng: null }
        );
      },
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  });
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
  const hasCityStateParams = Boolean(urlCity);
  const [entries, setEntries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [locationLabel, setLocationLabel] = useState(() => [urlCity, urlState].filter(Boolean).join(", "));
  const requestRef = useRef(0);
  const radiusMiles = hasCityStateParams ? null : 10;

  const scopeKey = useMemo(
    () => `${hasCityStateParams ? `${urlCity}|${urlState}` : "geo"}::${section}`,
    [hasCityStateParams, urlCity, urlState, section]
  );

  const buildApiParams = useCallback(async (loadMoreOffset = 0) => {
    const coords = await getUserCoords();
    const hasCoords = coords.lat !== null && coords.lng !== null;

    if (!hasCityStateParams && hasCoords) {
      reverseGeocode(coords.lat, coords.lng)
        .then((geo) => {
          if (geo?.label) setLocationLabel(geo.label);
        })
        .catch(() => {});
    } else if (hasCityStateParams) {
      setLocationLabel([urlCity, urlState].filter(Boolean).join(", "));
    }

    return {
      ...buildBrowseLocationParams(
        hasCityStateParams
          ? { urlCity, urlState, coords: hasCoords ? coords : null, radiusMiles }
          : { coords: hasCoords ? coords : null, radiusMiles }
      ),
      limit: PAGE_SIZE,
      offset: loadMoreOffset,
      browse_section: section,
    };
  }, [hasCityStateParams, radiusMiles, section, urlCity, urlState]);

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
        const apiParams = await buildApiParams(0);
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
      const apiParams = await buildApiParams(browseOffset);
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

  // Prefetch next page when browsing near the end of the loaded batch.
  useEffect(() => {
    if (!entries.length || loading || loadingMore || !hasMore) return;
    if (activeIndex >= entries.length - 2) {
      loadMore();
    }
  }, [activeIndex, entries.length, hasMore, loadMore, loading, loadingMore]);

  // If user navigated past the last available menu, load until index is reachable.
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
  };
}
