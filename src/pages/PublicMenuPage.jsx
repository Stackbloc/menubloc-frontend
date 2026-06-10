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
 *   Unified browse + order experience: tapping any item opens an
 *   ItemDetailSheet where the user can add to their order.
 *   No View/Order toggle — ordering is always accessible.
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { getLocalizedField } from "../utils/getLocalizedField.js";
import BasketSummaryBar from "../components/basket/BasketSummaryBar.jsx";
import IndulgenceMeter from "../components/IndulgenceMeter.jsx";
import ModifierSheet from "../components/basket/ModifierSheet.jsx";
import { itemHasRequiredModifiers } from "../components/basket/modifierModel.js";
import { itemHasInsightsData } from "../components/basket/ItemInsightsSheet.jsx";
import ShareButton from "../components/share/ShareButton.jsx";
import MenuItemInsightsPanel from "../components/MenuItemInsightsPanel.jsx";
import { formatMoney, getBaseMenuPrice, getConsumerDisplayPrice } from "../lib/pricingDisplay.js";
import {
  applyDocumentSocialMetadata,
  buildCanonicalMenuPath,
  buildMenuShareMetadata,
} from "../components/share/shareUtils.js";
import BottomNav from "../components/BottomNav.jsx";

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
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import PublicMenuMainContent from "../components/menu-templates/PublicMenuMainContent.jsx";
import { normalizeMenuStyle, pickHeroImageUrl } from "../components/menu-templates/menuPresentationUtils.js";
import { buildRestaurantMenuBrand, fontStackForPreset } from "../components/menu-templates/restaurantMenuBrand.js";
import { normalizeMenuThemeSettings } from "../components/menu-templates/menuThemeSettings.js";
import { MENU_TEMPLATE_PREVIEW_SAMPLE } from "../data/menuTemplatePreviewSample.js";
import { itemPassesDietFilter } from "../hooks/useDietPreferences";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { toConsumerErrorMessage } from "../lib/api.js";
import { trackRestaurantView } from "../lib/analytics.js";
import { sendPageVisit } from "../lib/analyticsPageVisitSend.js";
import TasteIndexBadge from "../components/TasteIndexBadge.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:3001" : "")).replace(/\/$/, "");

/* ---- Utilities ---- */

function asStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function fmtMoney(item) {
  const cents = getConsumerDisplayPrice(item);
  return cents != null ? formatMoney(cents) : "";
}

const formatMoneyFromCents = formatMoney;

function IndulgenceInline({ presentation }) {
  if (!presentation?.indulgence) return null;

  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 12px",
        borderRadius: 14,
        background: "linear-gradient(135deg, rgba(255,247,237,1), rgba(255,255,255,1))",
        border: "1px solid rgba(249,115,22,0.16)",
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2410c", marginBottom: 6 }}>
        {presentation.verdict || "Indulgent"}
      </div>
      <IndulgenceMeter indulgence={presentation.indulgence} />
      {presentation.interpretation ? (
        <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.45, color: "#7c2d12", fontWeight: 700 }}>
          {presentation.interpretation}
        </div>
      ) : null}
    </div>
  );
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

const ALLERGEN_PROFILE_TO_EVIDENCE = {
  peanuts:   ["peanuts"],
  tree_nuts: ["tree nuts"],
  dairy:     ["dairy"],
  gluten:    ["wheat", "gluten"],
  shellfish: ["shellfish"],
  soy:       ["soy"],
  eggs:      ["eggs", "egg"],
  fish:      ["fish"],
  sesame:    ["sesame"],
  wheat:     ["wheat"],
};

function itemFailsAllergenFilter(item, enabledAllergenKeys) {
  if (!enabledAllergenKeys || enabledAllergenKeys.size === 0) return false;
  const chip = item?.chips?.nutrition_chip || {};
  const evidence = new Set([
    ...(Array.isArray(chip.allergens) ? chip.allergens : []),
    ...(Array.isArray(chip.contains_allergens) ? chip.contains_allergens : []),
  ].map((a) => String(a || "").toLowerCase().replace(/_/g, " ").trim()));
  if (evidence.size === 0) return false;
  for (const key of enabledAllergenKeys) {
    const matches = ALLERGEN_PROFILE_TO_EVIDENCE[key] || [key.replace(/_/g, " ")];
    if (matches.some((m) => evidence.has(m))) return true;
  }
  return false;
}

