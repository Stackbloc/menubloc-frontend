/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/PublicMenuPage.jsx
 * File: PublicMenuPage.jsx
 * Date: 2026-04-03
 * Purpose:
 *   Renders the public menu for a restaurant.
 *   React route: /restaurants/:slugOrId/menu
 *   Back-compat redirect: /public/restaurants/:id/menu
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
 *
 *   Share system added 2026-04-03:
 *   - canonical Grubbid menu URLs
 *   - native share with modal fallback
 *   - dynamic OG / Twitter metadata for public menu pages
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { getLocalizedField } from "../utils/getLocalizedField.js";
import BasketSummaryBar from "../components/basket/BasketSummaryBar.jsx";
import ModifierSheet from "../components/basket/ModifierSheet.jsx";
import { itemHasRequiredModifiers } from "../components/basket/modifierModel.js";
import OrderCartToast from "../components/basket/OrderCartToast.jsx";
import ShareButton from "../components/share/ShareButton.jsx";
import {
  applyDocumentSocialMetadata,
  buildDishShareData,
  buildCanonicalMenuPath,
  buildMenuShareMetadata,
  getCanonicalMenuItemPath,
} from "../components/share/shareUtils.js";

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

function formatMoneyFromCents(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
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

function getCartItemState(cartItems, menuItemId) {
  const matchingLines = (Array.isArray(cartItems) ? cartItems : []).filter(
    (line) => Number(line?.menuItemId) === Number(menuItemId)
  );
  const simpleLine = matchingLines.find(
    (line) =>
      (!Array.isArray(line?.modifiers) || line.modifiers.length === 0) &&
      !asStr(line?.specialInstructions).trim()
  ) || null;

  return {
    matchingLines,
    simpleLine,
    totalQuantity: matchingLines.reduce((sum, line) => sum + Number(line?.quantity || 0), 0),
    simpleQuantity: simpleLine ? Number(simpleLine.quantity || 0) : 0,
  };
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

/* ---- Main component ---- */

export default function PublicMenuPage() {
  const { language, t } = useLanguage();
  const { id, slugOrId } = useParams();
  const navigate = useNavigate();
  const routeRestaurantParam = asStr(slugOrId || id).trim();
  const numericRouteRestaurantId = asFiniteNumber(routeRestaurantParam);
  const {
    addMenuItem,
    restaurant: cartRestaurantState,
    items: cartItems,
    itemCount,
    subtotalCents,
    notice,
    clearNotice,
    handleNoticeAction,
    updateQuantity,
    removeItem,
  } = useOrderCart();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modifierItem, setModifierItem] = useState(null);
  const [orderMode, setOrderMode] = useState(false);
  const [resolvedRouteState, setResolvedRouteState] = useState({
    status: "loading",
    restaurantId: "",
    error: null,
  });

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
  const activeFilterLabels = [...activePrefLabels(dietPrefs), ...(dealsFilter ? [t("common.deals", "Deals")] : [])];
  const proximityLat = asFiniteNumber(searchParams.get("lat"));
  const proximityLng = asFiniteNumber(searchParams.get("lng"));
  // Propagate city/state context from search page URL so the backend can
  // resolve the correct franchise market (e.g. LA McDonald's vs Dothan McDonald's).
  const contextCity  = searchParams.get("city")  || null;
  const contextState = searchParams.get("state") || null;

  useEffect(() => {
    let cancelled = false;

    if (numericRouteRestaurantId != null) {
      return undefined;
    }

    async function resolveRouteRestaurant() {
      try {
        setResolvedRouteState({ status: "loading", restaurantId: "", error: null });

        const res = await fetch(
          `${API}/public/restaurants/${encodeURIComponent(routeRestaurantParam)}`,
          { credentials: "include" }
        );
        const json = await res.json().catch(() => null);

        if (cancelled) return;

        const resolvedRestaurantId = asFiniteNumber(
          json?.id ||
          json?.restaurant_id ||
          json?.restaurant?.id ||
          json?.restaurant?.restaurant_id
        );
        if (!res.ok || resolvedRestaurantId == null) {
          setResolvedRouteState({
            status: "error",
            restaurantId: "",
            error: toConsumerErrorMessage(
              json?.detail || json?.error || "We couldn’t resolve this menu link.",
              "We couldn’t resolve this menu link right now."
            ),
          });
          return;
        }

        setResolvedRouteState({
          status: "ok",
          restaurantId: String(resolvedRestaurantId),
          error: null,
        });
      } catch (error) {
        if (cancelled) return;
        setResolvedRouteState({
          status: "error",
          restaurantId: "",
          error: toConsumerErrorMessage(
            error,
            "We couldn’t resolve this menu link right now."
          ),
        });
      }
    }

    if (!routeRestaurantParam) return undefined;

    resolveRouteRestaurant();
    return () => { cancelled = true; };
  }, [numericRouteRestaurantId, routeRestaurantParam]);

  const routeState =
    !routeRestaurantParam
      ? {
          status: "error",
          restaurantId: "",
          error: "Missing restaurant identifier.",
        }
      : numericRouteRestaurantId != null
      ? {
          status: "ok",
          restaurantId: String(numericRouteRestaurantId),
          error: null,
        }
      : resolvedRouteState;

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
    const rid = encodeURIComponent(asStr(routeState.restaurantId).trim());
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
  }, [routeState.restaurantId, proximityLat, proximityLng, contextCity, contextState]);

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

    if (routeState.status !== "ok" || !routeState.restaurantId) return undefined;

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
  }, [apiUrl, routeState.restaurantId, routeState.status]);

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

  useEffect(() => {
    if (routeState.status !== "ok" || pageState.status !== "ok" || !pageState.data) {
      return undefined;
    }

    const liveData = pageState.data;
    const liveRestaurantName =
      getLocalizedField(liveData, "restaurant_name", language) ||
      getLocalizedField(liveData, "name", language) ||
      asStr(liveData?.restaurant_name || liveData?.name || `Restaurant ${routeState.restaurantId}`).trim();
    const liveRestaurantId = liveData?.restaurant_id || routeState.restaurantId;
    const liveShareData = buildMenuShareMetadata({
      restaurantName: liveRestaurantName,
      restaurantSlug: liveData?.slug,
      restaurantId: liveRestaurantId,
      logoUrl: liveData?.logo_url,
    });

    return applyDocumentSocialMetadata({
      title: liveShareData.title,
      description: liveShareData.text,
      url: liveShareData.url,
      image: liveShareData.image,
    });
  }, [language, pageState.data, pageState.status, routeState.restaurantId, routeState.status]);

  /* ---- Loading ---- */

  if (routeState.status === "loading" || pageState.status === "loading") {
    return (
      <div style={pageBg}>
        <div style={{ maxWidth: 1450, margin: "0 auto", padding: isMobile ? "16px 12px" : "28px 20px", color: "#101828" }}>
          <div style={{ fontSize: 14, color: "#667085", fontWeight: 600 }}>Loading menu…</div>
        </div>
      </div>
    );
  }

  /* ---- Error ---- */

  if (routeState.status === "error" || pageState.status === "error") {
    return (
      <div style={pageBg}>
        <div style={{ maxWidth: 1450, margin: "0 auto", padding: isMobile ? "16px 12px" : "28px 20px", color: "#101828" }}>
          <PageNav back />
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{t("publicMenu.loadError", "Couldn't load menu")}</div>
          <div style={{ color: "var(--muted, #5b6675)", fontSize: 14 }}>{routeState.error || pageState.error}</div>
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
  const restaurantProfileTarget = asStr(data?.slug || data?.restaurant_id || routeState.restaurantId).trim();
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
  const sections        = normalizeSections(data);
  const displaySections = getFilteredDisplaySections(sections, dietPrefs, dealsFilter, dealMap);
  const displayableItemCount = displaySections.reduce(
    (count, sec) => count + (Array.isArray(sec?.items) ? sec.items.length : 0),
    0
  );
  const isIntakePreview = data?.menu_source === "intake";
  const franchiseGroup  = data?.franchise_group || null;
  const currentRestaurantId = data?.restaurant_id || routeState.restaurantId;
  const shareData = buildMenuShareMetadata({
    restaurantName,
    restaurantSlug: data?.slug,
    restaurantId: currentRestaurantId,
    logoUrl: data?.logo_url,
  });
  const shareAnalyticsContext = {
    restaurantId: currentRestaurantId,
    restaurantSlug: data?.slug || null,
    pageType: "public_menu",
    shareTarget: "menu",
  };
  const cartRestaurant = {
    restaurantId: currentRestaurantId,
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
  const hasBasketItems = itemCount > 0;
  const basketMatchesCurrentRestaurant =
    Number(cartRestaurantState?.restaurantId) === Number(cartRestaurant.restaurantId);
  const activeCartItems = basketMatchesCurrentRestaurant ? cartItems || [] : [];

  function navigateToFranchiseLocation(restaurantId, restaurantSlug = null) {
    if (!restaurantId) return;
    navigate({
      pathname: buildCanonicalMenuPath({
        restaurantSlug,
        restaurantId,
      }),
      search: searchParams.toString() ? `?${searchParams.toString()}` : "",
    });
  }

  function handlePreviousClosestLocation() {
    const locations = (Array.isArray(franchiseGroup?.locations) ? franchiseGroup.locations : []).filter(
      (location) => location?.is_displayable !== false && location?.restaurant_id
    );
    const currentIndex = locations.findIndex((location) => Number(location.restaurant_id) === Number(currentRestaurantId));
    const previousRestaurantId =
      currentIndex > 0 ? locations[currentIndex - 1]?.restaurant_id : null;
    const previousRestaurantSlug =
      currentIndex > 0 ? locations[currentIndex - 1]?.slug : null;
    navigateToFranchiseLocation(previousRestaurantId, previousRestaurantSlug);
  }

  function handleNextClosestLocation() {
    const locations = (Array.isArray(franchiseGroup?.locations) ? franchiseGroup.locations : []).filter(
      (location) => location?.is_displayable !== false && location?.restaurant_id
    );
    const currentIndex = locations.findIndex((location) => Number(location.restaurant_id) === Number(currentRestaurantId));
    const nextRestaurantId =
      currentIndex >= 0 && currentIndex + 1 < locations.length ? locations[currentIndex + 1]?.restaurant_id : null;
    const nextRestaurantSlug =
      currentIndex >= 0 && currentIndex + 1 < locations.length ? locations[currentIndex + 1]?.slug : null;
    navigateToFranchiseLocation(nextRestaurantId, nextRestaurantSlug);
  }

  function commitMenuItemToBasket(item, itemName, itemDescription, modifiers = []) {
    return addMenuItem({
      restaurant: cartRestaurant,
      item: {
        menuItemId: item?.id,
        name: itemName,
        description: itemDescription,
        basePriceCents: Number(item?.price_cents || 0),
        modifiers,
      },
    });
  }

  function enterOrderMode() {
    setOrderMode(true);
  }

  function exitOrderMode() {
    setOrderMode(false);
  }

  function openCheckout() {
    navigate("/checkout");
  }

  function openModifierFlow(item, itemName, itemDescription) {
    setModifierItem({
      ...item,
      name: itemName,
      description: itemDescription,
    });
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
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: "1 1 260px" }}>
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
                          wordBreak: "break-word",
                        }}
                      >
                        {restaurantName}
                      </Link>
                    ) : (
                      <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#11211a", wordBreak: "break-word" }}>
                        {restaurantName}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: "0 0 auto" }}>
                    <ShareButton
                      label="Share Menu"
                      modalTitle={`Share ${restaurantName}`}
                      shareData={shareData}
                      analyticsContext={shareAnalyticsContext}
                    />
                  </div>
                </div>
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
              currentRestaurantId={currentRestaurantId}
              onPrevious={handlePreviousClosestLocation}
              onNext={handleNextClosestLocation}
            />
            <div
              style={{
                marginTop: 18,
                padding: isMobile ? "16px 16px" : "18px 20px",
                borderRadius: 24,
                background: orderMode
                  ? "linear-gradient(135deg, rgba(240,253,244,0.98), rgba(236,253,245,0.92))"
                  : "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(247,246,241,0.98))",
                border: orderMode
                  ? "1px solid rgba(34,197,94,0.24)"
                  : "1px solid rgba(17,33,26,0.08)",
                boxShadow: orderMode
                  ? "0 14px 34px rgba(34,197,94,0.10)"
                  : "0 12px 28px rgba(15,23,42,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: orderMode ? "#dcfce7" : "#f5f5f4",
                      color: orderMode ? "#166534" : "#475467",
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                    }}
                  >
                    {orderMode ? "Ordering mode" : "Menu mode"}
                  </div>
                  <div style={{ marginTop: 10, fontSize: isMobile ? 22 : 26, fontWeight: 900, color: "#11211a", lineHeight: 1.1 }}>
                    {orderMode ? `Ordering from ${restaurantName}` : `Discover ${restaurantName}`}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#475467", maxWidth: 760 }}>
                    {orderMode
                      ? "Tap any item tile to add it. Selected items stay highlighted, quantities update inline, and the existing review and payment flow remains available from the sticky basket."
                      : "Browse the menu first. Item details, nutrition signals, deal pricing, and Grubbid insights remain the focus until you explicitly choose to build an order."}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {orderMode ? (
                    <>
                      <button
                        type="button"
                        onClick={openCheckout}
                        style={{
                          border: "none",
                          borderRadius: 999,
                          background: "#11211a",
                          color: "#fff",
                          padding: "12px 18px",
                          fontSize: 14,
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Review Order
                      </button>
                      <button
                        type="button"
                        onClick={exitOrderMode}
                        style={{
                          border: "1px solid rgba(17,33,26,0.12)",
                          borderRadius: 999,
                          background: "#fff",
                          color: "#11211a",
                          padding: "12px 18px",
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Back to Menu View
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={enterOrderMode}
                      style={{
                        border: "none",
                        borderRadius: 999,
                        background: "#14532d",
                        color: "#fff",
                        padding: "14px 22px",
                        fontSize: 15,
                        fontWeight: 900,
                        cursor: "pointer",
                        boxShadow: "0 14px 34px rgba(20,83,45,0.22)",
                      }}
                    >
                      {`Order from ${restaurantName}`}
                    </button>
                  )}
                </div>
              </div>
              {orderMode && hasBasketItems && basketMatchesCurrentRestaurant ? (
                <div
                  style={{
                    marginTop: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 999,
                    background: "#ffffff",
                    border: "1px solid rgba(20,83,45,0.14)",
                    padding: "9px 14px",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#166534",
                  }}
                >
                  <span aria-hidden="true">✓</span>
                  {`${itemCount} ${itemCount === 1 ? "item" : "items"} selected • ${formatMoneyFromCents(subtotalCents)}`}
                </div>
              ) : null}
            </div>
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
          {!orderMode ? (
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
          ) : null}

          {/* ── Menu content ── */}
          <main style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>

            <IntakePreviewBanner show={isIntakePreview} />

            {orderMode ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  padding: "12px 16px",
                  marginBottom: 16,
                  borderRadius: 16,
                  background: filtersActive ? "#f0fdf4" : "#ffffff",
                  border: filtersActive
                    ? "1px solid rgba(34,197,94,0.24)"
                    : "1px solid rgba(17,33,26,0.08)",
                  boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
                }}
              >
                <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      color: filtersActive ? "#166534" : "#667085",
                    }}
                  >
                    Filters in effect
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14, color: "#11211a", fontWeight: 700, lineHeight: 1.5 }}>
                    {filtersActive ? activeFilterLabels.join(", ") : "No filters applied"}
                  </div>
                </div>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    style={{
                      border: "1px solid rgba(17,33,26,0.10)",
                      borderRadius: 999,
                      background: "#fff",
                      color: "#11211a",
                      padding: "10px 14px",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Clear all filters
                  </button>
                ) : null}
              </div>
            ) : null}

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
                        const cartState = getCartItemState(activeCartItems, it?.id);
                        const hasRequiredOptions = itemHasRequiredModifiers(it);
                        const hasSelectedQuantity = hasRequiredOptions
                          ? cartState.totalQuantity > 0
                          : cartState.simpleQuantity > 0;
                        const selectedQuantity = hasRequiredOptions
                          ? cartState.totalQuantity
                          : cartState.simpleQuantity;

                        const canNavigate = it?.id != null;
                        const dishShareData = canNavigate ? buildDishShareData({
                          restaurant: {
                            id: currentRestaurantId,
                            slug: data?.slug || null,
                            name: restaurantName,
                            logoUrl: data?.logo_url || null,
                          },
                          menuItem: {
                            ...it,
                            id: it.id,
                            name,
                          },
                        }) : null;

                        return (
                          orderMode ? (
                            <div
                              key={itemKey}
                              style={{
                                border: hasSelectedQuantity
                                  ? "1px solid rgba(34,197,94,0.38)"
                                  : "1px solid rgba(18,34,28,0.10)",
                                borderRadius: 22,
                                background: hasSelectedQuantity ? "#f0fdf4" : "#fff",
                                boxShadow: hasSelectedQuantity
                                  ? "0 12px 28px rgba(34,197,94,0.08)"
                                  : "0 8px 22px rgba(15,23,42,0.05)",
                                overflow: "hidden",
                              }}
                            >
                              <button
                                type="button"
                                aria-pressed={hasSelectedQuantity}
                                onClick={() => {
                                  if (hasRequiredOptions) {
                                    openModifierFlow(it, name, desc);
                                    return;
                                  }
                                  commitMenuItemToBasket(it, name, desc);
                                }}
                                style={{
                                  width: "100%",
                                  border: "none",
                                  background: "transparent",
                                  padding: "16px 18px 14px",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                      <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.2, color: "#11211a" }}>
                                        {name}
                                      </span>
                                      {hasSelectedQuantity ? (
                                        <Badge label="Selected" bg="#dcfce7" color="#166534" border="1px solid #86efac" />
                                      ) : null}
                                      {hasDeal ? <Badge label={t("common.deals", "Deals")} bg="#dcfce7" color="#15803d" border="1px solid #bbf7d0" /> : null}
                                      {it?.is_vegan ? <Badge label={t("diet.vegan", "Vegan")} bg="#f0fdf4" color="#166534" border="1px solid #bbf7d0" /> : null}
                                      {it?.is_gluten_free ? <Badge label="GF" bg="#fffbeb" color="#92400e" border="1px solid #fde68a" /> : null}
                                    </div>
                                    {desc ? (
                                      <div style={{ marginTop: 6, fontSize: 13, color: "#475467", lineHeight: 1.55 }}>{desc}</div>
                                    ) : null}
                                    {it?.chips?.nutrition_chip?.allergen_alert ? (
                                      <div style={{ marginTop: 8 }}>
                                        <span style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 4,
                                          padding: "2px 8px",
                                          background: "rgba(230,130,0,0.06)",
                                          border: "1px solid rgba(230,130,0,0.15)",
                                          borderRadius: 999,
                                          fontSize: 10,
                                          color: "#7c4a00",
                                          fontWeight: 700,
                                        }}>
                                          <span aria-hidden="true">⚠</span>
                                          {it.chips.nutrition_chip.allergen_alert}
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>
                                  <div style={{ display: "grid", justifyItems: "end", gap: 8, flexShrink: 0 }}>
                                    {dishShareData ? (
                                      <ShareButton
                                        variant="dish"
                                        label="Share Dish"
                                        modalTitle={`Share ${name}`}
                                        shareData={dishShareData}
                                        analyticsContext={{
                                          restaurantId: currentRestaurantId,
                                          restaurantSlug: data?.slug || null,
                                          menuItemId: it.id,
                                          menuItemName: name,
                                          pageType: "public_menu",
                                          shareTarget: "dish",
                                        }}
                                        iconOnly
                                        stopPropagation
                                      />
                                    ) : null}
                                    {price ? (
                                      <div style={{ fontSize: 15, fontWeight: 900, whiteSpace: "nowrap", color: "#11211a" }}>{price}</div>
                                    ) : null}
                                    <div
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        borderRadius: 999,
                                        background: hasSelectedQuantity ? "#dcfce7" : "#f8fafc",
                                        color: hasSelectedQuantity ? "#166534" : "#475467",
                                        padding: "6px 10px",
                                        fontSize: 12,
                                        fontWeight: 800,
                                      }}
                                    >
                                      <span aria-hidden="true">{hasSelectedQuantity ? "✓" : "+"}</span>
                                      {hasRequiredOptions
                                        ? hasSelectedQuantity
                                          ? `${selectedQuantity} selected`
                                          : "Customize to add"
                                        : hasSelectedQuantity
                                        ? `${selectedQuantity} in basket`
                                        : "Tap to add"}
                                    </div>
                                  </div>
                                </div>
                              </button>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  flexWrap: "wrap",
                                  padding: "0 18px 16px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                  {hasRequiredOptions ? (
                                    <button
                                      type="button"
                                      onClick={() => openModifierFlow(it, name, desc)}
                                      style={{
                                        border: "1px solid rgba(17,33,26,0.10)",
                                        borderRadius: 999,
                                        background: "#fff",
                                        color: "#11211a",
                                        padding: "10px 14px",
                                        fontSize: 13,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                      }}
                                    >
                                      {hasSelectedQuantity ? "Add another customized item" : "Customize item"}
                                    </button>
                                  ) : hasSelectedQuantity ? (
                                    <div
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 10,
                                        border: "1px solid rgba(20,83,45,0.14)",
                                        borderRadius: 999,
                                        padding: "5px 6px",
                                        background: "#ffffff",
                                      }}
                                    >
                                      <button
                                        type="button"
                                        aria-label={`Decrease quantity for ${name}`}
                                        onClick={() => {
                                          if (!cartState.simpleLine) return;
                                          const nextQuantity = Number(cartState.simpleLine.quantity || 0) - 1;
                                          if (nextQuantity <= 0) {
                                            removeItem(cartState.simpleLine.lineId);
                                            return;
                                          }
                                          updateQuantity(cartState.simpleLine.lineId, nextQuantity);
                                        }}
                                        style={{
                                          border: "none",
                                          background: "#f8fafc",
                                          width: 34,
                                          height: 34,
                                          borderRadius: 999,
                                          cursor: "pointer",
                                          fontSize: 18,
                                          fontWeight: 900,
                                          color: "#11211a",
                                        }}
                                      >
                                        −
                                      </button>
                                      <span
                                        aria-live="polite"
                                        style={{
                                          minWidth: 20,
                                          textAlign: "center",
                                          fontSize: 14,
                                          fontWeight: 900,
                                          color: "#11211a",
                                        }}
                                      >
                                        {selectedQuantity}
                                      </span>
                                      <button
                                        type="button"
                                        aria-label={`Increase quantity for ${name}`}
                                        onClick={() => {
                                          if (!cartState.simpleLine) return;
                                          updateQuantity(
                                            cartState.simpleLine.lineId,
                                            Number(cartState.simpleLine.quantity || 0) + 1
                                          );
                                        }}
                                        style={{
                                          border: "none",
                                          background: "#dcfce7",
                                          width: 34,
                                          height: 34,
                                          borderRadius: 999,
                                          cursor: "pointer",
                                          fontSize: 18,
                                          fontWeight: 900,
                                          color: "#166534",
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => commitMenuItemToBasket(it, name, desc)}
                                      style={{
                                        border: "1px solid rgba(17,33,26,0.10)",
                                        borderRadius: 999,
                                        background: "#fff",
                                        color: "#11211a",
                                        padding: "10px 14px",
                                        fontSize: 13,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Add item
                                    </button>
                                  )}
                                  {canNavigate ? (
                                    <button
                                      type="button"
                                      onClick={() => navigate(getCanonicalMenuItemPath({
                                        restaurant: { slug: data?.slug || null, id: currentRestaurantId },
                                        menuItem: { id: it.id },
                                      }))}
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#166534",
                                        padding: 0,
                                        fontSize: 13,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                      }}
                                    >
                                      {t("common.nutritionInsights", "Nutrition & insights →")}
                                    </button>
                                  ) : null}
                                </div>
                                {hasRequiredOptions && hasSelectedQuantity ? (
                                  <div style={{ fontSize: 12, color: "#166534", fontWeight: 800 }}>
                                    {`${selectedQuantity} ${selectedQuantity === 1 ? "custom item" : "custom items"} in basket`}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <div
                              key={itemKey}
                              onClick={canNavigate ? () => navigate(getCanonicalMenuItemPath({
                                restaurant: { slug: data?.slug || null, id: currentRestaurantId },
                                menuItem: { id: it.id },
                              })) : undefined}
                              onMouseEnter={canNavigate ? (e) => { e.currentTarget.style.boxShadow = "0 6px 22px rgba(15,23,42,0.10)"; e.currentTarget.style.borderColor = "rgba(18,34,28,0.18)"; } : undefined}
                              onMouseLeave={canNavigate ? (e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,23,42,0.05)"; e.currentTarget.style.borderColor = "rgba(18,34,28,0.08)"; } : undefined}
                              style={{
                                border: "1px solid rgba(18,34,28,0.08)",
                                borderRadius: 20,
                                background: "#fff",
                                padding: "16px 18px",
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
                                  {dishShareData ? (
                                    <ShareButton
                                      variant="dish"
                                      label="Share Dish"
                                      modalTitle={`Share ${name}`}
                                      shareData={dishShareData}
                                      analyticsContext={{
                                        restaurantId: currentRestaurantId,
                                        restaurantSlug: data?.slug || null,
                                        menuItemId: it.id,
                                        menuItemName: name,
                                        pageType: "public_menu",
                                        shareTarget: "dish",
                                      }}
                                      iconOnly
                                      stopPropagation
                                    />
                                  ) : null}
                                  {price ? (
                                    <div style={{ fontSize: 14, fontWeight: 900, whiteSpace: "nowrap" }}>{price}</div>
                                  ) : null}
                                  {canNavigate && (
                                    <span style={{ fontSize: 11, color: "#2d6a4f", fontWeight: 700, whiteSpace: "nowrap" }}>
                                      {t("common.nutritionInsights", "Nutrition & insights →")}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {it?.chips?.nutrition_chip?.allergen_alert && (
                                <div style={{ marginTop: 8 }}>
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
                          )
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
      <ModifierSheet
        open={!!modifierItem}
        item={modifierItem}
        onClose={() => setModifierItem(null)}
        onConfirm={(modifiers) => {
          if (!modifierItem) return;
          commitMenuItemToBasket(
            modifierItem,
            modifierItem.name,
            modifierItem.description,
            modifiers
          );
          setModifierItem(null);
        }}
      />
      <OrderCartToast
        notice={notice}
        onDismiss={clearNotice}
        onAction={handleNoticeAction}
        bottomOffset={orderMode && hasBasketItems ? 94 : 18}
      />
      {orderMode && hasBasketItems ? (
        <BasketSummaryBar
          itemCount={itemCount}
          subtotal={subtotalCents}
          restaurantName={cartRestaurantState?.restaurantName}
          isCurrentRestaurant={basketMatchesCurrentRestaurant}
          headingLabel={orderMode ? "Basket summary" : undefined}
          summaryLabel={orderMode ? `${itemCount} ${itemCount === 1 ? "item" : "items"} • ${formatMoneyFromCents(subtotalCents)}` : undefined}
          ctaLabel={orderMode ? "Review Order" : "View Cart"}
          onOpenBasket={() => navigate("/checkout")}
        />
      ) : null}
    </div>
  );
}
