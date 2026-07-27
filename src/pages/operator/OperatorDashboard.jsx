import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import * as api from "../../lib/operatorApi.js";
import OrderAvailabilityControls from "../../components/operator/OrderAvailabilityControls.jsx";
import {
  getIncompleteFinishSetupSteps,
  isCoreOnboardingComplete,
} from "../../lib/operatorOnboardingCheckpoints.js";

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

function hasPickupLocation(location) {
  if (!location || typeof location !== "object") return false;
  return Boolean(
    location.current_pickup_address ||
      (Number.isFinite(Number(location.current_pickup_lat)) &&
        Number.isFinite(Number(location.current_pickup_lng)))
  );
}

function formatPickupLocation(location) {
  if (!hasPickupLocation(location)) return "No current pickup location saved.";
  const parts = [];
  if (location.current_pickup_label) parts.push(location.current_pickup_label);
  if (location.current_pickup_address) parts.push(location.current_pickup_address);
  if (!location.current_pickup_address && location.current_pickup_lat != null && location.current_pickup_lng != null) {
    parts.push(`${Number(location.current_pickup_lat).toFixed(5)}, ${Number(location.current_pickup_lng).toFixed(5)}`);
  }
  return parts.join(" • ");
}

function formatLocationTimestamp(value) {
  if (!value) return "Not confirmed yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not confirmed yet";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

// ── Main ──────────────────────────────────────────────────────────────────

export default function OperatorDashboard() {
  const { t } = useLanguage();
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
  const [loading, setLoading] = useState(false);
  const [finishSetupSteps, setFinishSetupSteps] = useState([]);
  const [coreComplete, setCoreComplete] = useState(false);

  // Pause / close UI
  const [pauseBusy, setPauseBusy] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationForm, setLocationForm] = useState({
    current_pickup_address: "",
    current_pickup_lat: "",
    current_pickup_lng: "",
    current_pickup_label: "",
    current_pickup_instructions: "",
  });

  const loadData = useCallback(async (restaurantId) => {
    setLoading(true);
    const [avail, live, history, checkpoint] = await Promise.allSettled([
      api.getOrderAvailability(restaurantId),
      api.getLiveOrders(restaurantId),
      api.getOrderHistory(restaurantId, { days: 35 }),
      api.getOnboardingCheckpoint(restaurantId),
    ]);
    if (avail.status === "fulfilled") setAvailability(avail.value?.availability ?? avail.value);
    if (live.status === "fulfilled") setLiveOrders(live.value?.orders || []);
    if (history.status === "fulfilled") setHistoryOrders(history.value?.orders || []);
    if (checkpoint.status === "fulfilled") {
      const payload = checkpoint.value || {};
      const restaurantShape = {
        id: restaurantId,
        completed_step_keys: payload.completed_step_keys || [],
        current_step_key: payload.current_step_key || payload.first_incomplete_stage || null,
        draft_payload: payload.draft_payload || { stage_records: payload.stage_records || {} },
        stage_records: payload.stage_records || payload.draft_payload?.stage_records || {},
        has_published_menu: payload.has_published_menu,
      };
      setCoreComplete(isCoreOnboardingComplete(restaurantShape));
      setFinishSetupSteps(getIncompleteFinishSetupSteps(restaurantShape));
    } else {
      setCoreComplete(false);
      setFinishSetupSteps([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!rid) { setAvailability(null); setLiveOrders([]); setHistoryOrders([]); return; }
    loadData(rid);
    const interval = setInterval(() => loadData(rid), 60_000);
    return () => clearInterval(interval);
  }, [rid, loadData]);

  useEffect(() => {
    const location = availability?.current_pickup_location;
    setLocationForm({
      current_pickup_address: location?.current_pickup_address || "",
      current_pickup_lat:
        location?.current_pickup_lat == null ? "" : String(location.current_pickup_lat),
      current_pickup_lng:
        location?.current_pickup_lng == null ? "" : String(location.current_pickup_lng),
      current_pickup_label: location?.current_pickup_label || "",
      current_pickup_instructions: location?.current_pickup_instructions || "",
    });
  }, [availability?.current_pickup_location]);

  async function handlePause({ pause_minutes, pause_until } = {}) {
    if (!rid) return;
    setPauseBusy(true);
    const minutes = pause_minutes || 0;
    const note = pause_until
      ? "Paused until selected time"
      : minutes
        ? `Paused for ${minutes < 60 ? minutes + " minutes" : minutes / 60 + " hour" + (minutes / 60 > 1 ? "s" : "")}`
        : "Orders paused";
    try {
      const result = await api.updateOrderAvailability(rid, {
        order_acceptance_status: "paused",
        order_acceptance_note: note,
        pause_minutes: minutes || undefined,
        pause_until: pause_until || undefined,
      });
      const updated = result?.availability ?? result;
      setAvailability((prev) => ({ ...prev, ...updated }));
      loadData(rid);
    } catch (e) {
      window.alert(e.message || "Unable to pause orders.");
    } finally {
      setPauseBusy(false);
    }
  }

  async function handleCloseStore({ close_minutes, close_preset, closed_until } = {}) {
    if (!rid) return;
    setPauseBusy(true);
    const note = closed_until
      ? "Temporarily closed until selected time"
      : close_preset === "rest_of_today"
        ? "Closed for the rest of today"
        : close_preset === "until_tomorrow"
          ? "Closed until tomorrow"
          : close_minutes
            ? `Temporarily closed for ${close_minutes / 60} hour${close_minutes / 60 > 1 ? "s" : ""}`
            : "Temporarily closed";
    try {
      const result = await api.updateOrderAvailability(rid, {
        order_acceptance_status: "closed",
        order_acceptance_note: note,
        close_minutes: close_minutes || undefined,
        close_preset: close_preset || undefined,
        closed_until: closed_until || undefined,
      });
      const updated = result?.availability ?? result;
      setAvailability((prev) => ({ ...prev, ...updated }));
      loadData(rid);
    } catch (e) {
      window.alert(e.message || "Unable to close store.");
    } finally {
      setPauseBusy(false);
    }
  }

  async function handleResume() {
    if (!rid) return;
    if (availability?.restaurant_type === "food_truck") {
      setLocationError("");
      setEditingLocation(!hasPickupLocation(availability?.current_pickup_location));
      setLocationModalOpen(true);
      return;
    }
    setPauseBusy(true);
    try {
      const result = await api.updateOrderAvailability(rid, { order_acceptance_status: "accepting_orders" });
      const updated = result?.availability ?? result;
      setAvailability((prev) => ({ ...prev, ...updated }));
      loadData(rid);
    } catch (e) {
      window.alert(e.message || "Unable to resume orders.");
    } finally {
      setPauseBusy(false);
    }
  }

  async function handleConfirmFoodTruckOpen() {
    if (!rid) return;
    setLocationBusy(true);
    setLocationError("");
    try {
      await api.updateOrderAvailability(rid, {
        order_acceptance_status: "accepting_orders",
        confirm_current_location: true,
      });
      setLocationModalOpen(false);
      setEditingLocation(false);
      await loadData(rid);
    } catch (e) {
      setLocationError(e.message || "Unable to open store.");
    } finally {
      setLocationBusy(false);
    }
  }

  async function handleSaveFoodTruckLocation() {
    if (!rid) return;
    setLocationBusy(true);
    setLocationError("");
    try {
      await api.updateFoodTruckCurrentLocation(rid, {
        current_pickup_address: locationForm.current_pickup_address,
        current_pickup_lat: locationForm.current_pickup_lat,
        current_pickup_lng: locationForm.current_pickup_lng,
        current_pickup_label: locationForm.current_pickup_label,
        current_pickup_instructions: locationForm.current_pickup_instructions,
        is_currently_serving: false,
      });
      await loadData(rid);
      setEditingLocation(false);
    } catch (e) {
      setLocationError(e.message || "Unable to save pickup location.");
    } finally {
      setLocationBusy(false);
    }
  }

  // Derived values
  const isFoodTruck = availability?.restaurant_type === "food_truck";
  const pickupLocation = availability?.current_pickup_location || null;

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

  const locationLine = [selectedRestaurant?.city, selectedRestaurant?.state].filter(Boolean).join(", ");
  const noRestaurant = restaurants.length === 0;

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
              {selectedRestaurant?.restaurant_name || selectedRestaurant?.name || t("operator.dashboard.myRestaurant", "My Restaurant")}
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

        {coreComplete && finishSetupSteps.length > 0 ? (
          <div
            style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: "16px 18px 18px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#8a9ab0",
                marginBottom: 6,
              }}
            >
              Finish setup
            </div>
            <div style={{ fontSize: 13, color: "#5b6675", marginBottom: 14, lineHeight: 1.5 }}>
              Complete one optional step at a time. Menu design is available last.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {finishSetupSteps.map((step, index) => {
                const recommended = index === 0;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => navigate(step.href)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: recommended ? `1.5px solid ${GREEN}` : `1px solid ${BORDER}`,
                      background: recommended ? "#f0fdf4" : "#f8fafc",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f1720", marginBottom: 4 }}>
                      {recommended ? "Recommended: " : ""}
                      {step.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#5b6675", lineHeight: 1.45 }}>{step.body}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ── Store Status + Pause ────────────────────────────── */}
        {isFoodTruck && (
          <div style={{
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 14,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8a9ab0", marginBottom: 6 }}>
                  Current Pickup Location
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f1720" }}>
                  {formatPickupLocation(pickupLocation)}
                </div>
                {pickupLocation?.current_pickup_instructions && (
                  <div style={{ fontSize: 12, color: "#5b6675", marginTop: 6 }}>
                    {pickupLocation.current_pickup_instructions}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 6 }}>
                  Last confirmed: {formatLocationTimestamp(availability?.current_location_updated_at || pickupLocation?.current_location_updated_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocationError("");
                  setEditingLocation(true);
                  setLocationModalOpen(true);
                }}
                style={{ ...ghostBtn, padding: "8px 14px", fontSize: 13 }}
              >
                Edit Location
              </button>
            </div>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <OrderAvailabilityControls
            availability={availability}
            busy={pauseBusy}
            onPause={handlePause}
            onCloseStore={handleCloseStore}
            onResume={handleResume}
            navigate={navigate}
          />
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
          <StatCard label={t("operator.dashboard.ordersToday", "Orders Today")} value={loading ? "…" : ordersToday} />
          <StatCard label={t("operator.dashboard.pending", "Pending")} value={loading ? "…" : pendingCount}
            sub={pendingCount > 0 ? <span style={{ color: "#92400e", fontWeight: 700 }}>Action needed</span> : null}
          />
          <StatCard label={t("operator.dashboard.cancelledToday", "Cancelled Today")} value={loading ? "…" : cancelledToday} />
        </div>

        {/* ── Sales ───────────────────────────────────────────── */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "4px 20px", marginBottom: 20 }}>
          <div style={{ padding: "10px 0 4px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a9ab0" }}>
            Sales
          </div>
          {[
            { label: t("operator.dashboard.salesToday", "Today"), value: loading ? "…" : salesToday },
            { label: t("operator.dashboard.salesYesterday", "Yesterday"), value: loading ? "…" : salesYesterday },
            { label: t("operator.dashboard.salesWtd", "Week to Date"), value: loading ? "…" : salesWTD },
            { label: t("operator.dashboard.salesMtd", "Month to Date"), value: loading ? "…" : salesMTD },
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

      </div>
      {locationModalOpen && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f1720", marginBottom: 6 }}>
              Confirm Pickup Location
            </div>
            <div style={{ fontSize: 14, color: "#5b6675", lineHeight: 1.6, marginBottom: 14 }}>
              Confirm your current pickup location before opening.
            </div>
            {locationError && (
              <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "#fef2f2", color: "#b91c1c", fontSize: 13, fontWeight: 700 }}>
                {locationError}
              </div>
            )}
            {!editingLocation ? (
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 14px", background: "#f8fafc" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f1720" }}>{formatPickupLocation(pickupLocation)}</div>
                {pickupLocation?.current_pickup_instructions && (
                  <div style={{ fontSize: 12, color: "#5b6675", marginTop: 6 }}>{pickupLocation.current_pickup_instructions}</div>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  value={locationForm.current_pickup_label}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, current_pickup_label: e.target.value }))}
                  placeholder="Location label"
                  style={modalInput}
                />
                <input
                  value={locationForm.current_pickup_address}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, current_pickup_address: e.target.value }))}
                  placeholder="Pickup address"
                  style={modalInput}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input
                    value={locationForm.current_pickup_lat}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, current_pickup_lat: e.target.value }))}
                    placeholder="Latitude"
                    style={modalInput}
                  />
                  <input
                    value={locationForm.current_pickup_lng}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, current_pickup_lng: e.target.value }))}
                    placeholder="Longitude"
                    style={modalInput}
                  />
                </div>
                <textarea
                  value={locationForm.current_pickup_instructions}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, current_pickup_instructions: e.target.value }))}
                  placeholder="Pickup instructions"
                  style={{ ...modalInput, minHeight: 80, resize: "vertical", paddingTop: 10 }}
                />
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {editingLocation ? (
                  <button type="button" onClick={handleSaveFoodTruckLocation} disabled={locationBusy} style={primaryBtn}>
                    {locationBusy ? t("auth.sending", "Sending…") : t("operator.dashboard.saveLocation", "Save Location")}
                  </button>
                ) : (
                  <button type="button" onClick={handleConfirmFoodTruckOpen} disabled={locationBusy} style={primaryBtn}>
                    {locationBusy ? "Opening…" : "Confirm and Open Store"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingLocation((prev) => !prev)}
                  disabled={locationBusy}
                  style={ghostBtn}
                >
                  {editingLocation ? "Back to Confirmation" : "Edit Location"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocationModalOpen(false);
                  setEditingLocation(false);
                  setLocationError("");
                }}
                disabled={locationBusy}
                style={ghostBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: "10px 18px",
};

const modalBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 32, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
  zIndex: 400,
};

const modalCard = {
  width: "100%",
  maxWidth: 560,
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 20px 60px rgba(15, 23, 32, 0.25)",
};

const modalInput = {
  width: "100%",
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
};
