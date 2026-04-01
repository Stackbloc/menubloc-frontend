import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  getRestaurantOrders,
  updateRestaurantOrderStatus,
} from "../../lib/operatorApi.js";

const TABS = [
  { key: "paid", label: "New / Paid", query: { status: "paid", paymentStatus: "succeeded" } },
  { key: "preparing", label: "In Progress", query: { status: "preparing" } },
  { key: "ready", label: "Ready", query: { status: "ready" } },
  { key: "completed", label: "Completed", query: { status: "completed" } },
  { key: "closed", label: "Refunded / Canceled", query: { status: "canceled,refunded", paymentStatus: "canceled,refunded,failed" } },
];

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

function badgeStyle(type, value) {
  const text = String(value || "").toLowerCase();
  if (type === "payment") {
    if (text === "succeeded") return { background: "#dcfce7", color: "#166534" };
    if (text === "processing") return { background: "#e0f2fe", color: "#075985" };
    if (text === "failed" || text === "canceled" || text === "refunded") return { background: "#fee2e2", color: "#991b1b" };
    return { background: "#e2e8f0", color: "#334155" };
  }

  if (text === "paid") return { background: "#fef3c7", color: "#92400e" };
  if (text === "preparing") return { background: "#dbeafe", color: "#1d4ed8" };
  if (text === "ready") return { background: "#dcfce7", color: "#166534" };
  if (text === "completed") return { background: "#e5e7eb", color: "#374151" };
  return { background: "#fee2e2", color: "#991b1b" };
}

function StatusBadge({ type, value }) {
  const style = badgeStyle(type, value);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: style.background,
        color: style.color,
        textTransform: "capitalize",
      }}
    >
      {String(value || "—").replaceAll("_", " ")}
    </span>
  );
}

function DeliveryBlock({ order }) {
  if (order.fulfillment_type !== "delivery") {
    return null;
  }

  const address = order.delivery_address_json || {};
  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 14px",
        borderRadius: 14,
        background: "#f8fafc",
        border: "1px solid #d9e0ea",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
        Delivery
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: "#0f1720", lineHeight: 1.5 }}>
        {[address.name, address.line1, address.line2, [address.city, address.state].filter(Boolean).join(", "), address.postalCode]
          .filter(Boolean)
          .map((line) => (
            <div key={line}>{line}</div>
          ))}
        <div style={{ marginTop: 8, color: "#475467" }}>
          Dispatch: {order.delivery_status || "Not dispatched"}
          {order.delivery_provider ? ` via ${order.delivery_provider}` : ""}
        </div>
        {address.instructions ? (
          <div style={{ marginTop: 6, color: "#475467" }}>Delivery notes: {address.instructions}</div>
        ) : null}
      </div>
    </div>
  );
}

