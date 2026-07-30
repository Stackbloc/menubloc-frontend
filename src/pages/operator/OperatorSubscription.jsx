import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import PlanComparisonTable from "../../components/PlanComparisonTable.jsx";
import * as api from "../../lib/operatorApi.js";
import { getCheckoutPlans } from "../../lib/operatorApi.js";
import {
  getSubscriptionPlanLabel,
  getSubscriptionStatusLabel,
} from "../../components/payments/paymentHelpers.js";
import {
  CHECKOUT_PRICE_LABELS,
  FOOD_TRUCK_ANNUAL_PLAN_CODE,
  FREE_PLAN_CODE,
  buildOperatorStripeCheckoutBody,
  clearIntendedCheckoutPlanCode,
  filterSelectableCheckoutPlans,
  getCheckoutPriceLabel,
  getMarketplaceCommissionDisclosure,
  indexPlansByCode,
  isFreePlanCode,
  isPaidSubscriptionConfirmed,
  readIntendedCheckoutPlanCode,
} from "../../lib/menuplyCheckoutPlans.js";

const GREEN = "#1F4E3D";
const AMBER = "#92400e";

function formatWholeDollarAmount(cents) {
  if (cents == null) return "";
  const amount = Number(cents);
  const dollars = Number.isFinite(amount) ? Math.round(amount / 100) : 0;
  return `$${dollars}`;
}

function getPlanTier(planCode) {
  if (!planCode) return "published";
  if (isFreePlanCode(planCode)) return "published";
  if (planCode === FOOD_TRUCK_ANNUAL_PLAN_CODE || planCode === "foodtruck_verified_annual") {
    return "food_truck";
  }
  if (planCode?.startsWith("founders")) return "founders";
  if (planCode?.startsWith("starter")) return "pro";
  // Legacy Pro display only.
  if (planCode?.startsWith("pro")) return "pro";
  return "published";
}

function getMarketplaceSetupStatus(sub) {
  if (!sub) return "Not started";
  if (sub.stripe_subscription_id) return "Connected";
  if (sub.stripe_customer_id) return "In progress";
  return "Not started";
}

function getAutoRenewLabel(sub) {
  return sub?.cancel_at_period_end ? "No" : "Yes";
}

function getBillingIntervalLabel(planCode) {
  if (!planCode || isFreePlanCode(planCode)) return "Free";
  if (planCode.includes("annual")) return "Annual";
  if (planCode.includes("monthly")) return "Monthly";
  return "Free";
}

function getPlanPriceLabel(planCode, planOptions) {
  const labeled = getCheckoutPriceLabel(planCode);
  if (labeled) return labeled;
  // Legacy Pro rows may still appear on historical subscriptions.
  if (planCode === "pro_annual") return "$399/year";
  if (planCode === "pro_monthly") return "$49/month";
  const match = (planOptions || []).find((p) => p.code === planCode);
  if (match?.amount_cents != null) {
    const interval = match.billing_interval === "month" ? "month" : "year";
    return `${formatWholeDollarAmount(match.amount_cents)}/${interval === "month" ? "month" : "year"}`;
  }
  return "Free";
}

function StatusRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 12, borderTop: "1px solid #eaecf0" }}>
      <span style={{ fontSize: 13, color: "#475467", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

async function markFoodTruckSubscriptionActivated(restaurantId) {
  await api.markOnboardingStage(restaurantId, {
    stage_id: "subscription_active",
    status: "completed",
    append_completed_key: "subscription_active",
    current_step_key: "detailed_information",
    selected_plan_code: FOOD_TRUCK_ANNUAL_PLAN_CODE,
    extra: { onboarding_kind: "food_truck" },
  });
  await api.markOnboardingStage(restaurantId, {
    stage_id: "onboarding_complete",
    status: "completed",
    append_completed_key: "onboarding_complete",
    current_step_key: "detailed_information",
    selected_plan_code: FOOD_TRUCK_ANNUAL_PLAN_CODE,
    extra: { onboarding_kind: "food_truck", account_active: true },
  });
}

export default function OperatorSubscription() {
  const { selectedRestaurant } = useOperator();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [planOptions, setPlanOptions] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [proInterval, setProInterval] = useState("monthly");
  const [foundersInterval, setFoundersInterval] = useState("annual");
  const [loading, setLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedPlanCode, setSelectedPlanCode] = useState(null);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [preferFoodTruckPlan, setPreferFoodTruckPlan] = useState(false);
  const foodTruckOnboarding = searchParams.get("onboarding") === "food_truck";

  const monthlyPlan = planOptions.find((p) => p.code === "starter_monthly");
  const annualPlan = planOptions.find((p) => p.code === "starter_annual");
  const foundersMonthlyPlan = planOptions.find((p) => p.code === "founders_monthly");
  const foundersAnnualPlan =
    planOptions.find((p) => p.code === "founders_annual") || {
      code: "founders_annual",
      amount_cents: 31900,
      billing_interval: "year",
    };
  const foodTruckPlan =
    planOptions.find((p) => p.code === FOOD_TRUCK_ANNUAL_PLAN_CODE) || {
      code: FOOD_TRUCK_ANNUAL_PLAN_CODE,
      amount_cents: 8900,
      billing_interval: "year",
    };

  const proPlanCode = proInterval === "annual" ? "starter_annual" : "starter_monthly";
  const foundersPlanCode =
    foundersInterval === "monthly" ? "founders_monthly" : "founders_annual";

  const currentPlanCode = subscription?.plan_code || null;
  const currentTier = getPlanTier(currentPlanCode);
  const normalizedStatus = String(subscription?.status || "").toLowerCase();
  const hasPaidSubscription = Boolean(
    currentPlanCode &&
    currentTier !== "published" &&
    ["active", "trialing", "past_due", "canceling"].includes(normalizedStatus)
  );
  const hasPublishedAccess = currentTier === "published" || !currentPlanCode;
  const shouldShowAccountManagement = hasPaidSubscription;

  const canCancel =
    Boolean(subscription?.stripe_subscription_id && subscription?.current_period_end) &&
    ["active", "trialing", "past_due"].includes(normalizedStatus) &&
    !subscription?.cancel_at_period_end;

  const canManageBilling = Boolean(subscription?.stripe_customer_id);

  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : "N/A";

  useEffect(() => {
    const intended = readIntendedCheckoutPlanCode();
    if (intended === FOOD_TRUCK_ANNUAL_PLAN_CODE || foodTruckOnboarding) {
      setPreferFoodTruckPlan(true);
      setSelectedPlanCode(FOOD_TRUCK_ANNUAL_PLAN_CODE);
    }
  }, [foodTruckOnboarding]);

  useEffect(() => {
    getCheckoutPlans()
      .then((data) => {
        setPlanOptions(filterSelectableCheckoutPlans(data.plans || []));
      })
      .catch(() => {
        setPlanOptions(filterSelectableCheckoutPlans([]));
      });
  }, []);

  async function refreshSubscription() {
    if (!selectedRestaurant?.id) {
      setSubscription(null);
      return null;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.getPlatformSubscriptionStatus(selectedRestaurant.id);
      setSubscription(response);
      return response;
    } catch (err) {
      setError(err.message || "Unable to load subscription status.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSubscription();
  }, [selectedRestaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) {
      setShowPlanSelection(!shouldShowAccountManagement);
    }
  }, [loading, shouldShowAccountManagement]);

  useEffect(() => {
    if (!foodTruckOnboarding || loading || !selectedRestaurant?.id) return;
    if (!isPaidSubscriptionConfirmed(subscription)) return;
    markFoodTruckSubscriptionActivated(selectedRestaurant.id).catch(() => {});
    navigate("/foodtruck/onboarding/details?activated=1", { replace: true });
  }, [foodTruckOnboarding, loading, selectedRestaurant?.id, subscription, navigate]);

  const checkoutResult = searchParams.get("checkout");
  useEffect(() => {
    if (checkoutResult === "success") {
      setMessage("Payment received. Confirming your subscription…");
      setSearchParams({}, { replace: true });
      refreshSubscription().then((sub) => {
        if (isPaidSubscriptionConfirmed(sub)) {
          clearIntendedCheckoutPlanCode();
          if (foodTruckOnboarding && selectedRestaurant?.id) {
            markFoodTruckSubscriptionActivated(selectedRestaurant.id).catch(() => {});
            setMessage("Your Food Truck account is active. Continue to your public profile details.");
            setTimeout(() => navigate("/foodtruck/onboarding/details?activated=1"), 1200);
          } else {
            setMessage("Your plan is active. Upload your menu to complete your public profile.");
            setTimeout(() => navigate("/operator/menulab"), 2000);
          }
        } else {
          setMessage(
            "Payment received. Your subscription is still processing — this page will show Active once Stripe confirms."
          );
        }
      });
    } else if (checkoutResult === "cancelled") {
      setSearchParams({}, { replace: true });
    }
  }, [checkoutResult, foodTruckOnboarding, selectedRestaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelectPublished() {
    setError("");
    setMessage("");
    if (hasPublishedAccess) {
      navigate("/operator/menulab");
      return;
    }
    if (!selectedRestaurant?.id) {
      setError("Select a restaurant first.");
      return;
    }
    try {
      await api.cancelPlatformSubscription({ restaurantId: selectedRestaurant.id, atPeriodEnd: true });
      setMessage("Standard selected. Your menu and data are preserved.");
      await refreshSubscription();
      setTimeout(() => navigate("/operator/menulab"), 1500);
    } catch (err) {
      setError(err.message || "Unable to switch to Standard.");
    }
  }

  async function handleManageBilling() {
    if (!selectedRestaurant?.id) {
      setError("Select a restaurant first.");
      return;
    }
    if (!canManageBilling) {
      setError("No Stripe billing account yet. Subscribe to a paid plan first.");
      return;
    }
    setIsOpeningPortal(true);
    setError("");
    setMessage("");
    try {
      const origin = window.location.origin;
      await api.openBillingPortal(selectedRestaurant.id, {
        returnUrl: `${origin}/operator/subscription`,
      });
    } catch (err) {
      setError(err.message || "Unable to open billing portal.");
      setIsOpeningPortal(false);
    }
  }

  async function handleStripeCheckout(planCode) {
    if (!selectedRestaurant?.id) {
      setError("Select a restaurant before starting checkout.");
      return;
    }
    setIsCheckingOut(true);
    setError("");
    setMessage("");
    try {
      const origin = window.location.origin;
      const body = buildOperatorStripeCheckoutBody({
        restaurantId: selectedRestaurant.id,
        planCode,
        successUrl: `${origin}/operator/subscription?checkout=success${foodTruckOnboarding ? "&onboarding=food_truck" : ""}`,
        cancelUrl: `${origin}/operator/subscription?checkout=cancelled${foodTruckOnboarding ? "&onboarding=food_truck" : ""}`,
      });
      const result = await api.createPlatformCheckoutSession(body);
      if (result.already_active) {
        setMessage(foodTruckOnboarding ? "Plan active. Taking you to profile details..." : "Plan active. Taking you to menu setup…");
        await refreshSubscription();
        clearIntendedCheckoutPlanCode();
        if (foodTruckOnboarding) {
          await api.markOnboardingStage(selectedRestaurant.id, {
            stage_id: "subscription_active",
            status: "completed",
            append_completed_key: "subscription_active",
            current_step_key: "detailed_information",
            selected_plan_code: FOOD_TRUCK_ANNUAL_PLAN_CODE,
            extra: { onboarding_kind: "food_truck" },
          }).catch(() => {});
          setTimeout(() => navigate("/foodtruck/onboarding/details"), 800);
        } else {
          setTimeout(() => navigate("/operator/menulab"), 1500);
        }
        setIsCheckingOut(false);
        return;
      }
      if (!result.checkout_url) throw new Error("No checkout URL returned.");
      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err.message || "Unable to start checkout.");
      setIsCheckingOut(false);
    }
  }

  async function handleCancelSubscription() {
    if (!selectedRestaurant?.id) {
      setError("Select a restaurant first.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await api.cancelPlatformSubscription({ restaurantId: selectedRestaurant.id, atPeriodEnd: true });
      setMessage("Auto-renewal turned off. Subscription ends at the current period end.");
      await refreshSubscription();
    } catch (err) {
      setError(err.message || "Unable to cancel subscription.");
    }
  }

  const showFoodTruckMiddleCard = preferFoodTruckPlan || currentTier === "food_truck";

  return (
    <OperatorLayout title="Subscription">
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {checkoutResult === "cancelled" && !message && !error && (
          <div style={banner("warn")}>Checkout was cancelled. No charge was made.</div>
        )}
        {error && <div style={banner("error")}>{error}</div>}
        {message && <div style={banner("success")}>{message}</div>}

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.03em" }}>
            {showPlanSelection ? "Choose Plan" : "My Account"}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280" }}>
            {showPlanSelection
              ? "Choose a plan and complete your restaurant setup."
              : "Review your current subscription and billing details before changing plans."}
          </p>
        </div>

        {!showPlanSelection && shouldShowAccountManagement && (
          <div style={{ maxWidth: 520, background: "#fff", border: "1px solid #eaecf0", borderRadius: 16, padding: 22, marginBottom: 32 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: "#0f1720" }}>Subscription status</h3>
            <div style={{ display: "grid", gap: 2 }}>
              <StatusRow label="Current plan" value={getSubscriptionPlanLabel(currentPlanCode)} />
              <StatusRow label="Billing interval" value={getBillingIntervalLabel(currentPlanCode)} />
              <StatusRow label="Subscription status" value={loading ? "Loading…" : getSubscriptionStatusLabel(subscription?.status)} />
              <StatusRow label="Next billing / renewal" value={loading ? "Loading…" : currentPeriodEnd} />
              <StatusRow label="Price" value={getPlanPriceLabel(currentPlanCode, planOptions)} />
              <StatusRow label="Auto Renew" value={loading ? "Loading…" : getAutoRenewLabel(subscription)} />
              <StatusRow label="Marketplace Setup" value={loading ? "Loading…" : getMarketplaceSetupStatus(subscription)} />
            </div>

            {subscription?.cancel_at_period_end && (
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #eaecf0", fontSize: 14, fontWeight: 700, color: "#667085", textAlign: "center" }}>
                Cancellation scheduled — access continues until period end
              </div>
            )}

            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              <button type="button" style={planBtn("muted", GREEN)} onClick={() => navigate("/operator/menulab")}>
                Go to Dashboard
              </button>
              <button type="button" style={planBtn("primary", GREEN)} onClick={() => setShowPlanSelection(true)}>
                Change Plan
              </button>
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={!canManageBilling || isOpeningPortal}
                style={{
                  ...planBtn("muted", GREEN),
                  opacity: canManageBilling && !isOpeningPortal ? 1 : 0.6,
                  cursor: canManageBilling && !isOpeningPortal ? "pointer" : "not-allowed",
                }}
              >
                {isOpeningPortal ? "Opening Billing…" : "Manage Billing"}
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={!canCancel}
                style={{ ...planBtn("muted", GREEN), opacity: canCancel ? 1 : 0.5, cursor: canCancel ? "pointer" : "not-allowed" }}
              >
                Cancel Subscription
              </button>
              {!canManageBilling && (
                <div style={{ fontSize: 12, color: "#8a9ab0", textAlign: "center" }}>
                  Billing portal opens after a paid plan creates your Stripe billing account.
                </div>
              )}
            </div>
          </div>
        )}

        {showPlanSelection && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 36, alignItems: "start" }} className="operator-responsive-grid-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlanCode(FREE_PLAN_CODE)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedPlanCode(FREE_PLAN_CODE);
                }}
                style={{ ...planCard("#f8faf9", "#d1e7dd", selectedPlanCode === FREE_PLAN_CODE), cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>Standard</span>
                  {hasPublishedAccess && <span style={currentBadge(GREEN)}>Current access</span>}
                </div>
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#eef6f1",
                    border: "1px solid #cfe0d8",
                    color: GREEN,
                    fontSize: 13,
                    fontWeight: 800,
                    lineHeight: 1.35,
                  }}
                >
                  {getMarketplaceCommissionDisclosure(FREE_PLAN_CODE, {
                    plansByCode: indexPlansByCode(planOptions),
                  })}
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.04em" }}>
                    {CHECKOUT_PRICE_LABELS[FREE_PLAN_CODE]}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 2 }}>Always</div>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                  {[
                    "Public restaurant profile",
                    "Single menu + unlimited items",
                    "QR code & public menu sharing",
                    "Basic upload & editing tools",
                  ].map((benefit) => (
                    <li key={benefit} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 7, alignItems: "flex-start" }}>
                      <span style={{ color: GREEN, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <button type="button" style={hasPublishedAccess ? planBtn("primary", GREEN) : planBtn("muted", GREEN)} onClick={handleSelectPublished} disabled={isCheckingOut}>
                  Select Standard
                </button>
                <p style={{ margin: 0, fontSize: 11, color: "#8a9ab0", textAlign: "center" }}>
                  Standard activates without Stripe checkout.
                </p>
              </div>

              {showFoodTruckMiddleCard ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlanCode(FOOD_TRUCK_ANNUAL_PLAN_CODE)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setSelectedPlanCode(FOOD_TRUCK_ANNUAL_PLAN_CODE);
                    }
                  }}
                  style={{
                    ...planCard(
                      "#fff",
                      GREEN,
                      selectedPlanCode === FOOD_TRUCK_ANNUAL_PLAN_CODE
                    ),
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>Food Truck</span>
                    {currentTier === "food_truck" ? (
                      <span style={currentBadge(GREEN)}>Current plan</span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "#eef6f1",
                      border: "1px solid #cfe0d8",
                      color: GREEN,
                      fontSize: 13,
                      fontWeight: 800,
                      lineHeight: 1.35,
                    }}
                  >
                    {getMarketplaceCommissionDisclosure(FOOD_TRUCK_ANNUAL_PLAN_CODE, {
                      plansByCode: indexPlansByCode(planOptions),
                    })}
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.04em" }}>
                      {formatWholeDollarAmount(foodTruckPlan.amount_cents)}
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>/year</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 2 }}>
                      {CHECKOUT_PRICE_LABELS[FOOD_TRUCK_ANNUAL_PLAN_CODE]}
                    </div>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                    {[
                      "Professional Food Truck profile",
                      "Logo and product photos",
                      "Full menu",
                      "Edit menus and menu items",
                      "Rich searchable menu data",
                      "QR Code",
                      "Window QR Code included",
                      "Social sharing of menus and menu items",
                      "Customers can follow your Food Truck",
                      "Create deals and promotions free of charge",
                      "Online ordering",
                    ].map((benefit) => (
                      <li key={benefit} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 7, alignItems: "flex-start" }}>
                        <span style={{ color: GREEN, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  {currentTier !== "food_truck" ? (
                    <button
                      type="button"
                      style={{ ...planBtn("primary", GREEN), opacity: isCheckingOut ? 0.6 : 1 }}
                      disabled={isCheckingOut}
                      onClick={() => handleStripeCheckout(FOOD_TRUCK_ANNUAL_PLAN_CODE)}
                    >
                      {isCheckingOut ? "Redirecting…" : "Choose Food Truck"}
                    </button>
                  ) : (
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f0f7f4", textAlign: "center", fontSize: 13, fontWeight: 700, color: GREEN }}>
                      ✓ You're on Food Truck
                    </div>
                  )}
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlanCode(proPlanCode)}
                  onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedPlanCode(proPlanCode);
                  }}
                  style={{
                    ...planCard(
                      "#fff",
                      GREEN,
                      selectedPlanCode === "starter_monthly" || selectedPlanCode === "starter_annual"
                    ),
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>Pro</span>
                    {currentTier === "pro"
                      ? <span style={currentBadge(GREEN)}>Current plan</span>
                      : <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 999, background: "#d1fae5", color: "#065f46" }}>Most popular</span>}
                  </div>
                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "#eef6f1",
                      border: "1px solid #cfe0d8",
                      color: GREEN,
                      fontSize: 13,
                      fontWeight: 800,
                      lineHeight: 1.35,
                    }}
                  >
                    {getMarketplaceCommissionDisclosure(proPlanCode, {
                      plansByCode: indexPlansByCode(planOptions),
                    })}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { key: "monthly", plan: monthlyPlan, label: "Monthly", sub: CHECKOUT_PRICE_LABELS.starter_monthly },
                      { key: "annual", plan: annualPlan, label: "Annual", sub: CHECKOUT_PRICE_LABELS.starter_annual },
                    ].map(({ key, plan, label, sub }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setProInterval(key);
                          setSelectedPlanCode(key === "annual" ? "starter_annual" : "starter_monthly");
                        }}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: proInterval === key ? `1.5px solid ${GREEN}` : "1.5px solid #e4e9f0",
                          background: proInterval === key ? "#f0f7f4" : "#fff",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          width: "100%",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${proInterval === key ? GREEN : "#d1d5db"}`, background: proInterval === key ? GREEN : "transparent", flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: proInterval === key ? GREEN : "#374151" }}>
                            {label}
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginLeft: 6 }}>{sub}</span>
                          </span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0f1720" }}>
                          {plan ? formatWholeDollarAmount(plan.amount_cents) : "—"}
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>
                            {key === "monthly" ? "/mo" : "/yr"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                    {[
                      "Unlimited menus",
                      "Restaurant logo",
                      "Advanced public profile",
                      "Online ordering",
                      "Free deal posting",
                      "Public profile billboard/promotional placement",
                      "Menu/customer tools available to paid operators",
                    ].map((benefit) => (
                      <li key={benefit} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 7, alignItems: "flex-start" }}>
                        <span style={{ color: GREEN, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  {currentTier !== "pro" ? (
                    <button
                      type="button"
                      style={{ ...planBtn("primary", GREEN), opacity: isCheckingOut ? 0.6 : 1 }}
                      disabled={isCheckingOut}
                      onClick={() => handleStripeCheckout(proPlanCode)}
                    >
                      {isCheckingOut ? "Redirecting…" : proInterval === "annual" ? "Choose Annual" : "Choose Monthly"}
                    </button>
                  ) : (
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f0f7f4", textAlign: "center", fontSize: 13, fontWeight: 700, color: GREEN }}>
                      ✓ You're on Pro
                    </div>
                  )}
                </div>
              )}

              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlanCode(foundersPlanCode)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedPlanCode(foundersPlanCode);
                }}
                style={{
                  ...planCard(
                    "#fffbeb",
                    "#fcd34d",
                    selectedPlanCode === "founders_monthly" || selectedPlanCode === "founders_annual"
                  ),
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: AMBER }}>Founder&apos;s</span>
                  {currentTier === "founders"
                    ? <span style={currentBadge(AMBER)}>Current plan</span>
                    : <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 999, background: "#fee2e2", color: "#b42318" }}>Limited Availability</span>}
                </div>
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#fff7ed",
                    border: "1px solid #fde68a",
                    color: AMBER,
                    fontSize: 13,
                    fontWeight: 800,
                    lineHeight: 1.35,
                  }}
                >
                  {getMarketplaceCommissionDisclosure(foundersPlanCode, {
                    plansByCode: indexPlansByCode(planOptions),
                  })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    {
                      key: "monthly",
                      plan: foundersMonthlyPlan,
                      label: "Monthly",
                      sub: CHECKOUT_PRICE_LABELS.founders_monthly,
                    },
                    {
                      key: "annual",
                      plan: foundersAnnualPlan,
                      label: "Annual",
                      sub: CHECKOUT_PRICE_LABELS.founders_annual,
                    },
                  ].map(({ key, plan, label, sub }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setFoundersInterval(key);
                        setSelectedPlanCode(key === "monthly" ? "founders_monthly" : "founders_annual");
                      }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: foundersInterval === key ? `1.5px solid ${AMBER}` : "1.5px solid #e4e9f0",
                        background: foundersInterval === key ? "#fffbeb" : "#fff",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${foundersInterval === key ? AMBER : "#d1d5db"}`, background: foundersInterval === key ? AMBER : "transparent", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: foundersInterval === key ? AMBER : "#374151" }}>
                          {label}
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#b45309", marginLeft: 6 }}>{sub}</span>
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f1720" }}>
                        {plan ? formatWholeDollarAmount(plan.amount_cents) : "—"}
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>
                          {key === "monthly" ? "/mo" : "/yr"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#8a9ab0" }}>
                  Guaranteed, no increase pricing for 24 months on Founder&apos;s Annual
                </div>
                {currentTier !== "founders" ? (
                  <button
                    type="button"
                    style={{ ...planBtn("founders", AMBER), opacity: isCheckingOut ? 0.6 : 1 }}
                    disabled={isCheckingOut}
                    onClick={() => handleStripeCheckout(foundersPlanCode)}
                  >
                    {isCheckingOut ? "Redirecting…" : "Choose Founder's Plan"}
                  </button>
                ) : (
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fef3c7", textAlign: "center", fontSize: 13, fontWeight: 700, color: AMBER }}>
                    ✓ You're a Founder's member
                  </div>
                )}
              </div>
            </div>

            {/* QR kit add-on callout */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap",
              background: "#f0f7f4", border: "1.5px solid #a7d4c0",
              borderRadius: 12, padding: "16px 20px", marginBottom: 28,
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1F4E3D", marginBottom: 4 }}>
                  ▣ Add QR Menu Kits — print-ready & ready to scan
                </div>
                <div style={{ fontSize: 13, color: "#344054", lineHeight: 1.5 }}>
                  Put your menu on every table. Menuply QR kits include custom-branded cards, stands, and stickers — printed and shipped. Pairs with any plan.
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/operator/marketplace")}
                style={{
                  background: "#1F4E3D", color: "#fff", border: "none",
                  borderRadius: 8, padding: "10px 18px",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  whiteSpace: "nowrap", fontFamily: "inherit",
                }}
              >
                Shop QR Kits →
              </button>
            </div>

            <PlanComparisonTable />
          </>
        )}
      </div>
    </OperatorLayout>
  );
}

