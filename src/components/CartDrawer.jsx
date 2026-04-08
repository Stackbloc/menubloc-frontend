/**
 * CartDrawer.jsx
 * Path: menubloc-frontend/src/components/CartDrawer.jsx
 *
 * Slide-in cart drawer with Stripe Checkout.
 * Rendered once at the app root — controlled via CartContext.
 *
 * Clicking "Checkout with Stripe" sends the cart to
 * POST /api/checkout/session and redirects to the returned checkout_url.
 * Stripe redirects back to successUrl / cancelUrl on completion.
 */

import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

function fmtPrice(price, interval) {
  const formatted = `$${price.toFixed(2)}`;
  if (interval === "month") return `${formatted}/mo`;
  if (interval === "year")  return `${formatted}/yr`;
  return formatted;
}

function LineItem({ item, onRemove, t }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: 12, padding: "14px 0",
      borderBottom: "1px solid rgba(0,0,0,0.07)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
          {item.name}
        </div>
        {item.description ? (
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            {item.description}
          </div>
        ) : null}
        <div style={{
          display: "inline-block", marginTop: 6,
          fontSize: 10, fontWeight: 800, letterSpacing: 0.4,
          textTransform: "uppercase", color: "#94a3b8",
        }}>
          {item.type === "subscription" ? t("cart.subscription") : t("cart.oneTime")}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
          {fmtPrice(item.price, item.interval)}
        </div>
        <button
          onClick={() => onRemove(item.id)}
          style={{
            background: "none", border: "none", padding: 0,
            fontSize: 11, fontWeight: 600, color: "#94a3b8",
            cursor: "pointer", letterSpacing: 0.2,
          }}
        >
          {t("cart.remove")}
        </button>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { cart, removeFromCart, clearCart, isOpen, closeCart, total } = useCart();
  const { t } = useLanguage();
  const overlayRef = useRef(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === "Escape") closeCart(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  async function handleCheckout() {
    if (cart.length === 0) return;

    setIsCheckingOut(true);
    setCheckoutError("");

    try {
      const origin = window.location.origin;
      const res = await fetch(`${API}/api/checkout/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productCode: item.productCode || item.id,
            name: item.name,
            price: item.price,
            type: item.type,
            interval: item.interval || null,
          })),
          successUrl: `${origin}${window.location.pathname}?checkout=success`,
          cancelUrl:  `${origin}${window.location.pathname}?checkout=cancelled`,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Checkout failed. Please try again.");
      }

      if (!data.checkout_url) {
        throw new Error("No checkout URL returned.");
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      setCheckoutError(err.message || "Checkout failed. Please try again.");
      setIsCheckingOut(false);
    }
  }

  const hasItems = cart.length > 0;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={closeCart}
        style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.4)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.aria")}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1000,
          width: "min(420px, 100vw)",
          background: "#ffffff",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          display: "flex", flexDirection: "column",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid #f1f5f9",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
            {t("cart.title")}
            {cart.length > 0 ? (
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 700,
                color: "#94a3b8", verticalAlign: "middle",
              }}>
                {t(
                  cart.length === 1 ? "cart.itemCountSingle" : "cart.itemCountPlural",
                  "",
                  { count: cart.length },
                )}
              </span>
            ) : null}
          </div>
          <button
            onClick={closeCart}
            aria-label={t("cart.close")}
            style={{
              width: 32, height: 32, borderRadius: 999,
              border: "1px solid #e2e8f0", background: "transparent",
              fontSize: 16, cursor: "pointer", color: "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
          {!hasItems ? (
            <div style={{
              paddingTop: 60, textAlign: "center",
              fontSize: 14, color: "#94a3b8", fontStyle: "italic",
            }}>
              {t("cart.empty")}
            </div>
          ) : (
            <>
              {/* Line items */}
              <div style={{ marginBottom: 4 }}>
                {cart.map((item) => (
                  <LineItem key={item.id} item={item} onRemove={removeFromCart} t={t} />
                ))}
              </div>

              {/* Total */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 0 20px",
                borderBottom: "1px solid #f1f5f9",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{t("cart.totalDueToday")}</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Checkout */}
              <div style={{ paddingTop: 20 }}>
                {checkoutError ? (
                  <div style={{
                    marginBottom: 14, padding: "10px 12px", borderRadius: 10,
                    background: "#fef2f2", border: "1px solid #fecaca",
                    fontSize: 13, color: "#b42318", fontWeight: 600,
                  }}>
                    {checkoutError}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 12,
                    border: "none", background: isCheckingOut ? "#94a3b8" : "#0f172a",
                    color: "#fff", fontSize: 15, fontWeight: 800,
                    cursor: isCheckingOut ? "wait" : "pointer",
                  }}
                >
                  {isCheckingOut ? "Redirecting to Stripe…" : t("cart.checkoutWithStripe")}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #f1f5f9",
          flexShrink: 0,
          fontSize: 11, color: "#94a3b8", textAlign: "center", lineHeight: 1.5,
        }}>
          {t("cart.stripeSecure")}
          {hasItems ? (
            <button
              onClick={clearCart}
              style={{
                display: "block", margin: "8px auto 0",
                background: "none", border: "none",
                fontSize: 11, color: "#cbd5e1", cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {t("cart.clear")}
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
