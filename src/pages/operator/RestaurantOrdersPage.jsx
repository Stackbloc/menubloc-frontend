import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  API_BASE,
  acceptOrder,
  confirmDeliveryPickup,
  declineOrder,
  getLiveOrders,
  getOrderAvailability,
  getOrderHistory,
  markOrderCompleted,
  markOrderPreparing,
  markOrderReady,
  updateOrderAvailability,
} from "../../lib/operatorApi.js";

// ── Audio ─────────────────────────────────────────────────────────────────

// Volume levels — minimum floor is "low"; alerts cannot be silenced entirely.
const VOLUME_LEVELS = [
  { key: "low",    label: "Low",    gain: 0.15 },
  { key: "medium", label: "Med",    gain: 0.35 },
  { key: "high",   label: "High",   gain: 0.65 },
  { key: "max",    label: "Max",    gain: 0.90 },
];
const DEFAULT_VOLUME = "medium";

function playAlertBeep(gainValue = 0.35) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  } catch (_) {
    // Audio not available in this environment
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt$(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
  }).format(Number(cents || 0) / 100);
}

function fmtTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function fmtTimeShort(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Returns elapsed minutes from createdAt to now
function elapsedMinutes(createdAt, now) {
  if (!createdAt) return 0;
  return Math.floor((now - new Date(createdAt)) / 60000);
}

// 0 = normal, 1 = warning (5–10 min), 2 = critical (10+ min)
function escalationLevel(createdAt, now) {
  const mins = elapsedMinutes(createdAt, now);
  if (mins >= 10) return 2;
  if (mins >= 5) return 1;
  return 0;
}

const ESCALATION_STYLES = [
  { border: "2px solid #dc2626", shadow: "0 8px 28px rgba(220,38,38,0.12)", badge: null },
  { border: "2px solid #d97706", shadow: "0 8px 28px rgba(217,119,6,0.14)", badge: { bg: "#fef3c7", color: "#92400e", text: "⚠ Waiting" } },
  { border: "2px solid #b91c1c", shadow: "0 8px 28px rgba(185,28,28,0.22)", badge: { bg: "#fee2e2", color: "#991b1b", text: "🚨 Urgent" } },
];

// ── Sub-components ────────────────────────────────────────────────────────

function StatusPill({ value }) {
  const text = String(value || "").toLowerCase();
  const map = {
    paid:      { bg: "#fef3c7", color: "#92400e" },
    merchant_acceptance_pending: { bg: "#ffedd5", color: "#9a3412" },
    accepted:  { bg: "#dcfce7", color: "#166534" },
    rejected:  { bg: "#fee2e2", color: "#991b1b" },
    preparing: { bg: "#dbeafe", color: "#1d4ed8" },
    ready:     { bg: "#dcfce7", color: "#166534" },
    completed: { bg: "#e5e7eb", color: "#374151" },
    canceled:  { bg: "#fee2e2", color: "#991b1b" },
    refunded:  { bg: "#fee2e2", color: "#991b1b" },
    pickup:    { bg: "#ede9fe", color: "#5b21b6" },
    delivery:  { bg: "#e0f2fe", color: "#075985" },
  };
  const s = map[text] || { bg: "#e2e8f0", color: "#334155" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "4px 10px", borderRadius: 999,
      fontSize: 12, fontWeight: 800,
      background: s.bg, color: s.color, textTransform: "capitalize",
    }}>
      {text.replace(/_/g, " ")}
    </span>
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
    }}>
      Refund pending — customer has not yet been fully refunded.
    </div>
  );
}

function LegacyPaidBadge() {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      background: "#ede9fe",
      color: "#5b21b6",
      textTransform: "none",
    }}>
      Legacy Paid Order
    </span>
  );
}

function ElapsedBadge({ createdAt, now }) {
  const mins = elapsedMinutes(createdAt, now);
  const level = escalationLevel(createdAt, now);
  if (level === 0 && mins < 1) return null;
  const colors = [
    { bg: "#e2e8f0", color: "#475467" },
    { bg: "#fef3c7", color: "#92400e" },
    { bg: "#fee2e2", color: "#991b1b" },
  ][level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 8px", borderRadius: 999,
      fontSize: 12, fontWeight: 800,
      background: colors.bg, color: colors.color,
    }}>
      {ESCALATION_STYLES[level].badge?.text ?? ""} {mins}m ago
    </span>
  );
}

