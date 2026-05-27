import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link } from "react-router-dom";
import { getCrmOrders, getCrmBilling, getCrmSubscriptions } from "../../lib/crmApi.js";
import {
  Badge,
  CrmCard,
  CrmPage,
  ErrorBanner,
  LinkCell,
  StatTile,
} from "./CrmShared.jsx";

function fmt(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function fmtDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

const BILLING_STATUS_COLORS = {
  paid:    { bg: "#e8f3ef", color: "#173f35" },
  pending: { bg: "#fffbe6", color: "#92400e" },
  failed:  { bg: "#fef2f2", color: "#991b1b" },
  refunded:{ bg: "#f1f5f9", color: "#64748b" },
};

function Tab({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        borderRadius: "12px 12px 0 0",
        border: "1px solid",
        borderBottom: active ? "1px solid #fff" : "1px solid #d9e0ea",
        borderColor: active ? "#d9e0ea" : "#d9e0ea",
        background: active ? "#fff" : "#f8fafc",
        color: active ? "#173f35" : "#64748b",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        marginBottom: -1,
        position: "relative",
        zIndex: active ? 2 : 1,
      }}
    >
      {label}
      {count != null && (
        <span style={{ marginLeft: 8, background: active ? "#173f35" : "#d9e0ea", color: active ? "#fff" : "#64748b", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Subscriptions & Billing tab ────────────────────────────────────────────────
function BillingTab() {
  const [billing, setBilling] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getCrmBilling(), getCrmSubscriptions()])
      .then(([b, s]) => { setBilling(b.billing || []); setSubs(s.subscriptions || []); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const activePaid = subs.filter((s) => s.status === "active" && s.monthly_price_cents > 0);
  const totalBilled = billing.reduce((sum, b) => sum + (b.billing_status === "paid" ? b.amount_cents : 0), 0);
  const pending = billing.filter((b) => b.billing_status === "pending");

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading…</div>;
  if (error) return <div style={{ padding: 20, color: "#991b1b", fontSize: 13 }}>{error}</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatTile label="Active paid subs" value={activePaid.length} />
        <StatTile label="Billing events" value={billing.length} />
        <StatTile label="Pending invoices" value={pending.length} />
        <StatTile label="Total collected" value={fmt(totalBilled)} />
      </div>

      <div style={{ marginBottom: 10, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>
        Billing History
      </div>

      {billing.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#fff", border: "1px solid #d9e0ea", borderRadius: 16 }}>
          No billing events yet.
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #d9e0ea", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Subscriber", "Plan", "Amount", "Status", "Date", "Invoice"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", borderBottom: "1px solid #d9e0ea" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billing.map((b) => {
                const badge = BILLING_STATUS_COLORS[b.billing_status] || BILLING_STATUS_COLORS.pending;
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f1720" }}>{b.full_name || "—"}</div>
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{b.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f1720" }}>{b.plan_name}</div>
                      <div style={{ color: "#64748b", fontSize: 11, marginTop: 2, textTransform: "capitalize" }}>{b.billing_cycle}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, fontSize: 15, color: "#0f1720" }}>{fmt(b.amount_cents)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 8, padding: "3px 10px", fontWeight: 700, fontSize: 11, textTransform: "capitalize" }}>
                        {b.billing_status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#0f1720" }}>{fmtDate(b.billing_date)}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{b.external_invoice_id || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24, padding: "16px 20px", background: "#f8fafc", border: "1px solid #d9e0ea", borderRadius: 16, fontSize: 13, color: "#64748b" }}>
        <strong style={{ color: "#0f1720" }}>Commission tracking</strong> — not yet set up. A commission table will be added once the commission structure is defined.
      </div>
    </div>
  );
}

// ── Food Orders tab ────────────────────────────────────────────────────────────
function FoodOrdersTab() {
  const [restaurantId, setRestaurantId] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [stuckOnly, setStuckOnly] = useState(false);
  const [state, setState] = useState({ status: "loading", orders: [], error: "" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await getCrmOrders({
          restaurantId: restaurantId || undefined,
          status: orderStatus || undefined,
          paymentStatus: paymentStatus || undefined,
          stuckOnly: stuckOnly ? "true" : undefined,
          limit: 50,
        });
        if (cancelled) return;
        setState({ status: "ready", orders: response.orders || [], error: "" });
      } catch (err) {
        if (cancelled) return;
        setState({ status: "error", orders: [], error: err.message || "Unable to load orders." });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [restaurantId, orderStatus, paymentStatus, stuckOnly]);

  const summary = useMemo(() => {
    const orders = state.orders || [];
    return {
      total: orders.length,
      paid_stuck: orders.filter((o) => o.operational_flags?.includes("paid_stuck")).length,
      failed: orders.filter((o) => o.payment_status === "failed").length,
    };
  }, [state.orders]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <StatTile label="Loaded" value={summary.total} />
        <StatTile label="Paid but stuck" value={summary.paid_stuck} />
        <StatTile label="Failed" value={summary.failed} />
      </div>

      <CrmCard title="Filters" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Restaurant ID</span>
            <input value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Order status</span>
            <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} style={inputStyle}>
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
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={inputStyle}>
              <option value="">All</option>
              <option value="succeeded">Succeeded</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
            <input type="checkbox" checked={stuckOnly} onChange={(e) => setStuckOnly(e.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1720" }}>Stuck only</span>
          </label>
        </div>
      </CrmCard>

      {state.error && <ErrorBanner message={state.error} />}

      <div style={{ display: "grid", gap: 14 }}>
        {(state.orders || []).map((order) => (
          <CrmCard key={order.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", fontWeight: 700 }}>
                  Order #{order.id} • Restaurant #{order.restaurant_id}
                </div>
                <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: "#0f1720" }}>{order.restaurant_name}</div>
                <div style={{ marginTop: 4, fontSize: 14, color: "#475467" }}>{order.customer_name} • {fmtDateTime(order.created_at)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f1720" }}>{fmt(order.total_cents)}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <Badge type="account" value={order.payment_status} />
                  <Badge type="stage" value={order.order_status} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
              <div style={metaBlockStyle}><strong>Fulfillment:</strong> {order.fulfillment_type}</div>
              <div style={metaBlockStyle}><strong>Latest event:</strong> {fmtDateTime(order.latest_event_at)}</div>
              <div style={metaBlockStyle}><strong>Flags:</strong> {order.operational_flags?.length ? order.operational_flags.join(", ") : "—"}</div>
              <div style={metaBlockStyle}><strong>Items:</strong> {order.items.map((i) => `${i.quantity}x ${i.name_snapshot}`).join(", ") || "—"}</div>
            </div>
            <div style={{ marginTop: 14 }}>
              <LinkCell to={`/crm/orders/${order.id}`}>Inspect order</LinkCell>
            </div>
          </CrmCard>
        ))}
        {state.status === "ready" && state.orders.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#fff", border: "1px solid #d9e0ea", borderRadius: 16 }}>No food orders match the current filters.</div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("billing");

  return (
    <CrmPage
      title="Orders"
      actions={
        <Link to="/crm" style={{ textDecoration: "none", background: "#194b3a", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>
          Back to dashboard
        </Link>
      }
    >
      <div style={{ display: "flex", gap: 0, marginBottom: 0, borderBottom: "1px solid #d9e0ea" }}>
        <Tab label="Subscriptions & Billing" active={tab === "billing"} onClick={() => setTab("billing")} />
        <Tab label="Food Orders" active={tab === "food"} onClick={() => setTab("food")} />
      </div>

      <div style={{ paddingTop: 24 }}>
        {tab === "billing" ? <BillingTab /> : <FoodOrdersTab />}
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
