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
 * Location-scoped browse feed for HomeNext.
 * Consumes GET /menus/browse — same contract as GrubbidDiscovery.
 */
export function useHomeBrowseFeed(options = {}) {
  const language = options.language || "en";
  const autoLocation = useDiscoveryAutoLocation();
  const [appliedLocation, setAppliedLocation] = useState(() => {
    if (typeof window === "undefined") return "";
    return String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
  });
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);
  const cacheRef = useRef({});

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

  const locationLabel = appliedLocation || autoLocation.label || "Near you";

  useEffect(() => {
    const hasLocation = shouldUseGeoBrowse || appliedLocation;
    if (!hasLocation) return undefined;

    const params = new URLSearchParams();
    params.set("surface", "home");
    params.set("limit", "50");

    if (shouldUseGeoBrowse) {
      params.set("lat", String(autoLocation.lat));
      params.set("lng", String(autoLocation.lng));
      params.set("radius", String(LOCAL_RADIUS_MILES));
    } else if (appliedLocation) {
      const loc = parseLocation(appliedLocation);
      if (loc.zip && !loc.city && !loc.state) {
        setMenus([]);
        return undefined;
      }
      if (loc.zip) params.set("zip", loc.zip);
      if (loc.city) params.set("city", loc.city);
      if (loc.state) params.set("state", loc.state);
    }

    if (language && language !== "en") params.set("lang", language);

    const cached = cacheRef.current[feedScopeKey];
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const controller = new AbortController();

    setMenus(Array.isArray(cached) ? cached : []);
    setLoading(true);

    fetch(`${API}/menus/browse?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (controller.signal.aborted || requestRef.current !== requestId) return;
        const rows = Array.isArray(json?.menus)
          ? json.menus
          : Array.isArray(json?.rows?.[0]?.menus)
            ? json.rows[0].menus
            : [];
        const next = dedupeDiscoveryMenus(rows);
        cacheRef.current[feedScopeKey] = next;
        setMenus(next);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
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
    language,
  ]);

  return {
    menus,
    loading,
    autoLocation,
    appliedLocation,
    setAppliedLocation,
    shouldUseGeoBrowse,
    locationLabel,
    locating: autoLocation.status === "locating",
  };
}
