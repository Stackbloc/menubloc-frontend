import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { Link, useLocation } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { Card } from "../components/grubbid/GrubbidPrimitives.jsx";
import { appendSearchAnalyticsParams } from "../lib/analyticsPageVisitSend.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_GEO_KEY = "grubbid.discovery.geo";
const DEFAULT_RADIUS_MILES = 25;

function readSessionLocation() {
  try {
    const raw = String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
    if (!raw) return { city: "", state: "" };
    const parts = raw.split(",");
    return {
      city: parts[0]?.trim() || "",
      state: parts[1]?.trim() || "",
    };
  } catch {
    return { city: "", state: "" };
  }
}

function readSessionGeo() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_GEO_KEY) || "";
    if (!raw) return { lat: "", lng: "" };
    const geo = JSON.parse(raw);
    return {
      lat: geo?.lat != null ? String(geo.lat) : "",
      lng: geo?.lng != null ? String(geo.lng) : "",
    };
  } catch {
    return { lat: "", lng: "" };
  }
}

function dedupeRestaurants(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = String(row?.restaurant_id || row?.id || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function buildLocationLabel({ city, state, lat, lng }) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (lat && lng) return "your area";
  return "";
}

export default function FoodTrucksPage() {
  const { t } = useLanguage();
  const { search } = useLocation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const area = useMemo(() => {
    const params = new URLSearchParams(search);
    const city = String(params.get("city") || "").trim();
    const state = String(params.get("state") || "").trim();
    const lat = String(params.get("lat") || "").trim();
    const lng = String(params.get("lng") || "").trim();
    const radius = String(params.get("radius_miles") || "").trim();

    if (city || state || (lat && lng)) {
      return { city, state, lat, lng, radius };
    }

    if (typeof window !== "undefined") {
      const sessionLoc = readSessionLocation();
      if (sessionLoc.city || sessionLoc.state) {
        return { city: sessionLoc.city, state: sessionLoc.state, lat: "", lng: "", radius: "" };
      }
      const sessionGeo = readSessionGeo();
      if (sessionGeo.lat && sessionGeo.lng) {
        return {
          city: "",
          state: "",
          lat: sessionGeo.lat,
          lng: sessionGeo.lng,
          radius: String(DEFAULT_RADIUS_MILES),
        };
      }
    }

    return { city: "", state: "", lat: "", lng: "", radius: "" };
  }, [search]);

  const locationLabel = buildLocationLabel(area);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("q", "food truck");

        if (area.city || area.state) {
          if (area.city) params.set("city", area.city);
          if (area.state) params.set("state", area.state);
        } else if (area.lat && area.lng) {
          params.set("lat", area.lat);
          params.set("lng", area.lng);
          params.set("radius_miles", area.radius || String(DEFAULT_RADIUS_MILES));
        }

        appendSearchAnalyticsParams(params);

        const res = await fetch(`${API}/search?${params.toString()}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || "Unable to load food trucks.");
        }

        const restaurantRows = Array.isArray(data?.results)
          ? data.results.filter((row) => row?.row_type === "restaurant")
          : [];

        if (!cancelled) {
          setRows(dedupeRestaurants(restaurantRows));
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err?.message || "Unable to load food trucks.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [area.city, area.state, area.lat, area.lng, area.radius]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)" }}>
      <StickyPageHeader title={`Food Trucks${locationLabel ? ` in ${locationLabel}` : ""}`} />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "14px 14px 88px" }}>
        <div style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
          Browse food trucks serving this area. Tap a truck name to open its profile page and see its details.
        </div>

        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "var(--gb-color-ink-strong)", fontSize: 17, fontWeight: 800 }}>
              Own a food truck?
            </div>
            <div style={{ color: "var(--gb-color-ink-muted)", fontSize: 14, lineHeight: 1.6 }}>
              Sign up for $89/year. Professional profile, full menu, QR Code, Window QR Code included, online ordering, social sharing, and Lowest marketplace commission.
            </div>
            <div>
              <Link
                to="/foodtruck/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 42,
                  padding: "0 16px",
                  borderRadius: 999,
                  background: "#22C55E",
                  color: "#06240f",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Food Truck Sign Up
              </Link>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card>
            <div style={{ color: "var(--gb-color-ink-muted)", fontWeight: 700 }}>Loading food trucks…</div>
          </Card>
        ) : error ? (
          <Card>
            <div style={{ color: "#FCA5A5", fontWeight: 700 }}>{error}</div>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <div style={{ color: "var(--gb-color-ink-strong)", fontWeight: 800, marginBottom: 6 }}>
              No food trucks found
            </div>
            <div style={{ color: "var(--gb-color-ink-muted)", fontSize: 14, lineHeight: 1.6 }}>
              {locationLabel
                ? `No truck profiles were found for ${locationLabel}.`
                : "No truck profiles were found for the current area."}
            </div>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {rows.map((row) => {
              const truckId = String(row?.restaurant_id || row?.id || "");
              const subtitle = [row?.address_line1, [row?.city, row?.state].filter(Boolean).join(", ")]
                .filter(Boolean)
                .join(" • ");

              return (
                <Card key={truckId} interactive>
                  <div style={{ display: "grid", gap: 8 }}>
                    <Link
                      to={`/foodtrucks/${encodeURIComponent(truckId)}`}
                      style={{
                        color: "var(--gb-color-ink-strong)",
                        fontSize: 18,
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                    >
                      {row?.restaurant_name || "Food Truck"}
                    </Link>
                    <div style={{ color: "var(--gb-color-ink-muted)", fontSize: 14, lineHeight: 1.5 }}>
                      {subtitle || "Location details available on the truck profile."}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
