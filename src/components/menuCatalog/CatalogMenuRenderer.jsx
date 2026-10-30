import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useOrderCart } from "../../context/OrderCartContext.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import ModifierSheet from "../basket/ModifierSheet.jsx";
import SmartCustomizationSheet, { isCustomizableItem } from "../basket/SmartCustomizationSheet.jsx";
import PublicMenuMainContent from "../menu-templates/PublicMenuMainContent.jsx";
import PublicMenuItemCard from "../menu-templates/PublicMenuItemCard.jsx";
import { pickHeroImageUrl, resolveTemplateMenuStyle } from "../menu-templates/menuPresentationUtils.js";
import { buildRestaurantMenuBrand, fontStackForPreset } from "../menu-templates/restaurantMenuBrand.js";
import { normalizeMenuThemeSettings, resolveMenuPageBackground, resolveMenuShellTextColor, shouldShowItemImages } from "../menu-templates/menuThemeSettings.js";
import {
  buildMenuAppearanceRootStyle,
  getMenuAppearanceTokens,
  shouldApplyMenuAppearance,
} from "../../lib/menuAppearances.js";
import { resolveEffectiveMenuAppearance } from "../../lib/menuAppearanceRecommendation.js";
import { buildMenuChromeRootStyle, pickFeedMenuChrome } from "../../lib/menuWallpapers.js";
import { buildBrandMenuRootStyle, resolveBrandMenuTheme } from "../../lib/brandMenuThemes.js";
import BrandMenuStripe from "../menu-templates/BrandMenuStripe.jsx";
import { formatMoney, getBaseMenuPrice, getConsumerDisplayPrice } from "../../lib/pricingDisplay.js";
import { buildMenuShareMetadata } from "../share/shareUtils.js";
import {
  buildRestaurantStatusLightProps,
  isOnlineOrderingAvailable,
} from "../../lib/restaurantStatusLight.js";
import { toConsumerErrorMessage } from "../../lib/api.js";
import CatalogItemDetailSheet from "./CatalogItemDetailSheet.jsx";
import MenuPreferencesAppliedBanner from "../menu/MenuPreferencesAppliedBanner.jsx";
import OrderingUnavailableBanner from "../menu/OrderingUnavailableBanner.jsx";
import MenuRestaurantContextualVideo from "../menu/MenuRestaurantContextualVideo.jsx";
import useSavedMenuPreferences from "../../hooks/useSavedMenuPreferences.js";
import useCatalogDietaryPreferencesSession from "../../hooks/useCatalogDietaryPreferencesSession.js";
import useMenuPreferenceBannerSession from "../../hooks/useMenuPreferenceBannerSession.js";
import useMenuItemHighlight from "../../hooks/useMenuItemHighlight.js";
import { getNormalizedMenuItemId } from "../../lib/menuItemIdentity.js";
import { findPinnedMenuItems, withoutPinnedMenuItems } from "../../lib/menuPinnedItem.js";
import { MenuRowActionsContext } from "./menuRowActionsContext.js";
import MenuTapToOrderHint from "./MenuTapToOrderHint.jsx";
import MenuOrderBar from "./MenuOrderBar.jsx";
import MenuHeaderBookmarkAction from "./MenuHeaderBookmarkAction.jsx";
import { MenuHeaderShareContext, MenuHeaderTrailingActionContext } from "./menuHeaderTrailingActionContext.js";
import {
  FEED_ORDER_UNKNOWN_LOCATION_MESSAGE,
  withFeedOrderMarketGate,
} from "../../lib/feedOrderEligibility.js";
import {
  buildAllergenPreferenceLabels,
  buildDietPreferenceLabels,
  countMenuDisplayItems,
  getMenuDisplaySectionsWithPreferences,
} from "../../lib/menuClientPreferenceFilter.js";
import {
  asFiniteNumber,
  asStr,
  buildAddressLocalityLine,
  buildGoogleMapsUrlForRestaurant,
  getCartItemState,
  isFoodTruckCategory,
  resolveRestaurantProfileHref,
  normalizeSections,
} from "../../lib/catalogMenuUtils.js";
import { resolvePublicMenuAddressDisplay } from "../../lib/displayAddress.js";
import { appendSavedMenuPreferenceQueryParams } from "../../lib/dietaryParams.js";

/**
 * Menu Browser rows carry the same four actions as the Feed rail — Wish List · Like · Invite ·
 * Share (Andre, 2026-10-20) — and tapping the dish adds it; no menu has a per-row "+"
 * (Andre, 2026-10-21). The header keeps its Bookmark.
 */
const MENU_BROWSER_ROW_ACTIONS = { hideDishShare: false, tapRowToAdd: true };
/** Pinned "From the clip" card: same four actions + Add to basket. */
const PINNED_CARD_ROW_ACTIONS = { hideDishShare: false, tapRowToAdd: true };
/** Templates without the post-header slot (allergenBannerSlot) — keep the in-row highlight instead. */
const SCROLL_TAP_GUARD_MS = 350;
const CANNOT_ORDER_RESTAURANT_NOTE = "This restaurant isn't taking online orders yet";
const CANNOT_ORDER_DISH_NOTE = "This dish can't be ordered online";
/**
 * Menu Browser ordering chip — the one tap-to-order instruction (Andre, 2026-10-16: the
 * 4s top toast that repeated it on every load was dropped as duplicative).
 */
