/**
 * MleLocationsSection — every kitchen of a multi-location (MLE) restaurant.
 *
 * Data comes with GET /public/restaurants/:slugOrId (`locations`, nearest first when the
 * diner's position is known). The page already shows the chosen kitchen's address; this lists
 * the others. Picking one reloads the page at that kitchen (?location=). 2026-10-20.
 * "Find closest location" (2026-10-21) saves the diner's position and reloads without
 * ?location= so the API picks the nearest kitchen.
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { saveDetectedLocation } from "../../lib/discoveryLocationPersistence.js";

const SELECTION_LABEL = {
  nearest: "Nearest to you",
  requested: "Showing",
  primary: "Main location",
};

function withLocation(pathname, search, locationId) {
  const params = new URLSearchParams(search);
  params.set("location", String(locationId));
  return `${pathname}?${params.toString()}`;
}

export default function MleLocationsSection({ locations, current, selection, restaurantName }) {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const [geoState, setGeoState] = useState("idle"); // idle | asking | denied
  const list = Array.isArray(locations) ? locations.filter((l) => l?.address_line1) : [];
  if (list.length < 2) return null;

  function findClosest() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("denied");
      return;
    }
    setGeoState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveDetectedLocation(window.localStorage, { lat: pos.coords.latitude, lng: pos.coords.longitude });
        const params = new URLSearchParams(routerLocation.search);
        params.delete("location");
        setGeoState("idle");
        // The page refetches when the URL changes; `near` forces it even when ?location= was absent.
        params.set("near", String(Date.now()).slice(-6));
        navigate(`${routerLocation.pathname}?${params.toString()}`, { replace: true });
      },
      () => setGeoState("denied"),
      { maximumAge: 300000, timeout: 10000 }
    );
  }

  // Own card + explicit ink: the profile page sets a light text color for its dark-mode shell.
  const sectionStyle = { maxWidth: 860, margin: "0 auto", padding: "8px 16px 24px" };
  const cardStyle = { background: "#fff", color: "#111827", borderRadius: 14, border: "1px solid #e5e7eb", padding: "12px 16px 16px" };
  const muted = { fontSize: 13, color: "#6b7280" };

  return (
    <section data-testid="mle-locations-section" style={sectionStyle} aria-label={`${restaurantName || "Restaurant"} locations`}>
      <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", margin: "8px 0 10px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{list.length} locations</h2>
        {selection !== "nearest" ? (
          <button
            type="button"
            data-testid="find-closest-location"
            onClick={findClosest}
            disabled={geoState === "asking"}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #16a34a",
              background: "#fff",
              color: "#15803d",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {geoState === "asking" ? "Finding…" : "📍 Find closest location"}
          </button>
        ) : null}
      </div>
      {geoState === "denied" ? (
        <div style={{ ...muted, marginBottom: 8 }}>Location is off — allow it in your browser to find the closest kitchen.</div>
      ) : null}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((loc) => {
          const isCurrent = current && String(current.location_id) === String(loc.location_id);
          const cityLine = [loc.city, [loc.state, loc.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
          const body = (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{loc.address_line1}</div>
                {cityLine ? <div style={muted}>{cityLine}</div> : null}
                {isCurrent ? (
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginTop: 2 }}>
                    {SELECTION_LABEL[selection] || "Showing"}
                  </div>
                ) : null}
              </div>
              {loc.distance_miles != null ? (
                <div style={{ ...muted, flexShrink: 0 }}>{Number(loc.distance_miles).toFixed(1)} mi</div>
              ) : null}
            </div>
          );
          return (
            <li
              key={loc.location_id}
              data-testid="mle-location-item"
              style={{
                border: `1px solid ${isCurrent ? "#16a34a" : "#e5e7eb"}`,
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              {isCurrent ? (
                body
              ) : (
                <Link
                  to={withLocation(routerLocation.pathname, routerLocation.search, loc.location_id)}
                  style={{ color: "inherit", textDecoration: "none", display: "block" }}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      </div>
    </section>
  );
}
