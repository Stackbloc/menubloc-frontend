import { useEffect } from "react";
import IndulgenceMeter from "../IndulgenceMeter.jsx";
import MenuItemInsightsPanel from "../MenuItemInsightsPanel.jsx";
import TasteIndexBadge from "../TasteIndexBadge.jsx";
import { itemHasRequiredModifiers } from "../basket/modifierModel.js";
import { itemHasInsightsData } from "../basket/ItemInsightsSheet.jsx";
import { getConsumerDisplayPrice } from "../../lib/pricingDisplay.js";
import { getCartItemState } from "../../lib/catalogMenuUtils.js";

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

function isItemOrderable(item) {
  return (getConsumerDisplayPrice(item) ?? 0) > 0;
}

export default function CatalogItemDetailSheet({
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
        <div style={{ paddingTop: 14, paddingBottom: 6, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#374151" }} />
        </div>

        <div style={{ padding: "4px 20px 96px" }}>
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

          {price ? (
            <div style={{ fontSize: 22, fontWeight: 900, color: accent, marginBottom: 14 }}>{price}</div>
          ) : null}

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

          {indulgencePresentation ? <IndulgenceInline presentation={indulgencePresentation} /> : null}

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