const ORDER_HERE_CHIP_LABEL = "🛍 Order here · Tap a dish to add it to your basket · Hold to remove";
/** Feed: keep the order bar clear of the mini video player (bottom-right). */
const FEED_PIP_ORDER_BAR_INSET = 150;
const PIN_UNSUPPORTED_MENU_STYLES = new Set(["v14", "v15"]);

const API = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:3001" : "")).replace(/\/$/, "");

const menuPayloadCache = new Map();
/**
 * Prefetch window only — a menu payload older than this is refetched so owner menu edits
 * show up without a full page reload (the cache used to live for the whole SPA session).
 */
const MENU_PAYLOAD_TTL_MS = 60 * 1000;

function AddedConfirmation({ name, onRemove, setConfirmation, brand }) {
  const accent = brand?.accent ?? "#22C55E";
  const accentBorder = brand?.accentBorder ?? "rgba(34,197,94,0.24)";
  useEffect(() => {
    const timer = setTimeout(() => setConfirmation(null), 2500);
    return () => clearTimeout(timer);
  }, [setConfirmation]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 88,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#121A14",
        borderRadius: 14,
        padding: "11px 16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 600,
        maxWidth: 360,
        width: "calc(100% - 32px)",
        border: `1px solid ${accentBorder}`,
      }}
    >
      <span style={{ color: accent, fontSize: 18, lineHeight: 1 }}>✓</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", flex: 1 }}>
        {name ? `${name} added` : "Added to order"}
      </span>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          color: "#667085",
          padding: "4px 0",
          textDecoration: "underline",
          whiteSpace: "nowrap",
        }}
      >
        Remove
      </button>
    </div>
  );
}

function fmtMoney(item) {
  const cents = getConsumerDisplayPrice(item);
  return cents != null ? formatMoney(cents) : "";
}

