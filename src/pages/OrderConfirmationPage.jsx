import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageNav } from "../components/NavButton.jsx";
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
    <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#11211a" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 18px 60px" }}>
        <PageNav back />

        <div
          style={{
            marginTop: 24,
            borderRadius: 24,
            background: "#fff",
            border: "1px solid rgba(17,33,26,0.08)",
            padding: "28px 24px",
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
          }}
        >
          {state.status === "loading" ? (
            <div style={{ fontSize: 15, color: "#667085" }}>Loading order confirmation…</div>
          ) : state.status === "error" ? (
            <div style={{ fontSize: 15, color: "#991b1b" }}>{state.error}</div>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, color: "#667085" }}>
                Order confirmation
              </div>
              <h1 style={{ fontSize: 32, margin: "10px 0 6px" }}>
                Order #{state.order.id}
              </h1>
              <p style={{ margin: 0, color: "#667085", lineHeight: 1.6 }}>
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
                  <span style={{ color: "#667085", fontWeight: 700 }}>Restaurant</span>
                  <strong>{state.order.restaurant_name}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#667085", fontWeight: 700 }}>Fulfillment</span>
                  <strong style={{ textTransform: "capitalize" }}>{state.order.fulfillment_type}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#667085", fontWeight: 700 }}>Payment status</span>
                  <strong style={{ textTransform: "capitalize" }}>{state.order.payment_status}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#667085", fontWeight: 700 }}>Order status</span>
                  <strong style={{ textTransform: "capitalize" }}>{state.order.order_status}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#667085", fontWeight: 700 }}>Total</span>
                  <strong>{formatMoney(state.order.total_cents)}</strong>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 10 }}>Items</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {state.order.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        borderRadius: 18,
                        border: "1px solid rgba(17,33,26,0.08)",
                        background: "#fffef8",
                        padding: "12px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 900 }}>{item.name_snapshot}</div>
                        <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
                          Qty {item.quantity}
                        </div>
                      </div>
                      <strong>{formatMoney(item.line_total_cents)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <Link to={`/public/restaurants/${state.order.restaurant_id}/menu`} style={{ color: "#14532d", fontWeight: 800 }}>
                  Back to menu
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
