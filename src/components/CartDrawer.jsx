/**
 * CartDrawer.jsx
 * Path: menubloc-frontend/src/components/CartDrawer.jsx
 *
 * Slide-in cart drawer with PayPal checkout.
 * Rendered once at the app root — controlled via CartContext.
 *
 * PayPal placeholders to swap before going live:
 *   PAYPAL_CLIENT_ID   — from PayPal Developer Dashboard → My Apps & Credentials
 *
 * Subscription items use PayPal Subscriptions API (createSubscription).
 * One-time items use PayPal Orders API (createOrder).
 */

import { useEffect, useRef } from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import { useCart } from "../context/CartContext.jsx";

// ── Replace with your real sandbox Client ID from developer.paypal.com ──
const PAYPAL_CLIENT_ID = "YOUR_SANDBOX_CLIENT_ID";

function fmtPrice(price, interval) {
  const formatted = `$${price.toFixed(2)}`;
  if (interval === "month") return `${formatted}/mo`;
  if (interval === "year")  return `${formatted}/yr`;
  return formatted;
}

function LineItem({ item, onRemove }) {
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
          {item.type === "subscription" ? "Subscription" : "One-time"}
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
          Remove
        </button>
      </div>
    </div>
  );
}

function CheckoutButtons({ cart, onSuccess }) {
  const subscriptionItem = cart.find((i) => i.type === "subscription");
  const oneTimeItems     = cart.filter((i) => i.type === "one_time");
  const oneTimeTotal     = oneTimeItems.reduce((s, i) => s + i.price, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Subscription checkout */}
      {subscriptionItem?.paypalPlanId ? (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#64748b",
            marginBottom: 8, letterSpacing: 0.3,
          }}>
            {subscriptionItem.name}
          </div>
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect", label: "subscribe" }}
            createSubscription={(_data, actions) =>
              actions.subscription.create({ plan_id: subscriptionItem.paypalPlanId })
            }
            onApprove={(_data, _actions) => onSuccess("subscription")}
            onError={(err) => console.error("PayPal subscription error:", err)}
          />
        </div>
      ) : null}

      {/* One-time checkout */}
      {oneTimeItems.length > 0 ? (
        <div>
          {subscriptionItem ? (
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#64748b",
              marginBottom: 8, letterSpacing: 0.3,
            }}>
              One-time purchase
            </div>
          ) : null}
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect" }}
            createOrder={(_data, actions) =>
              actions.order.create({
                purchase_units: oneTimeItems.map((item) => ({
                  description: item.name,
                  amount: {
                    currency_code: "USD",
                    value: item.price.toFixed(2),
                  },
                })),
              })
            }
            onApprove={(_data, actions) =>
              actions.order.capture().then(() => onSuccess("one_time"))
            }
            onError={(err) => console.error("PayPal order error:", err)}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function CartDrawer() {
  const { cart, removeFromCart, clearCart, isOpen, closeCart, total } = useCart();
  const overlayRef = useRef(null);

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

  function handleSuccess(type) {
    clearCart();
    closeCart();
    alert(type === "subscription"
      ? "Subscription activated! Welcome to Pro."
      : "Purchase complete! Thank you."
    );
  }

  const hasItems = cart.length > 0;

  return (
    <PayPalScriptProvider options={{
      clientId: PAYPAL_CLIENT_ID,
      vault: true,          // required for subscriptions
      intent: "subscription",
      currency: "USD",
    }}>
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
        aria-label="Cart"
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
            Your Cart
            {cart.length > 0 ? (
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 700,
                color: "#94a3b8", verticalAlign: "middle",
              }}>
                {cart.length} item{cart.length !== 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
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
              Your cart is empty.
            </div>
          ) : (
            <>
              {/* Line items */}
              <div style={{ marginBottom: 4 }}>
                {cart.map((item) => (
                  <LineItem key={item.id} item={item} onRemove={removeFromCart} />
                ))}
              </div>

              {/* Total */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 0 20px",
                borderBottom: "1px solid #f1f5f9",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Total due today</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* PayPal buttons */}
              <div style={{ paddingTop: 20 }}>
                <CheckoutButtons cart={cart} onSuccess={handleSuccess} />
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
          Payments are processed securely by PayPal.
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
              Clear cart
            </button>
          ) : null}
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
