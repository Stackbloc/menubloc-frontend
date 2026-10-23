import { useEffect, useRef } from "react";
import ShareButton from "../share/ShareButton.jsx";
import LikeMenuItemButton from "../LikeMenuItemButton.jsx";
import InviteToEatButton from "../InviteToEatButton.jsx";
import WishListMenuItemButton from "../WishListMenuItemButton.jsx";
import DishVideoCommentButton from "../comments/DishVideoCommentButton.jsx";
import DishMoreActions from "../menu/DishMoreActions.jsx";
import PreferenceIngredientAdvisory from "../menu/PreferenceIngredientAdvisory.jsx";
import MenuItemDealsIndicator from "../menu/MenuItemDealsIndicator.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../../utils/getDisplayMenuItemName.js";
import { resolveIndulgencePresentation } from "../../lib/indulgencePresentation.js";
import { itemHasInsightsData } from "../basket/ItemInsightsSheet.jsx";
import { itemHasRequiredModifiers } from "../basket/modifierModel.js";
import { buildDishShareData, menuItemDomId } from "../share/shareUtils.js";
import { getMenuItemImageUrl } from "./menuImageUtils.js";
import { MenuDesignPhotoSlot, useMenuDesignPhotoEdit } from "./MenuDesignPhotoEditOverlay.jsx";
import { normalizeMenuThemeSettings } from "./menuThemeSettings.js";
import { getNormalizedMenuItemId } from "../../lib/menuItemIdentity.js";
import { useMenuRowActions } from "../menuCatalog/menuRowActionsContext.js";
import { isOnlineOrderingAvailable } from "../../lib/restaurantStatusLight.js";
import {
  useIsTabletRange,
  useIsNarrowMenuViewport,
  resolveMenuRowSpacing,
} from "./menuPresentationUtils.js";

// Editorial (Apple-inspired) neutral palettes — isolated to editorialRefresh only.
// "light" backs the new default (Classic/v1). "dark" backs the dark color-scheme
// variant (v12) — same layout/typography system, different color tokens only.
// "steakhouse" (v13) is a warm dark palette (candlelit, brass accent) for
// upscale dining — still the same layout/typography system, colors only.
const ED_PALETTES = {
  light: { ink: "#1D1D1F", subtle: "#6E6E73", hairline: "#E5E5EA", unavailableBg: "#F5F5F7", unavailable: "#FF3B30", accentDefault: "#0071E3" },
  dark: { ink: "#F5F5F7", subtle: "#8E8E93", hairline: "#38383A", unavailableBg: "#1C1C1E", unavailable: "#FF453A", accentDefault: "#0A84FF" },
  steakhouse: { ink: "#F2E9DC", subtle: "#A89985", hairline: "#3A2F26", unavailableBg: "#221C17", unavailable: "#D97757", accentDefault: "#C9A227" },
  qsr: { ink: "#1A1A1A", subtle: "#767676", hairline: "#ECECEC", unavailableBg: "#F7F7F7", unavailable: "#E8483A", accentDefault: "#FF5A36" },
  casual: { ink: "#3A2A22", subtle: "#8A7568", hairline: "#EAE0D3", unavailableBg: "#F5EEE3", unavailable: "#C0392B", accentDefault: "#D2691E" },
  // Fine (v17) — espresso ink on warm brown page
  fine: { ink: "#2A1810", subtle: "#5C4030", hairline: "#8F6F4E", unavailableBg: "#A8825A", unavailable: "#8B2E1F", accentDefault: "#3D2314" },
};

function EditorialTag({ label, color }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color, whiteSpace: "nowrap" }}>{label}</span>
  );
}

