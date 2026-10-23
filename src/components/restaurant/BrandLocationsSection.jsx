/**
 * BrandLocationsSection — franchise brand profile location picker.
 *
 * Lists the chain's physical stores near the visitor, nearest first, from
 * GET /chains/:chainId/locations. The backend returns only stores with a street
 * address, so stores appear here automatically as addresses are added.
 * Picking a store opens the brand menu with that location preselected.
 * Store mode (franchise store pages, 2026-10-21): one shared brand profile across stores, so the
 * page offers "Find closest location" — no location prompt until tapped, and each row opens that
 * store's own page (store pages keep local SEO: address, hours, menu).
 * Each row also shows the store's phone (tap to call) and today's hours (Location Bot, 2026-10-23).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { restaurantPath } from "../../lib/canonicalUrlCore.js";
import { readDetectedLocation, saveDetectedLocation } from "../../lib/discoveryLocationPersistence.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const RADIUS_MILES = 25;

function asFinite(value) {
  const n = Number(value);
  return value == null || value === "" || !Number.isFinite(n) ? null : n;
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (digits.length !== 10) return value ? String(value) : null;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatClock(value) {
  const [h, m] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(h)) return null;
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

/** "Open 24 hours" | "Today 7 AM – 10 PM" | "Closed today" | null */
export function todayHoursLabel(loc) {
  if (loc?.open_24_hours) return "Open 24 hours";
  const h = loc?.hours_today;
  if (!h) return null;
  if (h.is_closed) return "Closed today";
  const opens = String(h.opens_at || "").slice(0, 5);
  const closes = String(h.closes_at || "").slice(0, 5);
  if (opens && opens === closes) return h.label || "Open 24 hours";
  const from = formatClock(opens);
  const to = formatClock(closes);
  return from && to ? `Today ${from} – ${to}` : h.label || null;
}

function withLocationParam(path, restaurantId) {
  if (!path) return null;
  const [base, query = ""] = String(path).split("?");
  const params = new URLSearchParams(query);
  params.set("location", String(restaurantId));
  return `${base}?${params.toString()}`;
}