function getFilteredDisplaySections(sections, dietPrefs, dealsFilter, dealMap, enabledAllergenKeys) {
  return (Array.isArray(sections) ? sections : [])
    .map((sec) => {
      const title = asStr(sec?.title || "Menu").trim() || "Menu";
      const rawItems = Array.isArray(sec?.items) ? sec.items : [];
      const items = rawItems.filter((it) => {
        if (!isDisplayableMenuItem(it)) return false;
        if (!itemPassesDietFilter(it, dietPrefs)) return false;
        if (dealsFilter && dealMap.get(it?.id) == null) return false;
        if (itemFailsAllergenFilter(it, enabledAllergenKeys)) return false;
        return true;
      });
      return { ...sec, title, items };
    })
    .filter((sec) => sec.items.length > 0);
}

function allergenKeyToLabel(key) {
  return String(key || "").replace(/_/g, " ").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function AllergenFilterBanner({ active, enabledKeys }) {
  if (!active || !enabledKeys || enabledKeys.size === 0) return null;
  const labels = [...enabledKeys].map(allergenKeyToLabel).join(", ");
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 14px",
      borderRadius: 10,
      background: "rgba(234, 179, 8, 0.08)",
      border: "1px solid rgba(234, 179, 8, 0.22)",
      color: "#92400e",
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 12,
    }}>
      <span aria-hidden="true" style={{ fontSize: 14 }}>⚠</span>
      Allergen filter active — items containing {labels} are hidden
    </div>
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
        background: "#1c1a0a",
        border: "1px solid #44400a",
        color: "#FCD34D",
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