function OrderCard({ order, onAction, busyStatus }) {
  const itemSummary = order.items.map((item) => `${item.quantity}x ${item.name_snapshot}`).join(", ");
  const actions = ACTIONS[order.order_status] || [];
  const isHighlighted = order.order_status === "paid" && order.payment_status === "succeeded";

  return (
    <article
      style={{
        background: "#fff",
        border: `1px solid ${isHighlighted ? "#f59e0b" : "#e4e9f0"}`,
        boxShadow: isHighlighted ? "0 10px 28px rgba(245, 158, 11, 0.12)" : "0 8px 24px rgba(15,23,42,0.05)",
        borderRadius: 18,
        padding: "18px 18px 16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#8a9ab0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Order #{order.id}
          </div>
          <div style={{ marginTop: 6, fontSize: 21, fontWeight: 800, color: "#0f1720" }}>
            {order.customer_name}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: "#5b6675" }}>
            {formatDateTime(order.created_at)} • {order.customer_phone || "No phone"}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f1720" }}>{formatMoney(order.total_cents)}</div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
            <StatusBadge type="payment" value={order.payment_status} />
            <StatusBadge type="order" value={order.order_status} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
        <div style={{ fontSize: 13, color: "#0f1720" }}>
          <strong>Fulfillment:</strong> <span style={{ textTransform: "capitalize" }}>{order.fulfillment_type}</span>
        </div>
        <div style={{ fontSize: 13, color: "#0f1720" }}>
          <strong>Items:</strong> {itemSummary || "—"}
        </div>
        <div style={{ fontSize: 13, color: "#0f1720" }}>
          <strong>Notes:</strong> {order.notes || "None"}
        </div>
      </div>

      <DeliveryBlock order={order} />

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <Link
          to={`/operator/orders/${order.id}`}
          style={{ color: "#1F4E3D", fontWeight: 800, textDecoration: "none" }}
        >
          Open details →
        </Link>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {actions.map((nextStatus) => (
            <button
              key={nextStatus}
              type="button"
              disabled={busyStatus === nextStatus}
              onClick={() => onAction(order.id, nextStatus)}
              style={{
                border: "none",
                borderRadius: 12,
                background: nextStatus === "canceled" ? "#fee2e2" : "#1F4E3D",
                color: nextStatus === "canceled" ? "#991b1b" : "#fff",
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {busyStatus === nextStatus ? "Updating..." : `Mark ${nextStatus}`}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function RestaurantOrdersPage() {
  const { selectedRestaurant } = useOperator();
  const [activeTab, setActiveTab] = useState("paid");
  const [state, setState] = useState({ status: "idle", orders: [], pagination: null, error: "" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyOrder, setBusyOrder] = useState(null);

  const tabConfig = useMemo(
    () => TABS.find((tab) => tab.key === activeTab) || TABS[0],
    [activeTab]
  );

  useEffect(() => {
    if (!selectedRestaurant?.id) return undefined;

    let cancelled = false;

    async function loadOrders() {
      try {
        setState((prev) => ({ ...prev, status: "loading", error: "" }));
        const response = await getRestaurantOrders(selectedRestaurant.id, {
          ...tabConfig.query,
          limit: 30,
        });

        if (cancelled) return;
        setState({
          status: "ready",
          orders: response.orders || [],
          pagination: response.pagination || null,
          error: "",
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          orders: [],
          pagination: null,
          error: error.message || "Unable to load orders.",
        });
      }
    }

    loadOrders();
    const intervalId = window.setInterval(loadOrders, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedRestaurant?.id, tabConfig, refreshKey]);

  async function handleStatusUpdate(orderId, nextStatus) {
    try {
      setBusyOrder(`${orderId}:${nextStatus}`);
      await updateRestaurantOrderStatus(orderId, nextStatus);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      window.alert(error.message || "Unable to update order status.");
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <OperatorLayout title="Orders">
      {!selectedRestaurant ? (
        <div style={{ color: "#5b6675" }}>Select a restaurant to load orders.</div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1720" }}>
                {selectedRestaurant.restaurant_name}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#5b6675" }}>
                Newest orders first. Payment state stays Stripe-driven; fulfillment state is restaurant-controlled.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              style={{
                border: "1px solid #d0d5dd",
                borderRadius: 12,
                background: "#fff",
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  borderRadius: 999,
                  border: activeTab === tab.key ? "1px solid #1F4E3D" : "1px solid #d0d5dd",
                  background: activeTab === tab.key ? "#1F4E3D" : "#fff",
                  color: activeTab === tab.key ? "#fff" : "#0f1720",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {state.error ? (
            <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" }}>
              {state.error}
            </div>
          ) : null}

          {state.status === "loading" && state.orders.length === 0 ? (
            <div style={{ color: "#5b6675" }}>Loading orders…</div>
          ) : state.orders.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #e4e9f0", borderRadius: 16, padding: 18, color: "#5b6675" }}>
              No orders in this queue.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {state.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={handleStatusUpdate}
                  busyStatus={busyOrder === `${order.id}:preparing` ? "preparing" : busyOrder === `${order.id}:ready` ? "ready" : busyOrder === `${order.id}:completed` ? "completed" : busyOrder === `${order.id}:canceled` ? "canceled" : null}
                />
              ))}
            </div>
          )}
        </>
      )}
    </OperatorLayout>
  );
}
