import { useEffect, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import StripeElementsProvider from "../../components/payments/StripeElementsProvider.jsx";
import SubscriptionCheckoutForm from "../../components/payments/SubscriptionCheckoutForm.jsx";
import {
  formatMoney,
  getSubscriptionPlanLabel,
  getSubscriptionStatusLabel,
  hasStripePublishableKey,
} from "../../components/payments/paymentHelpers.js";

const PLAN_OPTIONS = [
  {
    code: "pro_monthly",
    title: "Pro Monthly",
    priceCents: 2999,
    billing: "/month",
    description:
      "Flexible monthly billing for restaurants that want direct ordering, stronger branding, and Stripe-backed billing without annual commitment.",
  },
  {
    code: "pro_annual",
    title: "Pro Annual",
    priceCents: 19900,
    billing: "/year",
    description:
      "Lower annual effective rate for restaurants ready to lock in Grubbid Pro for the year.",
  },
];

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
  const [subscription, setSubscription] = useState(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState("pro_monthly");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkoutSession, setCheckoutSession] = useState(null);

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
  }, [selectedRestaurant?.id]);

  async function handleStartCheckout() {
    if (!selectedRestaurant?.id) {
      setError("Select a restaurant before starting a subscription.");
      return;
    }

    setCreating(true);
    setError("");
    setMessage("");
    setCheckoutSession(null);

    try {
      const response = await api.createPlatformSubscription({
        restaurantId: selectedRestaurant.id,
        planCode: selectedPlanCode,
      });

      setCheckoutSession(response);

      if (response.already_active) {
        setMessage("This restaurant already has an active subscription for that plan.");
        await refreshSubscription();
      } else if (!response.client_secret) {
        setMessage("Subscription record created. Refreshing backend status.");
        await refreshSubscription();
      }
    } catch (err) {
      setError(err.message || "Unable to start subscription checkout.");
    } finally {
      setCreating(false);
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
      setCheckoutSession(null);
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
            The selected restaurant is billed as a platform customer through Stripe Billing. Payment confirmation uses Stripe Elements, and subscription state is finalized from webhook-backed backend status.
          </p>
        </section>

        <section style={{ marginTop: 24, display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {PLAN_OPTIONS.map((plan) => {
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
                      {plan.code === "pro_annual" ? "Annual" : "Monthly"}
                    </div>
                    <h2 style={{ margin: "8px 0 0", fontSize: 28, color: "#0f1720", letterSpacing: "-0.05em" }}>
                      {plan.title}
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
                    {formatMoney(plan.priceCents)}
                  </div>
                  <div style={{ fontSize: 15, color: "#475467", fontWeight: 600 }}>{plan.billing}</div>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "#475467" }}>{plan.description}</p>
              </button>
            );
          })}
        </section>

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

            {!hasStripePublishableKey() ? (
              <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 14, background: "#fff7ed", color: "#9a3412", fontSize: 14, fontWeight: 700 }}>
                VITE_STRIPE_PUBLISHABLE_KEY is not configured in the frontend environment.
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleStartCheckout}
              disabled={!selectedRestaurant?.id || creating || loading || !hasStripePublishableKey()}
              style={{
                marginTop: 18,
                width: "100%",
                border: "none",
                borderRadius: 16,
                background: creating ? "#94a3b8" : "#11211a",
                color: "#fff",
                padding: "14px 16px",
                fontSize: 15,
                fontWeight: 900,
                cursor: creating ? "wait" : "pointer",
              }}
            >
              {creating ? "Preparing checkout..." : `Start ${getSubscriptionPlanLabel(selectedPlanCode)}`}
            </button>

            {checkoutSession?.client_secret ? (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#667085", marginBottom: 10 }}>
                  Confirm first invoice payment
                </div>
                <StripeElementsProvider clientSecret={checkoutSession.client_secret}>
                  <SubscriptionCheckoutForm
                    returnUrl={`${window.location.origin}/operator/subscription`}
                    onConfirmed={async () => {
                      setMessage("Payment submitted. Refreshing subscription status from the backend.");
                      setCheckoutSession(null);
                      await refreshSubscription();
                    }}
                  />
                </StripeElementsProvider>
              </div>
            ) : null}
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
