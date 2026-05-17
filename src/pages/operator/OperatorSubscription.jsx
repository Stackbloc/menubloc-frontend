import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { validateDiscountCode, getCheckoutPlans } from "../../lib/operatorApi.js";
import {
  formatMoney,
  getSubscriptionPlanLabel,
  getSubscriptionStatusLabel,
} from "../../components/payments/paymentHelpers.js";

// TODO: replace with CK-backed taxonomy when available
const PLAN_DESCRIPTIONS = {
  pro_monthly:
    "Flexible monthly billing for restaurants that want direct ordering, stronger branding, and Stripe-backed billing without annual commitment.",
  pro_annual:
    "Lower annual effective rate for restaurants ready to lock in Menuply Pro for the year.",
};

function billingLabel(interval) {
  if (interval === "month") return "/month";
  if (interval === "year") return "/year";
  return "";
}

function cardStyle(active) {
  return {
    background: active ? "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)" : "#fff",
    border: active ? "2px solid #fb923c" : "1px solid #eaecf0",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 18px 40px rgba(15, 23, 32, 0.05)",
    display: "grid",
    gap: 14,
  };
}

function StatusRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        paddingTop: 12,
        borderTop: "1px solid #eaecf0",
      }}
    >
      <span style={{ fontSize: 13, color: "#475467", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function OperatorSubscription() {
  const { selectedRestaurant } = useOperator();
  const [searchParams, setSearchParams] = useSearchParams();
  const [planOptions, setPlanOptions] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState("pro_monthly");
  const [loading, setLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [discountValidation, setDiscountValidation] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");

  useEffect(() => {
    getCheckoutPlans()
      .then((data) => {
        const filtered = (data.plans || []).filter((p) =>
          ["pro_monthly", "pro_annual"].includes(p.code)
        );
        if (filtered.length) setPlanOptions(filtered);
      })
      .catch(() => {
        // Fallback to service-defined amounts if fetch fails
        setPlanOptions([
          { code: "pro_monthly", checkout_label: "Pro Partner Monthly", amount_cents: 3999, billing_interval: "month" },
          { code: "pro_annual",  checkout_label: "Pro Partner Annual",  amount_cents: 29900, billing_interval: "year" },
        ]);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle return from Stripe Checkout
  const checkoutResult = searchParams.get("checkout");

  useEffect(() => {
    if (checkoutResult === "success") {
      setMessage("Subscription activated successfully. Your plan is now live.");
      // Strip the query param so refresh doesn't re-trigger the banner
      setSearchParams({}, { replace: true });
      refreshSubscription();
    } else if (checkoutResult === "cancelled") {
      setSearchParams({}, { replace: true });
    }
  }, [checkoutResult]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshSubscription() {
    if (!selectedRestaurant?.id) {
      setSubscription(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.getPlatformSubscriptionStatus(selectedRestaurant.id);
      setSubscription(response);
    } catch (err) {
      setError(err.message || "Unable to load restaurant subscription.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSubscription();
  }, [selectedRestaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApplyDiscount() {
    const code = discountCodeInput.trim().toUpperCase();
    if (!code) return;
    setDiscountLoading(true);
    setDiscountError("");
    setDiscountValidation(null);
    try {
      const data = await validateDiscountCode(code);
      setDiscountValidation(data.discount_code);
    } catch (e) {
      setDiscountError(e.message || "Invalid discount code");
    } finally {
      setDiscountLoading(false);
    }
  }

  async function handleCheckout() {
    if (!selectedRestaurant?.id) {
      setError("Select a restaurant before starting a subscription.");
      return;
    }

    setIsCheckingOut(true);
    setError("");
    setMessage("");

    try {
      const origin = window.location.origin;
      const result = await api.createPlatformCheckoutSession({
        restaurantId: selectedRestaurant.id,
        planCode: selectedPlanCode,
        successUrl: `${origin}/operator/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/operator/subscription?checkout=cancelled`,
        discountCode: discountValidation?.code || undefined,
      });

      if (result.already_active) {
        setMessage("This restaurant already has an active subscription for that plan.");
        await refreshSubscription();
        setIsCheckingOut(false);
        return;
      }

      if (!result.checkout_url) {
        throw new Error("No checkout URL returned from server.");
      }

      // Redirect to Stripe Checkout — browser leaves this page
      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err.message || "Unable to start subscription checkout.");
      setIsCheckingOut(false);
    }
  }

  async function handleCancelSubscription() {
    if (!selectedRestaurant?.id) {
      setError("Select a restaurant before cancelling a subscription.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.cancelPlatformSubscription({
        restaurantId: selectedRestaurant.id,
        atPeriodEnd: true,
      });
      setMessage("Subscription will cancel at period end.");
      await refreshSubscription();
    } catch (err) {
      setError(err.message || "Unable to cancel subscription.");
    }
  }

  const currentPlanCode = subscription?.plan_code || null;
  const currentStatus = getSubscriptionStatusLabel(subscription?.status);
  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : "N/A";

  return (
    <OperatorLayout title="Subscription">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <section
          style={{
            background: "linear-gradient(135deg, #0f1720 0%, #1f4e3d 48%, #eef6f1 100%)",
            borderRadius: 28,
            padding: "28px 24px",
            color: "#fff",
            boxShadow: "0 28px 70px rgba(15, 23, 32, 0.16)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "7px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 16,
            }}
          >
            Stripe Billing
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 0.95, letterSpacing: "-0.06em" }}>
            Restaurant Pro Subscriptions
          </h1>
          <p style={{ margin: "14px 0 0", maxWidth: 760, fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.88)" }}>
            Select a billing interval and click Subscribe to be redirected to Stripe Checkout. After payment, your subscription is activated automatically via webhook.
          </p>
        </section>

        <section style={{ marginTop: 24, display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {planOptions.map((plan) => {
            const active = selectedPlanCode === plan.code;
            const current = currentPlanCode === plan.code;

            return (
              <button
                key={plan.code}
                type="button"
                onClick={() => setSelectedPlanCode(plan.code)}
                style={{
                  ...cardStyle(active),
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#475467", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {plan.billing_interval === "year" ? "Annual" : "Monthly"}
                    </div>
                    <h2 style={{ margin: "8px 0 0", fontSize: 28, color: "#0f1720", letterSpacing: "-0.05em" }}>
                      {plan.checkout_label}
                    </h2>
                  </div>
                  {current ? (
                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: 999,
                        background: "#f0fdf4",
                        color: "#166534",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Current
                    </span>
                  ) : null}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div style={{ fontSize: 38, fontWeight: 800, color: "#b45309", letterSpacing: "-0.05em" }}>
                    {formatMoney(plan.amount_cents)}
                  </div>
                  <div style={{ fontSize: 15, color: "#475467", fontWeight: 600 }}>{billingLabel(plan.billing_interval)}</div>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "#475467" }}>
                  {PLAN_DESCRIPTIONS[plan.code] || ""}
                </p>
              </button>
            );
          })}
        </section>

        {checkoutResult === "cancelled" && !message && !error ? (
          <div style={{ marginTop: 20, background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412", borderRadius: 16, padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>
            Checkout was cancelled. No charge was made. Select a plan and try again.
          </div>
        ) : null}

        {error ? (
          <div style={{ marginTop: 20, background: "#fef2f2", border: "1px solid #fecaca", color: "#b42318", borderRadius: 16, padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        ) : null}

        {message ? (
          <div style={{ marginTop: 20, background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: 16, padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>
            {message}
          </div>
        ) : null}

        <section style={{ marginTop: 24, display: "grid", gap: 20, gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.9fr)" }}>
          <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 24, padding: 22, boxShadow: "0 18px 40px rgba(15, 23, 32, 0.04)" }}>
            <h3 style={{ margin: 0, fontSize: 24, color: "#0f1720", letterSpacing: "-0.04em" }}>Checkout</h3>
            <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.7, color: "#475467" }}>
              {selectedRestaurant?.restaurant_name
                ? `Billing restaurant: ${selectedRestaurant.restaurant_name}`
                : "Select a restaurant before starting a subscription."}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#667085" }}>
              You will be redirected to Stripe to complete payment. After checkout, you will be returned here and your subscription will be activated.
            </p>

            <div style={{ marginTop: 18, borderTop: "1px solid #eaecf0", paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475467", marginBottom: 8 }}>Have a discount code?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={discountCodeInput}
                  onChange={(e) => { setDiscountCodeInput(e.target.value.toUpperCase()); setDiscountValidation(null); setDiscountError(""); }}
                  placeholder="Enter code"
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: "1px solid #d0d5dd", fontSize: 14, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em" }}
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={!discountCodeInput.trim() || discountLoading}
                  style={{ padding: "10px 16px", borderRadius: 12, border: "none", background: "#0f1720", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  {discountLoading ? "…" : "Apply"}
                </button>
              </div>
              {discountError && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#b42318", fontWeight: 600 }}>{discountError}</div>
              )}
              {discountValidation && (
                <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "10px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>Code applied: {discountValidation.code}</div>
                  {discountValidation.subscription_discount_percent && (
                    <div style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>
                      {discountValidation.subscription_discount_percent}% off subscription fees
                      {discountValidation.subscription_discount_days ? ` for ${discountValidation.subscription_discount_days} days` : " (ongoing)"}
                    </div>
                  )}
                  {discountValidation.commission_discount_percent && (
                    <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                      {discountValidation.commission_discount_percent}% off commission rate
                      {discountValidation.commission_discount_days ? ` for ${discountValidation.commission_discount_days} days` : " (ongoing)"}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={!selectedRestaurant?.id || isCheckingOut || loading}
              style={{
                marginTop: 18,
                width: "100%",
                border: "none",
                borderRadius: 16,
                background: isCheckingOut ? "#94a3b8" : "#11211a",
                color: "#fff",
                padding: "14px 16px",
                fontSize: 15,
                fontWeight: 900,
                cursor: isCheckingOut ? "wait" : "pointer",
              }}
            >
              {isCheckingOut ? "Redirecting to Stripe..." : `Subscribe — ${getSubscriptionPlanLabel(selectedPlanCode)}`}
            </button>
          </div>

          <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 24, padding: 22, boxShadow: "0 18px 40px rgba(15, 23, 32, 0.04)" }}>
            <h3 style={{ margin: 0, fontSize: 24, color: "#0f1720", letterSpacing: "-0.04em" }}>Current Status</h3>
            <div style={{ marginTop: 14, display: "grid", gap: 2 }}>
              <StatusRow label="Plan" value={getSubscriptionPlanLabel(currentPlanCode)} />
              <StatusRow label="Status" value={loading ? "Loading..." : currentStatus} />
              <StatusRow label="Current Period End" value={loading ? "Loading..." : currentPeriodEnd} />
              <StatusRow label="Cancel At Period End" value={subscription?.cancel_at_period_end ? "Yes" : "No"} />
              <StatusRow label="Stripe Customer" value={subscription?.stripe_customer_id || "Not created"} />
              <StatusRow label="Stripe Subscription" value={subscription?.stripe_subscription_id || "Not created"} />
            </div>

            <button
              type="button"
              onClick={handleCancelSubscription}
              disabled={!subscription?.stripe_subscription_id || subscription?.cancel_at_period_end === true}
              style={{
                marginTop: 18,
                width: "100%",
                borderRadius: 16,
                border: "1px solid #fecaca",
                background: subscription?.cancel_at_period_end ? "#f8fafc" : "#fff5f5",
                color: "#b42318",
                padding: "13px 16px",
                fontSize: 14,
                fontWeight: 800,
                cursor: subscription?.cancel_at_period_end ? "not-allowed" : "pointer",
              }}
            >
              {subscription?.cancel_at_period_end ? "Cancellation already scheduled" : "Cancel At Period End"}
            </button>
          </div>
        </section>
      </div>
    </OperatorLayout>
  );
}
