import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { API_BASE, toConsumerErrorMessage } from "../../lib/api.js";
import { formatMoney } from "../../lib/pricingDisplay.js";
import RestaurantVerificationBadge from "../RestaurantVerificationBadge.jsx";
import { buildRestaurantStatusLightProps } from "../../lib/restaurantStatusLight.js";
import {
  asFiniteNumber,
  asStr,
  buildAddressLocalityLine,
  buildGoogleMapsUrlForRestaurant,
  resolveRestaurantProfileHref,
} from "../../lib/catalogMenuUtils.js";
import { getDrinkCatalogTab } from "../../lib/menuCatalogDrinkCategories.js";
import {
  buildMenuAppearanceRootStyle,
  getMenuAppearanceTokens,
  shouldApplyMenuAppearance,
} from "../../lib/menuAppearances.js";
import { resolveEffectiveMenuAppearance } from "../../lib/menuAppearanceRecommendation.js";
import { buildMenuChromeRootStyle } from "../../lib/menuWallpapers.js";
import {
  normalizeMenuThemeSettings,
  resolveMenuPageBackground,
  resolveMenuShellTextColor,
} from "../menu-templates/menuThemeSettings.js";

const drinksMenuPayloadCache = new Map();

/** Empty or failed responses must not stick in cache across remounts. */
function isCacheableDrinksPayload(json) {
  if (!json || json.ok !== true) return false;
  const itemCount = Number(json.item_count);
  if (Number.isFinite(itemCount) && itemCount <= 0) return false;
  const sections = json.browser_sections;
  if (Array.isArray(sections) && sections.every((s) => !Array.isArray(s?.items) || s.items.length === 0)) {
    return false;
  }
  return true;
}

export function clearDrinksMenuPayloadCache(apiUrl = null) {
  if (apiUrl == null) {
    drinksMenuPayloadCache.clear();
    return;
  }
  drinksMenuPayloadCache.delete(apiUrl);
}

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
    const json = await promise;
    if (!isCacheableDrinksPayload(json)) {
      drinksMenuPayloadCache.delete(apiUrl);
    }
    return json;
  } catch (error) {
    drinksMenuPayloadCache.delete(apiUrl);
    throw error;
  }
}

function orderBrowserSectionsForActiveTab(sections, activeBrowseSection) {
  const activeId = String(activeBrowseSection || "").trim().toLowerCase();
  if (!activeId || !Array.isArray(sections) || sections.length === 0) return sections;

  const active = sections.filter((section) => section.browser_category_id === activeId);
  const rest = sections.filter((section) => section.browser_category_id !== activeId);
  if (!active.length) return sections;
  return [...active, ...rest];
}

export function prefetchCatalogDrinksMenu(restaurantId, locationParams = {}, browseSection = "") {
  if (!restaurantId) return;
  const params = new URLSearchParams();
  if (locationParams.lat != null && locationParams.lng != null) {
    params.set("lat", String(locationParams.lat));
    params.set("lng", String(locationParams.lng));
  }
  if (locationParams.city) params.set("city", locationParams.city);
  if (locationParams.state) params.set("state", locationParams.state);
  if (browseSection) params.set("browse_section", browseSection);
  const qs = params.toString();
  const apiUrl = `${API_BASE}/public/restaurants/${encodeURIComponent(restaurantId)}/drinks-menu${qs ? `?${qs}` : ""}`;
  fetchDrinksMenuPayload(restaurantId, apiUrl).catch(() => {});
}

function formatItemPrice(item) {
  const cents = item?.happy_hour_price_cents != null && item?.is_happy_hour
    ? Number(item.happy_hour_price_cents)
    : item?.price_cents;
  return Number.isFinite(Number(cents)) ? formatMoney(Number(cents)) : "";
}

