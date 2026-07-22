import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { apiGet, toConsumerErrorMessage } from "../lib/api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatMenuItemName } from "../utils/formatMenuItemName.js";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function shouldPoll(order) {
  return order && ["pending", "processing", "requires_action"].includes(order.payment_status);
}

export default function OrderConfirmationPage() {
  const { t } = useLanguage();
  const { publicOrderToken, orderId } = useParams();
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
        let response;
        if (publicOrderToken) {
          response = await apiGet(
            `/api/orders/public/${encodeURIComponent(publicOrderToken)}`
          );
        } else if (orderId) {
          // Legacy sequential-id route: may 404 for guests after lockdown.
          response = await apiGet(`/api/orders/${encodeURIComponent(orderId)}`);
        } else {
          throw new Error("Missing order confirmation token.");
        }
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
            t("order.confirmation.loadError", "We couldn't load your order confirmation.")
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
  }, [publicOrderToken, orderId, clearCart, restaurant?.restaurantId, state.order]);

  const order = state.order;
  const delivery = order?.delivery_address_json || {};

  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)" }}>
      <StickyPageHeader title={t("order.confirmation.title", "Order confirmed")} />
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
              <h1 style={{ margin: "8px 0 4px", fontSize: 28 }}>Order Confirmed</h1>
              <div style={{ fontSize: 15, color: "#D1D5DB", marginTop: 4 }}>
                {order.restaurant_name}
              </div>
              <div style={{ fontSize: 14, color: "#9CA3AF", marginTop: 8 }}>
                Order #{order.id} · {order.fulfillment_type === "delivery" ? "Delivery" : "Pickup"}
              </div>
              <div style={{ fontSize: 14, color: "#9CA3AF", marginTop: 4 }}>
                Status: {order.order_status || "—"} · Payment: {order.payment_status || "—"}
              </div>

              <div style={{ marginTop: 20, display: "grid", gap: 6, fontSize: 14, color: "#D1D5DB" }}>
                <div><strong style={{ color: "#F9FAFB" }}>Name:</strong> {order.customer_name}</div>
                <div><strong style={{ color: "#F9FAFB" }}>Email:</strong> {order.customer_email || "—"}</div>
                <div><strong style={{ color: "#F9FAFB" }}>Phone:</strong> {order.customer_phone || "—"}</div>
                {order.fulfillment_type === "delivery" ? (
                  <div>
                    <strong style={{ color: "#F9FAFB" }}>Delivery:</strong>{" "}
                    {[
                      delivery.line1,
                      delivery.line2,
                      [delivery.city, delivery.state].filter(Boolean).join(", "),
                      delivery.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, color: "#9CA3AF", marginBottom: 10 }}>
                  Items
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {(order.items || []).map((item) => (
                    <div key={item.id || `${item.name_snapshot}-${item.quantity}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ color: "#F9FAFB" }}>
                        {item.quantity}× {formatMenuItemName(item.name_snapshot)}
                      </div>
                      <div style={{ color: "#D1D5DB" }}>{formatMoney(item.line_total_cents)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 22, borderTop: "1px solid #1F2937", paddingTop: 16, display: "grid", gap: 6, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#9CA3AF" }}>Subtotal</span>
                  <span>{formatMoney(order.subtotal_cents)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#9CA3AF" }}>Tax</span>
                  <span>{formatMoney(order.tax_cents)}</span>
                </div>
                {Number(order.delivery_fee_cents || 0) > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#9CA3AF" }}>Delivery</span>
                    <span>{formatMoney(order.delivery_fee_cents)}</span>
                  </div>
                ) : null}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, marginTop: 4 }}>
                  <span>Total</span>
                  <span>{formatMoney(order.total_cents)}</span>
                </div>
              </div>

              {order.is_guest_order ? (
                <div style={{ marginTop: 18, fontSize: 13, color: "#9CA3AF", lineHeight: 1.5 }}>
                  Already have an account?{" "}
                  <Link to="/account/login" style={{ color: "#22C55E", fontWeight: 700, textDecoration: "none" }}>
                    Sign in
                  </Link>{" "}
                  to manage future orders.
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
