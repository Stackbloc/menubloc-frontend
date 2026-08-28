import { useEffect, useMemo, useRef, useState } from "react";
import { parseLocation, reverseGeocode } from "../lib/locationUtils.js";
import {
  appliedLocationMatchesGeoCityState,
  buildDiscoveryFeedScopeKey,
  buildDiscoveryLocationKey,
  dedupeDiscoveryMenus,
} from "../lib/discoveryFeedGuardrails.js";
import {
  readDetectedLocation,
  saveDetectedLocation,
  shouldRequestGeolocation,
} from "../lib/discoveryLocationPersistence.js";
import { activeMarketsShareBrowseScope, resolveDiscoveryMarketLocation } from "../lib/marketGate.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const LOCAL_RADIUS_MILES = 8;
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const DEFAULT_MARKET = { city: "Los Angeles", state: "CA" };
/** 16 cards displayed; 20 gives section-dedupe slack (popular/nearby/discover/more). */
const HOME_FEED_LIMIT = 20;

function useDiscoveryAutoLocation() {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") {
      return { status: "unavailable", label: "", city: "", state: "", lat: null, lng: null };
    }
    return (
      readDetectedLocation(window.localStorage) || {
        status: "locating",
        label: "",
        city: "",
        state: "",
        lat: null,
        lng: null,
      }
    );
  });

  useEffect(() => {
    const cached = readDetectedLocation(window.localStorage);
    if (!shouldRequestGeolocation(cached)) return undefined;

    async function ipFallback() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const json = await res.json().catch(() => ({}));
        const city = String(json?.city || "").trim();
        const st = String(json?.region_code || "").trim();
        if (city && st) {
          setState({ status: "ready", label: `${city}, ${st}`, city, state: st, lat: null, lng: null });
          return;
        }
      } catch {
        // ignore
      }
      setState({ status: "unavailable", label: "", city: "", state: "", lat: null, lng: null });
    }

    if (!navigator?.geolocation) {
      ipFallback();
      return undefined;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          ipFallback();
          return;
        }
        const coordinateLocation = { status: "ready", label: "", city: "", state: "", lat, lng };
        setState(coordinateLocation);
        saveDetectedLocation(window.localStorage, coordinateLocation);

        try {
          const geo = await reverseGeocode(lat, lng);
          setState((prev) => {
            if (prev.lat !== lat || prev.lng !== lng) return prev;
            const resolved = {
              status: "ready",
              label: geo.label,
              city: geo.city,
              state: geo.state,
              lat,
              lng,
            };
            saveDetectedLocation(window.localStorage, resolved);
            return resolved;
          });
        } catch {
          // keep coordinate-backed state
        }
      },
      () => ipFallback(),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );

    return undefined;
  }, []);

  return state;
}

/**
 * Location-scoped homepage feed for HomeNext.
 * Consumes GET /api/home/feed — lightweight path only (not /menus/browse).
 */
export function useHomeBrowseFeed({ loadMenus = true } = {}) {
  const autoLocation = useDiscoveryAutoLocation();
  const [appliedLocation, setAppliedLocation] = useState(() => {
    if (typeof window === "undefined") return "";
    return String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
  });
  const [menus, setMenus] = useState([]);
  const [homepageSectionTitles, setHomepageSectionTitles] = useState(null);
  const [loading, setLoading] = useState(true);
  const requestRef = useRef(0);
  const cacheRef = useRef({});
  const menusRef = useRef([]);

  const geoMarketLocation = useMemo(
    () => resolveDiscoveryMarketLocation({ autoLocation, useAutoGeo: autoLocation.status === "ready" }),
    [autoLocation]
  );

  const appliedMarketLocation = useMemo(
    () => (appliedLocation ? resolveDiscoveryMarketLocation({ explicitLabel: appliedLocation }) : null),
    [appliedLocation]
  );

  const shouldUseGeoBrowse =
    autoLocation.status === "ready" &&
    autoLocation.lat != null &&
    autoLocation.lng != null &&
    geoMarketLocation &&
    (!appliedLocation ||
      appliedLocationMatchesGeoCityState(appliedLocation, autoLocation) ||
      (appliedMarketLocation && activeMarketsShareBrowseScope(geoMarketLocation, appliedMarketLocation)));

  const locationKey = useMemo(
    () => buildDiscoveryLocationKey({ shouldUseGeoBrowse, autoLocation, appliedLocation }),
    [shouldUseGeoBrowse, autoLocation, appliedLocation]
  );

  const feedScopeKey = useMemo(
    () => buildDiscoveryFeedScopeKey({ locationKey, filters: {}, browseMode: shouldUseGeoBrowse ? "geo" : "city" }),
    [locationKey, shouldUseGeoBrowse]
  );

  const locationLabel = appliedLocation || autoLocation.label || `${DEFAULT_MARKET.city}, ${DEFAULT_MARKET.state}`;

  useEffect(() => {
    menusRef.current = menus;
  }, [menus]);

  useEffect(() => {
    if (!loadMenus) {
      setMenus([]);
      setHomepageSectionTitles(null);
      setLoading(false);
      return undefined;
    }

    const params = new URLSearchParams();
    params.set("limit", String(HOME_FEED_LIMIT));

    if (appliedLocation) {
      const loc = parseLocation(appliedLocation);
      if (loc.zip && !loc.city && !loc.state) {
        setLoading(false);
        return undefined;
      }
      if (loc.city) params.set("city", loc.city);
      if (loc.state) params.set("state", loc.state);
    } else if (shouldUseGeoBrowse) {
      params.set("lat", String(autoLocation.lat));
      params.set("lng", String(autoLocation.lng));
      params.set("radius", String(LOCAL_RADIUS_MILES));
    } else {
      params.set("city", DEFAULT_MARKET.city);
      params.set("state", DEFAULT_MARKET.state);
    }

    const cached = cacheRef.current[feedScopeKey];
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const controller = new AbortController();
    const hasVisibleMenus = menusRef.current.length > 0;

    if (Array.isArray(cached?.menus)) {
      setMenus(cached.menus);
      setHomepageSectionTitles(cached.homepageSectionTitles || null);
      setLoading(false);
    } else if (Array.isArray(cached)) {
      // legacy cache shape
      setMenus(cached);
      setLoading(false);
    } else if (hasVisibleMenus) {
      // Stale-while-revalidate: keep default-market cards visible during geo refresh.
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetch(`${API}/api/home/feed?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (controller.signal.aborted || requestRef.current !== requestId) return;
        const rows = Array.isArray(json?.menus) ? json.menus : [];
        const next = dedupeDiscoveryMenus(rows);
        const titles = Array.isArray(json?.homepage_sections)
          ? Object.fromEntries(
              json.homepage_sections
                .filter((s) => s?.internal_key && s?.display_title)
                .map((s) => [s.internal_key, s.display_title])
            )
          : null;
        cacheRef.current[feedScopeKey] = {
          menus: next,
          homepageSectionTitles: titles,
        };
        setMenus(next);
        setHomepageSectionTitles(titles);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        // On failure, retain any cards already on screen (default market).
      })
      .finally(() => {
        if (controller.signal.aborted || requestRef.current !== requestId) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [
    shouldUseGeoBrowse,
    autoLocation.lat,
    autoLocation.lng,
    appliedLocation,
    feedScopeKey,
    loadMenus,
  ]);

  return {
    menus,
    homepageSectionTitles,
    loading,
    autoLocation,
    appliedLocation,
    setAppliedLocation,
    shouldUseGeoBrowse,
    locationLabel,
    locating: autoLocation.status === "locating",
  };
}
