import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { toConsumerErrorMessage } from "../../lib/api.js";
import { formatMoney } from "../../lib/pricingDisplay.js";
import { buildRestaurantStatusLightProps } from "../../lib/restaurantStatusLight.js";
import {
  asFiniteNumber,
  asStr,
  buildAddressLocalityLine,
  buildGoogleMapsUrlForRestaurant,
  resolveRestaurantProfileHref,
} from "../../lib/catalogMenuUtils.js";

const API = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:3001" : "")).replace(/\/$/, "");

const drinksMenuPayloadCache = new Map();

async function fetchDrinksMenuPayload(restaurantId, apiUrl) {
  if (drinksMenuPayloadCache.has(apiUrl)) {
    return drinksMenuPayloadCache.get(apiUrl);
  }
  const promise = (async () => {
    const res = await fetch(apiUrl);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.ok !== true) {
      throw new Error(
        toConsumerErrorMessage(
          json?.detail || json?.error || `Request failed (${res.status})`,
          "We couldn't load this drinks menu right now."
        )
      );
    }
    return json;
  })();
  drinksMenuPayloadCache.set(apiUrl, promise);
  try {
    return await promise;
  } catch (error) {
    drinksMenuPayloadCache.delete(apiUrl);
    throw error;
  }
}

export function prefetchCatalogDrinksMenu(restaurantId, locationParams = {}) {
  if (!restaurantId) return;
  const params = new URLSearchParams();
  if (locationParams.lat != null && locationParams.lng != null) {
    params.set("lat", String(locationParams.lat));
    params.set("lng", String(locationParams.lng));
  }
  if (locationParams.city) params.set("city", locationParams.city);
  if (locationParams.state) params.set("state", locationParams.state);
  const qs = params.toString();
  const apiUrl = `${API}/public/restaurants/${encodeURIComponent(restaurantId)}/drinks-menu${qs ? `?${qs}` : ""}`;
  fetchDrinksMenuPayload(restaurantId, apiUrl).catch(() => {});
}

function formatItemPrice(item) {
  const cents = item?.happy_hour_price_cents != null && item?.is_happy_hour
    ? Number(item.happy_hour_price_cents)
    : item?.price_cents;
  return Number.isFinite(Number(cents)) ? formatMoney(Number(cents)) : "";
}

