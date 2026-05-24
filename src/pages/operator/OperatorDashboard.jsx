import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const GREEN = "#1F4E3D";
const BORDER = "#e4e9f0";

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt$(cents) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
    .format(Number(cents) / 100);
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay()); // Sunday
  return x;
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(1);
  return x;
}

function sumOrders(orders, since, until) {
  return orders
    .filter(o => {
      const s = String(o.status || "").toLowerCase();
      if (!["completed", "confirmed", "ready", "preparing"].includes(s)) return false;
      const t = new Date(o.created_at);
      return t >= since && (!until || t < until);
    })
    .reduce((sum, o) => sum + (Number(o.subtotal_cents) || 0), 0);
}

function countOrders(orders, since, until) {
  return orders.filter(o => {
    const t = new Date(o.created_at);
    return t >= since && (!until || t < until);
  }).length;
}

function parseTodayClose(hoursSchedule) {
  if (!hoursSchedule || !Array.isArray(hoursSchedule)) return null;
  const dow = new Date().getDay(); // 0=Sun
  const entry = hoursSchedule.find(h => h.day_of_week === dow);
  if (!entry?.close_time) return null;
  const [hh, mm] = String(entry.close_time).split(":").map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ── Sub-components ────────────────────────────────────────────────────────

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#0f1720", lineHeight: 1.1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8a9ab0", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#aab4c0", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function QuickBtn({ label, icon, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 130,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "16px 12px",
        background: hov ? "#f0f8f4" : "#fff",
        border: `1.5px solid ${hov ? GREEN : BORDER}`,
        borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
        transition: "border-color 0.12s, background 0.12s",
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f1720" }}>{label}</span>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

const PAUSE_OPTIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "Other…", minutes: null },
];