// Muted status pill — used for the unavailable state instead of loud
// warning-colored text, per the "no loud red as the main treatment" rule.
function SoftBadge({ label, color, hairline }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        padding: "0 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 500,
        color,
        border: `1px solid ${hairline}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

/**
 * Title + icons + price. On narrow phones: title+price on row 1 (title wraps),
 * icons on row 2 — avoids truncating dish names against a fixed icon rail.
 */
function TitlePriceActionsBlock({
  stack,
  outerGap,
  iconGap,
  actionsInsetRight,
  priceMinWidth,
  titleStyle,
  title,
  price,
  priceTextStyle,
  hasDeal,
  openSheet,
  iconButtons,
}) {
  const priceEl = price ? (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        minWidth: priceMinWidth,
        justifyContent: "flex-end",
        flexShrink: 0,
      }}
    >
      <span style={priceTextStyle}>{price}</span>
      {hasDeal ? <MenuItemDealsIndicator onClick={openSheet} /> : null}
    </span>
  ) : null;

  const titleEl = <span style={titleStyle}>{title}</span>;

  const iconsRow = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: iconGap,
        flexShrink: 0,
        flexWrap: "wrap",
        paddingRight: actionsInsetRight,
      }}
    >
      {iconButtons}
      {!stack ? priceEl : null}
    </div>
  );

  if (stack) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: outerGap, minWidth: 0 }}>
          {titleEl}
          {priceEl}
        </div>
        {iconsRow}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: outerGap, minWidth: 0 }}>
      {titleEl}
      {iconsRow}
    </div>
  );
}

function AffordancePillButton({ label, color, hairline, hoverBg, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 10px",
        borderRadius: 999,
        border: `1px solid ${hairline}`,
        background: "transparent",
        color,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
        flexShrink: 0,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (hoverBg) e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {label}
    </button>
  );
}

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
        color,
        border: border || "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function getCartItemStateForItem(cartItems, menuItemId) {
  const matchingLines = (Array.isArray(cartItems) ? cartItems : []).filter(
    (line) => Number(line?.menuItemId) === Number(menuItemId)
  );
  const simpleLine =
    matchingLines.find(
      (line) =>
        (!Array.isArray(line?.modifiers) || line.modifiers.length === 0) &&
        !String(line?.preparationInstructions || line?.specialInstructions || "").trim()
    ) || null;

  return {
    matchingLines,
    simpleLine,
    totalQuantity: matchingLines.reduce((sum, line) => sum + Number(line?.quantity || 0), 0),
    simpleQuantity: simpleLine ? Number(simpleLine.quantity || 0) : 0,
  };
}

function isItemOrderable(item, getConsumerDisplayPrice) {
  return (getConsumerDisplayPrice(item) ?? 0) > 0;
}


/**
 * Shared data-driven item surface for all menu templates (presentation variants only).
 * @param {"classic"|"cinematic"|"takeout"} density
 */
export default function PublicMenuItemCard({
  density = "classic",
  showImage = true,
  compactActions = false,
  // Isolated Apple-inspired redesign variant (Classic/v1 default + v12 dark scheme).
  // Additive-only: does not alter any density or compactActions branch below.
  editorialRefresh = false,
  editorialColorScheme = "light",
  it,
  sIdx,
  iIdx,
  language,
  t,
  data,
  restaurantName,
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
  brand,
  menuThemeSettings = {},
}) {
  const themeSettings = normalizeMenuThemeSettings(menuThemeSettings);
  const {
    hideDishShare,
    tapRowToAdd,
    onRemoveOne,
    isScrollTap,
    onOpenOptions,
    onCannotOrder,
    nonOrderableOpensDish,
    keepNutritionChip,
  } = useMenuRowActions();
  const accent = brand?.accent ?? (editorialRefresh ? (ED_PALETTES[editorialColorScheme]?.accentDefault || ED_PALETTES.light.accentDefault) : "#22C55E");
  const onAccent = brand?.onAccent ?? "#0B0F0C";
  const softBg = brand?.accentSoftBg ?? "rgba(34,197,94,0.12)";
  const softBorder = brand?.accentBorder ?? "rgba(34,197,94,0.32)";
  const normalizedItemId = getNormalizedMenuItemId(it);
  const itemKey = String(normalizedItemId ?? `${sIdx}-${iIdx}`);
  const name = getDisplayMenuItemName(it, language, "Item");
  const desc = String(
    getLocalizedField(it, "description", language) ||
      getLocalizedField(it, "notes", language) ||
      it?.description ||
      it?.notes ||
      ""
  ).trim();
  const price = fmtMoney(it);
  const imageUrlRaw = getMenuItemImageUrl(it);
  const designEdit = useMenuDesignPhotoEdit();
  const itemSlotKey = String(it?.menu_item_id ?? it?.id ?? `${sIdx}-${iIdx}`);
  const stockHidden = designEdit?.enabled && designEdit.isStockHidden?.(itemSlotKey);
  const imageUrl = stockHidden ? "" : imageUrlRaw;
  const imageObjectFit = designEdit?.enabled ? designEdit.getSlotFit?.(itemSlotKey) || "cover" : "cover";
  const isStockImage = Boolean(imageUrl && !it?.photo_id && !it?.public_menu_item_id);
  const canNavigate = normalizedItemId != null;
  const indulgencePresentation = resolveIndulgencePresentation({ chips: it?.chips });
  const nutritionChip = it?.chips?.nutrition_chip || null;
  const hasNutritionData = !!(
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
  );
  const hasAllergenData = !!(
    nutritionChip &&
    (
      (Array.isArray(nutritionChip.allergens) && nutritionChip.allergens.length > 0) ||
      String(nutritionChip.allergen_alert || "").trim()
    )
  );
  // Menu Browser: a dish tap orders, so no Nutrition chip that leaves the menu for the detail page.
  // Restaurant menus keep it — it's their way to the dish page now that a tap adds (protected action).
  const showNutritionInline =
    (!tapRowToAdd || keepNutritionChip) &&
    themeSettings.nutrition_display !== "hidden" &&
    themeSettings.intelligence_density !== "none" &&
    (hasNutritionData || itemHasInsightsData(it));
  const showAllergenInline = false;
  const showIndulgenceInline =
    themeSettings.indulgence_display !== "hidden" &&
    indulgencePresentation &&
    themeSettings.intelligence_density !== "none" &&
    (themeSettings.intelligence_density === "standard" ||
      themeSettings.intelligence_density === "detailed" ||
      themeSettings.intelligence_density === "functional");
  const deal = normalizedItemId != null ? dealMap.get(normalizedItemId) : undefined;
  const hasDeal = !!deal;
  const itemIsOrderable = isItemOrderable(it, getConsumerDisplayPrice);
  const restaurantOrderingAvailable = isOnlineOrderingAvailable(data);
  const canAddToOrder = restaurantOrderingAvailable && itemIsOrderable;
  const dishShareData = canNavigate
    ? buildDishShareData({
        restaurant: {
          id: currentRestaurantId,
          slug: data?.slug || null,
          name: restaurantName,
          city: data?.city || null,
          state: data?.state || null,
          logoUrl: data?.logo_url || null,
        },
        menuItem: { ...it, id: normalizedItemId, name },
      })
    : null;
  const featuredMenuItemId =
    data?.featured_item?.id ?? data?.featured_menu_item_id ?? null;
  const isFeaturedDish =
    featuredMenuItemId != null &&
    normalizedItemId != null &&
    String(normalizedItemId) === String(featuredMenuItemId);
  const cartState = getCartItemStateForItem(activeCartItems, normalizedItemId);
  const inCartCount = cartState.totalQuantity;
  const isTablet = useIsTabletRange();
  const isNarrowMenu = useIsNarrowMenuViewport();
  const rowSpacing = resolveMenuRowSpacing(isNarrowMenu);
  const ed = ED_PALETTES[editorialColorScheme] || ED_PALETTES.light;
  // Cap descriptive badges at 2 (editorialRefresh only) so the row never shows
  // a wall of tags. Priority: featured dish, unavailability, deal, then diet flags.
  const visibleBadges = editorialRefresh
    ? [
        isFeaturedDish
          ? { key: "featured", label: t("menu.featuredDish", "Featured Dish"), color: accent, soft: true }
          : null,
        !itemIsOrderable ? { key: "unavailable", label: t("common.unavailable", "Unavailable"), color: ed.subtle, soft: true } : null,
        hasDeal ? { key: "deal", label: t("common.deals", "Deals"), color: accent } : null,
        it?.is_vegan ? { key: "vegan", label: t("diet.vegan", "Vegan"), color: ed.subtle } : null,
        it?.is_gluten_free ? { key: "gf", label: "GF", color: ed.subtle } : null,
      ].filter(Boolean).slice(0, 2)
    : null;

  const pad = editorialRefresh
    ? isTablet ? "18px 0" : "16px 0"
    : density === "cinematic" ? "14px 16px" :
      density === "takeout" ? "8px 12px" :
      density === "bold-casual" ? "12px 16px" :
      density === "refined-editorial" ? "14px 0" :
      compactActions ? "10px 14px" :
      "12px 16px";
  const radius = editorialRefresh
    ? 0
    : density === "cinematic" ? 20 :
      density === "takeout" ? 12 :
      density === "refined-editorial" ? 0 :
      density === "bold-casual" ? 14 :
      18;
  const titleSize = editorialRefresh
    ? 17
    : density === "cinematic" ? 17 : density === "bold-casual" ? 16 : density === "refined-editorial" ? 15 : 15;
  const descSize = editorialRefresh
    ? 14
    : density === "cinematic" ? 13 : density === "takeout" ? 11 : density === "refined-editorial" ? 13 : 12;

  function openSheet() {
    setItemSheet({
      item: it,
      name,
      desc,
      price,
      hasDeal,
      dishShareData,
      canNavigate,
      indulgencePresentation,
    });
  }

  function openMenuItemDetail() {
    if (!canNavigate || !navigate) return;
    navigate(`/menu-items/${normalizedItemId}?from=menu`);
  }

  function addItemToOrder(e) {
    e?.stopPropagation?.();
    if (!canAddToOrder) return;
    if (itemHasRequiredModifiers(it)) {
      // Menu Browser: go straight to the options picker (part of ordering), not the info sheet.
      if (tapRowToAdd && onOpenOptions) onOpenOptions(it, name, desc);
      else openSheet();
      return;
    }
    commitMenuItemToBasket(it, name, desc);
    setAddedConfirmation({ itemId: normalizedItemId, name });
  }

  // Menu Browser: press and hold a dish already in the basket to remove one (Andre, 2026-10-12).
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(null);
  const suppressClickRef = useRef(false);
  const holdToRemove = Boolean(tapRowToAdd && onRemoveOne && inCartCount > 0);
  function clearHold() {
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    holdStartRef.current = null;
  }
  useEffect(() => clearHold, []);
  const holdHandlers = tapRowToAdd
    ? {
        onPointerDown: (e) => {
          clearHold();
          if (!holdToRemove || (e.button != null && e.button !== 0)) return;
          holdStartRef.current = { x: e.clientX, y: e.clientY };
          holdTimerRef.current = window.setTimeout(() => {
            holdTimerRef.current = null;
            suppressClickRef.current = true;
            try { navigator.vibrate?.(15); } catch { /* unsupported */ }
            onRemoveOne(normalizedItemId, name);
          }, 550);
        },
        onPointerMove: (e) => {
          const start = holdStartRef.current;
          if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) clearHold();
        },
        onPointerUp: clearHold,
        onPointerLeave: clearHold,
        onPointerCancel: clearHold,
        onContextMenu: (e) => {
          if (holdToRemove) e.preventDefault();
        },
      }
    : null;

  // No per-row "+" anywhere (Andre, 2026-10-21): an orderable dish is added by tapping it.

  return (
    <div
      key={itemKey}
      id={menuItemDomId(normalizedItemId) || undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (tapRowToAdd) {
            if (canAddToOrder) addItemToOrder();
            else if (nonOrderableOpensDish && canNavigate) openMenuItemDetail();
            else if (onCannotOrder) onCannotOrder(restaurantOrderingAvailable ? "dish" : "restaurant");
            else openSheet();
            return;
          }
          if (canNavigate) {
            openMenuItemDetail();
            return;
          }
          if (itemHasInsightsData(it)) openSheet();
        }
      }}
      onMouseEnter={() => {
        if (inCartCount > 0) setHoveredItemId(normalizedItemId);
      }}
      onMouseLeave={() => setHoveredItemId(null)}
      {...holdHandlers}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        if (tapRowToAdd) {
          // Menu Browser: a tap that ends a scroll is not a selection.
          if (isScrollTap?.()) return;
          // Orderable → basket. Otherwise: restaurant menu pages open the dish page
          // (nonOrderableOpensDish); the Menu Browser shows a short note and never leaves the menu.
          if (canAddToOrder) addItemToOrder();
          else if (nonOrderableOpensDish && canNavigate) openMenuItemDetail();
          else if (onCannotOrder) onCannotOrder(restaurantOrderingAvailable ? "dish" : "restaurant");
          else openSheet();
          return;
        }
        if (canNavigate) {
          openMenuItemDetail();
          return;
        }
        if (itemHasInsightsData(it)) openSheet();
      }}
      style={{
        border: editorialRefresh
          ? "none"
          : density === "refined-editorial"
            ? inCartCount > 0 ? `1px solid ${softBorder}` : "none"
            : density === "bold-casual"
              ? inCartCount > 0 ? `1px solid ${softBorder}` : "none"
              : density === "classic"
                ? inCartCount > 0 ? `1px solid ${softBorder}` : compactActions ? "1px solid rgba(255,255,255,0.07)" : "1px solid #252F3D"
                : inCartCount > 0 ? `1px solid ${softBorder}` : "1px solid var(--gb-color-border)",
        borderBottom: editorialRefresh ? `1px solid ${ed.hairline}` : undefined,
        borderLeft: density === "bold-casual" ? `4px solid ${accent}` : undefined,
        borderRadius: radius,
        background: editorialRefresh
          ? (!itemIsOrderable ? ed.unavailableBg : inCartCount > 0 ? `${accent}0D` : "transparent")
          : density === "refined-editorial"
            ? inCartCount > 0 ? softBg : "transparent"
            : !itemIsOrderable
              ? "#121A14"
              : inCartCount > 0
                ? softBg
                : "var(--gb-color-surface-strong)",
        padding: pad,
        boxShadow: editorialRefresh
          ? "none"
          : density === "cinematic" ? "0 8px 28px rgba(0,0,0,0.35)" :
          density === "classic" ? (compactActions ? "0 1px 4px rgba(0,0,0,0.20)" : "0 2px 12px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.18)") :
          "var(--gb-shadow-card)",
        cursor: "pointer",
        ...(tapRowToAdd ? { WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" } : null),
        opacity: itemIsOrderable ? 1 : 0.78,
        transition: "background 120ms ease, border-color 120ms ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ display: "flex", gap: imageUrl || designEdit?.enabled ? 12 : 0, alignItems: imageUrl || designEdit?.enabled ? "flex-start" : "baseline" }}>
        {(showImage && imageUrl) || designEdit?.enabled ? (
          <MenuDesignPhotoSlot
            enabled={Boolean(designEdit?.enabled)}
            slotKey={itemSlotKey}
            kind="item"
            imageUrl={imageUrl || ""}
            isStock={isStockImage || Boolean(stockHidden)}
            objectFit={imageObjectFit}
            onReplaceFile={(file) => designEdit.replaceItemPhoto(it, file)}
            onDelete={() => designEdit.deleteItemPhoto(it)}
            onFitChange={(fit) => designEdit.setSlotFit(itemSlotKey, fit)}
            onRestoreStock={() => designEdit.restoreStock(itemSlotKey, imageUrlRaw)}
            style={editorialRefresh ? {
              width: 74,
              height: 74,
              borderRadius: 10,
              overflow: "hidden",
              flexShrink: 0,
              background: ed.unavailableBg,
              marginTop: 2,
            } : {
              width: density === "cinematic" ? 115 : 83,
              height: density === "cinematic" ? 83 : 83,
              borderRadius: density === "refined-editorial" ? 14 : 12,
              overflow: "hidden",
              flexShrink: 0,
              background: "#0f1720",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              marginTop: 2,
            }}
          >
            {showImage && imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: imageObjectFit,
                  display: "block",
                }}
              />
            ) : designEdit?.enabled ? (
              <div style={{ width: "100%", height: "100%", background: "rgba(148,163,184,0.25)" }} />
            ) : null}
          </MenuDesignPhotoSlot>
        ) : null}
        <div style={{ minWidth: 0, flex: 1 }}>
          {editorialRefresh ? (
            <TitlePriceActionsBlock
              stack={rowSpacing.stackTitleAndActions}
              outerGap={rowSpacing.outerGap}
              iconGap={rowSpacing.iconGap}
              actionsInsetRight={rowSpacing.actionsInsetRight}
              priceMinWidth={rowSpacing.priceMinWidth}
              title={name}
              titleStyle={{
                fontSize: titleSize,
                fontWeight: 600,
                color: ed.ink,
                lineHeight: 1.3,
                minWidth: 0,
                flex: 1,
                overflowWrap: rowSpacing.stackTitleAndActions ? "anywhere" : undefined,
              }}
              price={price}
              priceTextStyle={{
                fontSize: titleSize,
                fontWeight: 600,
                color: ed.ink,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                textAlign: "right",
              }}
              hasDeal={hasDeal}
              openSheet={openSheet}
              iconButtons={
                <>
                  {canNavigate ? (
                    <WishListMenuItemButton
                      menuItemId={normalizedItemId}
                      menuItemName={name}
                      restaurantId={currentRestaurantId}
                      restaurantName={restaurantName}
                    />
                  ) : null}
                  {canNavigate ? (
                    <LikeMenuItemButton menuItemId={normalizedItemId} tone="ghost" size="row" />
                  ) : null}
                  <InviteToEatButton
                    restaurantId={currentRestaurantId}
                    restaurantName={restaurantName}
                    menuItemId={canNavigate ? normalizedItemId : null}
                    menuItemName={name}
                    tone="ghost"
                    size="row"
                  />
                  <DishMoreActions
                    dishName={name}
                    items={[
                      dishShareData && !hideDishShare
                        ? {
                            key: "share",
                            label: "Share",
                            node: (
                              <ShareButton
                                variant="dish"
                                iconOnly={true}
                                tone="ghost"
                                shareData={dishShareData}
                                analyticsContext={{
                                  restaurantId: currentRestaurantId,
                                  restaurantSlug: data?.slug || null,
                                  menuItemId: normalizedItemId,
                                  menuItemName: name,
                                  pageType: "public_menu",
                                  shareTarget: "dish",
                                }}
                              />
                            ),
                          }
                        : null,
                      canNavigate
                        ? {
                            key: "video-comment",
                            label: "Comment with a video",
                            node: (
                              <DishVideoCommentButton
                                menuItemId={normalizedItemId}
                                menuItemName={name}
                                restaurantId={currentRestaurantId}
                                tone="ghost"
                                size="row"
                              />
                            ),
                          }
                        : null,
                    ]}
                  />
                </>
              }
            />
          ) : compactActions ? (
            <TitlePriceActionsBlock
              stack={rowSpacing.stackTitleAndActions}
              outerGap={rowSpacing.outerGap}
              iconGap={rowSpacing.iconGap}
              actionsInsetRight={rowSpacing.actionsInsetRight}
              priceMinWidth={rowSpacing.priceMinWidth}
              title={name}
              titleStyle={{
                fontSize: titleSize,
                fontWeight: density === "cinematic" || density === "bold-casual" ? 800 : density === "classic" ? 700 : 600,
                color: "#FFFFFF",
                lineHeight: 1.2,
                minWidth: 0,
                flex: 1,
                overflow: rowSpacing.stackTitleAndActions ? "visible" : "hidden",
                textOverflow: rowSpacing.stackTitleAndActions ? undefined : "ellipsis",
                whiteSpace: rowSpacing.stackTitleAndActions
                  ? "normal"
                  : density === "takeout"
                    ? "nowrap"
                    : "normal",
                overflowWrap: rowSpacing.stackTitleAndActions ? "anywhere" : undefined,
              }}
              price={price}
              priceTextStyle={{
                fontSize: titleSize,
                fontWeight: 700,
                color: accent,
                whiteSpace: "nowrap",
                textAlign: "right",
              }}
              hasDeal={hasDeal}
              openSheet={openSheet}
              iconButtons={
                <>
                  {canNavigate ? (
                    <WishListMenuItemButton
                      menuItemId={normalizedItemId}
                      menuItemName={name}
                      restaurantId={currentRestaurantId}
                      restaurantName={restaurantName}
                    />
                  ) : null}
                  {canNavigate ? (
                    <LikeMenuItemButton menuItemId={normalizedItemId} tone="ghost" size="row" />
                  ) : null}
                  <InviteToEatButton
                    restaurantId={currentRestaurantId}
                    restaurantName={restaurantName}
                    menuItemId={canNavigate ? normalizedItemId : null}
                    menuItemName={name}
                    tone="ghost"
                    size="row"
                  />
                  <DishMoreActions
                    dishName={name}
                    items={[
                      dishShareData && !hideDishShare
                        ? {
                            key: "share",
                            label: "Share",
                            node: (
                              <ShareButton
                                variant="dish"
                                iconOnly={true}
                                tone="ghost"
                                shareData={dishShareData}
                                analyticsContext={{
                                  restaurantId: currentRestaurantId,
                                  restaurantSlug: data?.slug || null,
                                  menuItemId: normalizedItemId,
                                  menuItemName: name,
                                  pageType: "public_menu",
                                  shareTarget: "dish",
                                }}
                              />
                            ),
                          }
                        : null,
                      canNavigate
                        ? {
                            key: "video-comment",
                            label: "Comment with a video",
                            node: (
                              <DishVideoCommentButton
                                menuItemId={normalizedItemId}
                                menuItemName={name}
                                restaurantId={currentRestaurantId}
                                tone="ghost"
                                size="row"
                              />
                            ),
                          }
                        : null,
                    ]}
                  />
                </>
              }
            />
          ) : (
            <TitlePriceActionsBlock
              stack={rowSpacing.stackTitleAndActions}
              outerGap={rowSpacing.outerGap}
              iconGap={rowSpacing.iconGap}
              actionsInsetRight={rowSpacing.actionsInsetRight}
              priceMinWidth={rowSpacing.priceMinWidth}
              title={name}
              titleStyle={{
                fontSize: titleSize,
                fontWeight: density === "cinematic" || density === "bold-casual" ? 800 : density === "classic" ? 700 : 600,
                color: "#FFFFFF",
                lineHeight: 1.2,
                minWidth: 0,
                flex: 1,
                overflow: rowSpacing.stackTitleAndActions ? "visible" : "hidden",
                textOverflow: rowSpacing.stackTitleAndActions ? undefined : "ellipsis",
                whiteSpace: rowSpacing.stackTitleAndActions
                  ? "normal"
                  : density === "takeout"
                    ? "nowrap"
                    : "normal",
                overflowWrap: rowSpacing.stackTitleAndActions ? "anywhere" : undefined,
              }}
              price={price}
              priceTextStyle={{
                fontSize: titleSize,
                fontWeight: 700,
                color: accent,
                whiteSpace: "nowrap",
                textAlign: "right",
              }}
              hasDeal={hasDeal}
              openSheet={openSheet}
              iconButtons={
                <>
                  {canNavigate ? (
                    <WishListMenuItemButton
                      menuItemId={normalizedItemId}
                      menuItemName={name}
                      restaurantId={currentRestaurantId}
                      restaurantName={restaurantName}
                    />
                  ) : null}
                  {canNavigate ? (
                    <LikeMenuItemButton menuItemId={normalizedItemId} tone="ghost" size="row" />
                  ) : null}
                  <InviteToEatButton
                    restaurantId={currentRestaurantId}
                    restaurantName={restaurantName}
                    menuItemId={canNavigate ? normalizedItemId : null}
                    menuItemName={name}
                    tone="ghost"
                    size="row"
                  />
                  <DishMoreActions
                    dishName={name}
                    items={[
                      dishShareData && !hideDishShare
                        ? {
                            key: "share",
                            label: "Share",
                            node: (
                              <ShareButton
                                variant="dish"
                                iconOnly={true}
                                tone="ghost"
                                shareData={dishShareData}
                                analyticsContext={{
                                  restaurantId: currentRestaurantId,
                                  restaurantSlug: data?.slug || null,
                                  menuItemId: normalizedItemId,
                                  menuItemName: name,
                                  pageType: "public_menu",
                                  shareTarget: "dish",
                                }}
                              />
                            ),
                          }
                        : null,
                      canNavigate
                        ? {
                            key: "video-comment",
                            label: "Comment with a video",
                            node: (
                              <DishVideoCommentButton
                                menuItemId={normalizedItemId}
                                menuItemName={name}
                                restaurantId={currentRestaurantId}
                                tone="ghost"
                                size="row"
                              />
                            ),
                          }
                        : null,
                    ]}
                  />
                </>
              }
            />
          )}

          {(editorialRefresh ? visibleBadges.length > 0 : (hasDeal || it?.is_vegan || it?.is_gluten_free || !itemIsOrderable)) || inCartCount > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: editorialRefresh ? 8 : 6, flexWrap: "wrap", marginTop: 6 }}>
              {inCartCount > 0 ? (
                hoveredItemId === normalizedItemId ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(cartState.simpleLine?.lineId);
                      setHoveredItemId(null);
                    }}
                    style={editorialRefresh ? {
                      fontSize: 12,
                      fontWeight: 500,
                      color: ed.unavailable,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    } : {
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fca5a5",
                      background: "#1c0a0a",
                      borderRadius: 999,
                      padding: "2px 7px",
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    × Remove from basket
                  </button>
                ) : (
                  <span
                    style={editorialRefresh ? {
                      fontSize: 12,
                      fontWeight: 500,
                      color: accent,
                      whiteSpace: "nowrap",
                    } : {
                      fontSize: 11,
                      fontWeight: 700,
                      color: onAccent,
                      background: accent,
                      borderRadius: 999,
                      padding: "2px 7px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {inCartCount} in order
                  </span>
                )
              ) : null}
              {editorialRefresh ? (
                visibleBadges.map((b) => (
                  b.soft
                    ? <SoftBadge key={b.key} label={b.label} color={b.color} hairline={ed.hairline} />
                    : <EditorialTag key={b.key} label={b.label} color={b.color} />
                ))
              ) : (
                <>
                  {isFeaturedDish ? (
                    <Badge
                      label={t("menu.featuredDish", "Featured Dish")}
                      bg={softBg}
                      color={accent}
                      border={`1px solid ${softBorder}`}
                    />
                  ) : null}
                  {!itemIsOrderable ? <Badge label="Unavailable" bg="#1c1208" color="#fb923c" border="1px solid #431407" /> : null}
                  {hasDeal && (
                    <Badge
                      label={t("common.deals", "Deals")}
                      bg={softBg}
                      color={accent}
                      border={`1px solid ${softBorder}`}
                    />
                  )}
                  {it?.is_vegan && (
                    <Badge
                      label={t("diet.vegan", "Vegan")}
                      bg={softBg}
                      color={accent}
                      border={`1px solid ${softBorder}`}
                    />
                  )}
                  {it?.is_gluten_free && <Badge label="GF" bg="#1c1a0a" color="#FCD34D" border="1px solid #44400a" />}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {desc ? (
        <div style={{
          marginTop: editorialRefresh ? 4 : density === "classic" ? 4 : 3,
          fontSize: descSize,
          color: editorialRefresh ? ed.subtle : density === "classic" ? "rgba(156,163,175,0.82)" : "#9CA3AF",
          lineHeight: 1.4,
          ...(editorialRefresh ? {
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          } : null),
        }}>{desc}</div>
      ) : null}

      <PreferenceIngredientAdvisory
        item={it}
        tone={editorialRefresh && (editorialColorScheme === "light" || editorialColorScheme === "qsr" || editorialColorScheme === "fine" || editorialColorScheme === "casual") ? "light" : "dark"}
        style={{ marginTop: editorialRefresh ? 6 : 5, fontSize: 12 }}
      />

      {density !== "takeout" && (showNutritionInline || showAllergenInline || showIndulgenceInline) ? (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: editorialRefresh ? 10 : 8, flexWrap: "wrap" }}>
          {showNutritionInline ? (
            editorialRefresh ? (
              <AffordancePillButton
                label={t("common.nutrition", "Nutrition")}
                color={ed.subtle}
                hairline={ed.hairline}
                hoverBg={ed.unavailableBg}
                onClick={(e) => {
                  e.stopPropagation();
                  const navId = normalizedItemId;
                  if (navId && navigate) navigate(`/menu-items/${navId}?from=menu`);
                }}
              />
            ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const navId = normalizedItemId;
                if (navId && navigate) navigate(`/menu-items/${navId}?from=menu`);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: compactActions ? 16 : 18,
                padding: "0 7px",
                borderRadius: 999,
                fontSize: compactActions ? 9.5 : 10,
                fontWeight: 800,
                letterSpacing: 0.3,
                background: compactActions ? "transparent" : softBg,
                color: compactActions ? "rgba(255,255,255,0.38)" : accent,
                border: compactActions ? "1px solid rgba(255,255,255,0.14)" : `1px solid ${softBorder}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              {t("common.nutrition", "Nutrition")}
            </button>
            )
          ) : null}
          {showIndulgenceInline && indulgencePresentation?.indulgence?.score != null ? (
            editorialRefresh ? (
              <SoftBadge label={`Indulgence ${indulgencePresentation.indulgence.score}`} color={ed.subtle} hairline={ed.hairline} />
            ) : (
              <Badge
                label={`Indulgence ${indulgencePresentation.indulgence.score}`}
                bg={softBg}
                color={accent}
                border={`1px solid ${softBorder}`}
              />
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