function planCard(bg, borderColor, highlighted) {
  return {
    background: bg,
    border: `${highlighted ? 2 : 1.5}px solid ${borderColor}`,
    borderRadius: 16,
    padding: "20px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };
}

function currentBadge(color) {
  return {
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "3px 8px",
    borderRadius: 999,
    background: color === AMBER ? "#fef3c7" : "#d1fae5",
    color: color === AMBER ? AMBER : "#065f46",
  };
}

function planBtn(variant, accentColor) {
  const base = {
    width: "100%",
    border: "none",
    borderRadius: 10,
    padding: "11px 12px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  };
  if (variant === "primary") return { ...base, background: accentColor, color: "#fff" };
  if (variant === "founders") return { ...base, background: AMBER, color: "#fff" };
  return { ...base, background: "#f4f3ef", color: "#5b6675" };
}

function banner(type) {
  const map = {
    success: { bg: "#f0fdf4", border: "#86efac", color: "#166534" },
    error: { bg: "#fef2f2", border: "#fecaca", color: "#b42318" },
    warn: { bg: "#fff7ed", border: "#fdba74", color: "#9a3412" },
  };
  const s = map[type];
  return {
    marginBottom: 16,
    background: s.bg,
    border: `1px solid ${s.border}`,
    color: s.color,
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 14,
    fontWeight: 600,
  };
}
