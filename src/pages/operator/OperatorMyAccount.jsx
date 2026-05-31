import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { getSubscriptionStatusLabel, formatMoney } from "../../components/payments/paymentHelpers.js";

function getPlanTier(planCode) {
  if (!planCode) return "verified";
  if (planCode === "founders_annual") return "founders";
  if (planCode?.startsWith("pro")) return "pro";
  return "verified";
}

function getPlanDisplayName(planCode) {
  if (!planCode || planCode === "verified") return "Verified";
  if (planCode === "pro_monthly") return "Pro Partner — Monthly";
  if (planCode === "pro_annual") return "Pro Partner — Annual";
  if (planCode === "founders_annual") return "Founders — Annual";
  if (planCode === "foodtruck_verified_annual" || planCode === "food_truck_annual") {
    return "Food Truck Annual";
  }
  return planCode;
}

function getBillingIntervalLabel(planCode) {
  if (!planCode || planCode === "verified") return "Free";
  if (planCode.includes("annual")) return "Annual";
  if (planCode.includes("monthly")) return "Monthly";
  return "—";
}

function getAutoRenewLabel(sub) {
  return sub?.cancel_at_period_end ? "No" : "Yes";
}

function Row({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: 12, padding: "14px 0", borderBottom: "1px solid #f0f4f8",
    }}>
      <span style={{ fontSize: 13, color: "#8a9ab0", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const colors = {
    active: { bg: "#f0faf6", color: "#1F4E3D" },
    trialing: { bg: "#f0f7ff", color: "#1e40af" },
    past_due: { bg: "#fff7ed", color: "#92400e" },
    canceling: { bg: "#fef3c7", color: "#92400e" },
    cancelled: { bg: "#f3f4f6", color: "#6b7280" },
    canceled: { bg: "#f3f4f6", color: "#6b7280" },
  };
  const style = colors[normalized] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{
      background: style.bg, color: style.color,
      fontWeight: 700, fontSize: 12, padding: "3px 10px",
      borderRadius: 20, display: "inline-block",
    }}>
      {getSubscriptionStatusLabel(status) || status || "—"}
    </span>
  );
}

