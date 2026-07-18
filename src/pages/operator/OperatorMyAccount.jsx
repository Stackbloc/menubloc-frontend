/**
 * Operator My Account — public restaurant profile editor + account settings.
 * Route: /operator/my-account
 *
 * Profile form is primary. Password, plan, and utilities are secondary.
 */
import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { getSubscriptionStatusLabel, formatMoney } from "../../components/payments/paymentHelpers.js";
import PrimaryQrCard from "../../components/qr/PrimaryQrCard.jsx";
import { operatorPublicProfilePath } from "../../lib/canonicalUrl.js";
import { OperatorRestaurantProfileForm } from "./OperatorProfileEditor.jsx";

function getPlanTier(planCode) {
  if (!planCode) return "published";
  if (planCode === "published_free" || planCode === "verified") return "published";
  if (planCode === "founders_annual" || planCode === "founders_monthly") return "founders";
  if (planCode?.startsWith("starter")) return "starter";
  if (planCode?.startsWith("pro")) return "pro";
  if (planCode === "foodtruck_verified_annual" || planCode === "food_truck_annual") {
    return "food_truck";
  }
  return "published";
}

function getPlanDisplayName(planCode) {
  if (!planCode || planCode === "verified" || planCode === "published_free") return "Starter";
  if (planCode === "starter_monthly") return "Pro — Monthly";
  if (planCode === "starter_annual") return "Pro — Annual";
  if (planCode === "pro_monthly") return "Pro Partner — Monthly";
  if (planCode === "pro_annual") return "Pro Partner — Annual";
  if (planCode === "founders_monthly") return "Founders — Monthly";
  if (planCode === "founders_annual") return "Founders — Annual";
  if (planCode === "foodtruck_verified_annual" || planCode === "food_truck_annual") {
    return "Food Truck Annual";
  }
  return planCode;
}

function getBillingIntervalLabel(planCode) {
  if (!planCode || planCode === "verified" || planCode === "published_free") return "Free";
  if (planCode.includes("annual")) return "Annual";
  if (planCode.includes("monthly")) return "Monthly";
  return "—";
}

function getAutoRenewLabel(sub) {
  return sub?.cancel_at_period_end ? "No" : "Yes";
}

function Row({ label, value, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid #f0f4f8",
      }}
    >
      <span style={{ fontSize: 13, color: "#78716c", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 650, textAlign: "right" }}>{value}</span>
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
    <span
      style={{
        background: style.bg,
        color: style.color,
        fontWeight: 700,
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 20,
        display: "inline-block",
      }}
    >
      {getSubscriptionStatusLabel(status) || status || "—"}
    </span>
  );
}

