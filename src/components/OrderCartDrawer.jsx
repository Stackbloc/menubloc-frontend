import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatMoney } from "../lib/pricingDisplay.js";

export default function OrderCartDrawer() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fulfillmentType, setFulfillmentType] = useState("delivery");
  const {
    restaurant,
    items,
    isOpen,
    subtotalCents,
    closeCart,
    clearCart,
    updateQuantity,
    removeItem,
  } = useOrderCart();

  useEffect(() => {
    if (!isOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        closeCart();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(2, 6, 23, 0.42)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 160ms ease",
          zIndex: 1198,
        }}
      />

      <aside
        aria-hidden={!isOpen}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(430px, 100vw)",
          background: "#fffef8",
          borderLeft: "1px solid rgba(17,33,26,0.10)",
          boxShadow: "-18px 0 50px rgba(15,23,42,0.16)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 180ms ease",
          zIndex: 1199,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(17,33,26,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#667085",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                {t("basket.title", "Basket")}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#11211a", marginTop: 4 }}>
                {restaurant?.restaurantName || t("checkout.yourOrder", "Your order")}
              </div>
            </div>
            <button
              type="button"
              onClick={closeCart}
              aria-label={t("common.close", "Close")}
              style={{
                border: "1px solid rgba(17,33,26,0.12)",
                background: "#fff",
                borderRadius: 999,
                width: 36,
                height: 36,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {["pickup", "delivery"].map((type) => {
              const active = fulfillmentType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFulfillmentType(type)}
                  style={{
                    flex: 1, height: 38, borderRadius: 12,
                    border: active ? "1.5px solid #11211a" : "1px solid #d0d5dd",
                    background: active ? "#11211a" : "#fff",
                    color: active ? "#fff" : "#11211a",
                    fontSize: 13, fontWeight: 800,
                    cursor: "pointer",
                    transition: "background 150ms ease, border-color 150ms ease",
                  }}
                >
                  {type === "pickup" ? t("checkout.pickup", "Pickup") : t("checkout.delivery", "Delivery")}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
          {items.length === 0 ? (
            <div style={{ color: "#667085", fontSize: 14, lineHeight: 1.6 }}>
              {t("basket.emptyHint", "Add menu items from one restaurant to start checkout.")}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.lineId}
                  style={{
                    border: "1px solid rgba(17,33,26,0.08)",
                    borderRadius: 18,
                    background: "#fff",
                    padding: "14px 14px 12px",
                    boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#11211a" }}>
                        {item.name}
                      </div>
                      {item.description ? (
                        <div style={{ fontSize: 12, color: "#667085", marginTop: 4, lineHeight: 1.5 }}>
                          {item.description}
                        </div>
                      ) : null}
                      {item.pricingType === "deal" ? (
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "#166534" }}>
                          {item.pricingLabel || t("basket.dealApplied", "Deal applied")}
                          {item.originalBasePriceCents > item.basePriceCents
                            ? ` · ${t("basket.wasPrice", "Was {price}").replace("{price}", formatMoney(item.originalBasePriceCents))}`
                            : ""}
                        </div>
                      ) : null}
                      {item.modifiers?.length ? (
                        <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
                          {item.modifiers.map((modifier) => (
                            <div
                              key={`${modifier.groupId}-${modifier.optionId}`}
                              style={{ fontSize: 12, color: "#667085" }}
                            >
                              + {modifier.optionName}
                              {modifier.priceDeltaCents > 0
                                ? ` (${formatMoney(modifier.priceDeltaCents)})`
                                : ""}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#11211a" }}>
                        {formatMoney(item.lineTotalCents)}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                          style={qtyBtnStyle}
                        >
                          −
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 20, textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                          style={qtyBtnStyle}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.lineId)}
                        style={{
                          marginTop: 8,
                          border: "none",
                          background: "transparent",
                          color: "#b42318",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {t("cart.remove", "Remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "16px 22px calc(16px + env(safe-area-inset-bottom, 0px))",
            borderTop: "1px solid rgba(17,33,26,0.08)",
            background: "#fffef8",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#667085" }}>
              {t("basket.subtotal", "Subtotal")}
            </span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#11211a" }}>
              {formatMoney(subtotalCents)}
            </span>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 11, lineHeight: 1.5, color: "#667085" }}>
            {t("checkout.priceDisclosure", "Prices shown on Menuply may differ from in-store prices and may include Menuply's service component. Taxes and optional tips are shown separately before you place your order.")}
          </p>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => {
              closeCart();
              navigate(`/checkout?fulfillment=${fulfillmentType}`);
            }}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 16,
              background: items.length === 0 ? "#cbd5e1" : "#11211a",
              color: "#fff",
              padding: "14px 16px",
              fontSize: 15,
              fontWeight: 900,
              cursor: items.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {t("basket.checkout", "Checkout")}
          </button>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={clearCart}
              style={{
                width: "100%",
                marginTop: 10,
                border: "none",
                background: "transparent",
                color: "#667085",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {t("basket.clear", "Clear basket")}
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}

const qtyBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid #d0d5dd",
  background: "#fff",
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer",
  lineHeight: 1,
};
