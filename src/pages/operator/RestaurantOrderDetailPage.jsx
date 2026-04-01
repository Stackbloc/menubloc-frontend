import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import {
  getRestaurantOrderDetail,
  updateRestaurantOrderStatus,
} from "../../lib/operatorApi.js";

const ACTIONS = {
  paid: ["preparing", "canceled"],
  preparing: ["ready", "canceled"],
  ready: ["completed", "canceled"],
};

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 18, padding: "10px 0", borderBottom: "1px solid #edf2f7" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#0f1720", textAlign: "right" }}>{value}</div>
    </div>
  );
}

export default function RestaurantOrderDetailPage() {
  const { orderId } = useParams();
  const [state, setState] = useState({ status: "loading", order: null, error: "" });
  const [busyStatus, setBusyStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      try {
        const response = await getRestaurantOrderDetail(orderId);
        if (cancelled) return;
        setState({ status: "ready", order: response.order, error: "" });
      } catch (error) {
        if (cancelled) return;
        setState({ status: "error", order: null, error: error.message || "Unable to load order." });
      }
    }

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function handleStatusUpdate(nextStatus) {
    try {
      setBusyStatus(nextStatus);
      await updateRestaurantOrderStatus(orderId, nextStatus);
      const response = await getRestaurantOrderDetail(orderId);
      setState({ status: "ready", order: response.order, error: "" });
    } catch (error) {
      window.alert(error.message || "Unable to update order status.");
    } finally {
      setBusyStatus("");
    }
  }

  return (
    <OperatorLayout title="Order Detail">
      {state.status === "loading" ? (
        <div style={{ color: "#5b6675" }}>Loading order…</div>
      ) : state.status === "error" ? (
        <div style={{ color: "#991b1b" }}>{state.error}</div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#8a9ab0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Order #{state.order.id}
              </div>
              <div style={{ marginTop: 6, fontSize: 30, fontWeight: 800, color: "#0f1720" }}>
                {state.order.customer_name}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#5b6675" }}>
                {formatDateTime(state.order.created_at)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f1720" }}>{formatMoney(state.order.total_cents)}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#475467" }}>
                Payment: {state.order.payment_status} • Order: {state.order.order_status}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
            <section style={{ background: "#fff", border: "1px solid #e4e9f0", borderRadius: 18, padding: 18 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 18, color: "#0f1720" }}>Items</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {state.order.items.map((item) => (
                  <div key={item.id} style={{ borderRadius: 14, background: "#f8fafc", padding: "12px 14px", display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f1720" }}>{item.name_snapshot}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "#5b6675" }}>
                        Qty {item.quantity} • {formatMoney(item.price_cents)} each
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f1720" }}>
                      {formatMoney(item.line_total_cents)}
                    </div>
                  </div>
                ))}
              </div>

              <h2 style={{ margin: "20px 0 12px", fontSize: 18, color: "#0f1720" }}>Order event log</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {state.order.events.map((event) => (
                  <div key={event.id} style={{ borderRadius: 14, border: "1px solid #e4e9f0", padding: "12px 14px", background: "#fff" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#1F4E3D" }}>{event.event_type}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{formatDateTime(event.created_at)}</div>
                  </div>
                ))}
              </div>
            </section>

            <aside style={{ background: "#fff", border: "1px solid #e4e9f0", borderRadius: 18, padding: 18 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 18, color: "#0f1720" }}>Operational details</h2>
              <DetailRow label="Phone" value={state.order.customer_phone || "—"} />
              <DetailRow label="Email" value={state.order.customer_email || "—"} />
              <DetailRow label="Fulfillment" value={state.order.fulfillment_type} />
              <DetailRow label="Payment status" value={state.order.payment_status} />
              <DetailRow label="Order status" value={state.order.order_status} />
              <DetailRow label="Latest event" value={formatDateTime(state.order.latest_event_at)} />
              <DetailRow label="Notes" value={state.order.notes || "None"} />
              {state.order.fulfillment_type === "delivery" ? (
                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 14, background: "#f8fafc", border: "1px solid #d9e0ea" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                    Delivery
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#0f1720", lineHeight: 1.5 }}>
                    {Object.values(state.order.delivery_address_json || {}).filter(Boolean).map((value) => (
                      <div key={String(value)}>{String(value)}</div>
                    ))}
                    <div style={{ marginTop: 8, color: "#475467" }}>
                      Dispatch: {state.order.delivery_status || "Not dispatched"}
                      {state.order.delivery_provider ? ` via ${state.order.delivery_provider}` : ""}
                    </div>
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
                {(ACTIONS[state.order.order_status] || []).map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    disabled={busyStatus === nextStatus}
                    onClick={() => handleStatusUpdate(nextStatus)}
                    style={{
                      border: "none",
                      borderRadius: 12,
                      background: nextStatus === "canceled" ? "#fee2e2" : "#1F4E3D",
                      color: nextStatus === "canceled" ? "#991b1b" : "#fff",
                      padding: "11px 14px",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {busyStatus === nextStatus ? "Updating..." : `Mark ${nextStatus}`}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <Link to="/operator/orders" style={{ color: "#1F4E3D", fontWeight: 800, textDecoration: "none" }}>
                  ← Back to orders
                </Link>
              </div>
            </aside>
          </div>
        </>
      )}
    </OperatorLayout>
  );
}
