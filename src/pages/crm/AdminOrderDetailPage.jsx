import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCrmOrderDetail } from "../../lib/crmApi.js";
import {
  Badge,
  CrmCard,
  CrmPage,
  ErrorBanner,
  LinkCell,
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

export default function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const [state, setState] = useState({ status: "loading", order: null, error: "" });

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      try {
        const response = await getCrmOrderDetail(orderId);
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

  return (
    <CrmPage
      title={`Order #${orderId}`}
      actions={
        <Link
          to="/crm/orders"
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
          Back to orders
        </Link>
      }
    >
      <ErrorBanner message={state.error} />

      {state.status === "loading" ? (
        <div style={{ color: "#64748b" }}>Loading order…</div>
      ) : state.order ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
          <CrmCard title={state.order.restaurant_name} subtitle={`Customer: ${state.order.customer_name}`}>
            <div style={{ display: "grid", gap: 10 }}>
              {state.order.items.map((item) => (
                <div key={item.id} style={{ padding: "12px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #d9e0ea", display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{item.name_snapshot}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                      Qty {item.quantity} • {formatMoney(item.price_cents)} each
                    </div>
                  </div>
                  <div style={{ fontWeight: 800 }}>{formatMoney(item.line_total_cents)}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
              {state.order.events.map((event) => (
                <div key={event.id} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #d9e0ea", background: "#fff" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#194b3a" }}>{event.event_type}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{formatDateTime(event.created_at)}</div>
                </div>
              ))}
            </div>
          </CrmCard>

          <CrmCard title="Operational detail">
            <div style={{ display: "grid", gap: 10 }}>
              <Detail label="Restaurant" value={<LinkCell to={`/crm/orders?restaurantId=${state.order.restaurant_id}`}>{state.order.restaurant_name}</LinkCell>} />
              <Detail label="Payment" value={<Badge type="account" value={state.order.payment_status} />} />
              <Detail label="Order" value={<Badge type="stage" value={state.order.order_status} />} />
              <Detail label="Fulfillment" value={state.order.fulfillment_type} />
              <Detail label="Total" value={formatMoney(state.order.total_cents)} />
              <Detail label="Phone" value={state.order.customer_phone || "—"} />
              <Detail label="Email" value={state.order.customer_email || "—"} />
              <Detail label="Latest event" value={formatDateTime(state.order.latest_event_at)} />
              <Detail label="Stripe PI" value={state.order.stripe_payment_intent_id || "—"} />
              <Detail label="Stripe charge" value={state.order.stripe_charge_id || "—"} />
              <Detail label="Notes" value={state.order.notes || "None"} />
              {state.order.fulfillment_type === "delivery" ? (
                <Detail
                  label="Delivery"
                  value={[
                    state.order.delivery_address_json?.line1,
                    state.order.delivery_address_json?.line2,
                    [state.order.delivery_address_json?.city, state.order.delivery_address_json?.state].filter(Boolean).join(", "),
                    state.order.delivery_address_json?.postalCode,
                    state.order.delivery_status ? `Dispatch: ${state.order.delivery_status}` : "Dispatch: not started",
                  ].filter(Boolean).join(" • ")}
                />
              ) : null}
            </div>
          </CrmCard>
        </div>
      ) : null}
    </CrmPage>
  );
}

function Detail({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, paddingBottom: 10, borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#0f1720", textAlign: "right" }}>{value}</div>
    </div>
  );
}