export default function OperatorDashboard() {
  const { selectedRestaurant, restaurants } = useOperator();
  const rid = selectedRestaurant?.id;
  const navigate = useNavigate();

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Data
  const [availability, setAvailability] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [hoursSchedule, setHoursSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pause UI
  const [pauseOpen, setPauseOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [pauseBusy, setPauseBusy] = useState(false);
  const pauseRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (pauseRef.current && !pauseRef.current.contains(e.target)) setPauseOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const loadData = useCallback(async (restaurantId) => {
    setLoading(true);
    const [avail, live, history, hours] = await Promise.allSettled([
      api.getOrderAvailability(restaurantId),
      api.getLiveOrders(restaurantId),
      api.getOrderHistory(restaurantId, { days: 35 }),
      api.getHours(restaurantId),
    ]);
    if (avail.status === "fulfilled") setAvailability(avail.value);
    if (live.status === "fulfilled") setLiveOrders(live.value?.orders || []);
    if (history.status === "fulfilled") setHistoryOrders(history.value?.orders || []);
    if (hours.status === "fulfilled") setHoursSchedule(hours.value?.schedule || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!rid) { setAvailability(null); setLiveOrders([]); setHistoryOrders([]); return; }
    loadData(rid);
    const interval = setInterval(() => loadData(rid), 60_000);
    return () => clearInterval(interval);
  }, [rid, loadData]);

  async function handlePause(minutes) {
    if (!rid) return;
    setPauseBusy(true);
    const note = minutes ? `Paused for ${minutes < 60 ? minutes + " minutes" : minutes / 60 + " hour" + (minutes / 60 > 1 ? "s" : "")}` : "Orders paused";
    try {
      await api.updateOrderAvailability(rid, {
        order_acceptance_status: "paused",
        order_acceptance_note: note,
      });
      setPauseOpen(false);
      setCustomMinutes("");
      await loadData(rid);
    } catch (e) {
      window.alert(e.message || "Unable to pause orders.");
    } finally {
      setPauseBusy(false);
    }
  }

  async function handleResume() {
    if (!rid) return;
    setPauseBusy(true);
    try {
      await api.updateOrderAvailability(rid, { order_acceptance_status: "accepting_orders" });
      await loadData(rid);
    } catch (e) {
      window.alert(e.message || "Unable to resume orders.");
    } finally {
      setPauseBusy(false);
    }
  }

  // Derived values
  const availStatus = availability?.order_acceptance_status || "accepting_orders";
  const isAccepting = availStatus === "accepting_orders";
  const isPaused    = availStatus === "paused";
  const isClosed    = availStatus === "closed";

  const todayStart     = startOfDay(now);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart      = startOfWeek(now);
  const monthStart     = startOfMonth(now);

  const allOrders = [...liveOrders, ...historyOrders];

  const ordersToday     = countOrders(allOrders, todayStart);
  const pendingCount    = liveOrders.filter(o => ["pending", "confirmed"].includes(String(o.status || "").toLowerCase())).length;
  const cancelledToday  = allOrders.filter(o => {
    const s = String(o.status || "").toLowerCase();
    return (s === "canceled" || s === "cancelled") && new Date(o.created_at) >= todayStart;
  }).length;

  const salesToday     = fmt$(sumOrders(allOrders, todayStart));
  const salesYesterday = fmt$(sumOrders(allOrders, yesterdayStart, todayStart));
  const salesWTD       = fmt$(sumOrders(allOrders, weekStart));
  const salesMTD       = fmt$(sumOrders(allOrders, monthStart));

  const closingToday = parseTodayClose(hoursSchedule);
  const locationLine = [selectedRestaurant?.city, selectedRestaurant?.state].filter(Boolean).join(", ");
  const noRestaurant = restaurants.length === 0;

  const statusStyle = isAccepting
    ? { bg: "#ecfdf3", border: "#86efac", color: "#166534", dot: "#22c55e", label: "Accepting Orders" }
    : isPaused
    ? { bg: "#fffbeb", border: "#fcd34d", color: "#92400e", dot: "#f59e0b", label: "Orders Paused" }
    : { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c", dot: "#ef4444", label: "Closed" };

  if (noRestaurant) {
    return (
      <OperatorLayout title="Home">
        <div style={{ maxWidth: 480, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "36px 32px", textAlign: "center", margin: "0 auto" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "#0f1720" }}>No restaurant linked</h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#5b6675", lineHeight: 1.6 }}>Link your account to a restaurant to manage operations.</p>
          <button type="button" onClick={() => navigate("/operator/claim")} style={primaryBtn}>Find and claim my restaurant</button>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Home">
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#0f1720", letterSpacing: "-0.03em" }}>
              {selectedRestaurant?.restaurant_name || selectedRestaurant?.name || "My Restaurant"}
            </h1>
            {locationLine && <div style={{ fontSize: 13, color: "#8a9ab0", marginTop: 4 }}>{locationLine}</div>}
          </div>
          {/* Clock */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f1720", fontVariantNumeric: "tabular-nums" }}>
              {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
            </div>
            <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 2 }}>
              {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* ── Store Status + Pause ────────────────────────────── */}
        <div style={{
          background: statusStyle.bg, border: `1px solid ${statusStyle.border}`,
          borderRadius: 14, padding: "16px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: statusStyle.dot, display: "inline-block", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: statusStyle.color }}>{statusStyle.label}</div>
              {closingToday && isAccepting && (
                <div style={{ fontSize: 12, color: statusStyle.color, opacity: 0.8, marginTop: 2 }}>
                  Closes today at {closingToday}
                </div>
              )}
              {(isPaused || isClosed) && availability?.order_acceptance_note && (
                <div style={{ fontSize: 12, color: statusStyle.color, opacity: 0.8, marginTop: 2 }}>
                  {availability.order_acceptance_note}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {(isPaused || isClosed) && (
              <button
                type="button"
                onClick={handleResume}
                disabled={pauseBusy}
                style={{ ...primaryBtn, padding: "8px 16px", fontSize: 13 }}
              >
                {pauseBusy ? "…" : "Resume Orders"}
              </button>
            )}
            {isAccepting && (
              <div ref={pauseRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setPauseOpen(v => !v)}
                  disabled={pauseBusy}
                  style={{ ...ghostBtn, padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                >
                  Pause Ordering ▾
                </button>
                {pauseOpen && (
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 200,
                    background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 190, overflow: "hidden",
                  }}>
                    {PAUSE_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => opt.minutes !== null ? handlePause(opt.minutes) : null}
                        style={{
                          display: "block", width: "100%", padding: "11px 16px",
                          background: "none", border: "none", borderTop: "1px solid #f0f4f8",
                          cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                          fontSize: 13, fontWeight: 600, color: "#0f1720",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8faf9"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        {opt.label}
                        {opt.minutes === null && (
                          <div style={{ marginTop: 6 }} onClick={e => e.stopPropagation()}>
                            <input
                              type="number"
                              min={1}
                              max={480}
                              placeholder="Minutes"
                              value={customMinutes}
                              onChange={e => setCustomMinutes(e.target.value)}
                              style={{ width: 90, padding: "5px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: 12, fontFamily: "inherit" }}
                            />
                            <button
                              type="button"
                              onClick={() => customMinutes && handlePause(Number(customMinutes))}
                              disabled={!customMinutes}
                              style={{ marginLeft: 6, padding: "5px 10px", borderRadius: 6, border: "none", background: GREEN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                            >
                              Pause
                            </button>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Active Alerts ───────────────────────────────────── */}
        {pendingCount > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/operator/orders?tab=pending")}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && navigate("/operator/orders?tab=pending")}
            style={{
              background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12,
              padding: "13px 18px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>⚠</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>
                {pendingCount} order{pendingCount !== 1 ? "s" : ""} pending confirmation
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>View Orders →</span>
          </div>
        )}

        {/* ── Orders Today ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          <StatCard label="Orders Today" value={loading ? "…" : ordersToday} />
          <StatCard label="Pending" value={loading ? "…" : pendingCount}
            sub={pendingCount > 0 ? <span style={{ color: "#92400e", fontWeight: 700 }}>Action needed</span> : null}
          />
          <StatCard label="Cancelled Today" value={loading ? "…" : cancelledToday} />
        </div>

        {/* ── Sales ───────────────────────────────────────────── */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "4px 20px", marginBottom: 20 }}>
          <div style={{ padding: "10px 0 4px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a9ab0" }}>
            Sales
          </div>
          {[
            { label: "Today", value: loading ? "…" : salesToday },
            { label: "Yesterday", value: loading ? "…" : salesYesterday },
            { label: "Week to Date", value: loading ? "…" : salesWTD },
            { label: "Month to Date", value: loading ? "…" : salesMTD },
          ].map(({ label, value }, i, arr) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 0",
              borderBottom: i < arr.length - 1 ? `1px solid #f0f4f8` : "none",
            }}>
              <span style={{ fontSize: 13, color: "#8a9ab0", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0f1720" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── Quick Access ────────────────────────────────────── */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a9ab0", marginBottom: 12 }}>
            Quick Access
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <QuickBtn icon="◷" label="Public Profile" onClick={() => window.open(`/restaurant-profile/${rid}`, "_blank")} />
            <QuickBtn icon="▣" label="Menu Editor" onClick={() => navigate("/operator/menu")} />
            <QuickBtn icon="🔥" label="Deals" onClick={() => navigate("/operator/deals")} />
            <QuickBtn icon="▣" label="QR Tools" onClick={() => navigate("/operator/qr-kits/order")} />
          </div>
        </div>

      </div>
    </OperatorLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const primaryBtn = {
  background: GREEN, color: "#fff", border: "none",
  borderRadius: 8, padding: "10px 18px",
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

const ghostBtn = {
  background: "#fff", color: "#374151",
  border: `1px solid ${BORDER}`, borderRadius: 8,
  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