function FranchiseLocationSheet({ locations, currentRestaurantId, brandName, onSelect, onClose, accent }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${brandName} locations`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)" }}
      />

      {/* Panel */}
      <div
        style={{
          position: "relative",
          background: "#111816",
          borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          maxHeight: "55vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8, paddingBottom: 2, flexShrink: 0 }}>
          <div style={{ width: 32, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 16px 10px",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
            {brandName}
            <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>
              · {locations.length} locations
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close locations"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "none",
              borderRadius: 999,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Location list */}
        <div style={{ overflowY: "auto", padding: "4px 0 16px" }}>
          {locations.map((loc, idx) => {
            const isCurrent = Number(loc.restaurant_id) === Number(currentRestaurantId);
            const name = asStr(loc.restaurant_name || loc.label).trim();
            const addressLine = asStr(loc.address_line || loc.address_line1 || loc.address).trim();
            const cityState = [asStr(loc.city).trim(), asStr(loc.state).trim()].filter(Boolean).join(", ");
            const secondaryLine = addressLine || cityState || null;
            const distanceMiles = Number.isFinite(Number(loc.distance_miles)) ? Number(loc.distance_miles) : null;

            return (
              <button
                key={loc.restaurant_id ?? idx}
                type="button"
                onClick={() => !isCurrent && onSelect(loc)}
                disabled={isCurrent}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 16px",
                  background: isCurrent ? "rgba(255,255,255,0.04)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  cursor: isCurrent ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: isCurrent ? 700 : 600,
                    color: isCurrent ? accent : "#FFFFFF",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {name}
                    {isCurrent ? (
                      <span style={{ marginLeft: 7, fontSize: 10, fontWeight: 700, color: accent, opacity: 0.8 }}>
                        current
                      </span>
                    ) : null}
                  </div>
                  {secondaryLine ? (
                    <div style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.38)",
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {secondaryLine}
                    </div>
                  ) : null}
                </div>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  {distanceMiles != null ? (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", fontWeight: 500 }}>
                      {distanceMiles < 0.1 ? "< 0.1 mi" : `${distanceMiles.toFixed(1)} mi`}
                    </span>
                  ) : null}
                  {!isCurrent ? (
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>›</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FranchiseBanner({ group, currentRestaurantId, onSelectLocation, brand }) {
  const accent = brand?.accent ?? "#22C55E";
  const [sheetOpen, setSheetOpen] = useState(false);
  const locations = (Array.isArray(group?.locations) ? group.locations : []).filter(
    (loc) => loc?.is_displayable !== false && loc?.restaurant_id
  );
  const currentIndex = locations.findIndex((loc) => Number(loc.restaurant_id) === Number(currentRestaurantId));
  const fallbackIndex = Number.isFinite(Number(group?.current_index)) ? Number(group.current_index) : 0;
  const resolvedIndex = currentIndex >= 0 ? currentIndex : fallbackIndex;
  const currentLocation = locations[resolvedIndex] || group?.current_location || null;
  const brandName = asStr(group?.brand_name || currentLocation?.restaurant_name).trim();
  const currentAddress = asStr(
    currentLocation?.address_line1 || currentLocation?.address_line || currentLocation?.address || currentLocation?.label
  ).trim();

  if (locations.length <= 1 || !currentLocation) return null;

  return (
    <>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
          Closest location: {currentAddress || brandName}
        </span>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontSize: 12,
            color: accent,
            fontWeight: 600,
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          See all {locations.length} locations →
        </button>
      </div>

      {sheetOpen ? (
        <FranchiseLocationSheet
          locations={locations}
          currentRestaurantId={currentRestaurantId}
          brandName={brandName}
          accent={accent}
          onSelect={(loc) => {
            setSheetOpen(false);
            onSelectLocation(loc.restaurant_id, loc.slug);
          }}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </>
  );
}

/* ---- Filter chip ---- */

function FilterChip({ label, active, onClick, fullWidth, brand }) {
  const accent = brand?.accent ?? "#22C55E";
  const onAccent = brand?.onAccent ?? "#0B0F0C";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 40,
        width: fullWidth ? "100%" : "auto",
        padding: "0 16px",
        borderRadius: 999,
        border: active ? `1.5px solid ${accent}` : "1px solid #1F2937",
        background: active ? accent : "#1A2419",
        color: active ? onAccent : "#9CA3AF",
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


function FilterDrawer({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        background: "rgba(15,23,42,0.28)",
        backdropFilter: "blur(3px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(360px, 100vw)",
          height: "100%",
          background: "#121A14",
          boxShadow: "-18px 0 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const DIET_CHIPS = [
  { key: "dairy_free",        label: "Dairy Free" },
  { key: "diabetic_friendly", label: "Diabetic Friendly" },
  { key: "gluten_free",       label: "Gluten Free" },
  { key: "keto",              label: "Keto" },
  { key: "low_fat",           label: "Low Fat" },
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

function getItemPriceCents(item) {
  return getConsumerDisplayPrice(item) ?? 0;
}

function isItemOrderable(item) {
  return getItemPriceCents(item) > 0;
}

/* ---- Item Detail Sheet ---- */

function ItemDetailSheet({
  sheetData,
  activeCartItems,
  onClose,
  onAddSimple,
  onOpenModifiers,
  onUpdateQuantity,
  onRemoveItem,
  t,
  brand,
  navigate,
}) {
  const accent = brand?.accent ?? "#22C55E";
  const accentStrong = brand?.accentStrong ?? "#16A34A";
  const onAccent = brand?.onAccent ?? "#0B0F0C";
  const softBg = brand?.accentSoftBg ?? "rgba(34,197,94,0.12)";
  const softBorder = brand?.accentBorder ?? "1px solid rgba(34,197,94,0.3)";
  const primaryGradient = `linear-gradient(180deg, ${accent} 0%, ${accentStrong} 100%)`;
  const { item, name, desc, price, hasDeal, indulgencePresentation, canNavigate } = sheetData;
  const nutritionChip = item?.chips?.nutrition_chip || null;
  const hasItemInsightsContent = !!(
    itemHasInsightsData(item) ||
    (
      nutritionChip &&
      (
        nutritionChip.calories_kcal != null ||
        nutritionChip.protein_g != null ||
        nutritionChip.fat_g != null ||
        nutritionChip.sodium_mg != null ||
        nutritionChip.sugar_g != null ||
        (Array.isArray(nutritionChip.allergens) && nutritionChip.allergens.length > 0) ||
        String(nutritionChip.allergen_alert || "").trim()
      )
    )
  );
  const hasRequiredOptions = itemHasRequiredModifiers(item);
  const canAddToOrder = isItemOrderable(item);
  const cartState = getCartItemState(activeCartItems, item?.id);
  const hasSelected = hasRequiredOptions ? cartState.totalQuantity > 0 : cartState.simpleQuantity > 0;
  const selectedQty = hasRequiredOptions ? cartState.totalQuantity : cartState.simpleQuantity;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.38)",
          zIndex: 500,
        }}
      />
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#121A14",
          borderRadius: "24px 24px 0 0",
          zIndex: 501,
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.16)",
        }}
      >
        {/* drag handle */}
        <div style={{ paddingTop: 14, paddingBottom: 6, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#374151" }} />
        </div>

        <div style={{ padding: "4px 20px 96px" }}>

          {/* Name + badges */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 21, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.2 }}>{name}</div>
            {(hasDeal || item?.is_vegan || item?.is_gluten_free) && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {hasDeal && <Badge label={t("common.deals", "Deal")} bg={softBg} color={accent} border={softBorder} />}
                {item?.is_vegan && <Badge label={t("diet.vegan", "Vegan")} bg={softBg} color={accent} border={softBorder} />}
                {item?.is_gluten_free && <Badge label="GF" bg="#1c1a0a" color="#FCD34D" border="1px solid #44400a" />}
              </div>
            )}
            {item?.id && <TasteIndexBadge menuItemId={item.id} accent={accent} />}
          </div>

          {/* Price */}
          {price ? (
            <div style={{ fontSize: 22, fontWeight: 900, color: accent, marginBottom: 14 }}>{price}</div>
          ) : null}

          {/* Description */}
          {desc ? (
            <div style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.65, marginBottom: 16 }}>{desc}</div>
          ) : null}

          {hasItemInsightsContent ? (
            <div style={{ marginBottom: 16 }}>
              <MenuItemInsightsPanel
                item={item}
                colors={{
                  panel2: "#141418",
                  border: "rgba(255,255,255,0.08)",
                  text: "rgba(255,255,255,0.92)",
                  subtext: "rgba(255,255,255,0.65)",
                  chipBg: "rgba(255,255,255,0.06)",
                }}
              />
            </div>
          ) : null}

          {!canAddToOrder ? (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 14,
                background: "#1c1a0a",
                color: "#FCD34D",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              This item is not currently available for checkout because pricing is unavailable.
            </div>
          ) : null}


          {/* Indulgence */}
          {indulgencePresentation ? <IndulgenceInline presentation={indulgencePresentation} /> : null}

          {/* Full detail page link */}
          {canNavigate && navigate ? (
            <button
              type="button"
              onClick={() => { onClose(); navigate(`/menu-items/${item.canonical_menu_item_id || item.id}?from=menu`); }}
              style={{
                display: "block",
                width: "100%",
                marginTop: 16,
                padding: "10px 0",
                background: "transparent",
                border: "none",
                color: "rgba(34,197,94,0.75)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "center",
                letterSpacing: "0.01em",
              }}
            >
              View full item details →
            </button>
          ) : null}

          {/* Add to order / quantity controls */}
          <div style={{ marginTop: 22 }}>
            {!canAddToOrder ? null : hasRequiredOptions ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { onOpenModifiers(item, name, desc); onClose(); }}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 14,
                    background: primaryGradient,
                    color: onAccent,
                    padding: "14px 20px",
                    fontSize: 15,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {hasSelected ? "Add another customized item" : "Customize to add"}
                </button>
                {hasSelected ? (
                  <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: accentStrong }}>
                    {`${selectedQty} ${selectedQty === 1 ? "custom item" : "custom items"} in order`}
                  </div>
                ) : null}
              </div>
            ) : hasSelected ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
                <button
                  type="button"
                  aria-label={`Decrease quantity for ${name}`}
                  onClick={() => {
                    const next = selectedQty - 1;
                    if (next <= 0) { onRemoveItem(cartState.simpleLine?.lineId); onClose(); }
                    else onUpdateQuantity(cartState.simpleLine?.lineId, next);
                  }}
                  style={{
                    width: 44, height: 44, borderRadius: 999,
                    border: "1px solid #1F2937",
                    background: "#1A2419", color: "#9CA3AF",
                    fontSize: 20, fontWeight: 900, cursor: "pointer",
                  }}
                >
                  −
                </button>
                <span aria-live="polite" style={{
                  minWidth: 48, textAlign: "center",
                  fontSize: 18, fontWeight: 900, color: "#FFFFFF",
                }}>
                  {selectedQty}
                </span>
                <button
                  type="button"
                  aria-label={`Increase quantity for ${name}`}
                  onClick={() => onUpdateQuantity(cartState.simpleLine?.lineId, selectedQty + 1)}
                  style={{
                    width: 44, height: 44, borderRadius: 999,
                    border: "none",
                    background: accent, color: onAccent,
                    fontSize: 20, fontWeight: 900, cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { onAddSimple(item, name, desc); onClose(); }}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 14,
                  background: primaryGradient,
                  color: onAccent,
                  padding: "14px 20px",
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Add to order
              </button>
            )}
          </div>


        </div>
      </div>
    </>
  );
}

/* ---- Added-to-order confirmation toast ---- */

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

/* ---- Main component ---- */

export default function PublicMenuPage() {
  const trackedRestaurantViewRef = useRef(new Set());
  const { language, t } = useLanguage();
  const location = useLocation();
  const isMenuTemplatePreview = location.pathname === "/menu-template-preview";
  const { id, slugOrId, restaurantSlug: routeRestaurantSlug } = useParams();
  const navigate = useNavigate();
  const routeRestaurantParam = asStr(routeRestaurantSlug || slugOrId || id).trim();
  const numericRouteRestaurantId = asFiniteNumber(routeRestaurantParam);
  const {
    addMenuItem,
    restaurant: cartRestaurantState,
    items: cartItems,
    itemCount,
    subtotalCents,
    updateQuantity,
    removeItem,
  } = useOrderCart();
  const isMobile = useIsMobile();
  const { isAuthenticated, allergenPreferences } = useConsumer();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modifierItem, setModifierItem] = useState(null);
  const [itemSheet, setItemSheet] = useState(null);
  const [addedConfirmation, setAddedConfirmation] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState(null);
  // Multi-menu tab state
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  // tabSections stores { menuId, sections } — separate from selectedMenuId so current content
  // stays visible during a background fetch for a new tab (never blank on switch).
  const [tabSections, setTabSections] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState(null);
  const userSelectedTabRef = useRef(false);
  const [resolvedRouteState, setResolvedRouteState] = useState({
    status: "loading",
    restaurantId: "",
    error: null,
  });

  const [pageState, setPageState] = useState(() => ({
    status: location.pathname === "/menu-template-preview" ? "ok" : "loading",
    data: location.pathname === "/menu-template-preview" ? MENU_TEMPLATE_PREVIEW_SAMPLE : null,
    error: null,
  }));

  const dietPrefs = {
    dairy_free:        searchParams.get("dairy_free")        === "1",
    diabetic_friendly: searchParams.get("diabetic_friendly") === "1",
    gluten_free:       searchParams.get("gluten_free")       === "1",
    keto:              searchParams.get("keto")              === "1" || searchParams.get("low_carb") === "1",
    low_fat:           searchParams.get("low_fat")           === "1" || searchParams.get("low_fat") === "true",
    low_sodium:        searchParams.get("low_sodium")        === "1",
    vegan:             searchParams.get("vegan")             === "1",
    vegetarian:        searchParams.get("vegetarian")        === "1",
  };
  const dealsFilter = searchParams.get("deals") === "1";
  const enabledAllergenKeys = useMemo(() => {
    if (!isAuthenticated || !Array.isArray(allergenPreferences)) return new Set();
    return new Set(allergenPreferences.filter((p) => p.is_enabled).map((p) => p.allergen_key));
  }, [isAuthenticated, allergenPreferences]);
  const allergenFilterActive = enabledAllergenKeys.size > 0;
  const filtersActive = Object.values(dietPrefs).some(Boolean) || dealsFilter || allergenFilterActive;
  const proximityLat = asFiniteNumber(searchParams.get("lat"));
  const proximityLng = asFiniteNumber(searchParams.get("lng"));
  const contextCity  = searchParams.get("city")  || null;
  const contextState = searchParams.get("state") || null;

  useEffect(() => {
    let cancelled = false;

    if (isMenuTemplatePreview) {
      return undefined;
    }

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
              json?.detail || json?.error || "We couldn't resolve this menu link.",
              "We couldn't resolve this menu link right now."
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
            "We couldn't resolve this menu link right now."
          ),
        });
      }
    }

    if (!routeRestaurantParam) return undefined;

    resolveRouteRestaurant();
    return () => { cancelled = true; };
  }, [numericRouteRestaurantId, routeRestaurantParam, isMenuTemplatePreview]);

  const routeState = useMemo(() => {
    if (isMenuTemplatePreview) {
      return { status: "ok", restaurantId: "0", error: null };
    }
    if (!routeRestaurantParam) {
      return {
        status: "error",
        restaurantId: "",
        error: "Missing restaurant identifier.",
      };
    }
    if (numericRouteRestaurantId != null) {
      return {
        status: "ok",
        restaurantId: String(numericRouteRestaurantId),
        error: null,
      };
    }
    return resolvedRouteState;
  }, [
    isMenuTemplatePreview,
    routeRestaurantParam,
    numericRouteRestaurantId,
    resolvedRouteState,
  ]);

  function handleTogglePref(key) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const isKeto = key === "keto";
      const isActive = isKeto
        ? next.get("keto") === "1" || next.get("low_carb") === "1"
        : next.get(key) === "1" || next.get(key) === "true";

      if (isActive) {
        next.delete(key);
        if (isKeto) next.delete("low_carb");
      } else {
        next.set(key, key === "low_fat" ? "true" : "1");
        if (isKeto) next.set("low_carb", "1");
      }
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
    if (contextCity)  params.set("city",  contextCity);
    if (contextState) params.set("state", contextState);
    if (language && language !== "en") params.set("lang", language);
    const qs = params.toString();
    return `${API}/public/restaurants/${rid}/menu${qs ? `?${qs}` : ""}`;
  }, [routeState.restaurantId, proximityLat, proximityLng, contextCity, contextState, language]);

  useEffect(() => {
    if (isMenuTemplatePreview) return;
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
  }, [proximityLat, proximityLng, setSearchParams, isMenuTemplatePreview]);

  useEffect(() => {
    let cancelled = false;

    if (isMenuTemplatePreview) return undefined;

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
            "We couldn't load this menu right now. Please try again in a moment."
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
            "We couldn't load this menu right now. Please try again in a moment."
          ),
        });
      }
    }

    run();
    return () => { cancelled = true; };
  }, [apiUrl, routeState.restaurantId, routeState.status, isMenuTemplatePreview]);

  // Set default selected menu from initial API response.
  // Only fires on first load; once the user manually picks a tab, userSelectedTabRef
  // blocks this effect from overriding their choice.
  useEffect(() => {
    const d = pageState.data;
    if (d?.selected_menu_id && !userSelectedTabRef.current) {
      setSelectedMenuId(d.selected_menu_id);
    }
  }, [pageState.data]);

  // Tab switch handler — never blanks the currently visible menu.
  // Highlights new tab immediately, fetches sections in background, swaps atomically on success.
  // On fetch failure or empty response, reverts tab highlight and shows a non-blocking message.
  const handleSelectMenu = useCallback(async (menuId) => {
    if (menuId === selectedMenuId) return;
    const prevMenuId = selectedMenuId;
    userSelectedTabRef.current = true;
    setSelectedMenuId(menuId);
    setTabError(null);
    setTabLoading(true);
    try {
      const rid = encodeURIComponent(asStr(routeState.restaurantId).trim());
      const res = await fetch(`${API}/public/restaurants/${rid}/menu?menu=${menuId}`);
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        const newSections = normalizeSections(json);
        if (newSections.length > 0) {
          setTabSections({ menuId, sections: newSections });
        } else {
          // Zero sections: preserve prior visible menu; show lightweight non-blocking message.
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
  }, [selectedMenuId, routeState.restaurantId]);

  const dealMap = useMemo(() => {
    const m = new Map();
    for (const d of pageState.data?.deal_items || []) {
      if (d.id != null) m.set(d.id, d);
    }
    return m;
  }, [pageState.data]);

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

  const data = pageState.status === "ok" ? pageState.data : null;
  const menuThemeSettings = normalizeMenuThemeSettings(data?.display_settings || data || {});
  const restaurantName = data
    ? getLocalizedField(data, "restaurant_name", language) ||
      getLocalizedField(data, "name", language) ||
      asStr(data?.restaurant_name || data?.name || `Restaurant ${id}`).trim()
    : "";
  // When multiple tabs are shown, keep the label in sync with the selected tab.
  // For single-menu restaurants fall back to the API's menu_name/menu_label.
  const _allMenus = Array.isArray(data?.menus) ? data.menus : [];
  const _activeMenu = _allMenus.length > 1 && selectedMenuId != null
    ? (_allMenus.find(m => m.id === selectedMenuId) ?? _allMenus[0])
    : null;
  const menuTypeLabel = asStr(
    (_activeMenu ? (_activeMenu.tab_label || _activeMenu.display_name || _activeMenu.name) : null) ||
    data?.menu_name ||
    data?.menu_label ||
    ""
  ).trim() || null;
  // Clock-based "now serving" label — independent of which tab the user has selected.
  // Only set when a menu with a real day+time schedule is currently active.
  const _scheduledActiveMenu = _allMenus.find(m => {
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
  // Use tabSections if a tab was explicitly switched to; fall back to initial page data.
  // tabSections?.sections may still show a prior menu's content during a background fetch —
  // this is intentional: never blank the display while waiting for a new tab to load.
  const sections        = tabSections?.sections ?? normalizeSections(data);
  const displaySections = getFilteredDisplaySections(sections, dietPrefs, dealsFilter, dealMap, enabledAllergenKeys);
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
    restaurantName,
    restaurantSlug: data?.slug || null,
    menuId: currentRestaurantId,
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
    availableFulfillmentTypes:
      Array.isArray(data?.available_fulfillment_types) && data.available_fulfillment_types.includes("delivery")
        ? data.available_fulfillment_types
        : ["pickup", "delivery"],
  };
  const hasBasketItems = itemCount > 0;
  const basketMatchesCurrentRestaurant =
    Number(cartRestaurantState?.restaurantId) === Number(cartRestaurant.restaurantId);
  const activeCartItems = basketMatchesCurrentRestaurant ? cartItems || [] : [];

  const menuBrand = data ? buildRestaurantMenuBrand({
    ...data,
    accent_color: menuThemeSettings.primary_color || menuThemeSettings.accent_color || data?.accent_color || null,
    hero_image_url: menuThemeSettings.hero_enabled === false ? null : data?.hero_image_url || null,
    font_preset: data?.font_preset || "default",
  }, restaurantName) : null;
  const pageShellStyle = {
    minHeight: "100vh",
    background:
      menuThemeSettings.background_style === "light" ? "#f7f5ef" :
      menuThemeSettings.background_style === "paper" ? "#f6efe3" :
      menuThemeSettings.background_style === "chalkboard" ? "#111111" :
      menuThemeSettings.background_style === "charcoal" ? "#0f1113" :
      menuBrand?.pageBackground ?? "#0B0F0C",
  };

  useEffect(() => {
    if (pageState.status !== "ok" || !data?.restaurant_id) return;
    const key = String(data.restaurant_id);
    if (trackedRestaurantViewRef.current.has(key)) return;
    trackedRestaurantViewRef.current.add(key);
    trackRestaurantView({
      restaurantId: data.restaurant_id,
      restaurantName,
      slug: data?.slug || routeRestaurantParam,
      source: "public_menu",
    });
    sendPageVisit({
      path: window.location.pathname + window.location.search,
      restaurant_id: Number(data.restaurant_id),
    });
  }, [pageState.status, data?.restaurant_id, data?.slug, restaurantName, routeRestaurantParam]);

  function handleRemoveAdded() {
    if (!addedConfirmation) return;
    const state = getCartItemState(activeCartItems, addedConfirmation.itemId);
    if (state.simpleLine) removeItem(state.simpleLine.lineId);
    setAddedConfirmation(null);
  }

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


  function commitMenuItemToBasket(item, itemName, itemDescription, modifiers = []) {
    return addMenuItem({
      restaurant: cartRestaurant,
      item: {
        menuItemId: item?.id,
        name: itemName,
        description: itemDescription,
        basePriceCents: getConsumerDisplayPrice(item) ?? 0,
        originalBasePriceCents: getBaseMenuPrice(item) ?? getConsumerDisplayPrice(item) ?? 0,
        modifiers,
      },
    });
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

  const menuPresentationStyle = normalizeMenuStyle(
    searchParams.get("menuStyle") || searchParams.get("previewStyle") || pageState.data?.menu_style
  );

  const franchiseSlot = franchiseGroup ? (
    <FranchiseBanner
      group={franchiseGroup}
      currentRestaurantId={currentRestaurantId}
      onSelectLocation={navigateToFranchiseLocation}
      brand={menuBrand}
    />
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
          logoUrl: data?.logo_url || null,
          shareData,
          shareAnalyticsContext,
          franchiseSlot,
          intakeBannerSlot: <IntakePreviewBanner show={isIntakePreview} />,
          allergenBannerSlot: <AllergenFilterBanner active={allergenFilterActive} enabledKeys={enabledAllergenKeys} />,
          onOpenFilters: () => setIsFilterDrawerOpen(true),
          displaySections,
          displayableItemCount,
          dealItems: data?.deal_items || [],
          filtersActive,
          handleClearFilters,
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
        }
      : null;

  if (!isMenuTemplatePreview && (routeState.status === "loading" || pageState.status === "loading")) {
    return (
      <div style={pageShellStyle}>
        <StickyPageHeader
          barBackground={menuBrand?.pageBackground}
          linkAccent={menuBrand?.accent}
          dealsPillBackground={menuBrand?.accentSoftBg}
          dealsPillBorder={menuBrand ? `1.5px solid ${menuBrand.accentBorder}` : undefined}
          logoPageColor={menuBrand?.pageBackground}
        />
        <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "16px 12px" : "28px 20px", color: "#101828" }}>
          <div style={{ fontSize: 14, color: "#667085", fontWeight: 600 }}>Loading menu…</div>
        </div>
      </div>
    );
  }

  if (!isMenuTemplatePreview && (routeState.status === "error" || pageState.status === "error")) {
    return (
      <div style={pageShellStyle}>
        <StickyPageHeader
          barBackground={menuBrand?.pageBackground}
          linkAccent={menuBrand?.accent}
          dealsPillBackground={menuBrand?.accentSoftBg}
          dealsPillBorder={menuBrand ? `1.5px solid ${menuBrand.accentBorder}` : undefined}
          logoPageColor={menuBrand?.pageBackground}
        />
        <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "14px 12px 80px" : "20px 20px 80px", color: "#101828" }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{t("publicMenu.loadError", "Couldn't load menu")}</div>
          <div style={{ color: "var(--muted, #5b6675)", fontSize: 14 }}>{routeState.error || pageState.error}</div>
        </div>
      </div>
    );
  }

  if (!templateContext) {
    return (
      <div style={pageShellStyle}>
        <StickyPageHeader
          barBackground={menuBrand?.pageBackground}
          linkAccent={menuBrand?.accent}
          dealsPillBackground={menuBrand?.accentSoftBg}
          dealsPillBorder={menuBrand ? `1.5px solid ${menuBrand.accentBorder}` : undefined}
          logoPageColor={menuBrand?.pageBackground}
        />
        <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "16px 12px" : "28px 20px", color: "#101828" }}>
          <div style={{ fontSize: 14, color: "#667085", fontWeight: 600 }}>Loading menu…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageShellStyle}>
      <StickyPageHeader
        barBackground={menuBrand?.pageBackground}
        linkAccent={menuBrand?.accent}
        dealsPillBackground={menuBrand?.accentSoftBg}
        dealsPillBorder={menuBrand ? `1.5px solid ${menuBrand.accentBorder}` : undefined}
        logoPageColor={menuBrand?.pageBackground}
      />
      <div style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: isMobile ? "16px 12px 80px" : "28px 20px 80px",
        color: "#FFFFFF",
      }}>
        {isMenuTemplatePreview ? (
          <div
            style={{
              marginBottom: 14,
              padding: "10px 12px",
              borderRadius: 12,
              background: "#1c1a0a",
              border: "1px solid #44400a",
              color: "#FCD34D",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {t(
              "menuTemplates.previewBanner",
              "Preview mode — sample data only. Use ?previewStyle=v1|v2|v3|v4|v5|v6|v7|v8|v9. On a live menu add ?menuStyle=v6."
            )}
          </div>
        ) : null}

        <PublicMenuMainContent menuStyle={menuPresentationStyle} templateContext={templateContext} />

        <FilterDrawer open={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)}>
          <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #1F2937", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#FFFFFF" }}>
              {t("common.filters", "Filters")}
            </div>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 20,
                lineHeight: 1,
                color: "#667085",
                padding: 0,
              }}
              aria-label={t("common.close", "Close")}
            >
              ×
            </button>
          </div>
          <div style={{ padding: 18, display: "grid", gap: 10, overflowY: "auto" }}>
            {DIET_CHIPS.map(({ key, label }) => (
              <FilterChip
                key={key}
                label={t(`diet.${key}`, label)}
                active={dietPrefs[key]}
                onClick={() => handleTogglePref(key)}
                fullWidth
                brand={menuBrand}
              />
            ))}
            <FilterChip
              label={t("common.deals", "Deals")}
              active={dealsFilter}
              onClick={() => handleTogglePref("deals")}
              fullWidth
              brand={menuBrand}
            />
            {filtersActive ? (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  marginTop: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#667085",
                  padding: 0,
                  textDecoration: "underline",
                  textAlign: "left",
                }}
              >
                {t("common.clearAll", "Clear all")}
              </button>
            ) : null}
          </div>
        </FilterDrawer>
      </div>

      {/* Item detail sheet */}
      {itemSheet ? (
        <ItemDetailSheet
          sheetData={itemSheet}
          activeCartItems={activeCartItems}
          onClose={() => setItemSheet(null)}
          onAddSimple={(item, name, desc) => commitMenuItemToBasket(item, name, desc)}
          onOpenModifiers={(item, name, desc) => openModifierFlow(item, name, desc)}
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

      {hasBasketItems ? (
        <BasketSummaryBar
          itemCount={itemCount}
          subtotal={subtotalCents}
          restaurantName={cartRestaurantState?.restaurantName}
          isCurrentRestaurant={basketMatchesCurrentRestaurant}
          summaryLabel={`${itemCount} ${itemCount === 1 ? "item" : "items"} • ${formatMoneyFromCents(subtotalCents)}`}
          ctaLabel="Review Order"
          onOpenBasket={() => navigate("/checkout")}
          onClear={() => { for (const line of activeCartItems) removeItem(line.lineId); }}
        />
      ) : null}

      {addedConfirmation ? (
        <AddedConfirmation
          name={addedConfirmation.name}
          onRemove={handleRemoveAdded}
          setConfirmation={setAddedConfirmation}
          brand={menuBrand}
        />
      ) : null}

      <BottomNav />
    </div>
  );
}
