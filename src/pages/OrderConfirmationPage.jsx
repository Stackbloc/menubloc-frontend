import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { apiGet, toConsumerErrorMessage } from "../lib/api.js";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function shouldPoll(order) {
  return order && ["pending", "processing", "requires_action"].includes(order.payment_status);
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { restaurant, clearCart } = useOrderCart();
  const [state, setState] = useState({
    status: "loading",
    order: null,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    async function loadOrder() {
      try {
        const response = await apiGet(`/api/orders/${encodeURIComponent(orderId)}`);
        if (cancelled) return;

        setState({
          status: "ready",
          order: response.order,
          error: "",
        });

        if (
          response.order?.payment_status === "succeeded" &&
          restaurant?.restaurantId &&
          Number(restaurant.restaurantId) === Number(response.order.restaurant_id)
        ) {
          clearCart();
        }
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          order: null,
          error: toConsumerErrorMessage(
            error,
            "We couldn't load your order confirmation."
          ),
        });
      }
    }

    loadOrder();

    intervalId = window.setInterval(() => {
      if (shouldPoll(state.order)) {
        loadOrder();
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [orderId, clearCart, restaurant?.restaurantId, state.order]);

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F0C", color: "#FFFFFF" }}>
      <StickyPageHeader title="Order Confirmation" />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 18px 80px" }}>

        <div
          style={{
            marginTop: 24,
            borderRadius: 24,
            background: "#121A14",
            border: "1px solid #1F2937",
            padding: "28px 24px",
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
          }}
        >
          {state.status === "loading" ? (
            <div style={{ fontSize: 15, color: "#9CA3AF" }}>Loading order confirmation…</div>
          ) : state.status === "error" ? (
            <div style={{ fontSize: 15, color: "#F87171" }}>{state.error}</div>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, color: "#9CA3AF" }}>
                Order confirmation
              </div>
              <h1 style={{ fontSize: 32, margin: "10px 0 6px" }}>
                Order #{state.order.id}
              </h1>
              <p style={{ margin: 0, color: "#9CA3AF", lineHeight: 1.6 }}>
                {state.order.payment_status === "succeeded"
                  ? "Payment succeeded. The restaurant will handle fulfillment directly."
                  : state.order.payment_status === "processing"
                    ? "Payment is processing. We’ll keep checking the final status."
                    : state.order.payment_status === "failed"
                      ? "Payment failed. Your order record was saved, but the restaurant was not paid."
                      : "Order status is still updating."}
              </p>

              <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#9CA3AF", fontWeight: 700 }}>Restaurant</span>
                  <strong>{state.order.restaurant_name}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#9CA3AF", fontWeight: 700 }}>Fulfillment</span>
                  <strong style={{ textTransform: "capitalize" }}>{state.order.fulfillment_type}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#9CA3AF", fontWeight: 700 }}>Payment status</span>
                  <strong style={{ textTransform: "capitalize" }}>{state.order.payment_status}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#9CA3AF", fontWeight: 700 }}>Order status</span>
                  <strong style={{ textTransform: "capitalize" }}>{state.order.order_status}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#9CA3AF", fontWeight: 700 }}>Subtotal</span>
                  <strong>{formatMoney(state.order.subtotal_cents)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#9CA3AF", fontWeight: 700 }}>Tax</span>
                  <strong>{formatMoney(state.order.tax_cents)}</strong>
                </div>
                {Number(state.order.delivery_provider_fee_cents || 0) > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: "#9CA3AF", fontWeight: 700 }}>Provider delivery fee</span>
                    <strong>{formatMoney(state.order.delivery_provider_fee_cents)}</strong>
                  </div>
                ) : null}
                {Number(state.order.delivery_fee_cents || 0) > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: "#9CA3AF", fontWeight: 700 }}>
                      {state.order.delivery_payload_json?.delivery_fee_label || "Delivery fee"}
                    </span>
                    <strong>{formatMoney(state.order.delivery_fee_cents)}</strong>
                  </div>
                ) : null}
                {state.order.delivery_payload_json?.delivery_fee_disclosure ? (
                  <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>
                    {state.order.delivery_payload_json.delivery_fee_disclosure}
                  </div>
                ) : null}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#9CA3AF", fontWeight: 700 }}>Total</span>
                  <strong>{formatMoney(state.order.total_cents)}</strong>
                </div>
                {Number(state.order.coins_redeemed_cents || 0) > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: "#9CA3AF", fontWeight: 700 }}>G-Coins applied</span>
                    <strong>-{formatMoney(state.order.coins_redeemed_cents)}</strong>
                  </div>
                ) : null}
                {state.order.payment_status === "succeeded" && Number(state.order.coins_earned_cents || 0) > 0 ? (
                  <div
                    style={{
                      marginTop: 8,
                      borderRadius: 14,
                      background: "#ecfdf3",
                      border: "1px solid #bbf7d0",
                      padding: "12px 14px",
                      color: "#22C55E",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    You earned {formatMoney(state.order.coins_earned_cents)} in G-Coins
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 10 }}>Items</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {state.order.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        borderRadius: 18,
                        border: "1px solid #1F2937",
                        background: "#121A14",
                        padding: "12px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 900 }}>{item.name_snapshot}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                          Qty {item.quantity}
                        </div>
                      </div>
                      <strong>{formatMoney(item.line_total_cents)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <Link to={`/public/restaurants/${state.order.restaurant_id}/menu`} style={{ color: "#22C55E", fontWeight: 800 }}>
                  Back to menu
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