function ItemList({ items }) {
  if (!items || items.length === 0) {
    return <div style={{ color: "#8a9ab0", fontSize: 14 }}>No items</div>;
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item, i) => (
        <div key={item.id || i} style={{
          padding: "10px 12px", borderRadius: 10,
          background: "#f8fafc", border: "1px solid #e4e9f0",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#0f1720" }}>
              {item.quantity}× {item.name_snapshot}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f1720", whiteSpace: "nowrap" }}>
              {fmt$(item.line_total_cents)}
            </div>
          </div>
          {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 12, color: "#475467" }}>
              {item.modifiers.map((m) => m.name).join(", ")}
            </div>
          )}
          {item.special_instructions && (
            <div style={{ marginTop: 4, fontSize: 12, color: "#dc7f2b", fontStyle: "italic" }}>
              Note: {item.special_instructions}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DeliveryAddress({ order }) {
  if (order.fulfillment_type !== "delivery") return null;
  const addr = order.delivery_address_json || {};
  const lines = [
    addr.name, addr.line1, addr.line2,
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.postalCode,
  ].filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <div style={{
      marginTop: 12, padding: "10px 12px", borderRadius: 10,
      background: "#e0f2fe", border: "1px solid #bae6fd",
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#075985", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        Delivery Address
      </div>
      {lines.map((line) => (
        <div key={line} style={{ fontSize: 13, color: "#0f1720" }}>{line}</div>
      ))}
      {addr.instructions && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#475467", fontStyle: "italic" }}>
          Instructions: {addr.instructions}
        </div>
      )}
    </div>
  );
}

// ── Print Ticket ──────────────────────────────────────────────────────────

function PrintTicket({ order }) {
  if (!order) return null;
  return (
    <div id="menuply-order-ticket" style={{
      fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, padding: 24, maxWidth: 400,
    }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>MENUPLY</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>ORDER #{order.id}</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, textTransform: "uppercase" }}>
          {order.fulfillment_type === "delivery" ? "DELIVERY" : "PICKUP"}
        </div>
        {order.restaurant_name && (
          <div style={{ fontSize: 14, marginTop: 2 }}>{order.restaurant_name}</div>
        )}
      </div>
      <div style={{ borderTop: "2px dashed #000", margin: "12px 0" }} />
      <div><strong>Customer:</strong> {order.customer_name}</div>
      <div><strong>Phone:</strong> {order.customer_phone || "—"}</div>
      {order.fulfillment_type === "delivery" && (() => {
        const addr = order.delivery_address_json || {};
        const lines = [addr.name, addr.line1, addr.line2, [addr.city, addr.state].filter(Boolean).join(", "), addr.postalCode].filter(Boolean);
        return lines.length > 0 ? (
          <div><strong>Deliver to:</strong><br />{lines.join(", ")}</div>
        ) : null;
      })()}
      <div><strong>Ordered:</strong> {fmtTime(order.created_at)}</div>
      <div><strong>Confirmed:</strong> {fmtTime(order.confirmed_at)}</div>
      <div style={{ borderTop: "2px dashed #000", margin: "12px 0" }} />
      <div style={{ fontWeight: 800, marginBottom: 6 }}>ITEMS</div>
      {(order.items || []).map((item, i) => (
        <div key={item.id || i} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>{item.quantity}× {item.name_snapshot}</div>
          {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
            <div style={{ paddingLeft: 12, fontSize: 12 }}>+ {item.modifiers.map((m) => m.name).join(", ")}</div>
          )}
          {item.special_instructions && (
            <div style={{ paddingLeft: 12, fontSize: 12 }}>* {item.special_instructions}</div>
          )}
          <div style={{ textAlign: "right" }}>{fmt$(item.line_total_cents)}</div>
        </div>
      ))}
      <div style={{ borderTop: "2px dashed #000", margin: "12px 0" }} />
      {order.notes && <div><strong>Instructions:</strong> {order.notes}</div>}
      <div style={{ textAlign: "right", marginTop: 8 }}>
        <div>Subtotal: {fmt$(order.subtotal_cents)}</div>
        <div>Tax: {fmt$(order.tax_cents)}</div>
        {Number(order.delivery_provider_fee_cents || 0) > 0 && <div>Provider delivery fee: {fmt$(order.delivery_provider_fee_cents)}</div>}
        {Number(order.delivery_fee_cents || 0) > 0 && <div>{order.delivery_payload_json?.delivery_fee_label || "Delivery fee"}: {fmt$(order.delivery_fee_cents)}</div>}
        <div style={{ fontWeight: 900, fontSize: 16 }}>Total: {fmt$(order.total_cents)}</div>
      </div>
      <div style={{ borderTop: "2px dashed #000", margin: "12px 0", textAlign: "center", fontSize: 11, color: "#475467" }}>
        Thank you — Powered by Menuply
      </div>
    </div>
  );
}

// ── Pending order card ────────────────────────────────────────────────────

function PendingCard({ order, onPreparing, onReady, onCompleted, onPickedUp, busy }) {
  const isDelivery = order.fulfillment_type === "delivery";
  const deliveryPickedUp = order.delivery_status === "picked_up";
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "16px 18px",
      border: order.order_status === "ready" ? "2px solid #16a34a" : "1px solid #e4e9f0",
      boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#8a9ab0", textTransform: "uppercase" }}>#{order.id}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f1720", marginTop: 2 }}>{order.customer_name}</div>
          <div style={{ fontSize: 13, color: "#5b6675", marginTop: 2 }}>
            {fmtTimeShort(order.created_at)} • {order.customer_phone || "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f1720" }}>{fmt$(order.total_cents)}</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6, flexWrap: "wrap" }}>
            <StatusPill value={order.order_status} />
            <StatusPill value={order.fulfillment_type} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {order.order_status === "accepted" && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => onPreparing(order.id)}
            style={{
              minHeight: 44, padding: "10px 18px", borderRadius: 12,
              border: "none", background: "#14532d", color: "#fff",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}
          >
            {busy === "preparing" ? "Updating…" : "Start Preparing"}
          </button>
        )}
        {order.order_status === "preparing" && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => onReady(order.id)}
            style={{
              minHeight: 44, padding: "10px 18px", borderRadius: 12,
              border: "none", background: "#1F4E3D", color: "#fff",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}
          >
            {busy === "ready" ? "Updating…" : "Mark Ready"}
          </button>
        )}
        {isDelivery && !deliveryPickedUp && order.order_status === "ready" && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => onPickedUp(order.id)}
            style={{
              minHeight: 44, padding: "10px 18px", borderRadius: 12,
              border: "none", background: "#0369a1", color: "#fff",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}
          >
            {busy === "pickedup" ? "Updating…" : "Confirm Picked Up"}
          </button>
        )}
        {isDelivery && deliveryPickedUp && (
          <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700, alignSelf: "center" }}>
            ✓ Delivery Picked Up
          </span>
        )}
        {order.order_status === "ready" && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => onCompleted(order.id)}
            style={{
              minHeight: 44, padding: "10px 18px", borderRadius: 12,
              border: "none", background: "#111827", color: "#fff",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}
          >
            {busy === "completed" ? "Updating…" : "Mark Completed"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── History table row ─────────────────────────────────────────────────────

function HistoryRow({ order }) {
  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td style={{ padding: "10px 8px", fontSize: 13, color: "#0f1720", fontWeight: 700 }}>#{order.id}</td>
      <td style={{ padding: "10px 8px", fontSize: 12, color: "#475467" }}>{fmtTime(order.created_at)}</td>
      <td style={{ padding: "10px 8px", fontSize: 13, color: "#0f1720" }}>{order.customer_name}</td>
      <td style={{ padding: "10px 8px" }}><StatusPill value={order.fulfillment_type} /></td>
      <td style={{ padding: "10px 8px" }}><StatusPill value={order.order_status} /></td>
      <td style={{ padding: "10px 8px", fontSize: 13, fontWeight: 800, color: "#0f1720", textAlign: "right" }}>{fmt$(order.total_cents)}</td>
      <td style={{ padding: "10px 8px", fontSize: 13, color: "#475467", textAlign: "center" }}>{order.item_count}</td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function RestaurantOrdersPage() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const [searchParams] = useSearchParams();

  // Live queue state
  const [liveOrders, setLiveOrders] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);

  // History / cancelled
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ status: "", fulfillment_type: "", days: 21 });
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [cancelledLoading, setCancelledLoading] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [completedLoading, setCompletedLoading] = useState(false);

  // UI tabs — support ?tab=history from sidebar link
  const initialTab = ["pending", "completed", "cancelled", "history"].includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "pending";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Audio — always active after first user gesture; volume controls level (no mute/disable)
  const [audioReady, setAudioReady] = useState(false);   // true after browser gesture
  const audioReadyRef = useRef(false);
  const [alertVolume, setAlertVolume] = useState(DEFAULT_VOLUME);
  const alertVolumeRef = useRef(DEFAULT_VOLUME);

  // SSE connection status
  const [sseStatus, setSseStatus] = useState("disconnected");
  // "connecting" | "connected" | "reconnecting" | "disconnected"

  // Flash banner animation (alternates at 700ms)
  const [flashOn, setFlashOn] = useState(true);

  // Clock tick for elapsed-time display (every 30 s)
  const [now, setNow] = useState(() => Date.now());

  // Action busy state
  const [busyOrder, setBusyOrder] = useState(null); // "orderId:action"

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [declineReasonCode, setDeclineReasonCode] = useState("");
  const [declineNote, setDeclineNote] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [availabilityDraft, setAvailabilityDraft] = useState({
    reason_code: "",
    note: "",
  });
  const [availabilityConfirm, setAvailabilityConfirm] = useState(null);

  // Print ticket
  const [printOrder, setPrintOrder] = useState(null);
  const printFiredRef = useRef(false);

  // Refresh trigger (incremented to reload live orders)
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // ── Derived queues ───────────────────────────────────────────────────────
  const incomingOrders = liveOrders.filter((o) =>
    ["paid", "merchant_acceptance_pending"].includes(o.order_status)
  );
  const pendingOrders = liveOrders.filter((o) =>
    ["accepted", "preparing", "ready"].includes(o.order_status)
  );
  const hasIncoming = incomingOrders.length > 0;
  const selectedIncoming = incomingOrders[0] ?? null;

  // ── Flash banner ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasIncoming) return;
    const id = setInterval(() => setFlashOn((v) => !v), 700);
    return () => clearInterval(id);
  }, [hasIncoming]);

  // ── Elapsed-time tick ────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // ── Repeating alert beep (every 30 s while unacknowledged orders exist) ──
  // Alerts always fire once audio is ready — volume controls level, not on/off.
  useEffect(() => {
    if (!hasIncoming || !audioReady) return;
    const gain = VOLUME_LEVELS.find((v) => v.key === alertVolumeRef.current)?.gain ?? 0.35;
    const id = setInterval(() => playAlertBeep(gain), 30000);
    return () => clearInterval(id);
  }, [hasIncoming, audioReady]);

  // ── Load live orders from API ─────────────────────────────────────────────
  const loadLive = useCallback(async (restaurantId) => {
    if (!restaurantId) return;
    setLiveLoading(true);
    try {
      const data = await getLiveOrders(restaurantId);
      setLiveOrders(data.orders || []);
    } catch (_) {
      // Keep stale data on failure — polling will retry
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const loadAvailability = useCallback(async (restaurantId) => {
    if (!restaurantId) return;
    try {
      const data = await getOrderAvailability(restaurantId);
      setAvailability(data.availability || null);
      setAvailabilityDraft({
        reason_code: data.availability?.order_acceptance_reason_code || "",
        note: data.availability?.order_acceptance_note || "",
      });
    } catch (_) {
      // Keep the previous availability state if refresh fails.
    }
  }, []);

  // ── SSE + 15-s polling fallback ───────────────────────────────────────────
  useEffect(() => {
    if (!rid) return;

    // Immediate fetch on mount or restaurant change
    loadLive(rid);
    loadAvailability(rid);

    // Polling fallback — guarantees data even if SSE is down
    const pollId = setInterval(() => loadLive(rid), 15000);

    // SSE connection
    setSseStatus("connecting");
    const es = new EventSource(
      `${API_BASE}/operator/restaurants/${rid}/orders/stream`,
      { withCredentials: true }
    );

    es.addEventListener("connected", () => {
      setSseStatus("connected");
      // Re-fetch immediately on (re)connect to catch any missed events
      loadLive(rid);
    });

    es.addEventListener("new_order", () => {
      if (audioReadyRef.current) {
        const gain = VOLUME_LEVELS.find((v) => v.key === alertVolumeRef.current)?.gain ?? 0.35;
        playAlertBeep(gain);
      }
      loadLive(rid);
    });

    es.addEventListener("order_confirmed", () => loadLive(rid));
    es.addEventListener("order_cancelled", () => loadLive(rid));
    es.addEventListener("order_ready", () => loadLive(rid));
    es.addEventListener("delivery_picked_up", () => loadLive(rid));

    // EventSource auto-reconnects — onerror fires on each failed attempt
    es.onerror = () => setSseStatus("reconnecting");

    return () => {
      es.close();
      clearInterval(pollId);
      setSseStatus("disconnected");
    };
  }, [rid, loadLive, loadAvailability]);

  // Re-load on manual refresh
  useEffect(() => {
    if (rid && refreshKey > 0) loadLive(rid);
  }, [refreshKey, rid, loadLive]);

  // ── History tab ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "history" || !rid) return;
    setHistoryLoading(true);
    getOrderHistory(rid, historyFilter)
      .then((data) => setHistoryOrders(data.orders || []))
      .catch(() => setHistoryOrders([]))
      .finally(() => setHistoryLoading(false));
  }, [activeTab, rid, historyFilter]);

  // ── Cancelled tab ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "cancelled" || !rid) return;
    setCancelledLoading(true);
    getOrderHistory(rid, { days: 2, status: "canceled" })
      .then((data) => setCancelledOrders(data.orders || []))
      .catch(() => setCancelledOrders([]))
      .finally(() => setCancelledLoading(false));
  }, [activeTab, rid, refreshKey]);

  // ── Completed tab ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "completed" || !rid) return;
    setCompletedLoading(true);
    getOrderHistory(rid, { days: 2, status: "completed" })
      .then((data) => setCompletedOrders(data.orders || []))
      .catch(() => setCompletedOrders([]))
      .finally(() => setCompletedLoading(false));
  }, [activeTab, rid, refreshKey]);

  // ── Auto-print after confirm ───────────────────────────────────────────────
  useEffect(() => {
    if (printOrder && !printFiredRef.current) {
      printFiredRef.current = true;
      requestAnimationFrame(() => setTimeout(() => window.print(), 120));
    }
    if (!printOrder) printFiredRef.current = false;
  }, [printOrder]);

  // ── Audio controls ────────────────────────────────────────────────────────
  function handleActivateAlerts() {
    // Browser requires a user gesture to unlock AudioContext.
    // After this, alerts always fire; volume controls the level (no mute/disable).
    const gain = VOLUME_LEVELS.find((v) => v.key === alertVolumeRef.current)?.gain ?? 0.35;
    playAlertBeep(gain);
    audioReadyRef.current = true;
    setAudioReady(true);
  }

  function handleVolumeChange(levelKey) {
    alertVolumeRef.current = levelKey;
    setAlertVolume(levelKey);
    // Play a short preview at the new level
    if (audioReady) {
      const gain = VOLUME_LEVELS.find((v) => v.key === levelKey)?.gain ?? 0.35;
      playAlertBeep(gain);
    }
  }

  // ── Order actions ─────────────────────────────────────────────────────────
  async function handleAccept(orderId) {
    setBusyOrder(`${orderId}:accept`);
    try {
      const data = await acceptOrder(rid, orderId);
      setPrintOrder(data.order);
      refresh();
    } catch (err) {
      window.alert(err.message || "Unable to accept order.");
    } finally {
      setBusyOrder(null);
    }
  }

  function openDeclineModal(orderId) {
    setCancelTarget(orderId);
    setDeclineReasonCode("");
    setDeclineNote("");
  }

  async function handleDeclineSubmit() {
    if (!cancelTarget) return;
    setCancelBusy(true);
    try {
      const response = await declineOrder(rid, cancelTarget, {
        reason_code: declineReasonCode || undefined,
        note: declineNote || undefined,
      });
      setCancelTarget(null);
      refresh();
      if (response?.order?.refund_error) {
        window.alert(`Order declined, but refund is pending: ${response.order.refund_error}`);
      }
    } catch (err) {
      window.alert(err.message || "Unable to decline order.");
    } finally {
      setCancelBusy(false);
    }
  }

  async function handlePreparing(orderId) {
    setBusyOrder(`${orderId}:preparing`);
    try {
      await markOrderPreparing(rid, orderId);
      refresh();
    } catch (err) {
      window.alert(err.message || "Unable to move order to preparing.");
    } finally {
      setBusyOrder(null);
    }
  }

  async function handleReady(orderId) {
    setBusyOrder(`${orderId}:ready`);
    try {
      await markOrderReady(rid, orderId);
      refresh();
    } catch (err) {
      window.alert(err.message || "Unable to mark order ready.");
    } finally {
      setBusyOrder(null);
    }
  }

  async function handleCompleted(orderId) {
    setBusyOrder(`${orderId}:completed`);
    try {
      await markOrderCompleted(rid, orderId);
      refresh();
    } catch (err) {
      window.alert(err.message || "Unable to mark order completed.");
    } finally {
      setBusyOrder(null);
    }
  }

  async function handlePickedUp(orderId) {
    setBusyOrder(`${orderId}:pickedup`);
    try {
      await confirmDeliveryPickup(rid, orderId);
      refresh();
    } catch (err) {
      window.alert(err.message || "Unable to confirm pickup.");
    } finally {
      setBusyOrder(null);
    }
  }

  async function handleAvailabilityUpdate(status) {
    setAvailabilityBusy(true);
    try {
      const data = await updateOrderAvailability(rid, {
        status,
        reason_code: status === "accepting_orders" ? undefined : availabilityDraft.reason_code || undefined,
        note: status === "accepting_orders" ? undefined : availabilityDraft.note || undefined,
      });
      setAvailability(data.availability || null);
      setAvailabilityDraft({
        reason_code: data.availability?.order_acceptance_reason_code || "",
        note: data.availability?.order_acceptance_note || "",
      });
    } catch (err) {
      window.alert(err.message || "Unable to update availability.");
    } finally {
      setAvailabilityBusy(false);
    }
  }

  function requestAvailabilityUpdate(status) {
    if (status === "paused" || status === "closed") {
      setAvailabilityConfirm(status);
      return;
    }
    handleAvailabilityUpdate(status);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const connLost = sseStatus === "reconnecting" || sseStatus === "disconnected";
  const sseLabel =
    sseStatus === "connected" ? "● Live"
    : sseStatus === "connecting" ? "◌ Connecting…"
    : sseStatus === "reconnecting" ? "● Reconnecting…"
    : "○ Disconnected";
  const sseColor =
    sseStatus === "connected" ? "#16a34a"
    : sseStatus === "connecting" ? "#d97706"
    : "#dc2626";
  const availabilityStatus = availability?.order_acceptance_status || "accepting_orders";
  const availabilityStyles = {
    accepting_orders: { bg: "#ecfdf3", border: "#86efac", color: "#166534", label: "Accepting Orders" },
    paused: { bg: "#fffbeb", border: "#fcd34d", color: "#92400e", label: "Orders Paused" },
    closed: { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b", label: "Orders Closed" },
  }[availabilityStatus];

  return (
    <OperatorLayout title="Incoming Orders">
      {/* Print-only CSS — visibility trick isolates the ticket during print */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #menuply-order-ticket, #menuply-order-ticket * { visibility: visible !important; }
          #menuply-order-ticket {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important; padding: 24px !important;
            background: white !important;
          }
          @page { margin: 0.5cm; }
        }
        #menuply-order-ticket { display: none; }
        @media print { #menuply-order-ticket { display: block !important; } }
      `}</style>

      {/* Hidden print ticket — made visible only by window.print() */}
      <PrintTicket order={printOrder} />

      {!selectedRestaurant ? (
        <div style={{ color: "#5b6675", padding: 24 }}>Select a restaurant to view orders.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, minHeight: "100%" }}>

          {/* ── Connection lost banner ─────────────────────────────────── */}
          {connLost && (
            <div style={{
              padding: "12px 18px", borderRadius: 14,
              background: "#fef3c7", border: "2px solid #d97706",
              color: "#92400e", fontWeight: 800, fontSize: 15,
              display: "flex", alignItems: "center", gap: 10,
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 20 }}>⚠</span>
              Connection Lost — Reconnecting. Orders are still being polled every 15 seconds.
            </div>
          )}

          {/* ── Top bar ──────────────────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, flexWrap: "wrap", paddingBottom: 14,
            borderBottom: "1px solid #e4e9f0", marginBottom: 0,
          }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f1720" }}>
                {selectedRestaurant.restaurant_name}
              </div>
              <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: sseColor }}>{sseLabel}</span>
                {liveLoading && <span style={{ fontSize: 12, color: "#8a9ab0" }}>Refreshing…</span>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {/* Audio — activate once (browser gesture), then show volume control */}
              {!audioReady ? (
                <button
                  type="button"
                  onClick={handleActivateAlerts}
                  style={{
                    minHeight: 44, padding: "10px 16px", borderRadius: 12,
                    border: "2px solid #1F4E3D", background: "#fff",
                    color: "#1F4E3D", fontSize: 14, fontWeight: 800, cursor: "pointer",
                  }}
                >
                  🔔 Activate Alerts
                </button>
              ) : (
                /* Volume selector — minimum is Low; no mute/disable option */
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#5b6675", fontWeight: 700 }}>🔔</span>
                  {VOLUME_LEVELS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleVolumeChange(key)}
                      style={{
                        minHeight: 36, padding: "6px 12px", borderRadius: 8,
                        border: alertVolume === key ? "2px solid #1F4E3D" : "1px solid #d0d5dd",
                        background: alertVolume === key ? "#edf7f2" : "#fff",
                        color: alertVolume === key ? "#1F4E3D" : "#5b6675",
                        fontSize: 12, fontWeight: alertVolume === key ? 800 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={refresh}
                style={{
                  minHeight: 44, padding: "10px 14px", borderRadius: 12,
                  border: "1px solid #d0d5dd", background: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#0f1720",
                }}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* ── Order Status Panel ────────────────────────────── */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { status: "accepting_orders", label: "Accepting Orders", dot: "#22c55e", activeText: "#166534", activeBg: "#dcfce7", activeBorder: "#86efac" },
              { status: "paused",           label: "Pause Orders",     dot: "#f59e0b", activeText: "#92400e", activeBg: "#fffbeb", activeBorder: "#fcd34d" },
              { status: "closed",           label: "Stop Orders",      dot: "#ef4444", activeText: "#991b1b", activeBg: "#fef2f2", activeBorder: "#fca5a5" },
            ].map(({ status, label, dot, activeText, activeBg, activeBorder }) => {
              const isActive = availabilityStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  disabled={availabilityBusy || isActive}
                  onClick={() => requestAvailabilityUpdate(status)}
                  style={{
                    flex: 1, minHeight: 54, borderRadius: 12,
                    border: isActive ? `2px solid ${activeBorder}` : "1.5px solid #e4e9f0",
                    background: isActive ? activeBg : "#fff",
                    cursor: isActive ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "10px 12px",
                    transition: "all 0.12s",
                    opacity: availabilityBusy && !isActive ? 0.6 : 1,
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{
                    width: 11, height: 11, borderRadius: "50%",
                    background: isActive ? dot : "#d0d5dd",
                    flexShrink: 0, display: "inline-block",
                    boxShadow: isActive ? `0 0 7px ${dot}` : "none",
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: isActive ? activeText : "#8a9ab0" }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── NEW ORDER flash banner ─────────────────────────────────── */}
          {hasIncoming && (
            <div style={{
              padding: "18px 24px", borderRadius: 16, marginTop: 14,
              background: flashOn ? "#dc2626" : "#fff",
              color: flashOn ? "#fff" : "#dc2626",
              border: "3px solid #dc2626",
              textAlign: "center", fontSize: 34, fontWeight: 900,
              letterSpacing: "0.05em", userSelect: "none",
              transition: "background 0.12s, color 0.12s",
            }}>
              NEW ORDER{incomingOrders.length > 1 ? ` (${incomingOrders.length})` : ""}
              {!audioReady && (
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, opacity: 0.75 }}>
                  Tap "Activate Alerts" above to enable sound
                </div>
              )}
            </div>
          )}

          {/* ── Main two-column panel ─────────────────────────────────── */}
          <div style={{
            display: "flex", gap: 20, marginTop: 18,
            alignItems: "flex-start", flexWrap: "wrap",
          }}>
            {/* LEFT: order detail */}
            <div style={{ flex: "1 1 0%", minWidth: 0 }}>
              {!hasIncoming ? (
                <div style={{
                  background: "#f8fafc", border: "1px dashed #d0d5dd", borderRadius: 16,
                  padding: "48px 24px", textAlign: "center", color: "#8a9ab0",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🟢</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>Awaiting new orders</div>
                  <div style={{ fontSize: 14, marginTop: 8 }}>
                    Orders appear here in real time. Polling every 15 s as backup.
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {incomingOrders.map((order, idx) => {
                    const level = escalationLevel(order.created_at, now);
                    const es = ESCALATION_STYLES[level];
                    return (
                      <div key={order.id} style={{
                        background: "#fff", borderRadius: 18, padding: "20px 20px 16px",
                        border: idx === 0 ? es.border : "1px solid #fca5a5",
                        boxShadow: idx === 0 ? es.shadow : "0 4px 12px rgba(15,23,42,0.05)",
                      }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: "#8a9ab0", textTransform: "uppercase" }}>
                              Order #{order.id}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f1720", marginTop: 2 }}>
                              {order.customer_name}
                            </div>
                            <div style={{ fontSize: 14, color: "#5b6675", marginTop: 4 }}>
                              {order.customer_phone || "No phone"} • {fmtTime(order.created_at)}
                            </div>
                            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              <StatusPill value={order.fulfillment_type} />
                              <StatusPill value={order.order_status} />
                              {order.order_status === "paid" ? <LegacyPaidBadge /> : null}
                              <ElapsedBadge createdAt={order.created_at} now={now} />
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: "#0f1720" }}>
                              {fmt$(order.total_cents, order.currency)}
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <ItemList items={order.items} />

                        {/* Delivery address */}
                        <DeliveryAddress order={order} />

                        {/* Special instructions */}
                        {order.notes && (
                          <div style={{
                            marginTop: 12, padding: "10px 12px", borderRadius: 10,
                            background: "#fffbeb", border: "1px solid #fde68a",
                            fontSize: 14, color: "#92400e",
                          }}>
                            <strong>Instructions:</strong> {order.notes}
                          </div>
                        )}

                        {order.payment_status === "payment_refund_pending" ? (
                          <RefundPendingBanner />
                        ) : null}

                        {/* Confirm / Cancel (always shown — sidebar duplicates on wide screens) */}
                        <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            disabled={busyOrder === `${order.id}:accept`}
                            onClick={() => handleAccept(order.id)}
                            style={{
                              flex: 1, minHeight: 56, minWidth: 140, borderRadius: 14,
                              border: "none", background: "#16a34a", color: "#fff",
                              fontSize: 18, fontWeight: 900, cursor: "pointer",
                              opacity: busyOrder === `${order.id}:accept` ? 0.7 : 1,
                            }}
                          >
                            {busyOrder === `${order.id}:accept` ? "Accepting…" : "✓ Accept Order"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeclineModal(order.id)}
                            disabled={!!busyOrder}
                            style={{
                              flex: 1, minHeight: 56, minWidth: 140, borderRadius: 14,
                              border: "none", background: "#dc2626", color: "#fff",
                              fontSize: 18, fontWeight: 900, cursor: "pointer",
                            }}
                          >
                            ✕ Decline Order
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: action panel (visible when incoming orders exist) */}
            {hasIncoming && selectedIncoming && (
              <div style={{
                width: 300, flexShrink: 0,
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                {/* Escalation badge */}
                {escalationLevel(selectedIncoming.created_at, now) > 0 && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 12,
                    background: escalationLevel(selectedIncoming.created_at, now) === 2 ? "#fee2e2" : "#fef3c7",
                    border: escalationLevel(selectedIncoming.created_at, now) === 2 ? "1px solid #fca5a5" : "1px solid #fde68a",
                    fontWeight: 800, fontSize: 14,
                    color: escalationLevel(selectedIncoming.created_at, now) === 2 ? "#991b1b" : "#92400e",
                  }}>
                    {escalationLevel(selectedIncoming.created_at, now) === 2 ? "🚨 Urgent" : "⚠ Waiting"} — {elapsedMinutes(selectedIncoming.created_at, now)} min
                  </div>
                )}

                {/* Order summary */}
                <div style={{
                  background: "#f8fafc", borderRadius: 16, padding: "16px 14px",
                  border: "1px solid #e4e9f0",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#8a9ab0", textTransform: "uppercase", marginBottom: 10 }}>
                    Order Summary
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#475467", marginBottom: 6 }}>
                    <span>Subtotal</span><span>{fmt$(selectedIncoming.subtotal_cents)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#475467", marginBottom: 6 }}>
                    <span>Tax</span><span>{fmt$(selectedIncoming.tax_cents)}</span>
                  </div>
                  {Number(selectedIncoming.delivery_provider_fee_cents || 0) > 0 ? (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#475467", marginBottom: 6 }}>
                      <span>Provider delivery fee</span><span>{fmt$(selectedIncoming.delivery_provider_fee_cents)}</span>
                    </div>
                  ) : null}
                  {Number(selectedIncoming.delivery_fee_cents || 0) > 0 ? (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#475467", marginBottom: 6 }}>
                      <span>{selectedIncoming.delivery_payload_json?.delivery_fee_label || "Delivery fee"}</span><span>{fmt$(selectedIncoming.delivery_fee_cents)}</span>
                    </div>
                  ) : null}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 18, fontWeight: 900, color: "#0f1720",
                    borderTop: "1px solid #e4e9f0", paddingTop: 10,
                  }}>
                    <span>Total</span><span>{fmt$(selectedIncoming.total_cents, selectedIncoming.currency)}</span>
                  </div>
                </div>

                {/* Confirm */}
                <button
                  type="button"
                  disabled={busyOrder === `${selectedIncoming.id}:accept`}
                  onClick={() => handleAccept(selectedIncoming.id)}
                  style={{
                    minHeight: 64, width: "100%", borderRadius: 16,
                    border: "none", background: "#16a34a", color: "#fff",
                    fontSize: 20, fontWeight: 900, cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
                    opacity: busyOrder === `${selectedIncoming.id}:accept` ? 0.7 : 1,
                  }}
                >
                  {busyOrder === `${selectedIncoming.id}:accept` ? "Accepting…" : "✓ Accept Order"}
                </button>

                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => openDeclineModal(selectedIncoming.id)}
                  disabled={!!busyOrder}
                  style={{
                    minHeight: 56, width: "100%", borderRadius: 16,
                    border: "none", background: "#fee2e2", color: "#dc2626",
                    fontSize: 18, fontWeight: 900, cursor: "pointer",
                  }}
                >
                  ✕ Decline Order
                </button>

                {selectedIncoming.fulfillment_type === "delivery" && (
                  <div style={{
                    padding: "10px 12px", borderRadius: 10,
                    background: "#e0f2fe", border: "1px solid #bae6fd",
                    fontSize: 13, color: "#075985", fontWeight: 600,
                  }}>
                    Delivery order — confirm pickup after courier collects.
                  </div>
                )}

                {selectedIncoming.payment_status === "payment_refund_pending" ? (
                  <RefundPendingBanner />
                ) : null}
              </div>
            )}
          </div>

          {/* ── Print ticket confirmation bar ─────────────────────────── */}
          {printOrder && (
            <div style={{
              marginTop: 20, padding: "16px 18px", borderRadius: 16,
              background: "#f0fdf4", border: "2px solid #16a34a",
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#166534", marginBottom: 10 }}>
                ✓ Order #{printOrder.id} accepted
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    minHeight: 48, padding: "10px 24px", borderRadius: 12,
                    border: "none", background: "#166534", color: "#fff",
                    fontSize: 16, fontWeight: 800, cursor: "pointer",
                  }}
                >
                  🖨 Print Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setPrintOrder(null)}
                  style={{
                    minHeight: 48, padding: "10px 18px", borderRadius: 12,
                    border: "1px solid #d0d5dd", background: "#fff",
                    fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151",
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* ── Bottom section: Pending / Cancelled / History ─────────── */}
          <div style={{ marginTop: 32 }}>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e4e9f0", marginBottom: 20 }}>
              {[
                { key: "pending",   label: `Pending Orders${pendingOrders.length > 0 ? ` (${pendingOrders.length})` : ""}` },
                { key: "completed", label: "Completed Orders" },
                { key: "cancelled", label: "Cancelled Orders" },
                { key: "history",   label: "Past Orders" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    minHeight: 48, padding: "10px 20px",
                    borderRadius: "12px 12px 0 0", border: "none",
                    background: activeTab === tab.key ? "#1F4E3D" : "transparent",
                    color: activeTab === tab.key ? "#fff" : "#5b6675",
                    fontSize: 15, fontWeight: 800, cursor: "pointer",
                    borderBottom: activeTab === tab.key ? "2px solid #1F4E3D" : "none",
                    marginBottom: -2,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pending Orders */}
            {activeTab === "pending" && (
              pendingOrders.length === 0 ? (
                <div style={{ color: "#8a9ab0", padding: "24px 0", fontSize: 15 }}>
                  No orders in progress.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                  {pendingOrders.map((order) => {
                    const orderBusy = busyOrder?.startsWith(`${order.id}:`)
                      ? busyOrder.split(":")[1]
                      : null;
                    return (
                      <PendingCard
                        key={order.id}
                        order={order}
                        onPreparing={handlePreparing}
                        onReady={handleReady}
                        onCompleted={handleCompleted}
                        onPickedUp={handlePickedUp}
                        busy={orderBusy}
                      />
                    );
                  })}
                </div>
              )
            )}

            {/* Completed Orders */}
            {activeTab === "completed" && (
              completedLoading ? (
                <div style={{ color: "#8a9ab0" }}>Loading…</div>
              ) : completedOrders.length === 0 ? (
                <div style={{ color: "#8a9ab0", padding: "24px 0", fontSize: 15 }}>
                  No completed orders in the last 2 days.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {completedOrders.map((order) => (
                    <div key={order.id} style={{
                      background: "#fff", borderRadius: 14, padding: "14px 16px",
                      border: "1px solid #e4e9f0",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#8a9ab0", textTransform: "uppercase" }}>#{order.id}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1720", marginTop: 2 }}>{order.customer_name}</div>
                          <div style={{ fontSize: 13, color: "#5b6675", marginTop: 2 }}>{fmtTime(order.created_at)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f1720" }}>{fmt$(order.total_cents)}</div>
                          <div style={{ marginTop: 6, display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <StatusPill value={order.fulfillment_type} />
                            <StatusPill value={order.order_status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Cancelled Orders */}
            {activeTab === "cancelled" && (
              cancelledLoading ? (
                <div style={{ color: "#8a9ab0" }}>Loading…</div>
              ) : cancelledOrders.length === 0 ? (
                <div style={{ color: "#8a9ab0", padding: "24px 0", fontSize: 15 }}>
                  No cancelled orders in the last 2 days.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {cancelledOrders.map((order) => (
                    <div key={order.id} style={{
                      background: "#fff", borderRadius: 14, padding: "14px 16px",
                      border: "1px solid #fca5a5",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#8a9ab0", textTransform: "uppercase" }}>#{order.id}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1720", marginTop: 2 }}>{order.customer_name}</div>
                          <div style={{ fontSize: 13, color: "#5b6675", marginTop: 2 }}>{fmtTime(order.created_at)}</div>
                          {order.cancellation_reason && (
                            <div style={{ marginTop: 6, fontSize: 13, color: "#dc2626", fontStyle: "italic" }}>
                              Reason: {order.cancellation_reason}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>{fmt$(order.total_cents)}</div>
                          <div style={{ marginTop: 6 }}><StatusPill value={order.fulfillment_type} /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* 21-Day History */}
            {activeTab === "history" && (
              <div>
                {/* Filters */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                  {[
                    {
                      label: "Status", value: historyFilter.status,
                      onChange: (v) => setHistoryFilter((f) => ({ ...f, status: v })),
                      options: [
                        ["", "All Statuses"], ["paid", "Paid (Legacy)"], ["merchant_acceptance_pending", "Awaiting Acceptance"],
                        ["accepted", "Accepted"], ["preparing", "Preparing"],
                        ["ready", "Ready"], ["completed", "Completed"],
                        ["rejected", "Rejected"], ["canceled", "Cancelled"], ["refunded", "Refunded"],
                      ],
                    },
                    {
                      label: "Type", value: historyFilter.fulfillment_type,
                      onChange: (v) => setHistoryFilter((f) => ({ ...f, fulfillment_type: v })),
                      options: [["", "All Types"], ["pickup", "Pickup"], ["delivery", "Delivery"]],
                    },
                    {
                      label: "Range", value: historyFilter.days,
                      onChange: (v) => setHistoryFilter((f) => ({ ...f, days: Number(v) })),
                      options: [[1, "Last 24 h"], [7, "Last 7 days"], [21, "Last 21 days"], [30, "Last 30 days"]],
                    },
                  ].map(({ label, value, onChange, options }) => (
                    <select
                      key={label}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      style={{
                        minHeight: 40, padding: "6px 12px", borderRadius: 10,
                        border: "1px solid #d0d5dd", fontSize: 13, fontWeight: 600,
                      }}
                    >
                      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ))}
                </div>

                {historyLoading ? (
                  <div style={{ color: "#8a9ab0" }}>Loading history…</div>
                ) : historyOrders.length === 0 ? (
                  <div style={{ color: "#8a9ab0", padding: "24px 0" }}>No orders in this period.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e4e9f0" }}>
                          {["Order #", "Date / Time", "Customer", "Type", "Status", "Total", "Items"].map((h) => (
                            <th key={h} style={{
                              padding: "8px 8px 10px",
                              textAlign: h === "Total" || h === "Items" ? "right" : "left",
                              fontWeight: 800, color: "#374151",
                              fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em",
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {historyOrders.map((order) => (
                          <HistoryRow key={order.id} order={order} />
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: 10, fontSize: 12, color: "#8a9ab0" }}>
                      {historyOrders.length} order{historyOrders.length !== 1 ? "s" : ""} — last {historyFilter.days} day{historyFilter.days !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cancel reason modal ───────────────────────────────────────────── */}
      {cancelTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px",
            width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f1720", marginBottom: 6 }}>
              Decline Order #{cancelTarget}?
            </div>
            <div style={{ fontSize: 14, color: "#5b6675", marginBottom: 16 }}>
              This will reject the order. If payment was captured, refund handling will start immediately.
            </div>
            <select
              value={declineReasonCode}
              onChange={(e) => setDeclineReasonCode(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: "1px solid #d0d5dd", fontSize: 14, boxSizing: "border-box",
                marginBottom: 12,
              }}
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
              placeholder="Optional note"
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: "1px solid #d0d5dd", fontSize: 14, resize: "vertical",
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={cancelBusy}
                onClick={handleDeclineSubmit}
                style={{
                  flex: 1, minHeight: 52, borderRadius: 14, border: "none",
                  background: "#dc2626", color: "#fff",
                  fontSize: 16, fontWeight: 900, cursor: "pointer",
                }}
              >
                {cancelBusy ? "Declining…" : "Yes, Decline Order"}
              </button>
              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => setCancelTarget(null)}
                style={{
                  flex: 1, minHeight: 52, borderRadius: 14,
                  border: "1px solid #d0d5dd", background: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: "pointer", color: "#374151",
                }}
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      {availabilityConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px",
            width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f1720", marginBottom: 6 }}>
              {availabilityConfirm === "paused" ? "Pause new incoming orders?" : "Stop accepting new orders?"}
            </div>
            <div style={{ fontSize: 14, color: "#5b6675", marginBottom: 16 }}>
              Customers will still be able to browse your menu.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={availabilityBusy}
                onClick={async () => {
                  const nextStatus = availabilityConfirm;
                  setAvailabilityConfirm(null);
                  await handleAvailabilityUpdate(nextStatus);
                }}
                style={{
                  flex: 1, minHeight: 52, borderRadius: 14, border: "none",
                  background: availabilityConfirm === "closed" ? "#b91c1c" : "#d97706",
                  color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer",
                }}
              >
                {availabilityBusy ? "Updating…" : availabilityConfirm === "closed" ? "Yes, Stop Orders" : "Yes, Pause Orders"}
              </button>
              <button
                type="button"
                disabled={availabilityBusy}
                onClick={() => setAvailabilityConfirm(null)}
                style={{
                  flex: 1, minHeight: 52, borderRadius: 14,
                  border: "1px solid #d0d5dd", background: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: "pointer", color: "#374151",
                }}
              >
                Keep Accepting Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </OperatorLayout>
  );
}