export default function BrandLocationsSection({
  chainId,
  brandName,
  menuHref,
  initialLat = null,
  initialLng = null,
  /** "brand" (brand page: asks on load, rows open the menu) | "store" (rows open store pages). */
  mode = "brand",
  currentRestaurantId = null,
}) {
  const storeMode = mode === "store";
  const [coords, setCoords] = useState(() => {
    const lat = asFinite(initialLat);
    const lng = asFinite(initialLng);
    if (lat != null && lng != null) return { lat, lng };
    // Brand page: the location the app already detected, so nearby stores show without a prompt.
    const saved = !storeMode && typeof window !== "undefined" ? readDetectedLocation(window.localStorage) : null;
    return saved ? { lat: saved.lat, lng: saved.lng } : null;
  });
  const [geoState, setGeoState] = useState(coords ? "ready" : "idle"); // idle | asking | ready | denied | unavailable
  const [state, setState] = useState({ status: "idle", locations: [] });

  function askForLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("unavailable");
      return;
    }
    setGeoState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(next);
        setGeoState("ready");
        if (typeof window !== "undefined") saveDetectedLocation(window.localStorage, next);
      },
      () => setGeoState("denied"),
      { maximumAge: 300000, timeout: 10000 }
    );
  }

  // Brand page asks once on mount when it has no coordinates yet; store pages wait for a tap.
  useEffect(() => {
    if (!coords && !storeMode) askForLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chainId || !coords) return undefined;
    let alive = true;
    setState({ status: "loading", locations: [] });
    const params = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      radius_miles: String(RADIUS_MILES),
    });
    fetch(`${API}/chains/${encodeURIComponent(chainId)}/locations?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        setState({ status: "ok", locations: Array.isArray(json?.locations) ? json.locations : [] });
      })
      .catch(() => {
        if (alive) setState({ status: "error", locations: [] });
      });
    return () => {
      alive = false;
    };
  }, [chainId, coords]);

  if (!chainId) return null;

  // Explicit ink: the profile stays light even when the body inherits a dark-mode text color.
  const sectionStyle = { maxWidth: 860, margin: "0 auto", padding: "8px 16px 24px", color: "#111827" };
  const muted = { fontSize: 13, color: "#6b7280" };

  return (
    <section
      id="profile-locations"
      data-testid="brand-locations-section"
      data-mode={mode}
      style={sectionStyle}
      aria-label={`${brandName || "Brand"} locations`}
    >
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: "8px 0 10px" }}>
        {storeMode ? `Other ${brandName || ""} locations`.replace(/\s+/g, " ") : "Locations near you"}
      </h2>

      {!coords && storeMode ? (
        <button
          type="button"
          data-testid="find-closest-location"
          onClick={askForLocation}
          disabled={geoState === "asking"}
          style={findClosestButtonStyle}
        >
          {geoState === "asking" ? "Finding the closest location…" : "📍 Find closest location"}
        </button>
      ) : null}
      {!coords && storeMode && (geoState === "denied" || geoState === "unavailable") ? (
        <div style={{ ...muted, marginTop: 8 }}>Location is off — allow it in your browser to find the closest store.</div>
      ) : null}

      {!coords && storeMode ? null : !coords ? (
        <div style={muted}>
          {geoState === "asking" ? "Finding locations near you…" : null}
          {geoState === "denied" || geoState === "unavailable" || geoState === "idle" ? (
            <>
              Share your location to see the nearest {brandName || "locations"}.{" "}
              <button
                type="button"
                onClick={askForLocation}
                style={{ background: "none", border: "none", padding: 0, color: "#16a34a", fontWeight: 700, cursor: "pointer" }}
              >
                Use my location
              </button>
            </>
          ) : null}
        </div>
      ) : state.status === "loading" ? (
        <div style={muted}>Finding locations near you…</div>
      ) : state.status === "error" ? (
        <div style={muted}>Locations are unavailable right now.</div>
      ) : state.locations.length === 0 ? (
        <div style={muted}>No nearby locations with a listed address yet.</div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {state.locations.map((loc) => {
            const isHere = currentRestaurantId != null && String(loc.restaurant_id) === String(currentRestaurantId);
            const href = storeMode
              ? isHere
                ? null
                : restaurantPath({ slug: loc.slug, city: loc.city, state: loc.state }) ||
                  `/restaurants/${encodeURIComponent(String(loc.restaurant_id))}`
              : withLocationParam(menuHref, loc.restaurant_id);
            const cityLine = [loc.city, loc.state].filter(Boolean).join(", ");
            const hoursLabel = todayHoursLabel(loc);
            const phone = formatPhone(loc.phone);
            const body = (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{loc.address_line1}</div>
                  {cityLine ? <div style={muted}>{cityLine}</div> : null}
                  {hoursLabel ? (
                    <div data-testid="brand-location-hours" style={{ fontSize: 13, color: "#15803d", fontWeight: 600, marginTop: 2 }}>
                      {hoursLabel}
                    </div>
                  ) : null}
                  {isHere ? (
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginTop: 2 }}>You're here</div>
                  ) : null}
                </div>
                {loc.distance_miles != null ? (
                  <div style={{ ...muted, flexShrink: 0 }}>{Number(loc.distance_miles).toFixed(1)} mi</div>
                ) : null}
              </div>
            );
            return (
              <li
                key={loc.restaurant_id}
                style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px" }}
              >
                {href ? (
                  <Link to={href} style={{ color: "inherit", textDecoration: "none", display: "block" }}>
                    {body}
                  </Link>
                ) : (
                  body
                )}
                {phone ? (
                  <a
                    href={`tel:${String(loc.phone).replace(/[^\d+]/g, "")}`}
                    data-testid="brand-location-phone"
                    style={{ display: "inline-block", marginTop: 4, fontSize: 13, fontWeight: 700, color: "#15803d", textDecoration: "none" }}
                  >
                    📞 {phone}
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const findClosestButtonStyle = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #16a34a",
  background: "#fff",
  color: "#15803d",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
};
