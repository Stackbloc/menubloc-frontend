import ShareButton from "../share/ShareButton.jsx";
import FoodInterestButton from "../food-interests/FoodInterestButton.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../../utils/getDisplayMenuItemName.js";
import { resolveIndulgencePresentation } from "../../lib/indulgencePresentation.js";
import { itemHasInsightsData } from "../basket/ItemInsightsSheet.jsx";
import { itemHasRequiredModifiers } from "../basket/modifierModel.js";
import { buildDishShareData } from "../share/shareUtils.js";
import { getMenuItemImageUrl } from "./menuImageUtils.js";
import { normalizeMenuThemeSettings } from "./menuThemeSettings.js";

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
        !String(line?.specialInstructions || "").trim()
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
  const accent = brand?.accent ?? "#22C55E";
  const onAccent = brand?.onAccent ?? "#0B0F0C";
  const softBg = brand?.accentSoftBg ?? "rgba(34,197,94,0.12)";
  const softBorder = brand?.accentBorder ?? "rgba(34,197,94,0.32)";
  const itemKey = String(it?.id ?? `${sIdx}-${iIdx}`);
  const name = getDisplayMenuItemName(it, language, "Item");
  const desc = String(
    getLocalizedField(it, "description", language) ||
      getLocalizedField(it, "notes", language) ||
      it?.description ||
      it?.notes ||
      ""
  ).trim();
  const price = fmtMoney(it);
  const imageUrl = getMenuItemImageUrl(it);
  const canNavigate = it?.id != null;
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
  const showInsightsInline =
    themeSettings.insight_display !== "hidden" &&
    themeSettings.intelligence_density !== "none" &&
    themeSettings.intelligence_density !== "minimal" &&
    canNavigate &&
    itemHasInsightsData(it);
  const showNutritionInline =
    themeSettings.nutrition_display !== "hidden" &&
    themeSettings.intelligence_density !== "none" &&
    hasNutritionData;
  const showAllergenInline = false;
  const showIndulgenceInline =
    themeSettings.indulgence_display !== "hidden" &&
    indulgencePresentation &&
    themeSettings.intelligence_density !== "none" &&
    (themeSettings.intelligence_density === "standard" ||
      themeSettings.intelligence_density === "detailed" ||
      themeSettings.intelligence_density === "functional");
  const deal = it?.id != null ? dealMap.get(it.id) : undefined;
  const hasDeal = !!deal;
  const itemIsOrderable = isItemOrderable(it, getConsumerDisplayPrice);
  const dishShareData = canNavigate
    ? buildDishShareData({
        restaurant: {
          id: currentRestaurantId,
          slug: data?.slug || null,
          name: restaurantName,
          logoUrl: data?.logo_url || null,
        },
        menuItem: { ...it, id: it.id, name },
      })
    : null;
  const cartState = getCartItemStateForItem(activeCartItems, it?.id);
  const inCartCount = cartState.totalQuantity;

  const pad =
    density === "cinematic" ? "14px 16px" :
    density === "takeout" ? "8px 12px" :
    density === "bold-casual" ? "12px 16px" :
    density === "refined-editorial" ? "14px 0" :
    "12px 16px";
  const radius =
    density === "cinematic" ? 20 :
    density === "takeout" ? 12 :
    density === "refined-editorial" ? 0 :
    density === "bold-casual" ? 14 :
    18;
  const titleSize = density === "cinematic" ? 17 : density === "bold-casual" ? 16 : density === "refined-editorial" ? 15 : 15;
  const descSize = density === "cinematic" ? 13 : density === "takeout" ? 11 : density === "refined-editorial" ? 13 : 12;

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

  return (
    <div
      key={itemKey}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!itemIsOrderable) {
            if (canNavigate && itemHasInsightsData(it)) openSheet();
            return;
          }
          if (itemHasRequiredModifiers(it)) openSheet();
          else {
            commitMenuItemToBasket(it, name, desc);
            setAddedConfirmation({ itemId: it.id, name });
          }
        }
      }}
      onMouseEnter={() => {
        if (inCartCount > 0) setHoveredItemId(it.id);
      }}
      onMouseLeave={() => setHoveredItemId(null)}
      onClick={() => {
        if (!itemIsOrderable) {
          if (canNavigate && itemHasInsightsData(it)) openSheet();
          return;
        }
        if (itemHasRequiredModifiers(it)) {
          openSheet();
        } else {
          commitMenuItemToBasket(it, name, desc);
          setAddedConfirmation({ itemId: it.id, name });
        }
      }}
      style={{
        border:
          density === "refined-editorial"
            ? inCartCount > 0 ? `1px solid ${softBorder}` : "none"
            : density === "bold-casual"
              ? inCartCount > 0 ? `1px solid ${softBorder}` : "none"
              : density === "classic"
                ? inCartCount > 0 ? `1px solid ${softBorder}` : "1px solid #252F3D"
                : inCartCount > 0 ? `1px solid ${softBorder}` : "1px solid var(--gb-color-border)",
        borderLeft: density === "bold-casual" ? `4px solid ${accent}` : undefined,
        borderRadius: radius,
        background:
          density === "refined-editorial"
            ? inCartCount > 0 ? softBg : "transparent"
            : !itemIsOrderable
              ? "#121A14"
              : inCartCount > 0
                ? softBg
                : "var(--gb-color-surface-strong)",
        padding: pad,
        boxShadow:
          density === "cinematic" ? "0 8px 28px rgba(0,0,0,0.35)" :
          density === "classic" ? "0 2px 12px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.18)" :
          "var(--gb-shadow-card)",
        cursor: "pointer",
        opacity: itemIsOrderable ? 1 : 0.78,
        transition: "background 120ms ease, border-color 120ms ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ display: "flex", gap: imageUrl ? 12 : 0, alignItems: imageUrl ? "flex-start" : "baseline" }}>
        {showImage && imageUrl ? (
          <div
            aria-hidden="true"
            style={{
              width: density === "cinematic" ? 100 : 72,
              height: density === "cinematic" ? 72 : 72,
              borderRadius: density === "refined-editorial" ? 14 : 12,
              overflow: "hidden",
              flexShrink: 0,
              background: "#0f1720",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              marginTop: 2,
            }}
          >
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ) : null}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1, flexWrap: "nowrap" }}>
              <span
                style={{
                  fontSize: titleSize,
                  fontWeight: density === "cinematic" || density === "bold-casual" ? 800 : density === "classic" ? 700 : 600,
                  color: "#FFFFFF",
                  lineHeight: 1.2,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: density === "takeout" ? "nowrap" : "normal",
                }}
              >
                {name}
              </span>
              {dishShareData ? (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", flexShrink: 0, whiteSpace: "nowrap" }}>
                  <ShareButton
                    variant="dish"
                    shareData={dishShareData}
                    analyticsContext={{
                      restaurantId: currentRestaurantId,
                      restaurantSlug: data?.slug || null,
                      menuItemId: it.id,
                      menuItemName: name,
                      pageType: "public_menu",
                      shareTarget: "dish",
                    }}
                    size="compact"
                    tone="subtle"
                    iconOnly
                  />
                </div>
              ) : null}
              {canNavigate ? (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", flexShrink: 0 }}>
                  <FoodInterestButton
                    compact
                    interest={{
                      interest_type: "dish",
                      interest_key: `menu_item_${it.id}`,
                      display_label: name,
                      source_menu_item_id: it.id,
                    }}
                  />
                </div>
              ) : null}
            </div>
            {price ? (
              <span style={{ fontSize: titleSize, fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>{price}</span>
            ) : null}
          </div>

          {inCartCount > 0 || hasDeal || it?.is_vegan || it?.is_gluten_free || !itemIsOrderable ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {inCartCount > 0 ? (
                hoveredItemId === it.id ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(cartState.simpleLine?.lineId);
                      setHoveredItemId(null);
                    }}
                    style={{
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
                    style={{
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
            </div>
          ) : null}
        </div>
      </div>

      {desc ? (
        <div style={{
          marginTop: density === "classic" ? 4 : 3,
          fontSize: descSize,
          color: density === "classic" ? "rgba(156,163,175,0.82)" : "#9CA3AF",
          lineHeight: density === "classic" ? 1.4 : 1.35,
        }}>{desc}</div>
      ) : null}

      {density !== "takeout" && (showInsightsInline || showNutritionInline || showAllergenInline || showIndulgenceInline) ? (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {showNutritionInline ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const navId = it?.canonical_menu_item_id || it?.id;
                if (navId && navigate) navigate(`/menu-items/${navId}?from=menu`);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 18,
                padding: "0 7px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.3,
                background: softBg,
                color: accent,
                border: `1px solid ${softBorder}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              {t("common.nutrition", "Nutrition")}
            </button>
          ) : null}
          {showIndulgenceInline && indulgencePresentation?.indulgence?.score != null ? (
            <Badge
              label={`Indulgence ${indulgencePresentation.indulgence.score}`}
              bg={softBg}
              color={accent}
              border={`1px solid ${softBorder}`}
            />
          ) : null}
          {showInsightsInline ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const navId = it?.canonical_menu_item_id || it?.id;
                if (navId && navigate) navigate(`/menu-items/${navId}?from=menu`);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "none",
                background: "transparent",
                color: accent,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
                e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
                e.currentTarget.style.opacity = "1";
              }}
            >
              Insights
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