export default function OperatorMyAccount() {
  const { t } = useLanguage();
  const { operator, selectedRestaurant, subscription: contextSubscription } = useOperator();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [billingOverview, setBillingOverview] = useState(null);
  const [menus, setMenus] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  async function loadData(rid) {
    setLoading(true);
    setError("");
    try {
      const [subData, billingData, menusData, dealsData] = await Promise.allSettled([
        api.getPlatformSubscriptionStatus(rid),
        api.getBillingOverview(rid),
        api.getMenus(rid),
        api.getDeals(rid),
      ]);
      setSubscription(subData.status === "fulfilled" ? subData.value : null);
      setBillingOverview(billingData.status === "fulfilled" ? billingData.value : null);
      setMenus(menusData.status === "fulfilled" ? menusData.value?.menus || [] : []);
      setDeals(dealsData.status === "fulfilled" ? dealsData.value?.deals || [] : []);
      if (subData.status === "rejected") setError("Unable to load subscription details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedRestaurant?.id) {
      loadData(selectedRestaurant.id);
    } else {
      setSubscription(null);
      setBillingOverview(null);
      setMenus([]);
      setDeals([]);
    }
  }, [selectedRestaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stripe platform subscription is primary; internal context subscription is fallback
  const planCode = subscription?.plan_code || contextSubscription?.plan_slug || null;
  const planDisplayOverride = !subscription?.plan_code && contextSubscription?.plan_name
    ? contextSubscription.plan_name
    : null;
  const tier = getPlanTier(planCode);
  const isFreeTier = tier === "verified";
  const normalizedStatus = String(subscription?.status || "").toLowerCase();

  const canCancel =
    Boolean(subscription?.stripe_subscription_id && subscription?.current_period_end) &&
    ["active", "trialing", "past_due"].includes(normalizedStatus) &&
    !subscription?.cancel_at_period_end;

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  async function handleCancel() {
    if (!selectedRestaurant?.id) return;
    setCancelBusy(true);
    try {
      await api.cancelPlatformSubscription({ restaurantId: selectedRestaurant.id, atPeriodEnd: true });
      setCancelMessage("Cancellation scheduled. Your plan remains active until the end of the billing period.");
      setCancelConfirm(false);
      await loadData(selectedRestaurant.id);
    } catch (err) {
      setCancelMessage("Unable to process cancellation. Please try again.");
    } finally {
      setCancelBusy(false);
    }
  }

  const locationLine = [selectedRestaurant?.city, selectedRestaurant?.state]
    .filter(Boolean).join(", ");

  return (
    <OperatorLayout>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1720", margin: 0 }}>
            My Account
          </h1>
          {operator?.full_name && (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#344054", fontWeight: 600 }}>
              {operator.full_name}
            </p>
          )}
          {operator?.email && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8a9ab0" }}>
              {operator.email}
            </p>
          )}
          {(selectedRestaurant?.restaurant_name || selectedRestaurant?.name) && (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#aab4c0" }}>
              {selectedRestaurant.restaurant_name || selectedRestaurant.name}
              {locationLine ? ` · ${locationLine}` : ""}
            </p>
          )}
        </div>

        {!selectedRestaurant ? (
          <p style={{ fontSize: 14, color: "#8a9ab0" }}>Select a restaurant to view account details.</p>
        ) : loading ? (
          <div style={{ padding: "24px 0", color: "#8a9ab0", fontSize: 14 }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "12px 16px", background: "#fef3c7", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
            {error}
          </div>
        ) : (
          <>
            {/* Restaurant stats */}
            {(() => {
              const totalItems = menus.reduce((sum, m) => sum + (Number(m.item_count) || 0), 0);
              const activeDeals = deals.filter((d) => String(d.status || "").toLowerCase() === "active").length;
              const liveMenus = menus.filter((m) => String(m.status || "").toLowerCase() === "published").length;
              const menuStatusLabel = liveMenus > 0
                ? `${liveMenus} menu${liveMenus === 1 ? "" : "s"} live`
                : menus.length > 0 ? "No menus published" : "No menus yet";
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Menu items", value: totalItems },
                    { label: "Active deals", value: activeDeals },
                    { label: "Menu status", value: menuStatusLabel },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: "#fff", border: "1px solid #e4e9f0",
                      borderRadius: 12, padding: "14px 16px",
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#0f1720", lineHeight: 1.1 }}>{value}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#8a9ab0", marginTop: 6 }}>{label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Quick actions */}
            <div style={{
              background: "#fff", border: "1px solid #e4e9f0",
              borderRadius: 12, marginBottom: 20, overflow: "hidden",
            }}>
              <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a9ab0" }}>
                Quick Actions
              </div>
              {[
                { label: "Open Menu Lab", action: () => navigate("/operator/menu") },
                { label: "View Public Menu", action: () => window.open(`/public/restaurants/${selectedRestaurant.id}/menu`, "_blank") },
                { label: "View Public Profile", action: () => window.open(`/restaurant-profile/${selectedRestaurant.id}`, "_blank") },
                { label: "QR Tools", action: () => navigate("/operator/qr-kits/order") },
              ].map(({ label, action }, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%", padding: "13px 16px",
                    background: "none", border: "none",
                    borderTop: i === 0 ? "none" : "1px solid #f0f4f8",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 16, color: "#c4cdd6" }}>›</span>
                </button>
              ))}
            </div>

            {/* Subscription summary card */}
            <div style={{
              background: "#fff", border: "1px solid #e4e9f0",
              borderRadius: 12, padding: "4px 20px 4px",
              marginBottom: 20,
            }}>
              <Row label="Plan" value={planDisplayOverride || getPlanDisplayName(planCode)} />
              <Row
                label="Status"
                value={<StatusBadge status={subscription?.status || contextSubscription?.status || (isFreeTier ? "active" : null)} />}
              />
              <Row label="Billing" value={getBillingIntervalLabel(planCode)} />
              <Row label="Renewal date" value={isFreeTier ? "—" : renewalDate} />
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: 12, padding: "14px 0",
              }}>
                <span style={{ fontSize: 13, color: "#8a9ab0", fontWeight: 500 }}>Auto-renew</span>
                <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 700 }}>
                  {isFreeTier ? "—" : getAutoRenewLabel(subscription)}
                </span>
              </div>
            </div>

            {/* Cancellation-scheduled notice */}
            {!isFreeTier && subscription?.cancel_at_period_end && !cancelMessage && (
              <div style={{
                padding: "12px 16px", background: "#fef3c7",
                borderRadius: 8, fontSize: 13, color: "#92400e", marginBottom: 20,
              }}>
                Your plan will not renew. Access continues until {renewalDate}.
              </div>
            )}

            {/* Success / error feedback */}
            {cancelMessage && (
              <div style={{
                padding: "12px 16px", background: "#f0faf6",
                borderRadius: 8, fontSize: 13, color: "#1F4E3D", marginBottom: 20,
              }}>
                {cancelMessage}
              </div>
            )}

            {/* Billing details (non-duplicate fields from billing overview) */}
            {billingOverview && (
              <div style={{
                background: "#fff", border: "1px solid #e4e9f0",
                borderRadius: 12, padding: "4px 20px 4px",
                marginBottom: 20,
              }}>
                {billingOverview.subscription?.subscription_fee_amount_cents != null && (
                  <Row
                    label="Subscription fee"
                    value={formatMoney(billingOverview.subscription.subscription_fee_amount_cents)}
                  />
                )}
                {billingOverview.payment_method?.present && (
                  <Row
                    label="Payment method"
                    value={
                      billingOverview.payment_method.brand
                        ? `${billingOverview.payment_method.brand.charAt(0).toUpperCase()}${billingOverview.payment_method.brand.slice(1)} ···· ${billingOverview.payment_method.last4}`
                        : "On file"
                    }
                  />
                )}
                {billingOverview.marketplace?.effective_commission_rate_percent != null && (
                  <Row
                    label="Commission rate"
                    value={`${billingOverview.marketplace.effective_commission_rate_percent}%`}
                  />
                )}
                <Row
                  label="Marketplace setup"
                  value={billingOverview.stripe_connect?.onboarding_complete ? "Complete" : "Not complete"}
                />
              </div>
            )}

            {/* Account settings nav */}
            <div style={{
              background: "#fff", border: "1px solid #e4e9f0",
              borderRadius: 12, marginBottom: 20, overflow: "hidden",
            }}>
              <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a9ab0" }}>
                Account Settings
              </div>
              {[
                { label: "Restaurant Profile", to: "/operator/profile" },
                { label: "Manage Subscription", to: "/operator/subscription" },
                { label: "Delivery Settings", to: "/operator/delivery" },
              ].map(({ label, to }, i, arr) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => navigate(to)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%", padding: "14px 16px",
                    background: "none", border: "none",
                    borderTop: i === 0 ? "none" : "1px solid #f0f4f8",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 16, color: "#c4cdd6" }}>›</span>
                </button>
              ))}
            </div>

            {/* Subscription actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                onClick={() => navigate("/operator/subscription")}
                style={{
                  background: "#0f1720", color: "#fff",
                  border: "none", borderRadius: 8,
                  padding: "12px 20px", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", textAlign: "center",
                }}
              >
                Change Plan
              </button>

              {canCancel && !cancelConfirm && (
                <button
                  type="button"
                  onClick={() => setCancelConfirm(true)}
                  style={{
                    background: "none", color: "#8a9ab0",
                    border: "1px solid #e4e9f0", borderRadius: 8,
                    padding: "11px 20px", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  Cancel Subscription
                </button>
              )}

              {cancelConfirm && (
                <div style={{
                  background: "#fff", border: "1px solid #e4e9f0",
                  borderRadius: 10, padding: "16px 18px",
                }}>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    Your plan will stay active until <strong>{renewalDate}</strong>, then switch to Verified (free). No charge after that.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelBusy}
                      style={{
                        background: "#7f1d1d", color: "#fff",
                        border: "none", borderRadius: 7,
                        padding: "9px 16px", fontSize: 13, fontWeight: 700,
                        cursor: cancelBusy ? "default" : "pointer", opacity: cancelBusy ? 0.7 : 1,
                      }}
                    >
                      {cancelBusy ? "Processing…" : "Confirm Cancellation"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelConfirm(false)}
                      disabled={cancelBusy}
                      style={{
                        background: "none", color: "#5b6675",
                        border: "1px solid #e4e9f0", borderRadius: 7,
                        padding: "9px 16px", fontSize: 13, fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Keep Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </OperatorLayout>
  );
}