function DrinksMenuSection({ section }) {
  const items = Array.isArray(section?.items) ? section.items : [];
  if (!items.length) return null;

  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "#11211a",
        }}
      >
        {asStr(section.display_section_name || section.title || "Beverages").trim()}
      </h2>
      <div style={{ display: "grid", gap: 14 }}>
        {items.map((item) => {
          const price = formatItemPrice(item);
          const key = `${section.canonical_section_id || "section"}-${item.id || item.name}`;
          return (
            <article
              key={key}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                alignItems: "start",
                paddingBottom: 12,
                borderBottom: "1px solid rgba(18,34,28,0.08)",
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#11211a" }}>
                  {asStr(item.name).trim()}
                </div>
                {item.description ? (
                  <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.45, color: "#667085" }}>
                    {asStr(item.description).trim()}
                  </div>
                ) : null}
                {item.is_happy_hour ? (
                  <div
                    style={{
                      marginTop: 6,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "rgba(245,158,11,0.12)",
                      color: "#b45309",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Happy Hour
                  </div>
                ) : null}
              </div>
              {price ? (
                <div style={{ fontSize: 14, fontWeight: 700, color: "#11211a", whiteSpace: "nowrap" }}>
                  {price}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function CatalogDrinksMenuRenderer({
  entry,
  locationParams = {},
  onLoadStateChange,
}) {
  const { t } = useLanguage();
  const restaurantId = entry?.restaurant_id;
  const [pageState, setPageState] = useState({ status: "idle", data: null, error: null });

  const apiUrl = useMemo(() => {
    if (!restaurantId) return "";
    const params = new URLSearchParams();
    const distance = asFiniteNumber(entry?.distance_miles ?? entry?.restaurant_distance_miles);
    if (distance != null) params.set("distance_miles", String(distance));
    if (locationParams.lat != null && locationParams.lng != null) {
      params.set("lat", String(locationParams.lat));
      params.set("lng", String(locationParams.lng));
    }
    if (locationParams.city) params.set("city", locationParams.city);
    if (locationParams.state) params.set("state", locationParams.state);
    const qs = params.toString();
    return `${API}/public/restaurants/${encodeURIComponent(restaurantId)}/drinks-menu${qs ? `?${qs}` : ""}`;
  }, [entry?.distance_miles, entry?.restaurant_distance_miles, locationParams.city, locationParams.lat, locationParams.lng, locationParams.state, restaurantId]);

  useEffect(() => {
    let cancelled = false;
    if (!restaurantId || !apiUrl) {
      setPageState({ status: "idle", data: null, error: null });
      return undefined;
    }

    async function run() {
      setPageState({ status: "loading", data: null, error: null });
      try {
        const json = await fetchDrinksMenuPayload(restaurantId, apiUrl);
        if (cancelled) return;
        setPageState({ status: "ok", data: json, error: null });
      } catch (error) {
        if (cancelled) return;
        setPageState({
          status: "error",
          data: null,
          error: toConsumerErrorMessage(error, "We couldn't load this drinks menu right now."),
        });
      }
    }

    run();
    return () => { cancelled = true; };
  }, [apiUrl, restaurantId]);

  useEffect(() => {
    onLoadStateChange?.(pageState.status);
  }, [onLoadStateChange, pageState.status]);

  const data = pageState.status === "ok" ? pageState.data : null;
  const restaurant = data?.restaurant || {};
  const restaurantName = asStr(
    restaurant.restaurant_name || data?.restaurant_name || entry?.restaurant_name || `Restaurant ${restaurantId}`
  ).trim();
  const addressLine1 = asStr(restaurant.address_line1 || data?.address_line1).trim();
  const addressLine2 = buildAddressLocalityLine(
    restaurant.city || data?.city,
    restaurant.state || data?.state,
    restaurant.postal_code || data?.postal_code
  );
  const addressLine = [addressLine1, addressLine2].filter(Boolean).join(", ");
  const distanceMiles = asFiniteNumber(
    restaurant.distance_miles ?? data?.distance_miles ?? entry?.distance_miles
  );
  const directionsHref = buildGoogleMapsUrlForRestaurant({
    addressLine,
    addressLine1,
    addressLine2,
    city: restaurant.city || data?.city,
    state: restaurant.state || data?.state,
    lat: restaurant.lat ?? data?.lat ?? entry?.lat,
    lng: restaurant.lng ?? data?.lng ?? entry?.lng,
  });
  const restaurantProfileHref = resolveRestaurantProfileHref({
    data: { ...data, ...restaurant },
    entry,
    restaurantId,
  });
  const statusLight = buildRestaurantStatusLightProps({
    openNow: restaurant.open_now ?? data?.open_now,
    compact: true,
  });
  const sections = Array.isArray(data?.sections) ? data.sections : [];

  if (pageState.status === "loading") {
    return (
      <div style={{ padding: 24, color: "#667085", fontSize: 14 }}>
        {t("menuCatalog.loadingDrinksMenu", "Loading drinks menu...")}
      </div>
    );
  }

  if (pageState.status === "error") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
          {t("menuCatalog.drinksLoadError", "Couldn't load drinks menu")}
        </div>
        <div style={{ color: "#667085", fontSize: 14 }}>{pageState.error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        background: "#f7f6f1",
        padding: "20px 18px 32px",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9333ea" }}>
          {t("menuBrowser.mode.drinks", "Drinks Menu")}
        </div>
        <h1 style={{ margin: "8px 0 6px", fontSize: 28, lineHeight: 1.1, fontWeight: 900, color: "#11211a" }}>
          {restaurantProfileHref ? (
            <Link to={restaurantProfileHref} style={{ color: "inherit", textDecoration: "none" }}>
              {restaurantName}
            </Link>
          ) : restaurantName}
        </h1>
        {addressLine ? (
          <div style={{ fontSize: 14, color: "#667085", lineHeight: 1.45 }}>
            {directionsHref ? (
              <a href={directionsHref} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
                {addressLine}
              </a>
            ) : addressLine}
          </div>
        ) : null}
        {distanceMiles != null ? (
          <div style={{ marginTop: 6, fontSize: 13, color: "#667085" }}>
            {distanceMiles.toFixed(1)} mi away
          </div>
        ) : null}
        {statusLight?.label ? (
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: statusLight.color || "#16a34a" }}>
            {statusLight.label}
          </div>
        ) : null}
        <div style={{ marginTop: 10, fontSize: 13, color: "#667085" }}>
          {asStr(data?.menu_title || "Drinks Menu").trim()}
          {data?.item_count != null ? ` · ${data.item_count} beverages` : ""}
        </div>
      </header>

      {sections.length === 0 ? (
        <div style={{ color: "#667085", fontSize: 14 }}>
          {t("menuCatalog.noDrinksSections", "No beverage sections are available for this restaurant yet.")}
        </div>
      ) : (
        sections.map((section) => (
          <DrinksMenuSection
            key={`${section.canonical_section_id}-${section.display_section_name}`}
            section={section}
          />
        ))
      )}
    </div>
  );
}
