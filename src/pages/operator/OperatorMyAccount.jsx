import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { getSubscriptionStatusLabel } from "../../components/payments/paymentHelpers.js";

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
  if (planCode === "foodtruck_verified_annual") return "Food Truck Verified — Annual";
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
  const { selectedRestaurant } = useOperator();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  async function loadSubscription(rid) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getPlatformSubscriptionStatus(rid);
      setSubscription(data);
    } catch (err) {
      setError("Unable to load subscription details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedRestaurant?.id) {
      loadSubscription(selectedRestaurant.id);
    } else {
      setSubscription(null);
    }
  }, [selectedRestaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const planCode = subscription?.plan_code || null;
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
      await loadSubscription(selectedRestaurant.id);
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
          {selectedRestaurant?.name && (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#8a9ab0" }}>
              {selectedRestaurant.name}{locationLine ? ` · ${locationLine}` : ""}
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
            {/* Subscription summary card */}
            <div style={{
              background: "#fff", border: "1px solid #e4e9f0",
              borderRadius: 12, padding: "4px 20px 4px",
              marginBottom: 20,
            }}>
              <Row label="Plan" value={getPlanDisplayName(planCode)} />
              <Row
                label="Status"
                value={<StatusBadge status={subscription?.status || (isFreeTier ? "active" : null)} />}
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
