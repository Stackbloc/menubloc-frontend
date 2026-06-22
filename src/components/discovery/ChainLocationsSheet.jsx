import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link } from "react-router-dom";
import { restaurantMenuPathFromRow } from "../../lib/canonicalUrl.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const SESSION_GEO_KEY = "grubbid.discovery.geo";

function readGeo() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_GEO_KEY);
    if (!raw) return null;
    const geo = JSON.parse(raw);
    if (Number.isFinite(geo?.lat) && Number.isFinite(geo?.lng)) return geo;
  } catch {}
  return null;
}

export default function ChainLocationsSheet({ chainId, currentRestaurantId, onClose }) {
  const { t } = useLanguage();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const geo = readGeo();
    const params = new URLSearchParams();
    if (geo) {
      params.set("lat", String(geo.lat));
      params.set("lng", String(geo.lng));
      params.set("radius_miles", "25");
    }
    if (currentRestaurantId != null) {
      params.set("exclude_restaurant_id", String(currentRestaurantId));
    }

    fetch(`${API}/chains/${chainId}/locations?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || "Failed");
        setLocations(json.locations || []);
      })
      .catch((err) => setError(err.message || "Could not load locations"))
      .finally(() => setLoading(false));
  }, [chainId, currentRestaurantId]);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200 }}
      />
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 201,
        background: "#fff",
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: "12px 0 40px",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        maxHeight: "70vh", display: "flex", flexDirection: "column",
        animation: "clSlideUp 220ms cubic-bezier(.22,.68,0,1.1) both",
      }}>
        <style>{`@keyframes clSlideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }`}</style>

        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "#e4e7ec", margin: "0 auto 12px", flexShrink: 0,
        }} />

        <div style={{
          fontSize: 15, fontWeight: 800, color: "#101828",
          padding: "0 20px 12px", flexShrink: 0,
        }}>
          Other nearby locations
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading && (
            <div style={{ padding: "20px", fontSize: 14, color: "#667085", textAlign: "center" }}>
              Loading…
            </div>
          )}
          {error && (
            <div style={{ padding: "20px", fontSize: 14, color: "#b42318", textAlign: "center" }}>
              {error}
            </div>
          )}
          {!loading && !error && locations.length === 0 && (
            <div style={{ padding: "20px", fontSize: 14, color: "#667085", textAlign: "center" }}>
              No other locations found nearby.
            </div>
          )}
          {!loading && !error && locations.map((loc) => {
            const addressSnippet = [loc.address_line1, loc.city, loc.state].filter(Boolean).join(", ");
            const href = restaurantMenuPathFromRow(loc) || `/public/restaurants/${loc.restaurant_id}/menu`;
            return (
              <Link
                key={loc.restaurant_id}
                to={href}
                onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 20px", borderTop: "1px solid #f1f5f9",
                  textDecoration: "none", color: "inherit",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: "#101828",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {(loc.restaurant_name || "Location").replace(/^The\s+/i, "")}
                  </div>
                  {addressSnippet && (
                    <div style={{
                      fontSize: 12, color: "#667085", marginTop: 2,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {addressSnippet}
                    </div>
                  )}
                </div>
                {loc.distance_miles != null && loc.distance_miles <= 50 && (
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: "#1F4E3D",
                    marginLeft: 12, flexShrink: 0,
                  }}>
                    {loc.distance_miles.toFixed(1)} mi
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
