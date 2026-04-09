/**
 * BasketResumePrompt
 *
 * Detects when a consumer logs in while there are items in the basket
 * from a prior session. Offers them a chance to clear the basket or
 * continue shopping at that restaurant.
 *
 * Mounted globally in AppShell so it fires regardless of which page
 * the user is on when they sign in.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { useOrderCart } from "../../context/OrderCartContext.jsx";

export default function BasketResumePrompt() {
  const { consumer } = useConsumer();
  const { restaurant, items, itemCount, subtotalCents, clearCart } = useOrderCart();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const prevConsumerRef = useRef(consumer);

  // Detect login transition: null → non-null
  useEffect(() => {
    const wasLoggedOut = prevConsumerRef.current == null;
    const isNowLoggedIn = consumer != null;

    if (wasLoggedOut && isNowLoggedIn && itemCount > 0) {
      setVisible(true);
    }

    prevConsumerRef.current = consumer;
  }, [consumer, itemCount]);

  if (!visible || !restaurant) return null;

  const restaurantName = restaurant.restaurantName || "a restaurant";
  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;
  const subtotal = `$${(Number(subtotalCents || 0) / 100).toFixed(2)}`;

  function handleContinue() {
    setVisible(false);
    // Navigate to the restaurant whose items are in the basket
    const rid = restaurant.restaurantId;
    if (rid) {
      navigate(`/restaurants/${encodeURIComponent(rid)}/menu`);
    }
  }

  function handleClear() {
    clearCart();
    setVisible(false);
  }

  function handleDismiss() {
    setVisible(false);
  }

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Basket from prior visit"
      onClick={handleDismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(15,23,42,0.46)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "28px 24px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 24px 56px rgba(15,23,42,0.22)",
          display: "grid",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#11211a",
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Welcome back!
          </div>
          <div style={{ fontSize: 14, color: "#475467", lineHeight: 1.6 }}>
            You have{" "}
            <strong style={{ color: "#11211a" }}>
              {itemLabel} ({subtotal})
            </strong>{" "}
            from{" "}
            <strong style={{ color: "#11211a" }}>{restaurantName}</strong>{" "}
            in your basket from a previous visit.
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <button
            type="button"
            onClick={handleContinue}
            style={{
              border: "none",
              borderRadius: 999,
              background: "#14532d",
              color: "#fff",
              padding: "13px 20px",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Continue shopping at {restaurantName}
          </button>
          <button
            type="button"
            onClick={handleClear}
            style={{
              border: "1px solid rgba(220,38,38,0.22)",
              borderRadius: 999,
              background: "#fff",
              color: "#dc2626",
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Clear basket
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              border: "none",
              borderRadius: 999,
              background: "transparent",
              color: "#667085",
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Decide later
          </button>
        </div>
      </div>
    </div>
  );
}