function DrinksBrowserCategorySection({
  section,
  isActiveBrowseSection = false,
  inkColor = "#11211a",
  mutedColor = "#667085",
  dividerColor = "rgba(18,34,28,0.08)",
}) {
  const items = Array.isArray(section?.items) ? section.items : [];
  if (!items.length) return null;

  const accent = asStr(section.accent || getDrinkCatalogTab(section.browser_category_id)?.accent || inkColor).trim();
  const label = asStr(section.label || getDrinkCatalogTab(section.browser_category_id)?.label || "Beverages").trim();

  return (
    <section style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          padding: "6px 12px",
          borderRadius: 999,
          background: `${accent}18`,
          border: `1px solid ${accent}44`,
          boxShadow: isActiveBrowseSection ? `0 0 0 2px ${accent}33` : "none",
        }}
      >
        {section.emoji ? (
          <span aria-hidden="true" style={{ fontSize: 14 }}>{section.emoji}</span>
        ) : null}
        <h2
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {label}
        </h2>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        {items.map((item) => {
          const price = formatItemPrice(item);
          const key = `${section.browser_category_id || "section"}-${item.id || item.name}`;
          return (
            <article
              key={key}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                alignItems: "start",
                paddingBottom: 12,
                borderBottom: `1px solid ${dividerColor}`,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: inkColor }}>
                  {asStr(item.name).trim()}
                </div>
                {item.description ? (
                  <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.45, color: mutedColor }}>
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
                <div style={{ fontSize: 14, fontWeight: 700, color: inkColor, whiteSpace: "nowrap" }}>
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
  browseSection = "",
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
    if (browseSection) params.set("browse_section", browseSection);
    const qs = params.toString();
    return `${API_BASE}/public/restaurants/${encodeURIComponent(restaurantId)}/drinks-menu${qs ? `?${qs}` : ""}`;
  }, [browseSection, entry?.distance_miles, entry?.restaurant_distance_miles, locationParams.city, locationParams.lat, locationParams.lng, locationParams.state, restaurantId]);

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
  const verificationProps = buildRestaurantStatusLightProps({ ...data, ...restaurant });
  const browserSections = useMemo(
    () => orderBrowserSectionsForActiveTab(
      Array.isArray(data?.browser_sections) ? data.browser_sections : [],
      asStr(data?.active_browse_section || browseSection).trim().toLowerCase()
    ),
    [browseSection, data?.active_browse_section, data?.browser_sections]
  );
  const activeBrowseSection = asStr(data?.active_browse_section || browseSection).trim().toLowerCase();

  const displaySettingsSource = data?.display_settings || data?.style?.display_settings || data || {};
  const menuThemeSettings = normalizeMenuThemeSettings(displaySettingsSource);
  const applyMenuAppearance = shouldApplyMenuAppearance(data?.menu_style || data?.style?.menu_style || "v1");
  const effectiveMenuAppearance =
    data?.effective_menu_appearance
    || data?.style?.effective_menu_appearance
    || resolveEffectiveMenuAppearance({
      menu_appearance_key: data?.menu_appearance_key || data?.style?.menu_appearance_key,
      category: restaurant.category || data?.category || entry?.category,
      cuisine: restaurant.cuisine || data?.cuisine || entry?.cuisine,
    });
  const effectiveMenuWallpaper =
    data?.menu_wallpaper_key == null || data?.menu_wallpaper_key === ""
      ? (data?.style?.menu_wallpaper_key == null || data?.style?.menu_wallpaper_key === ""
        ? null
        : String(data.style.menu_wallpaper_key).trim())
      : String(data.menu_wallpaper_key).trim();
  const appearanceTokens = applyMenuAppearance
    ? getMenuAppearanceTokens(effectiveMenuAppearance)
    : null;
  const resolvedPageBackground = resolveMenuPageBackground(
    {
      ...displaySettingsSource,
      menu_style: data?.menu_style || data?.style?.menu_style || menuThemeSettings.menu_style,
      shell_background_color:
        displaySettingsSource.shell_background_color
        || data?.style?.shell_background_color
        || null,
      background_style:
        displaySettingsSource.background_style
        || data?.style?.background_style
        || null,
    },
    {
      accent_color: data?.accent_color || data?.style?.accent_color || menuThemeSettings.accent_color,
    }
  );
  const shellTextColor = resolveMenuShellTextColor(displaySettingsSource);
  const canvasStyle = applyMenuAppearance
    ? {
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        padding: "20px 18px 32px",
        ...buildMenuChromeRootStyle(
          effectiveMenuAppearance,
          effectiveMenuWallpaper,
          data?.resolved_menu_wallpaper || data?.style?.resolved_menu_wallpaper || null
        ),
      }
    : {
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        background: resolvedPageBackground || "#f7f6f1",
        padding: "20px 18px 32px",
      };
  const inkColor = applyMenuAppearance
    ? (appearanceTokens?.ink || appearanceTokens?.onPage || "#11211a")
    : (shellTextColor || "#11211a");
  const mutedColor = applyMenuAppearance
    ? (appearanceTokens?.muted || "#667085")
    : "#667085";
  const dividerColor = applyMenuAppearance
    ? (appearanceTokens?.divider || "rgba(18,34,28,0.08)")
    : "rgba(18,34,28,0.08)";

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
      style={canvasStyle}
      data-menu-appearance={applyMenuAppearance ? effectiveMenuAppearance : undefined}
      data-drinks-menu-canvas="true"
    >
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9333ea" }}>
          {t("menuBrowser.mode.drinks", "Drinks Menu")}
        </div>
        <h1 style={{ margin: "8px 0 6px", fontSize: 28, lineHeight: 1.1, fontWeight: 900, color: inkColor }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {restaurantProfileHref ? (
              <Link to={restaurantProfileHref} style={{ color: "inherit", textDecoration: "none" }}>
                {restaurantName}
              </Link>
            ) : restaurantName}
            <RestaurantVerificationBadge {...verificationProps} size="md" />
          </span>
        </h1>
        {addressLine ? (
          <div style={{ fontSize: 14, color: mutedColor, lineHeight: 1.45 }}>
            {directionsHref ? (
              <a href={directionsHref} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
                {addressLine}
              </a>
            ) : addressLine}
          </div>
        ) : null}
        {distanceMiles != null ? (
          <div style={{ marginTop: 6, fontSize: 13, color: mutedColor }}>
            {distanceMiles.toFixed(1)} mi away
          </div>
        ) : null}

        <div style={{ marginTop: 10, fontSize: 13, color: mutedColor }}>
          {asStr(data?.menu_title || "Drinks Menu").trim()}
          {data?.item_count != null ? ` · ${data.item_count} beverages` : ""}
        </div>
      </header>

      {browserSections.length === 0 ? (
        <div style={{ color: mutedColor, fontSize: 14 }}>
          {t("menuCatalog.noDrinksSections", "No beverage sections are available for this restaurant yet.")}
        </div>
      ) : (
        browserSections.map((section) => (
          <DrinksBrowserCategorySection
            key={section.browser_category_id}
            section={section}
            isActiveBrowseSection={activeBrowseSection === section.browser_category_id}
            inkColor={inkColor}
            mutedColor={mutedColor}
            dividerColor={dividerColor}
          />
        ))
      )}
    </div>
  );
}
