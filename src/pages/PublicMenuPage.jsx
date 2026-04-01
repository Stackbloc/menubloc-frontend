/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/PublicMenuPage.jsx
 * File: PublicMenuPage.jsx
 * Date: 2026-03-06
 * Purpose:
 *   Renders the public menu for a restaurant.
 *   React route: /public/restaurants/:id/menu
 *   Data source: GET /public/restaurants/:id/menu
 *
 *   Default layout is visually identical to the previous version.
 *   Each menu item row includes an inline details panel area.
 *   Nutrition and Insights render in that panel automatically with
 *   no user click required.
 *
 *   Expanded sections render only when the API provides the relevant
 *   data for that item. Deal Details cross-references deal_items
 *   from the same API response (no additional network requests).
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { getLocalizedField } from "../utils/getLocalizedField.js";

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth <= breakpoint); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}
import { PageNav } from "../components/NavButton.jsx";
import { itemPassesDietFilter, activePrefLabels } from "../hooks/useDietPreferences";
import { toConsumerErrorMessage } from "../lib/api.js";

const API = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:3001" : "")).replace(/\/$/, "");

/* ---- Utilities ---- */

function asStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function fmtMoney(price) {
  const s = asStr(price).trim();
  return s;
}

function normalizeExternalUrl(value) {
  const raw = asStr(value).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function buildGoogleMapsDirectionsUrl(destination) {
  const raw = asStr(destination).trim();
  if (!raw) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(raw)}`;
}

function buildAddressLocalityLine(city, state, zip) {
  const locality = [asStr(city).trim(), asStr(state).trim()].filter(Boolean).join(", ");
  const postal = asStr(zip).trim();
  if (locality && postal) return `${locality} ${postal}`;
  return locality || postal;
}

function asFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isFoodTruckCategory(value) {
  const normalized = asStr(value).trim().toLowerCase();
  return normalized === "food truck" || normalized === "food_truck" || normalized === "foodtruck";
}

function normalizeSections(data) {
  if (Array.isArray(data?.sections)) return data.sections;
  if (Array.isArray(data?.menu_sections)) return data.menu_sections;
  if (Array.isArray(data?.menu)) return data.menu;
  return [];
}

function isDisplayableMenuItem(item) {
  return asStr(item?.name).trim().length > 0;
}

function getFilteredDisplaySections(sections, dietPrefs, dealsFilter, dealMap) {
  return (Array.isArray(sections) ? sections : [])
    .map((sec) => {
      const title = asStr(sec?.title || "Menu").trim() || "Menu";
      const rawItems = Array.isArray(sec?.items) ? sec.items : [];
      const items = rawItems.filter((it) => {
        if (!isDisplayableMenuItem(it)) return false;
        if (!itemPassesDietFilter(it, dietPrefs)) return false;
        if (dealsFilter && dealMap.get(it?.id) == null) return false;
        return true;
      });
      return { ...sec, title, items };
    })
    .filter((sec) => sec.items.length > 0);
}

function UnverifiedBanner({ show, onClaim }) {
  const { t } = useLanguage();
  if (!show) return null;

  return (
    <button
      onClick={onClaim}
      style={{
        marginTop: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 18px",
        borderRadius: 10,
        background: "#11211a",
        color: "#fff",
        border: "none",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.3,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        transition: "background 160ms ease, box-shadow 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#2d6a4f";
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.22)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#11211a";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.7 }}>●</span>
      {t("publicMenu.unverified")}
    </button>
  );
}

function IntakePreviewBanner({ show }) {
  const { t } = useLanguage();
  if (!show) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 12,
        background: "#fffbeb",
        border: "1px solid #fde68a",
        color: "#92400e",
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 16,
      }}
    >
      <span style={{ fontSize: 16 }}>📋</span>
      {t("publicMenu.preview")}
    </div>
  );
}

function FranchiseBanner({ group, currentRestaurantId, onPrevious, onNext }) {
  const { t } = useLanguage();
  const locations = (Array.isArray(group?.locations) ? group.locations : []).filter(
    (location) => location?.is_displayable !== false && location?.restaurant_id
  );
  const totalLocations = locations.length;
  const derivedIndex = locations.findIndex((location) => Number(location.restaurant_id) === Number(currentRestaurantId));
  const fallbackIndex = Number.isFinite(Number(group?.current_index)) ? Number(group.current_index) : 0;
  const currentIndex = derivedIndex >= 0 ? derivedIndex : fallbackIndex;
  const currentLocation = locations[currentIndex] || group?.current_location || null;
  const hasPrevious = currentIndex > 0 && currentIndex < locations.length;
  const hasNext = currentIndex >= 0 && currentIndex < locations.length - 1;
  const previousLocation = hasPrevious ? locations[currentIndex - 1] : null;
  const nextLocation = hasNext ? locations[currentIndex + 1] : null;
  const currentLabel = asStr(currentLocation?.label || currentLocation?.restaurant_name).trim();
  const brandName = asStr(group?.brand_name || currentLocation?.restaurant_name).trim();

  if (totalLocations <= 1 || !currentLabel) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 12,
        padding: "12px 14px",
        borderRadius: 16,
        background: "#eef6ff",
        border: "1px solid rgba(37, 99, 235, 0.18)",
        color: "#1e3a8a",
      }}
    >
      <div style={{ fontSize: 13, lineHeight: 1.45, fontWeight: 700 }}>
        {t("publicMenu.closest", `Showing ${brandName} (${totalLocations} locations). Closest: ${currentLabel}.`, {
          brand: brandName,
          count: totalLocations,
          location: currentLabel,
        })}
        {previousLocation || nextLocation
          ? ` ${t("publicMenu.navigateClosest", "", {
              arrows: `${nextLocation ? "→" : ""}${nextLocation && previousLocation ? " / " : ""}${previousLocation ? "←" : ""}`,
              direction: nextLocation && previousLocation
                ? t("publicMenu.next") + " / " + t("publicMenu.previous")
                : nextLocation
                ? t("publicMenu.next")
                : t("publicMenu.previous"),
              brand: brandName,
            })}`
          : null}
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {hasPrevious ? (
          <button
            type="button"
            onClick={onPrevious}
            aria-label={`Show previous closest ${brandName}`}
            title={`Show previous closest ${brandName}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "1px solid rgba(30, 58, 138, 0.18)",
              background: "#fff",
              color: "#1d4ed8",
              cursor: "pointer",
              flexShrink: 0,
              fontSize: 18,
              fontWeight: 900,
              boxShadow: "0 4px 14px rgba(37,99,235,0.10)",
            }}
          >
            ←
          </button>
        ) : null}
        {hasNext ? (
          <button
            type="button"
            onClick={onNext}
            aria-label={`Show next closest ${brandName}`}
            title={`Show next closest ${brandName}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "1px solid rgba(30, 58, 138, 0.18)",
              background: "#fff",
              color: "#1d4ed8",
              cursor: "pointer",
              flexShrink: 0,
              fontSize: 18,
              fontWeight: 900,
              boxShadow: "0 4px 14px rgba(37,99,235,0.10)",
            }}
          >
            →
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ---- Filter chip ---- */

function FilterChip({ label, active, onClick, fullWidth }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 40,
        width: fullWidth ? "100%" : "auto",
        padding: "0 16px",
        borderRadius: 999,
        border: active ? "1px solid #11211a" : "1px solid rgba(18,34,28,0.12)",
        background: active ? "#11211a" : "#fff",
        color: active ? "#f7f6f1" : "#667085",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
        textAlign: "left",
        boxSizing: "border-box",
      }}
    >
      {label}
    </button>
  );
}

const DIET_CHIPS = [
  { key: "dairy_free",        label: "Dairy Free" },
  { key: "diabetic_friendly", label: "Diabetic Friendly" },
  { key: "gluten_free",       label: "Gluten Free" },
  { key: "keto",              label: "Keto" },
  { key: "low_sodium",        label: "Low Sodium" },
  { key: "vegan",             label: "Vegan" },
  { key: "vegetarian",        label: "Vegetarian" },
];

/* ---- Badge ---- */

function Badge({ label, bg, color, border }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        padding: "0 7px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.3,
        background: bg,
        color: color,
        border: border || "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function HeaderActionButton({ href, label, icon, external = false }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 38,
        height: 38,
        borderRadius: 999,
        border: "1px solid rgba(18,34,28,0.12)",
        background: "#fff",
        color: "#11211a",
        textDecoration: "none",
        boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
        flexShrink: 0,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
        {icon}
      </span>
    </a>
  );
}


/* ---- Main component ---- */

export default function PublicMenuPage() {
  const { language, t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMenuItem, openCart } = useOrderCart();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pageState, setPageState] = useState({
    status: "loading", // loading | ok | error
    data: null,
    error: null,
  });

  // URL is the single source of truth for filter state on this page.
  // No localStorage reads/writes — avoids cross-page state corruption.
  const dietPrefs = {
    dairy_free:        searchParams.get("dairy_free")        === "1",
    diabetic_friendly: searchParams.get("diabetic_friendly") === "1",
    gluten_free:       searchParams.get("gluten_free")       === "1",
    keto:              searchParams.get("keto")              === "1",
    low_sodium:        searchParams.get("low_sodium")        === "1",
    vegan:             searchParams.get("vegan")             === "1",
    vegetarian:        searchParams.get("vegetarian")        === "1",
  };
  const dealsFilter = searchParams.get("deals") === "1";
  const filtersActive = Object.values(dietPrefs).some(Boolean) || dealsFilter;
  const proximityLat = asFiniteNumber(searchParams.get("lat"));
  const proximityLng = asFiniteNumber(searchParams.get("lng"));
  // Propagate city/state context from search page URL so the backend can
  // resolve the correct franchise market (e.g. LA McDonald's vs Dothan McDonald's).
  const contextCity  = searchParams.get("city")  || null;
  const contextState = searchParams.get("state") || null;

  function handleTogglePref(key) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get(key) === "1") next.delete(key);
      else next.set(key, "1");
      return next;
    });
  }

  function handleClearFilters() {
    setSearchParams({});
  }

  const apiUrl = useMemo(() => {
    const rid = encodeURIComponent(asStr(id).trim());
    const params = new URLSearchParams();
    if (proximityLat != null && proximityLng != null) {
      params.set("lat", String(proximityLat));
      params.set("lng", String(proximityLng));
    }
    // Pass city/state so backend can swap to the correct market franchise location.
    // These are present in the URL when the user arrived from the search page.
    if (contextCity)  params.set("city",  contextCity);
    if (contextState) params.set("state", contextState);
    const qs = params.toString();
    return `${API}/public/restaurants/${rid}/menu${qs ? `?${qs}` : ""}`;
  }, [id, proximityLat, proximityLng, contextCity, contextState]);

  useEffect(() => {
    if (proximityLat != null && proximityLng != null) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const lat = Number(position.coords?.latitude);
        const lng = Number(position.coords?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("lat", String(lat));
          next.set("lng", String(lng));
          return next;
        }, { replace: true });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );

    return () => { cancelled = true; };
  }, [proximityLat, proximityLng, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setPageState({ status: "loading", data: null, error: null });

        const res = await fetch(apiUrl);
        const json = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok || !json || json.ok !== true) {
          const msg = toConsumerErrorMessage(
            json?.detail || json?.error || `Request failed (${res.status})`,
            "We couldn’t load this menu right now. Please try again in a moment."
          );
          setPageState({ status: "error", data: null, error: msg });
          return;
        }

        setPageState({ status: "ok", data: json, error: null });
      } catch (e) {
        if (cancelled) return;
        setPageState({
          status: "error",
          data: null,
          error: toConsumerErrorMessage(
            e,
            "We couldn’t load this menu right now. Please try again in a moment."
          ),
        });
      }
    }

    run();
    return () => { cancelled = true; };
  }, [apiUrl]);

  /* ---- Deal lookup from API response ---- */

  // Map of item id → deal object (for O(1) cross-reference)
  const dealMap = useMemo(() => {
    const m = new Map();
    for (const d of pageState.data?.deal_items || []) {
      if (d.id != null) m.set(d.id, d);
    }
    return m;
  }, [pageState.data]);

  const pageBg = { minHeight: "100vh", background: "#f7f6f1" };

  /* ---- Loading ---- */

  if (pageState.status === "loading") {
    return (
      <div style={pageBg}>
        <div style={{ maxWidth: 1450, margin: "0 auto", padding: isMobile ? "16px 12px" : "28px 20px", color: "#101828" }}>
          <div style={{ fontSize: 14, color: "#667085", fontWeight: 600 }}>Loading menu…</div>
        </div>
      </div>
    );
  }

  /* ---- Error ---- */

  if (pageState.status === "error") {
    return (
      <div style={pageBg}>
        <div style={{ maxWidth: 1450, margin: "0 auto", padding: isMobile ? "16px 12px" : "28px 20px", color: "#101828" }}>
          <PageNav back />
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{t("publicMenu.loadError", "Couldn't load menu")}</div>
          <div style={{ color: "var(--muted, #5b6675)", fontSize: 14 }}>{pageState.error}</div>
          <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted-2, #93a0b2)" }}>Endpoint: {apiUrl}</div>
        </div>
      </div>
    );
  }

  /* ---- OK ---- */

  const data = pageState.data;
  const restaurantName  =
    getLocalizedField(data, "restaurant_name", language) ||
    getLocalizedField(data, "name", language) ||
    asStr(data?.restaurant_name || data?.name || `Restaurant ${id}`).trim();
  const isFoodTruck =
    isFoodTruckCategory(data?.category) ||
    isFoodTruckCategory(data?.restaurant_category) ||
    isFoodTruckCategory(data?.type);
  const restaurantProfileTarget = asStr(data?.slug || data?.restaurant_id || id).trim();
  const restaurantProfileHref = restaurantProfileTarget
    ? {
        pathname: `${isFoodTruck ? "/foodtrucks" : "/restaurants"}/${encodeURIComponent(restaurantProfileTarget)}`,
        search: searchParams.toString() ? `?${searchParams.toString()}` : "",
      }
    : null;
  const addressLine1    = asStr(data?.address_line1 || data?.address).trim();
  const addressLine2    = buildAddressLocalityLine(data?.city, data?.state, data?.zip);
  const addressLine     = asStr(data?.address_line).trim() || [addressLine1, addressLine2].filter(Boolean).join(", ");
  const directionsHref  = buildGoogleMapsDirectionsUrl(addressLine);
  const phoneNumber     = asStr(data?.phone).trim();
  const phoneHref       = phoneNumber ? `tel:${phoneNumber.replace(/[^\d+]/g, "")}` : "";
  const orderHref       = normalizeExternalUrl(data?.website_url || data?.website);
  const sections        = normalizeSections(data);
  const displaySections = getFilteredDisplaySections(sections, dietPrefs, dealsFilter, dealMap);
  const displayableItemCount = displaySections.reduce(
    (count, sec) => count + (Array.isArray(sec?.items) ? sec.items.length : 0),
    0
  );
  const menuBanner      = asStr(data?.menu_banner).trim();
  const isUnverified    = data?.is_authoritative === false || !!menuBanner;
  const isIntakePreview = data?.menu_source === "intake";
  const franchiseGroup  = data?.franchise_group || null;
  const cartRestaurant = {
    restaurantId: data?.restaurant_id || id,
    restaurantName,
    deliveryEnabled: data?.delivery_enabled === true,
    defaultDeliveryProvider: data?.default_delivery_provider || null,
    activeDeliveryProviders: Array.isArray(data?.active_delivery_providers)
      ? data.active_delivery_providers
      : [],
    availableFulfillmentTypes: Array.isArray(data?.available_fulfillment_types)
      ? data.available_fulfillment_types
      : ["pickup"],
  };

  function navigateToFranchiseLocation(restaurantId) {
    if (!restaurantId) return;
    navigate({
      pathname: `/public/restaurants/${restaurantId}/menu`,
      search: searchParams.toString() ? `?${searchParams.toString()}` : "",
    });
  }

  function handlePreviousClosestLocation() {
    const locations = (Array.isArray(franchiseGroup?.locations) ? franchiseGroup.locations : []).filter(
      (location) => location?.is_displayable !== false && location?.restaurant_id
    );
    const currentIndex = locations.findIndex((location) => Number(location.restaurant_id) === Number(id));
    const previousRestaurantId =
      currentIndex > 0 ? locations[currentIndex - 1]?.restaurant_id : null;
    navigateToFranchiseLocation(previousRestaurantId);
  }

  function handleNextClosestLocation() {
    const locations = (Array.isArray(franchiseGroup?.locations) ? franchiseGroup.locations : []).filter(
      (location) => location?.is_displayable !== false && location?.restaurant_id
    );
    const currentIndex = locations.findIndex((location) => Number(location.restaurant_id) === Number(id));
    const nextRestaurantId =
      currentIndex >= 0 && currentIndex + 1 < locations.length ? locations[currentIndex + 1]?.restaurant_id : null;
    navigateToFranchiseLocation(nextRestaurantId);
  }

  function handleAddToOrder(event, item, itemName, itemDescription) {
    event.stopPropagation();

    const result = addMenuItem({
      restaurant: cartRestaurant,
      item: {
        menuItemId: item?.id,
        name: itemName,
        description: itemDescription,
        priceCents: Number(item?.price_cents || 0),
      },
    });

    if (result?.ok) {
      openCart();
    }
  }

  return (
    <div style={pageBg}>
      <div style={{
        maxWidth: 1450,
        margin: "0 auto",
        padding: isMobile ? "16px 12px 56px" : "28px 20px 56px",
        color: "#101828",
      }}>
        <PageNav back />

        {/* Restaurant header — above the two-column layout */}
        <div style={{ marginBottom: isMobile ? 18 : 22 }}>
          <div style={{ paddingLeft: isMobile ? 0 : 284 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {restaurantProfileHref ? (
                <Link
                  to={restaurantProfileHref}
                  title={`Open ${restaurantName} profile`}
                  style={{
                    fontSize: isMobile ? 22 : 28,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    color: "#11211a",
                    textDecoration: "none",
                  }}
                >
                  {restaurantName}
                </Link>
              ) : (
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#11211a" }}>
                  {restaurantName}
                </div>
              )}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <HeaderActionButton href={phoneHref} label={`Call ${restaurantName}`} icon="📞" />
                <HeaderActionButton href={orderHref} label={`Order from ${restaurantName}`} icon="🍴" external />
              </div>
            </div>
            {addressLine ? (
              <div style={{ marginTop: 6, fontSize: 14, color: "#667085", fontWeight: 600 }}>
                {directionsHref ? (
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Get directions to ${restaurantName}`}
                    title="Open Google Maps directions"
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    {addressLine1 ? <span>{addressLine1}</span> : null}
                    {addressLine2 ? <span>{addressLine2}</span> : null}
                  </a>
                ) : (
                  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    {addressLine1 ? <span>{addressLine1}</span> : null}
                    {addressLine2 ? <span>{addressLine2}</span> : null}
                  </span>
                )}
              </div>
            ) : null}
            <FranchiseBanner
              group={franchiseGroup}
              currentRestaurantId={id}
              onPrevious={handlePreviousClosestLocation}
              onNext={handleNextClosestLocation}
            />
          </div>
        </div>

        {/* Two-column layout: sidebar + menu content */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "flex-start",
          gap: isMobile ? 16 : 24,
        }}>

          {/* ── Filter sidebar ── */}
          <aside style={{
            flex: isMobile ? "1 1 auto" : "0 0 260px",
            width: isMobile ? "100%" : 260,
            position: isMobile ? "static" : "sticky",
            top: 18,
            alignSelf: "flex-start",
            minWidth: 0,
          }}>
            <div style={{
              borderRadius: 24,
              padding: isMobile ? 14 : 18,
              background: "#fff",
              border: "1px solid rgba(18,34,28,0.08)",
              boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
              boxSizing: "border-box",
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#11211a", marginBottom: 14 }}>
                {t("discovery.dietary")}
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {DIET_CHIPS.map(({ key, label }) => (
                  <FilterChip
                    key={key}
                    label={t(`diet.${key}`, label)}
                    active={dietPrefs[key]}
                    onClick={() => handleTogglePref(key)}
                    fullWidth
                  />
                ))}
                <FilterChip
                  label={t("common.deals", "Deals")}
                  active={dealsFilter}
                  onClick={() => handleTogglePref("deals")}
                  fullWidth
                />
              </div>
              {filtersActive && (
                <button
                  onClick={handleClearFilters}
                  style={{
                    marginTop: 12,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#667085",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >{t("common.clearAll", "Clear all")}</button>
              )}
            </div>
          </aside>

          {/* ── Menu content ── */}
          <main style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>

            <IntakePreviewBanner show={isIntakePreview} />

            {filtersActive && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                padding: "10px 16px",
                marginBottom: 16,
                borderRadius: 12,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: 13,
                fontWeight: 600,
                color: "#166534",
              }}>
                <span>
                  <span style={{ fontWeight: 800 }}>{t("common.filterApplied", "Filter applied: ")}</span>
                  {[...activePrefLabels(dietPrefs), ...(dealsFilter ? [t("common.deals", "Deals")] : [])].join(", ")}
                  <span style={{ fontWeight: 400, color: "#475467" }}>{t("common.matchingItemsOnly", " — only matching items shown")}</span>
                </span>
                <button
                  onClick={handleClearFilters}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 700, color: "#667085",
                    padding: 0, textDecoration: "underline", whiteSpace: "nowrap",
                  }}
                >
                  {t("common.showFullMenu", "Show full menu")}
                </button>
              </div>
            )}

            {displayableItemCount === 0 ? (
              <div style={{ fontSize: 14, color: "var(--muted, #5b6675)", padding: "24px 0" }}>
                {filtersActive ? (
                  <>
                    {t("publicMenu.noItemsAfterFilters", "This restaurant has no displayable menu items after your active filters.")}{" "}
                    <button onClick={handleClearFilters} style={{ background: "none", border: "none", cursor: "pointer", color: "#2d6a4f", fontWeight: 700, fontSize: 14, padding: 0, textDecoration: "underline" }}>
                      {t("common.clearFilters", "Clear filters")}
                    </button>
                  </>
                ) : (
                  t("publicMenu.noItems", "This restaurant does not currently have any displayable menu items.")
                )}
              </div>
            ) : (
              displaySections.map((sec, sIdx) => {
                const title = asStr(getLocalizedField(sec, "title", language) || sec?.title || t("publicMenu.menu")).trim();
                const items = Array.isArray(sec?.items) ? sec.items : [];

                return (
                  <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", color: "#667085", marginBottom: 10 }}>
                      {title}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {items.map((it, iIdx) => {
                        const itemKey = String(it?.id ?? `${sIdx}-${iIdx}`);
                        const name    = asStr(
                          getLocalizedField(it, "name", language) ||
                          getLocalizedField(it, "menu_item_name", language) ||
                          it?.name ||
                          "Item"
                        ).trim();
                        const desc    = asStr(
                          getLocalizedField(it, "description", language) ||
                          getLocalizedField(it, "notes", language) ||
                          it?.description ||
                          it?.notes ||
                          ""
                        ).trim();
                        const price   = fmtMoney(it?.price);
                        const deal    = it?.id != null ? dealMap.get(it.id) : undefined;
                        const hasDeal = !!deal;

                        const canNavigate = it?.id != null;

                        return (
                          <div
                            key={itemKey}
                            onClick={canNavigate ? () => navigate(`/menu-items/${it.id}`) : undefined}
                            onMouseEnter={canNavigate ? (e) => { e.currentTarget.style.boxShadow = "0 6px 22px rgba(15,23,42,0.10)"; e.currentTarget.style.borderColor = "rgba(18,34,28,0.18)"; } : undefined}
                            onMouseLeave={canNavigate ? (e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,23,42,0.05)"; e.currentTarget.style.borderColor = "rgba(18,34,28,0.08)"; } : undefined}
                            style={{
                              border: "1px solid rgba(18,34,28,0.08)",
                              borderRadius: 20,
                              background: "#fff",
                              padding: "14px 18px",
                              boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
                              cursor: canNavigate ? "pointer" : "default",
                              transition: "box-shadow 150ms ease, border-color 150ms ease",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2, color: "#11211a" }}>
                                    {name}
                                  </span>
                                  {hasDeal ? <Badge label={t("common.deals", "Deals")} bg="#dcfce7" color="#15803d" border="1px solid #bbf7d0" /> : null}
                                  {it?.is_vegan ? <Badge label={t("diet.vegan", "Vegan")} bg="#f0fdf4" color="#166534" border="1px solid #bbf7d0" /> : null}
                                  {it?.is_gluten_free ? <Badge label="GF" bg="#fffbeb" color="#92400e" border="1px solid #fde68a" /> : null}
                                </div>
                                {desc ? (
                                  <div style={{ marginTop: 4, fontSize: 13, color: "#475467", lineHeight: 1.5 }}>{desc}</div>
                                ) : null}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                                {price ? (
                                  <div style={{ fontSize: 14, fontWeight: 900, whiteSpace: "nowrap" }}>{price}</div>
                                ) : null}
                                {Number.isFinite(Number(it?.price_cents)) && Number(it.price_cents) > 0 ? (
                                  <button
                                    type="button"
                                    onClick={(event) => handleAddToOrder(event, it, name, desc)}
                                    style={{
                                      border: "none",
                                      borderRadius: 999,
                                      background: "#11211a",
                                      color: "#f8fafc",
                                      padding: "8px 12px",
                                      fontSize: 12,
                                      fontWeight: 800,
                                      whiteSpace: "nowrap",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Add to cart
                                  </button>
                                ) : null}
                                {canNavigate && (
                                  <span style={{ fontSize: 11, color: "#2d6a4f", fontWeight: 700, whiteSpace: "nowrap" }}>
                                    {t("common.nutritionInsights", "Nutrition & insights →")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {it?.chips?.nutrition_chip?.allergen_alert && (
                              <div style={{ marginTop: 4 }}>
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  padding: "1px 6px",
                                  background: "rgba(230,130,0,0.06)",
                                  border: "1px solid rgba(230,130,0,0.15)",
                                  borderRadius: 4,
                                  fontSize: 10,
                                  color: "#7c4a00",
                                  fontWeight: 500,
                                }}>
                                  <span style={{ opacity: 0.7 }}>⚠</span>
                                  {it.chips.nutrition_chip.allergen_alert}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
