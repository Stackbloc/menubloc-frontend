import { useEffect, useState } from "react";
import { reverseGeocode } from "../lib/locationUtils.js";
import {
  readDetectedLocation,
  saveDetectedLocation,
  shouldRequestGeolocation,
} from "../lib/discoveryLocationPersistence.js";

/**
 * Device geolocation + reverse geocode, with IP city/state fallback.
 * Shared by home feed and menu catalog browse.
 */
export default function useDiscoveryAutoLocation() {
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