async function fetchMenuPayload(restaurantId, apiUrl) {
  const cacheKey = apiUrl;
  const cached = menuPayloadCache.get(cacheKey);
  if (cached && Date.now() - cached.at < MENU_PAYLOAD_TTL_MS) {
    return cached.promise;
  }
  const promise = (async () => {
    // no-cache = revalidate with the server (ETag), never serve a stale browser copy.
    const res = await fetch(apiUrl, { cache: "no-cache" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.ok !== true) {
      throw new Error(
        toConsumerErrorMessage(
          json?.detail || json?.error || `Request failed (${res.status})`,
          "We couldn't load this menu right now."
        )
      );
    }
    return json;
  })();
  menuPayloadCache.set(cacheKey, { promise, at: Date.now() });
  try {
    return await promise;
  } catch (error) {
    menuPayloadCache.delete(cacheKey);
    throw error;
  }
}

export function prefetchCatalogMenu(restaurantId, locationParams = {}, language = "en") {
  if (!restaurantId) return;
  const params = new URLSearchParams();
  if (locationParams.lat != null && locationParams.lng != null) {
    params.set("lat", String(locationParams.lat));
    params.set("lng", String(locationParams.lng));
  }
  if (locationParams.city) params.set("city", locationParams.city);
  if (locationParams.state) params.set("state", locationParams.state);
  if (language && language !== "en") params.set("lang", language);
  const qs = params.toString();
  const apiUrl = `${API}/public/restaurants/${encodeURIComponent(restaurantId)}/menu${qs ? `?${qs}` : ""}`;
  fetchMenuPayload(restaurantId, apiUrl).catch(() => {});
}

export default function CatalogMenuRenderer({
  entry,
  locationParams = {},
  isMobile = false,
  browseSection = "",
  highlightMenuItemId = null,
  /** Dish name fallback when the highlight id is not on this menu (Feed videos). */
  highlightMenuItemName = null,
  /** Feed videos with several dishes: [{ id, name }] (up to 3), video order. */
  highlightMenuItems = null,
  /** When set (e.g. "From the clip"), the matched dish is pinned under the restaurant header. */
  pinnedItemLabel = null,
  /** Feed Menu Browser only: ordering is offered only for restaurants in the viewer's market. */
  gateOrderingByMarket = false,
  /** Feed viewer location (preference first, then detected); null = unknown. */
  orderViewerLocation = null,
  /** Extra list bottom padding (px) so floating controls never cover the last row. */
  bottomClearance = 0,
  /** Right inset (px) for the order bar so floating buttons (Feed mini player, menu FAB) never cover it. */
  orderBarInsetRight = 0,
  /** When false, Feed PiP owns video — do not mount restaurant contextual player. */
  enableRestaurantContextualVideo = true,
  /** Feed only: menus without an owner-chosen appearance/wallpaper get random subtle chrome (display-only). */
  varyDefaultChrome = false,
  onLoadStateChange,
}) {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const {
    addMenuItem,
    restaurant: cartRestaurantState,
    items: cartItems,
    itemCount,
    subtotalCents,
    updateQuantity,
    removeItem,
  } = useOrderCart();
  const { foodsToAvoid = [] } = useConsumer();
  const {
    dietPrefs,
    enabledAllergenKeys,
    hasSavedPreferences,
    dietPreferenceActive,
    allergenPreferenceActive,
  } = useSavedMenuPreferences();
  const [applySavedPreferences, setApplySavedPreferences] = useCatalogDietaryPreferencesSession(
    dietPreferenceActive
  );
  const dietaryFilterActive = applySavedPreferences && dietPreferenceActive;
  const allergenFilterActive = allergenPreferenceActive;
  const filtersActive = dietaryFilterActive || allergenFilterActive;
  const preferenceBannerVisible = hasSavedPreferences;
  const { isFirstMenuView } = useMenuPreferenceBannerSession(preferenceBannerVisible);

  const restaurantId = entry?.restaurant_id;
  const [pageState, setPageState] = useState({ status: "idle", data: null, error: null });
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [tabSections, setTabSections] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState(null);
  const userSelectedTabRef = useRef(false);
  const [modifierItem, setModifierItem] = useState(null);
  const [modifierInitialInstructions, setModifierInitialInstructions] = useState("");
  const [smartSheetItem, setSmartSheetItem] = useState(null);
  const [itemSheet, setItemSheet] = useState(null);
  const [addedConfirmation, setAddedConfirmation] = useState(null);
  const [hoveredItemId, setHoveredItemId] = useState(null);

  const apiUrl = useMemo(() => {
    if (!restaurantId) return "";
    const params = new URLSearchParams();
    if (locationParams.lat != null && locationParams.lng != null) {
      params.set("lat", String(locationParams.lat));
      params.set("lng", String(locationParams.lng));
    }
    if (locationParams.city) params.set("city", locationParams.city);
    if (locationParams.state) params.set("state", locationParams.state);
    if (language && language !== "en") params.set("lang", language);
    appendSavedMenuPreferenceQueryParams(params, {
      applyDietaryPreferences: dietaryFilterActive,
      dietPrefs,
      enabledAllergenKeys,
    });
    const qs = params.toString();
    return `${API}/public/restaurants/${encodeURIComponent(restaurantId)}/menu${qs ? `?${qs}` : ""}`;
  }, [
    dietaryFilterActive,
    dietPrefs,
    enabledAllergenKeys,
    language,
    locationParams.city,
    locationParams.lat,
    locationParams.lng,
    locationParams.state,
    restaurantId,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (!restaurantId || !apiUrl) {
      setPageState({ status: "idle", data: null, error: null });
      return undefined;
    }

    userSelectedTabRef.current = false;
    setSelectedMenuId(null);
    setTabSections(null);
    setTabError(null);

    async function run() {
      setPageState({ status: "loading", data: null, error: null });
      try {
        const json = await fetchMenuPayload(restaurantId, apiUrl);
        if (cancelled) return;
        setPageState({ status: "ok", data: json, error: null });
      } catch (error) {
        if (cancelled) return;
        setPageState({
          status: "error",
          data: null,
          error: toConsumerErrorMessage(error, "We couldn't load this menu right now."),
        });
      }
    }

    run();
    return () => { cancelled = true; };
  }, [apiUrl, restaurantId]);

  useEffect(() => {
    onLoadStateChange?.(pageState.status);
  }, [onLoadStateChange, pageState.status]);

  useEffect(() => {
    const d = pageState.data;
    if (d?.selected_menu_id && !userSelectedTabRef.current) {
      setSelectedMenuId(d.selected_menu_id);
    }
  }, [pageState.data]);

  const handleSelectMenu = useCallback(async (menuId) => {
    if (menuId === selectedMenuId) return;
    const prevMenuId = selectedMenuId;
    userSelectedTabRef.current = true;
    setSelectedMenuId(menuId);
    setTabError(null);
    setTabLoading(true);
    try {
      const rid = encodeURIComponent(asStr(restaurantId).trim());
      const params = new URLSearchParams();
      params.set("menu", String(menuId));
      appendSavedMenuPreferenceQueryParams(params, {
        applyDietaryPreferences: dietaryFilterActive,
        dietPrefs,
        enabledAllergenKeys,
      });
      const res = await fetch(`${API}/public/restaurants/${rid}/menu?${params.toString()}`, { cache: "no-cache" });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        const newSections = normalizeSections(json);
        if (newSections.length > 0) {
          setTabSections({ menuId, sections: newSections });
        } else {
          setSelectedMenuId(prevMenuId);
          setTabError("Unable to load menu section.");
        }
      } else {
        setSelectedMenuId(prevMenuId);
        setTabError("Unable to load menu section.");
      }
    } catch {
      setSelectedMenuId(prevMenuId);
      setTabError("Unable to load menu section.");
    } finally {
      setTabLoading(false);
    }
  }, [restaurantId, selectedMenuId, dietaryFilterActive, dietPrefs, enabledAllergenKeys]);

  const loadedData = pageState.status === "ok" ? pageState.data : null;
  // Feed: out-of-market / unknown-location viewers browse the same menu with ordering switched off.
  const { data, orderMarketState } = useMemo(
    () =>
      withFeedOrderMarketGate(loadedData, {
        enabled: gateOrderingByMarket,
        viewer: orderViewerLocation,
        distanceMiles: asFiniteNumber(
          entry?.distance_miles ??
            entry?.restaurant_distance_miles ??
            loadedData?.distance_miles ??
            loadedData?.restaurant_distance_miles
        ),
      }),
    [loadedData, gateOrderingByMarket, orderViewerLocation, entry?.distance_miles, entry?.restaurant_distance_miles]
  );
  const displaySettingsSource = data?.display_settings || data || {};
  const menuThemeSettings = normalizeMenuThemeSettings(displaySettingsSource);
  const restaurantName = data
    ? (
      getLocalizedField(data, "restaurant_name", language) ||
      getLocalizedField(data, "name", language) ||
      asStr(data?.restaurant_name || data?.name || entry?.restaurant_name || `Restaurant ${restaurantId}`).trim()
    )
    : asStr(entry?.restaurant_name || "").trim();

  const _allMenus = Array.isArray(data?.menus) ? data.menus : [];
  const _activeMenu = _allMenus.length > 1 && selectedMenuId != null
    ? (_allMenus.find((m) => m.id === selectedMenuId) ?? _allMenus[0])
    : null;
  const menuTypeLabel = asStr(
    (_activeMenu ? (_activeMenu.tab_label || _activeMenu.display_name || _activeMenu.name) : null) ||
    data?.menu_name ||
    data?.menu_label ||
    ""
  ).trim() || null;

  const _scheduledActiveMenu = _allMenus.find((m) => {
    const days = Array.isArray(m.schedule_days) ? m.schedule_days : [];
    return !!(m.start_time && m.end_time && days.length > 0 && days.length < 7) && m.is_currently_active === true;
  }) || null;
  const scheduledActiveMenuLabel = _scheduledActiveMenu
    ? asStr(_scheduledActiveMenu.tab_label || _scheduledActiveMenu.display_name || _scheduledActiveMenu.name).trim() || null
    : null;

  const isFoodTruck =
    isFoodTruckCategory(data?.category) ||
    isFoodTruckCategory(data?.restaurant_category) ||
    isFoodTruckCategory(data?.type);
  const restaurantProfileHref = resolveRestaurantProfileHref({
    data,
    entry,
    restaurantId,
    isFoodTruck,
  });

  const addressDisplay = resolvePublicMenuAddressDisplay(data, { isFoodTruck });
  const addressLine1 = addressDisplay.addressLine1;
  const addressLine2 = addressDisplay.addressLine2;
  const addressLine = addressDisplay.addressLine;
  const directionsHref =
    addressDisplay.directionsHref ||
    buildGoogleMapsUrlForRestaurant({
      addressLine,
      addressLine1,
      addressLine2,
      city: data?.city,
      state: data?.state,
      zip: data?.zip,
      lat: data?.lat ?? entry?.lat,
      lng: data?.lng ?? entry?.lng,
    });
  const distanceMiles = useMemo(() => {
    const fromEntry = asFiniteNumber(entry?.distance_miles ?? entry?.restaurant_distance_miles);
    if (fromEntry != null) return fromEntry;
    return asFiniteNumber(data?.distance_miles ?? data?.restaurant_distance_miles);
  }, [data?.distance_miles, data?.restaurant_distance_miles, entry?.distance_miles, entry?.restaurant_distance_miles]);
  const showDistanceBelowAddress = distanceMiles != null;
  const sections = tabSections?.sections ?? normalizeSections(data);
  const dietLabels = useMemo(() => buildDietPreferenceLabels(dietPrefs), [dietPrefs]);
  const allergenLabels = useMemo(
    () => buildAllergenPreferenceLabels(enabledAllergenKeys),
    [enabledAllergenKeys]
  );
  const displaySections = useMemo(
    () =>
      getMenuDisplaySectionsWithPreferences(sections, {
        applyDietaryPreferences: dietaryFilterActive,
        dietPrefs,
        enabledAllergenKeys,
      }),
    [sections, dietaryFilterActive, dietPrefs, enabledAllergenKeys]
  );

  const subjectMatches = useMemo(() => {
    const subjects =
      Array.isArray(highlightMenuItems) && highlightMenuItems.length
        ? highlightMenuItems
        : highlightMenuItemId != null || highlightMenuItemName
          ? [{ id: highlightMenuItemId, name: highlightMenuItemName }]
          : [];
    return subjects.length ? findPinnedMenuItems(displaySections, subjects, 3) : [];
  }, [displaySections, highlightMenuItems, highlightMenuItemId, highlightMenuItemName]);
  const pinnedMatches =
    pinnedItemLabel && !PIN_UNSUPPORTED_MENU_STYLES.has(resolveTemplateMenuStyle(data?.menu_style))
      ? subjectMatches
      : [];
  const listSections = useMemo(
    () => withoutPinnedMenuItems(displaySections, pinnedMatches),
    [displaySections, pinnedMatches]
  );
  const subjectMatchId = subjectMatches[0] ? getNormalizedMenuItemId(subjectMatches[0].item) : null;
  // Pinned cards carry their own highlight; the row highlight is for in-list (unpinned) matches.
  const effectiveHighlightId = pinnedMatches.length
    ? null
    : subjectMatchId != null && String(subjectMatchId).trim() !== ""
      ? subjectMatchId
      : highlightMenuItemId != null && String(highlightMenuItemId).trim() !== ""
        ? highlightMenuItemId
        : null;

  useMenuItemHighlight({
    highlightMenuItemId: effectiveHighlightId,
    ready: pageState.status === "ok" && Boolean(data),
    displaySections,
  });

  const totalMenuItemCount = useMemo(() => countMenuDisplayItems(sections), [sections]);
  const displayableItemCount = displaySections.reduce(
    (count, sec) => count + (Array.isArray(sec?.items) ? sec.items.length : 0),
    0
  );
  const isIntakePreview = data?.menu_source === "intake";
  const currentRestaurantId = data?.restaurant_id || restaurantId;

  const shareData = buildMenuShareMetadata({
    restaurantName,
    restaurantSlug: data?.slug,
    restaurantId: currentRestaurantId,
    city: data?.city,
    state: data?.state,
    logoUrl: data?.logo_url,
  });

  const shareAnalyticsContext = {
    restaurantId: currentRestaurantId,
    restaurantName,
    restaurantSlug: data?.slug || null,
    menuId: currentRestaurantId,
    pageType: "menu_catalog",
    shareTarget: "menu",
  };
  const shareHeaderValue = { shareData, analyticsContext: shareAnalyticsContext };

  const cartRestaurant = {
    restaurantId: currentRestaurantId,
    restaurantName,
    deliveryEnabled: data?.delivery_enabled === true,
    defaultDeliveryProvider: data?.default_delivery_provider || null,
    activeDeliveryProviders: Array.isArray(data?.active_delivery_providers)
      ? data.active_delivery_providers
      : [],
    availableFulfillmentTypes:
      Array.isArray(data?.available_fulfillment_types) && data.available_fulfillment_types.includes("delivery")
        ? data.available_fulfillment_types
        : ["pickup", "delivery"],
  };

  const hasBasketItems = itemCount > 0;
  const basketMatchesCurrentRestaurant =
    Number(cartRestaurantState?.restaurantId) === Number(cartRestaurant.restaurantId);
  const activeCartItems = useMemo(
    () => (basketMatchesCurrentRestaurant ? cartItems || [] : []),
    [basketMatchesCurrentRestaurant, cartItems]
  );

  // National chains: menu wears the same brand colors as the brand profile (display-only).
  const brandMenuTheme = resolveBrandMenuTheme(data, restaurantName);
  const menuBrand = data ? buildRestaurantMenuBrand({
    ...data,
    accent_color:
      menuThemeSettings.primary_color ||
      menuThemeSettings.accent_color ||
      data?.accent_color ||
      brandMenuTheme?.tokens.accent ||
      null,
    hero_image_url: menuThemeSettings.hero_enabled === false ? null : data?.hero_image_url || null,
    font_preset: data?.font_preset || "default",
  }, restaurantName) : null;

  const resolvedPageBackground = resolveMenuPageBackground(displaySettingsSource, menuBrand);
  const shellTextColor = resolveMenuShellTextColor(displaySettingsSource);

  const applyMenuAppearance = shouldApplyMenuAppearance(data?.menu_style || "v1");
  const feedChrome = useMemo(
    () => (varyDefaultChrome && restaurantId ? pickFeedMenuChrome() : null),
    [varyDefaultChrome, restaurantId]
  );
  const hasOwnerChrome =
    String(data?.menu_appearance_key || "").trim() !== "" ||
    String(data?.menu_wallpaper_key || "").trim() !== "";
  const useFeedChrome = Boolean(feedChrome && data && !hasOwnerChrome && !brandMenuTheme);
  const effectiveMenuAppearance = useFeedChrome
    ? feedChrome.menu_appearance_key
    : data?.effective_menu_appearance ||
      resolveEffectiveMenuAppearance({
        menu_appearance_key: data?.menu_appearance_key,
        category: data?.category,
        cuisine: data?.cuisine,
      });
  const effectiveMenuWallpaper = useFeedChrome
    ? feedChrome.menu_wallpaper_key
    : data?.menu_wallpaper_key == null || data?.menu_wallpaper_key === ""
      ? null
      : String(data.menu_wallpaper_key).trim();
  const appearanceTokens = applyMenuAppearance
    ? brandMenuTheme?.tokens || getMenuAppearanceTokens(effectiveMenuAppearance)
    : null;
  const catalogShellStyle = applyMenuAppearance
    ? {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        ...(brandMenuTheme
          ? buildBrandMenuRootStyle(brandMenuTheme.tokens)
          : buildMenuChromeRootStyle(
              effectiveMenuAppearance,
              effectiveMenuWallpaper,
              useFeedChrome ? null : data?.resolved_menu_wallpaper || null
            )),
        overflow: "hidden",
      }
    : {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: resolvedPageBackground,
        overflow: "hidden",
      };
  const effectiveShellTextColor = applyMenuAppearance
    ? appearanceTokens.onPage || appearanceTokens.ink || "#101828"
    : shellTextColor;

  const dealMap = useMemo(() => {
    const m = new Map();
    for (const d of pageState.data?.deal_items || []) {
      const key = d.menu_item_id ?? d.id;
      if (key == null) continue;
      m.set(key, d);
      const numericKey = Number(key);
      if (Number.isFinite(numericKey)) m.set(numericKey, d);
    }
    return m;
  }, [pageState.data]);

  function commitMenuItemToBasket(item, itemName, itemDescription, modifiers = [], preparationInstructions = null) {
    if (!isOnlineOrderingAvailable(data)) return null;
    return addMenuItem({
      restaurant: cartRestaurant,
      item: {
        menu_item_id: item?.menu_item_id,
        restaurant_id: item?.restaurant_id,
        menu_id: item?.menu_id,
        product_key: item?.product_key ?? null,
        name: itemName,
        description: itemDescription,
        basePriceCents: getConsumerDisplayPrice(item) ?? 0,
        originalBasePriceCents: getBaseMenuPrice(item) ?? getConsumerDisplayPrice(item) ?? 0,
        modifiers,
        preparationInstructions: preparationInstructions || null,
      },
    });
  }

  function openCheckout() {
    navigate("/checkout");
  }

  function openModifierFlow(item, itemName, itemDescription, initialInstructions = "") {
    setModifierInitialInstructions(initialInstructions);
    setModifierItem({
      ...item,
      name: itemName,
      description: itemDescription,
    });
  }

  function openSmartOrModifierFlow(item, itemName, itemDescription) {
    if (isCustomizableItem(item)) {
      setSmartSheetItem({ ...item, name: itemName, description: itemDescription });
    } else {
      openModifierFlow(item, itemName, itemDescription);
    }
  }

  const [menuNotice, setMenuNotice] = useState(null);
  // A tap within this window after the menu scrolled is a scroll gesture, not a selection.
  const lastScrollAtRef = useRef(0);
  const isScrollTap = useCallback(() => Date.now() - lastScrollAtRef.current < SCROLL_TAP_GUARD_MS, []);
  useEffect(() => {
    // Capture phase: catches the menu scroller and any outer scroller the menu sits in.
    const onAnyScroll = () => { lastScrollAtRef.current = Date.now(); };
    document.addEventListener("scroll", onAnyScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onAnyScroll, { capture: true });
  }, []);
  const removeOneFromBasket = useCallback(
    (menuItemId, itemName) => {
      const state = getCartItemState(activeCartItems, menuItemId);
      const line = state.simpleLine || state.matchingLines[state.matchingLines.length - 1];
      if (!line) return;
      const qty = Number(line.quantity || 0);
      if (qty > 1) updateQuantity(line.lineId, qty - 1);
      else removeItem(line.lineId);
      setAddedConfirmation(null);
      setMenuNotice({ key: Date.now(), message: `Removed 1 ${itemName || "item"} from your basket` });
    },
    [activeCartItems, updateQuantity, removeItem]
  );
  const onCannotOrder = useCallback((reason) => {
    setMenuNotice({
      key: Date.now(),
      message: reason === "restaurant" ? CANNOT_ORDER_RESTAURANT_NOTE : CANNOT_ORDER_DISH_NOTE,
    });
  }, []);
  const onOpenOptions = useCallback((item, itemName, itemDescription) => {
    openSmartOrModifierFlow(item, itemName, itemDescription);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flow setters are stable
  }, []);
  const sharedRowActions = { onRemoveOne: removeOneFromBasket, isScrollTap, onCannotOrder, onOpenOptions };
  const menuBrowserRowActions = useMemo(
    () => ({ ...MENU_BROWSER_ROW_ACTIONS, ...sharedRowActions }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- members listed individually
    [removeOneFromBasket, isScrollTap, onCannotOrder, onOpenOptions]
  );
  const pinnedCardRowActions = useMemo(
    () => ({ ...PINNED_CARD_ROW_ACTIONS, ...sharedRowActions }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- members listed individually
    [removeOneFromBasket, isScrollTap, onCannotOrder, onOpenOptions]
  );

  function handleRemoveAdded() {
    if (!addedConfirmation) return;
    const state = getCartItemState(activeCartItems, addedConfirmation.itemId);
    if (state.simpleLine) removeItem(state.simpleLine.lineId);
    setAddedConfirmation(null);
  }

  const menuPresentationStyle = resolveTemplateMenuStyle(data?.menu_style);

  const headerBookmarkAction = currentRestaurantId ? (
    <MenuHeaderBookmarkAction
      key={`bookmark-${currentRestaurantId}`}
      restaurant={{
        restaurant_id: currentRestaurantId,
        restaurant_name: restaurantName,
        slug: data?.slug || entry?.slug || "",
        city: data?.city || entry?.city || "",
        state: data?.state || entry?.state || "",
      }}
    />
  ) : null;

  const orderingAvailable = isOnlineOrderingAvailable(data);
  // Orderable menus say "tap to order" in the static chip only; this toast is just for unknown location.
  const tapToOrderHint = !orderingAvailable && orderMarketState === "unknown_location" && isOnlineOrderingAvailable(loadedData) ? (
    <MenuTapToOrderHint
      key={`order-hint-${currentRestaurantId}`}
      tone="info"
      message={FEED_ORDER_UNKNOWN_LOCATION_MESSAGE}
    />
  ) : null;

  const pinnedCard = pinnedMatches.length ? (
    <section
      data-testid="menu-browser-pinned-item"
      aria-label={pinnedItemLabel}
      style={{
        marginTop: 12,
        marginBottom: 4,
        padding: "8px 10px 2px",
        borderRadius: 14,
        background: "rgba(34, 197, 94, 0.08)",
        border: "1px solid rgba(34, 197, 94, 0.28)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#15803d",
          marginBottom: 2,
        }}
      >
        {pinnedItemLabel}
      </div>
      <MenuRowActionsContext.Provider value={pinnedCardRowActions}>
        {pinnedMatches.map((match) => (
        <div
          key={`${match.sectionIndex}:${match.itemIndex}`}
          data-testid="menu-browser-pinned-dish"
          style={{ border: "2px solid #22c55e", borderRadius: 10, padding: "0 8px", marginBottom: 6, background: "#fff" }}
        >
        <PublicMenuItemCard
          density="classic"
          editorialRefresh={!["v12", "v13", "v17"].includes(menuPresentationStyle)}
          it={match.item}
          sIdx={match.sectionIndex}
          iIdx={match.itemIndex}
          language={language}
          t={t}
          data={data}
          restaurantName={restaurantName}
          currentRestaurantId={currentRestaurantId}
          dealMap={dealMap}
          activeCartItems={activeCartItems}
          hoveredItemId={hoveredItemId}
          setHoveredItemId={setHoveredItemId}
          removeItem={removeItem}
          navigate={navigate}
          setItemSheet={setItemSheet}
          setAddedConfirmation={setAddedConfirmation}
          commitMenuItemToBasket={commitMenuItemToBasket}
          fmtMoney={fmtMoney}
          getConsumerDisplayPrice={getConsumerDisplayPrice}
          brand={menuBrand}
          menuThemeSettings={menuThemeSettings}
          showImage={shouldShowItemImages(menuThemeSettings)}
        />
        </div>
        ))}
      </MenuRowActionsContext.Provider>
    </section>
  ) : null;

  const templateContext =
    data && pageState.status === "ok"
      ? {
          isMobile,
          language,
          t,
          restaurantName,
          restaurantProfileHref,
          menuTypeLabel,
          scheduledActiveMenuLabel,
          addressLine1,
          addressLine2,
          addressLine,
          directionsHref,
          distanceMiles,
          showDistanceBelowAddress,
          logoUrl: data?.logo_url || null,
          logoPlacement: menuThemeSettings.logo_placement || "top-left",
          shareData,
          shareAnalyticsContext,
          franchiseSlot: null,
          intakeBannerSlot: (
            <>
              <OrderingUnavailableBanner data={data} label={ORDER_HERE_CHIP_LABEL} />
            </>
          ),
          allergenBannerSlot: (
            <>
            {pinnedCard}
            <MenuPreferencesAppliedBanner
              visible={preferenceBannerVisible}
              isFirstMenuView={isFirstMenuView}
              dietaryApplied={dietaryFilterActive}
              filtersActive={filtersActive}
              filteredItemCount={displayableItemCount}
              totalMenuItemCount={totalMenuItemCount}
              dietLabels={dietLabels}
              allergenLabels={allergenLabels}
              onToggleDietary={setApplySavedPreferences}
            />
            </>
          ),
          displaySections: listSections,
          displayableItemCount,
          dealItems: data?.deal_items || [],
          filtersActive,
          data,
          currentRestaurantId,
          dealMap,
          activeCartItems,
          hoveredItemId,
          setHoveredItemId,
          removeItem,
          navigate,
          setItemSheet,
          setAddedConfirmation,
          commitMenuItemToBasket,
          fmtMoney,
          getConsumerDisplayPrice,
          heroImageUrl: menuThemeSettings.hero_enabled === false ? null : pickHeroImageUrl(data),
          menuThemeSettings,
          cartLineCount: basketMatchesCurrentRestaurant ? itemCount : 0,
          onGoCheckout: openCheckout,
          brand: menuBrand,
          fontStack: fontStackForPreset(menuBrand?.fontPreset),
          menus: data?.menus || [],
          selectedMenuId,
          onSelectMenu: handleSelectMenu,
          tabLoading,
          tabError,
          menuPresentation: data?.menu_presentation || data?.presentation || {},
          menuAppearanceKey: applyMenuAppearance ? effectiveMenuAppearance : null,
          ...buildRestaurantStatusLightProps(data),
        }
      : null;

  const isSponsored = entry?.is_sponsored === true;

  if (!restaurantId) {
    return (
      <div style={{ padding: 24, color: "#667085", fontSize: 14, fontWeight: 600 }}>
        {t("menuCatalog.selectMenu", "Select a category to browse menus.")}
      </div>
    );
  }

  if (pageState.status === "loading" || pageState.status === "idle") {
    return (
      <div style={{ padding: 24, color: "#667085", fontSize: 14, fontWeight: 600 }}>
        {t("menuCatalog.loadingMenu", "Loading menu…")}
      </div>
    );
  }

  if (pageState.status === "error") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{t("publicMenu.loadError", "Couldn't load menu")}</div>
        <div style={{ color: "#667085", fontSize: 14 }}>{pageState.error}</div>
      </div>
    );
  }

  return (
    <div
      style={{ ...catalogShellStyle, position: "relative" }}
      data-menu-appearance={applyMenuAppearance ? effectiveMenuAppearance : undefined}
      data-menu-chrome={applyMenuAppearance && useFeedChrome ? "feed" : undefined}
      data-brand-theme={applyMenuAppearance && brandMenuTheme ? brandMenuTheme.name : undefined}
    >
      {menuNotice ? (
        <MenuTapToOrderHint
          key={`notice-${menuNotice.key}`}
          tone="info"
          durationMs={2200}
          message={menuNotice.message}
        />
      ) : (
        tapToOrderHint
      )}
      {isSponsored ? (
        <div style={{
          padding: "6px 16px",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "#a16207",
          background: "rgba(234, 179, 8, 0.14)",
          borderBottom: "1px solid rgba(234, 179, 8, 0.25)",
          flexShrink: 0,
        }}>
          {entry?.sponsored_label || t("menuBrowser.sponsored", "Sponsored")}
          {entry?.sponsored_deal?.title ? ` · ${entry.sponsored_deal.title}` : ""}
        </div>
      ) : null}

      <div
        className="menu-catalog-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          // Catalog scrolls inside the menu pane — sticky header sticks to pane top, not viewport.
          "--sph-h": "0px",
          position: "relative",
          isolation: "isolate",
        }}
      >
        <div style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: isMobile ? "12px 12px 24px" : "20px 20px 24px",
          paddingBottom: 24 + Math.max(0, Number(bottomClearance) || 0),
          color: effectiveShellTextColor,
        }}>
          <MenuHeaderShareContext.Provider value={shareHeaderValue}>
          <MenuHeaderTrailingActionContext.Provider value={headerBookmarkAction}>
          <MenuRowActionsContext.Provider value={menuBrowserRowActions}>
          {templateContext ? (
            applyMenuAppearance && appearanceTokens ? (
              <div
                style={{
                  backgroundColor: appearanceTokens.menuSurface,
                  border: `1px solid ${appearanceTokens.border}`,
                  boxShadow: appearanceTokens.shadow,
                  borderRadius: 12,
                  // Keep overflow visible so sticky headers do not cover section titles.
                  color: appearanceTokens.ink,
                }}
              >
                {appearanceTokens.heroStripe ? <BrandMenuStripe background={appearanceTokens.heroStripe} /> : null}
                <PublicMenuMainContent menuStyle={menuPresentationStyle} templateContext={templateContext} />
              </div>
            ) : (
              <PublicMenuMainContent menuStyle={menuPresentationStyle} templateContext={templateContext} />
            )
          ) : null}
          </MenuRowActionsContext.Provider>
          </MenuHeaderTrailingActionContext.Provider>
          </MenuHeaderShareContext.Provider>
          <MenuOrderBar
            // No empty-state bar: the chip already says how to order (Andre: overkill).
            showEmpty={false}
            insetRight={Math.max(orderBarInsetRight, gateOrderingByMarket ? FEED_PIP_ORDER_BAR_INSET : 0)}
            basketProps={
              hasBasketItems
                ? {
                    itemCount,
                    subtotal: subtotalCents,
                    restaurantName: cartRestaurantState?.restaurantName,
                    isCurrentRestaurant: basketMatchesCurrentRestaurant,
                    summaryLabel: `${itemCount} ${itemCount === 1 ? "item" : "items"} · ${formatMoney(subtotalCents)}`,
                    onOpenBasket: () => navigate("/checkout"),
                    onClear: () => { for (const line of activeCartItems) removeItem(line.lineId); },
                  }
                : null
            }
          />
        </div>
      </div>

      {itemSheet ? (
        <CatalogItemDetailSheet
          sheetData={itemSheet}
          activeCartItems={activeCartItems}
          onClose={() => setItemSheet(null)}
          onAddSimple={(item, name, desc) => {
            if (isCustomizableItem(item)) {
              setItemSheet(null);
              setSmartSheetItem({ ...item, name, description: desc });
            } else {
              commitMenuItemToBasket(item, name, desc);
            }
          }}
          onOpenModifiers={(item, name, desc) => openSmartOrModifierFlow(item, name, desc)}
          onUpdateQuantity={(lineId, qty) => updateQuantity(lineId, qty)}
          onRemoveItem={(lineId) => removeItem(lineId)}
          t={t}
          brand={menuBrand}
          menuThemeSettings={menuThemeSettings}
          navigate={navigate}
        />
      ) : null}

      <ModifierSheet
        open={!!modifierItem}
        item={modifierItem}
        initialSpecialInstructions={modifierInitialInstructions}
        onClose={() => { setModifierItem(null); setModifierInitialInstructions(""); }}
        onConfirm={(modifiers, preparationInstructions) => {
          if (!modifierItem) return;
          commitMenuItemToBasket(
            modifierItem,
            modifierItem.name,
            modifierItem.description,
            modifiers,
            preparationInstructions
          );
          setModifierItem(null);
          setModifierInitialInstructions("");
        }}
      />

      <SmartCustomizationSheet
        open={!!smartSheetItem}
        item={smartSheetItem}
        foodsToAvoid={foodsToAvoid}
        onClose={() => setSmartSheetItem(null)}
        onAddToCart={(item, preparationInstructions) => {
          commitMenuItemToBasket(item, item.name, item.description, [], preparationInstructions);
          setSmartSheetItem(null);
        }}
        onCustomize={(item, initialInstructions) => {
          setSmartSheetItem(null);
          openModifierFlow(item, item.name, item.description, initialInstructions || "");
        }}
      />

      {addedConfirmation ? (
        <AddedConfirmation
          name={addedConfirmation.name}
          onRemove={handleRemoveAdded}
          setConfirmation={setAddedConfirmation}
          brand={menuBrand}
        />
      ) : null}

      {enableRestaurantContextualVideo && restaurantId ? (
        <MenuRestaurantContextualVideo
          restaurantId={restaurantId}
          preferredMenuItemId={effectiveHighlightId}
          bottomInset={itemCount > 0 ? 72 : 56}
        />
      ) : null}
    </div>
  );
}
