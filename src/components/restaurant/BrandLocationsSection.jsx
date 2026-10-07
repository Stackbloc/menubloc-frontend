/**
 * BrandLocationsSection — franchise brand profile location picker.
 *
 * Lists the chain's physical stores near the visitor, nearest first, from
 * GET /chains/:chainId/locations. The backend returns only stores with a street
 * address, so stores appear here automatically as addresses are added.
 * Picking a store opens the brand menu with that location preselected.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const RADIUS_MILES = 25;

function asFinite(value) {
  const n = Number(value);
  return value == null || value === "" || !Number.isFinite(n) ? null : n;
}

function withLocationParam(path, restaurantId) {
  if (!path) return null;
  const [base, query = ""] = String(path).split("?");
  const params = new URLSearchParams(query);
  params.set("location", String(restaurantId));
  return `${base}?${params.toString()}`;
}

export default function BrandLocationsSection({ chainId, brandName, menuHref, initialLat = null, initialLng = null }) {
  const [coords, setCoords] = useState(() => {
    const lat = asFinite(initialLat);
    const lng = asFinite(initialLng);
    return lat != null && lng != null ? { lat, lng } : null;
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
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("ready");
      },
      () => setGeoState("denied"),
      { maximumAge: 300000, timeout: 10000 }
    );
  }

  // Ask once on mount when the page has no coordinates yet.
  useEffect(() => {
    if (!coords) askForLocation();
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

  const sectionStyle = { maxWidth: 860, margin: "0 auto", padding: "8px 16px 24px" };
  const muted = { fontSize: 13, color: "#6b7280" };

  return (
    <section data-testid="brand-locations-section" style={sectionStyle} aria-label={`${brandName || "Brand"} locations`}>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: "8px 0 10px" }}>Locations near you</h2>

      {!coords ? (
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
            const href = withLocationParam(menuHref, loc.restaurant_id);
            const cityLine = [loc.city, loc.state].filter(Boolean).join(", ");
            const body = (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{loc.address_line1}</div>
                  {cityLine ? <div style={muted}>{cityLine}</div> : null}
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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
