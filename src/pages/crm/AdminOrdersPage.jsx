import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCrmOrders } from "../../lib/crmApi.js";
import {
  Badge,
  CrmCard,
  CrmPage,
  ErrorBanner,
  LinkCell,
  StatTile,
  SuccessBanner,
} from "./CrmShared.jsx";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function AdminOrdersPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [stuckOnly, setStuckOnly] = useState(false);
  const [state, setState] = useState({ status: "loading", orders: [], pagination: null, error: "" });

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await getCrmOrders({
          restaurantId: restaurantId || undefined,
          status: orderStatus || undefined,
          paymentStatus: paymentStatus || undefined,
          stuckOnly: stuckOnly ? "true" : undefined,
          limit: 50,
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
    return () => {
      cancelled = true;
    };
  }, [restaurantId, orderStatus, paymentStatus, stuckOnly]);

  const summary = useMemo(() => {
    const orders = state.orders || [];
    return {
      total: orders.length,
      paid_stuck: orders.filter((order) => order.operational_flags?.includes("paid_stuck")).length,
      processing_delayed: orders.filter((order) => order.operational_flags?.includes("processing_delayed")).length,
      refunded: orders.filter((order) => order.payment_status === "refunded").length,
      failed: orders.filter((order) => order.payment_status === "failed").length,
    };
  }, [state.orders]);

  return (
    <CrmPage
      title="Order Oversight"
      actions={
        <Link
          to="/crm"
          style={{
            textDecoration: "none",
            background: "#194b3a",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Back to dashboard
        </Link>
      }
    >
      <ErrorBanner message={state.error} />
      <SuccessBanner message={stuckOnly ? "Showing only orders that need ops attention." : ""} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 18 }}>
        <StatTile label="Loaded orders" value={summary.total} />
        <StatTile label="Paid but stuck" value={summary.paid_stuck} />
        <StatTile label="Processing delayed" value={summary.processing_delayed} />
        <StatTile label="Refunded" value={summary.refunded} />
        <StatTile label="Failed" value={summary.failed} />
      </div>

      <CrmCard title="Filters" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Restaurant ID</span>
            <input value={restaurantId} onChange={(event) => setRestaurantId(event.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Order status</span>
            <select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)} style={inputStyle}>
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
              <option value="refunded">Refunded</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Payment status</span>
            <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} style={inputStyle}>
              <option value="">All</option>
              <option value="succeeded">Succeeded</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
            <input type="checkbox" checked={stuckOnly} onChange={(event) => setStuckOnly(event.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>Stuck orders only</span>
          </label>
        </div>
      </CrmCard>

      <div style={{ display: "grid", gap: 14 }}>
        {(state.orders || []).map((order) => (
          <CrmCard key={order.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", fontWeight: 700 }}>
                  Order #{order.id} • Restaurant #{order.restaurant_id}
                </div>
                <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: "#0f1720" }}>
                  {order.restaurant_name}
                </div>
                <div style={{ marginTop: 4, fontSize: 14, color: "#475467" }}>
                  {order.customer_name} • {formatDateTime(order.created_at)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f1720" }}>{formatMoney(order.total_cents)}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <Badge type="account" value={order.payment_status} />
                  <Badge type="stage" value={order.order_status} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
              <div style={metaBlockStyle}><strong>Fulfillment:</strong> {order.fulfillment_type}</div>
              <div style={metaBlockStyle}><strong>Latest event:</strong> {formatDateTime(order.latest_event_at)}</div>
              <div style={metaBlockStyle}><strong>Flags:</strong> {order.operational_flags?.length ? order.operational_flags.join(", ") : "—"}</div>
              <div style={metaBlockStyle}><strong>Items:</strong> {order.items.map((item) => `${item.quantity}x ${item.name_snapshot}`).join(", ") || "—"}</div>
            </div>

            {order.fulfillment_type === "delivery" ? (
              <div style={{ marginTop: 12, ...metaBlockStyle }}>
                <strong>Delivery:</strong>{" "}
                {[
                  order.delivery_address_json?.line1,
                  order.delivery_address_json?.line2,
                  [order.delivery_address_json?.city, order.delivery_address_json?.state].filter(Boolean).join(", "),
                  order.delivery_address_json?.postalCode,
                ]
                  .filter(Boolean)
                  .join(" • ") || "Address missing"}
              </div>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <LinkCell to={`/crm/orders/${order.id}`}>Inspect order</LinkCell>
            </div>
          </CrmCard>
        ))}
      </div>
    </CrmPage>
  );
}

const inputStyle = {
  borderRadius: 12,
  border: "1px solid #d9e0ea",
  background: "#fff",
  padding: "10px 12px",
  fontSize: 14,
};

const metaBlockStyle = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #d9e0ea",
  fontSize: 13,
  color: "#0f1720",
};
