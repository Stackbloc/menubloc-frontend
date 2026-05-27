import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link, useParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import {
  acceptOrder,
  declineOrder,
  getRestaurantOrderDetail,
  markOrderCompleted,
  markOrderPreparing,
  markOrderReady,
} from "../../lib/operatorApi.js";

const ACTIONS = {
  paid: ["accept", "decline"],
  merchant_acceptance_pending: ["accept", "decline"],
  accepted: ["preparing"],
  preparing: ["ready"],
  ready: ["completed"],
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

function RefundPendingBanner() {
  return (
    <div style={{
      marginTop: 12,
      padding: "10px 12px",
      borderRadius: 12,
      background: "#fff7ed",
      border: "1px solid #fdba74",
      color: "#9a3412",
      fontSize: 13,
      fontWeight: 800,
      lineHeight: 1.5,
    }}>
      Refund pending — customer has not yet been fully refunded.
    </div>
  );
}

function LegacyPaidBadge() {
  return (
    <div style={{
      marginTop: 10,
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      background: "#ede9fe",
      color: "#5b21b6",
    }}>
      Legacy Order (Pre-Acceptance Upgrade)
    </div>
  );
}

export default function RestaurantOrderDetailPage() {
  const { t } = useLanguage();
  const { orderId } = useParams();
  const [state, setState] = useState({ status: "loading", order: null, error: "" });
  const [busyStatus, setBusyStatus] = useState("");
  const [declineReasonCode, setDeclineReasonCode] = useState("");
  const [declineNote, setDeclineNote] = useState("");

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
      const restaurantId = state.order.restaurant_id;
      if (nextStatus === "accept") {
        await acceptOrder(restaurantId, orderId);
      } else if (nextStatus === "decline") {
        const declineResponse = await declineOrder(restaurantId, orderId, {
          reason_code: declineReasonCode || undefined,
          note: declineNote || undefined,
        });
        if (declineResponse?.order?.refund_error) {
          window.alert(`Order declined, but refund is pending: ${declineResponse.order.refund_error}`);
        }
      } else if (nextStatus === "preparing") {
        await markOrderPreparing(restaurantId, orderId);
      } else if (nextStatus === "ready") {
        await markOrderReady(restaurantId, orderId);
      } else if (nextStatus === "completed") {
        await markOrderCompleted(restaurantId, orderId);
      }
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
              {state.order.order_status === "paid" ? <LegacyPaidBadge /> : null}
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
              <DetailRow label="Decline reason" value={state.order.decline_reason_code || "—"} />
              <DetailRow label="Refund requested" value={formatDateTime(state.order.refund_requested_at)} />
              <DetailRow label="Refund completed" value={formatDateTime(state.order.refund_completed_at)} />
              <DetailRow label="Subtotal" value={formatMoney(state.order.subtotal_cents)} />
              <DetailRow label="Tax" value={formatMoney(state.order.tax_cents)} />
              {Number(state.order.delivery_provider_fee_cents || 0) > 0 ? (
                <DetailRow label="Provider delivery fee" value={formatMoney(state.order.delivery_provider_fee_cents)} />
              ) : null}
              {Number(state.order.delivery_fee_cents || 0) > 0 ? (
                <DetailRow
                  label={state.order.delivery_payload_json?.delivery_fee_label || "Delivery fee"}
                  value={formatMoney(state.order.delivery_fee_cents)}
                />
              ) : null}
              <DetailRow label="Latest event" value={formatDateTime(state.order.latest_event_at)} />
              <DetailRow label="Notes" value={state.order.notes || "None"} />
              {state.order.delivery_payload_json?.delivery_fee_disclosure ? (
                <div style={{ marginTop: 12, fontSize: 12, color: "#5b6675", lineHeight: 1.5 }}>
                  {state.order.delivery_payload_json.delivery_fee_disclosure}
                </div>
              ) : null}
              {state.order.payment_status === "payment_refund_pending" ? (
                <RefundPendingBanner />
              ) : null}
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

              {["paid", "merchant_acceptance_pending"].includes(state.order.order_status) ? (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  <select
                    value={declineReasonCode}
                    onChange={(e) => setDeclineReasonCode(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d0d5dd" }}
                  >
                    <option value="">Optional decline reason</option>
                    <option value="too_busy">Too busy</option>
                    <option value="kitchen_backlog">Kitchen backlog</option>
                    <option value="staff_shortage">Staff shortage</option>
                    <option value="sold_out">Sold out</option>
                    <option value="equipment_issue">Equipment issue</option>
                    <option value="closing_early">Closing early</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    value={declineNote}
                    onChange={(e) => setDeclineNote(e.target.value)}
                    rows={3}
                    placeholder="Optional note"
                    style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d0d5dd", resize: "vertical", fontFamily: "inherit" }}
                  />
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
                      background: nextStatus === "decline" ? "#fee2e2" : "#1F4E3D",
                      color: nextStatus === "decline" ? "#991b1b" : "#fff",
                      padding: "11px 14px",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {busyStatus === nextStatus
                      ? "Updating..."
                      : nextStatus === "accept"
                        ? "Accept Order"
                        : nextStatus === "decline"
                          ? "Decline Order"
                          : `Mark ${nextStatus}`}
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