function QuietLink({ onClick, href, children }) {
  const style = {
    fontSize: 13,
    fontWeight: 650,
    color: "#1F4E3D",
    textDecoration: "none",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function SectionCard({ title, children, style }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e7e5e4",
        borderRadius: 12,
        padding: "18px 20px",
        marginBottom: 16,
        ...style,
      }}
    >
      {title ? (
        <h2
          style={{
            margin: "0 0 14px",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#78716c",
          }}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export default function OperatorMyAccount() {
  const { t } = useLanguage();
  const { selectedRestaurant, subscription: contextSubscription } = useOperator();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [billingOverview, setBillingOverview] = useState(null);
  const [primaryQr, setPrimaryQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function loadData(rid) {
    setLoading(true);
    setError("");
    try {
      const [subData, billingData, qrData] = await Promise.allSettled([
        api.getPlatformSubscriptionStatus(rid),
        api.getBillingOverview(rid),
        api.getPrimaryQr(rid),
      ]);
      setSubscription(subData.status === "fulfilled" ? subData.value : null);
      setBillingOverview(billingData.status === "fulfilled" ? billingData.value : null);
      setPrimaryQr(qrData.status === "fulfilled" ? qrData.value?.qr || null : null);
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
      setPrimaryQr(null);
    }
  }, [selectedRestaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const planCode = subscription?.plan_code || contextSubscription?.plan_slug || null;
  const planDisplayOverride =
    !subscription?.plan_code && contextSubscription?.plan_name ? contextSubscription.plan_name : null;
  const tier = getPlanTier(planCode);
  const isFreeTier = tier === "published";
  const normalizedStatus = String(subscription?.status || "").toLowerCase();

  const canCancel =
    Boolean(subscription?.stripe_subscription_id && subscription?.current_period_end) &&
    ["active", "trialing", "past_due"].includes(normalizedStatus) &&
    !subscription?.cancel_at_period_end;

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
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
    } catch {
      setCancelMessage("Unable to process cancellation. Please try again.");
    } finally {
      setCancelBusy(false);
    }
  }

  const publicProfileHref = selectedRestaurant ? operatorPublicProfilePath(selectedRestaurant) : null;

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      await api.changeOperatorPassword(currentPassword, newPassword);
      setPasswordMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13,
    border: "1px solid #e7e5e4",
    borderRadius: 8,
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <OperatorLayout title="My Account">
      <div style={{ maxWidth: 960, paddingBottom: 48 }}>
        {/* Restaurant name lives in the sidebar — do not repeat it here */}
        {selectedRestaurant?.id ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            {publicProfileHref ? (
              <QuietLink href={publicProfileHref}>View public profile ↗</QuietLink>
            ) : null}
            <QuietLink
              onClick={() =>
                window.open(`/public/restaurants/${selectedRestaurant.id}/menu`, "_blank")
              }
            >
              View public menu ↗
            </QuietLink>
            <QuietLink onClick={() => navigate("/operator/menulab")}>Menu Lab →</QuietLink>
          </div>
        ) : null}

        {!selectedRestaurant?.id ? (
          <p style={{ fontSize: 14, color: "#78716c", marginBottom: 16 }}>
            {t("operator.selectRestaurantProfile", "Select a restaurant to edit its profile.")}
          </p>
        ) : (
          <>
            {/* PRIMARY — public profile editor */}
            <SectionCard title="Public restaurant profile">
              <p style={{ margin: "-4px 0 16px", fontSize: 13, color: "#78716c", lineHeight: 1.5 }}>
                These fields appear on your public Menuply listing. Save a draft, then publish to go live.
              </p>
              <OperatorRestaurantProfileForm embedded />
            </SectionCard>

            {/* SECONDARY — plan */}
            <SectionCard title="Plan">
              {loading ? (
                <p style={{ margin: 0, fontSize: 13, color: "#78716c" }}>Loading…</p>
              ) : error ? (
                <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>{error}</p>
              ) : (
                <>
                  <Row
                    label="Current plan"
                    value={planDisplayOverride || getPlanDisplayName(planCode)}
                  />
                  <Row
                    label="Status"
                    value={
                      <StatusBadge
                        status={
                          subscription?.status ||
                          contextSubscription?.status ||
                          (isFreeTier ? "active" : null)
                        }
                      />
                    }
                  />
                  <Row label="Billing" value={getBillingIntervalLabel(planCode)} />
                  <Row label="Renewal" value={isFreeTier ? "—" : renewalDate} />
                  <Row
                    label="Auto-renew"
                    value={isFreeTier ? "—" : getAutoRenewLabel(subscription)}
                    last={!billingOverview}
                  />

                  {billingOverview ? (
                    <>
                      {billingOverview.subscription?.subscription_fee_amount_cents != null ? (
                        <Row
                          label="Subscription fee"
                          value={formatMoney(billingOverview.subscription.subscription_fee_amount_cents)}
                        />
                      ) : null}
                      {billingOverview.payment_method?.present ? (
                        <Row
                          label="Payment method"
                          value={
                            billingOverview.payment_method.brand
                              ? `${billingOverview.payment_method.brand.charAt(0).toUpperCase()}${billingOverview.payment_method.brand.slice(1)} ···· ${billingOverview.payment_method.last4}`
                              : "On file"
                          }
                        />
                      ) : null}
                      <Row
                        label="Marketplace setup"
                        value={
                          billingOverview.stripe_connect?.onboarding_complete ? "Complete" : "Not complete"
                        }
                        last
                      />
                    </>
                  ) : null}

                  {!isFreeTier && subscription?.cancel_at_period_end && !cancelMessage ? (
                    <p style={{ margin: "12px 0 0", fontSize: 13, color: "#92400e" }}>
                      Your plan will not renew. Access continues until {renewalDate}.
                    </p>
                  ) : null}
                  {cancelMessage ? (
                    <p style={{ margin: "12px 0 0", fontSize: 13, color: "#1F4E3D" }}>{cancelMessage}</p>
                  ) : null}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => navigate("/operator/subscription")}
                      style={{
                        background: "#1c1917",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Change plan
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/operator/delivery")}
                      style={{
                        background: "#fff",
                        color: "#1c1917",
                        border: "1px solid #d6d3d1",
                        borderRadius: 8,
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 650,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Delivery settings
                    </button>
                    {canCancel && !cancelConfirm ? (
                      <button
                        type="button"
                        onClick={() => setCancelConfirm(true)}
                        style={{
                          background: "none",
                          color: "#78716c",
                          border: "none",
                          padding: "10px 8px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Cancel subscription
                      </button>
                    ) : null}
                  </div>

                  {cancelConfirm ? (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f4f8" }}>
                      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                        Your plan stays active until <strong>{renewalDate}</strong>, then switches to Starter
                        (free).
                      </p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={cancelBusy}
                          style={{
                            background: "#7f1d1d",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "9px 14px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: cancelBusy ? "default" : "pointer",
                            opacity: cancelBusy ? 0.7 : 1,
                            fontFamily: "inherit",
                          }}
                        >
                          {cancelBusy ? "Processing…" : "Confirm cancellation"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelConfirm(false)}
                          disabled={cancelBusy}
                          style={{
                            background: "none",
                            color: "#57534e",
                            border: "1px solid #e7e5e4",
                            borderRadius: 8,
                            padding: "9px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Keep plan
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </SectionCard>

            {/* QR — keep, quieter */}
            <SectionCard title="Primary QR">
              <PrimaryQrCard qr={primaryQr} restaurantId={selectedRestaurant?.id} />
              <div style={{ marginTop: 10 }}>
                <QuietLink onClick={() => navigate("/operator/qr-kits/order")}>QR tools →</QuietLink>
              </div>
            </SectionCard>
          </>
        )}

        {/* Password — separate account-level panel (not restaurant-scoped) */}
        <SectionCard title="Password">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
              style={inputStyle}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              style={inputStyle}
            />
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              style={inputStyle}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordSaving}
                style={{
                  background: "#1c1917",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: passwordSaving ? "default" : "pointer",
                  opacity: passwordSaving ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {passwordSaving ? "Updating…" : "Update password"}
              </button>
              {(passwordError || passwordMessage) && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: passwordError ? "#dc2626" : "#16a34a",
                  }}
                >
                  {passwordError || passwordMessage}
                </span>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </OperatorLayout>
  );
}
