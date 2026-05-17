/**
 * src/pages/operator/OperatorSubscription.jsx
 *
 * Plan selection page — Verified (free) | Pro (paid) | Founders (paid, annual).
 *
 * Flow:
 *   1. Operator lands here after account creation or from sidebar nav
 *   2. Selects a plan (Verified → immediate redirect; Pro/Founders → Stripe checkout)
 *   3. On success → /operator/menu (upload-first menu screen)
 *
 * Founders is a pricing variant of Pro, not a separate feature tier.
 * Verified is a meaningful free entry tier — intentionally lightweight.
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import { validateDiscountCode, getCheckoutPlans } from "../../lib/operatorApi.js";
import {
  formatMoney,
  getSubscriptionPlanLabel,
  getSubscriptionStatusLabel,
} from "../../components/payments/paymentHelpers.js";

// ── Feature comparison matrix ──────────────────────────────────────────────
// Verified checkmarks: only the 4 approved features.
// Founders (f) = Pro (p) — Founders is pricing differentiation only.
const MATRIX = [
  {
    category: "Discovery & Presence",
    rows: [
      { label: "Searchable listing",           v: true,  p: true, f: true },
      { label: "Public restaurant profile",     v: true,  p: true, f: true },
      { label: "QR code & public menu sharing", v: true,  p: true, f: true },
      { label: "Social sharing",               v: false, p: true, f: true },
      { label: "Followers",                    v: false, p: true, f: true },
    ],
  },
  {
    category: "Menu Management",
    rows: [
      { label: "Single menu + unlimited items",     v: true,  p: true, f: true },
      { label: "PDF, spreadsheet & photo upload",   v: true,  p: true, f: true },
      { label: "Paste menu text",                   v: true,  p: true, f: true },
      { label: "Edit, publish & delete items",      v: true,  p: true, f: true },
      { label: "Multiple menus",                    v: false, p: true, f: true },
    ],
  },
  {
    category: "Menu Intelligence",
    rows: [
      { label: "Nutrition enrichment",     v: false, p: true, f: true },
      { label: "Ingredient intelligence",  v: false, p: true, f: true },
      { label: "Advanced menu attributes", v: false, p: true, f: true },
    ],
  },
  {
    category: "Pricing & Deals",
    rows: [
      { label: "Bulk price adjustments",  v: false, p: true, f: true },
      { label: "Deals & billboard deals", v: false, p: true, f: true },
    ],
  },
  {
    category: "Marketplace & Commerce",
    rows: [
      { label: "Marketplace ordering", v: false, p: true, f: true },
      { label: "Direct ordering",      v: false, p: true, f: true },
    ],
  },
];

// ── Design tokens ──────────────────────────────────────────────────────────
const GREEN = "#1F4E3D";
const AMBER = "#92400e";

function getPlanTier(planCode) {
  if (!planCode) return "verified";
  if (planCode === "founders_annual") return "founders";
  if (planCode?.startsWith("pro")) return "pro";
  return "verified";
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

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 12, borderTop: "1px solid #eaecf0" }}>
      <span style={{ fontSize: 13, color: "#475467", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function CategoryHeader({ label }) {
  return (
    <tr>
      <td colSpan={4} style={{
        padding: "18px 16px 8px",
        fontSize: 11, fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.07em", color: "#8a9ab0",
        background: "#f8faf9", borderTop: "1px solid #e4e9f0",
      }}>
        {label}
      </td>
    </tr>
  );
}

function FeatureRow({ label, v, p, f, shade }) {
  const check = (flag) => flag
    ? <span style={{ color: GREEN, fontWeight: 800, fontSize: 15 }}>✓</span>
    : <span style={{ color: "#d1d5db", fontSize: 15 }}>—</span>;
  return (
    <tr style={{ background: shade ? "#f8faf9" : "#fff" }}>
      <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151", fontWeight: 500, borderRight: "1px solid #f0f4f8" }}>{label}</td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 90 }}>{check(v)}</td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 90, background: shade ? "#f0f7f4" : "#f8fdf9" }}>{check(p)}</td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 90 }}>{check(f)}</td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function OperatorSubscription() {
  const { selectedRestaurant } = useOperator();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [planOptions, setPlanOptions]     = useState([]);
  const [subscription, setSubscription]   = useState(null);
  const [proInterval, setProInterval]     = useState("monthly");
  const [loading, setLoading]             = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage]             = useState("");
  const [error, setError]                 = useState("");

  const [discountCodeInput, setDiscountCodeInput]   = useState("");
  const [discountValidation, setDiscountValidation] = useState(null);
  const [discountLoading, setDiscountLoading]       = useState(false);
  const [discountError, setDiscountError]           = useState("");

  // ── Derived ───────────────────────────────────────────────────────────────
  const monthlyPlan  = planOptions.find(p => p.code === "pro_monthly");
  const annualPlan   = planOptions.find(p => p.code === "pro_annual");
  const foundersPlan = planOptions.find(p => p.code === "founders_annual") || annualPlan;

  const currentPlanCode = subscription?.plan_code || null;
  const currentTier     = getPlanTier(currentPlanCode);

  const hasActiveStripeSubscription = Boolean(
    subscription?.stripe_subscription_id && subscription?.current_period_end
  );
  const canCancel =
    hasActiveStripeSubscription &&
    ["active", "trialing", "past_due"].includes(subscription?.status) &&
    !subscription?.cancel_at_period_end;

  const annualSavings = monthlyPlan && annualPlan
    ? Math.round(100 - (annualPlan.amount_cents / (monthlyPlan.amount_cents * 12)) * 100)
    : null;

  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString() : "N/A";

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    getCheckoutPlans()
      .then(data => {
        const filtered = (data.plans || []).filter(p =>
          ["pro_monthly", "pro_annual", "founders_annual"].includes(p.code)
        );
        if (filtered.length) setPlanOptions(filtered);
      })
      .catch(() => {
        setPlanOptions([
          { code: "pro_monthly", checkout_label: "Pro Monthly", amount_cents: 4900,  billing_interval: "month" },
          { code: "pro_annual",  checkout_label: "Pro Annual",  amount_cents: 39900, billing_interval: "year"  },
        ]);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshSubscription() {
    if (!selectedRestaurant?.id) { setSubscription(null); return; }
    setLoading(true);
    setError("");
    try {
      const response = await api.getPlatformSubscriptionStatus(selectedRestaurant.id);
      setSubscription(response);
    } catch (err) {
      setError(err.message || "Unable to load subscription status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSubscription();
  }, [selectedRestaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Checkout success → redirect to /operator/menu ─────────────────────────
  const checkoutResult = searchParams.get("checkout");
  useEffect(() => {
    if (checkoutResult === "success") {
      setMessage("Subscription activated. Taking you to your dashboard…");
      setSearchParams({}, { replace: true });
      refreshSubscription().then(() => {
        setTimeout(() => navigate("/operator/menu"), 2000);
      });
    } else if (checkoutResult === "cancelled") {
      setSearchParams({}, { replace: true });
    }
  }, [checkoutResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

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

  async function handleSelectVerified() {
    setError("");
    setMessage("");
    if (currentTier === "verified") {
      navigate("/operator/menu");
      return;
    }
    if (!selectedRestaurant?.id) {
      setError("Select a restaurant first.");
      return;
    }
    try {
      await api.cancelPlatformSubscription({ restaurantId: selectedRestaurant.id, atPeriodEnd: true });
      setMessage("Downgraded to Verified. Your menu and data are preserved.");
      await refreshSubscription();
      setTimeout(() => navigate("/operator/menu"), 1500);
    } catch (err) {
      setError(err.message || "Unable to downgrade plan.");
    }
  }

  async function handleStripeCheckout(planCode, discountCode) {
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
        planCode,
        successUrl: `${origin}/operator/subscription?checkout=success`,
        cancelUrl:  `${origin}/operator/subscription?checkout=cancelled`,
        discountCode: discountCode || undefined,
      });
      if (result.already_active) {
        setMessage("Plan active. Taking you to your dashboard…");
        await refreshSubscription();
        setTimeout(() => navigate("/operator/menu"), 1500);
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
    if (!selectedRestaurant?.id) { setError("Select a restaurant first."); return; }
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <OperatorLayout title="Subscription">
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* ── Alert banners ──────────────────────────────────────── */}
        {checkoutResult === "cancelled" && !message && !error && (
          <div style={banner("warn")}>Checkout was cancelled. No charge was made.</div>
        )}
        {error   && <div style={banner("error")}>{error}</div>}
        {message && <div style={banner("success")}>{message}</div>}

        {/* ── Page heading ───────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.03em" }}>
            Choose your plan
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280" }}>
            All plans include a public menu, QR code, and upload tools. Upgrade any time.
          </p>
        </div>

        {/* ── Plan cards: Verified | Pro | Founders ──────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 36,
          alignItems: "start",
        }} className="operator-responsive-grid-3">

          {/* ── Verified ── */}
          <div style={planCard("#f8faf9", "#d1e7dd", false)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>Verified</span>
              {currentTier === "verified" && (
                <span style={currentBadge(GREEN)}>Current plan</span>
              )}
            </div>

            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.04em" }}>Free</div>
              <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 2 }}>Always</div>
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
              {[
                "Public restaurant profile",
                "Single menu + unlimited items",
                "QR code & public menu sharing",
                "Basic upload & editing tools",
              ].map(b => (
                <li key={b} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 7, alignItems: "flex-start" }}>
                  <span style={{ color: GREEN, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>

            {currentTier === "verified" ? (
              <button
                style={planBtn("primary", GREEN)}
                onClick={() => navigate("/operator/menu")}
              >
                Go to Dashboard →
              </button>
            ) : (
              <button
                style={planBtn("muted", GREEN)}
                onClick={handleSelectVerified}
                disabled={isCheckingOut}
              >
                Downgrade to Verified
              </button>
            )}

            <p style={{ margin: 0, fontSize: 11, color: "#8a9ab0", textAlign: "center" }}>
              Your menu and data are preserved if you downgrade.
            </p>
          </div>

          {/* ── Pro ── */}
          <div style={planCard("#fff", GREEN, true)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>Pro</span>
              {currentTier === "pro"
                ? <span style={currentBadge(GREEN)}>Current plan</span>
                : <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 999, background: "#d1fae5", color: "#065f46" }}>Most popular</span>
              }
            </div>

            {/* Billing toggle */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { key: "monthly", plan: monthlyPlan, label: "Monthly", sub: null },
                { key: "annual",  plan: annualPlan,  label: "Annual",  sub: annualSavings ? `Save ${annualSavings}%` : "Best value" },
              ].map(({ key, plan, label, sub }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setProInterval(key)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 12px", borderRadius: 10,
                    border: proInterval === key ? `1.5px solid ${GREEN}` : "1.5px solid #e4e9f0",
                    background: proInterval === key ? "#f0f7f4" : "#fff",
                    cursor: "pointer", fontFamily: "inherit", width: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: `2px solid ${proInterval === key ? GREEN : "#d1d5db"}`,
                      background: proInterval === key ? GREEN : "transparent",
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: proInterval === key ? GREEN : "#374151" }}>
                      {label}
                      {sub && <span style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginLeft: 6 }}>{sub}</span>}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0f1720" }}>
                    {plan ? formatMoney(plan.amount_cents) : "—"}
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>
                      {key === "monthly" ? "/mo" : "/yr"}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
              {[
                "Multiple menus",
                "Advanced pricing & deals",
                "Marketplace & ordering",
                "Nutrition enrichment",
                "Ingredient intelligence",
              ].map(b => (
                <li key={b} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 7, alignItems: "flex-start" }}>
                  <span style={{ color: GREEN, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>

            {currentTier !== "pro" ? (
              <>
                <button
                  style={{ ...planBtn("primary", GREEN), opacity: isCheckingOut ? 0.6 : 1 }}
                  disabled={isCheckingOut}
                  onClick={() => handleStripeCheckout(
                    proInterval === "annual" ? "pro_annual" : "pro_monthly",
                    discountValidation?.code || undefined
                  )}
                >
                  {isCheckingOut ? "Redirecting…" : `Get Pro ${proInterval === "annual" ? "(Annual)" : "(Monthly)"} →`}
                </button>
                {discountValidation && (
                  <div style={{ fontSize: 11, color: "#059669", textAlign: "center", fontWeight: 600 }}>
                    Code applied: {discountValidation.code}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f0f7f4", textAlign: "center", fontSize: 13, fontWeight: 700, color: GREEN }}>
                ✓ You're on Pro
              </div>
            )}
          </div>

          {/* ── Founders ── */}
          <div style={planCard("#fffbeb", "#fcd34d", false)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: AMBER }}>Founders</span>
              {currentTier === "founders"
                ? <span style={currentBadge(AMBER)}>Current plan</span>
                : <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 999, background: "#fef3c7", color: AMBER }}>Limited time</span>
              }
            </div>

            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.04em" }}>
                {foundersPlan ? (
                  <>{formatMoney(foundersPlan.amount_cents)}<span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>/yr</span></>
                ) : "—"}
              </div>
              <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 2 }}>Pricing guaranteed for 3 years</div>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
              Founders includes the Pro feature set with discounted annual pricing guaranteed for 3 years.
            </p>

            {/* Founders discount code */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 12px", borderRadius: 10,
              background: "#fef3c7", border: "1px solid #fcd34d",
            }}>
              <span style={{ fontSize: 12, color: AMBER, fontWeight: 600 }}>Discount code</span>
              <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: AMBER, letterSpacing: "0.08em" }}>
                FOUNDERS
              </span>
            </div>

            {currentTier !== "founders" ? (
              <button
                style={{ ...planBtn("founders", AMBER), opacity: isCheckingOut ? 0.6 : 1 }}
                disabled={isCheckingOut}
                onClick={() => handleStripeCheckout(foundersPlan?.code || "founders_annual", "FOUNDERS")}
              >
                {isCheckingOut ? "Redirecting…" : "Join as Founder →"}
              </button>
            ) : (
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fef3c7", textAlign: "center", fontSize: 13, fontWeight: 700, color: AMBER }}>
                ✓ You're a Founder
              </div>
            )}
          </div>
        </div>

        {/* ── Discount code (for Pro) ─────────────────────────────── */}
        <div style={{ maxWidth: 440, marginBottom: 36 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#475467", marginBottom: 8 }}>Have a discount code?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={discountCodeInput}
              onChange={e => { setDiscountCodeInput(e.target.value.toUpperCase()); setDiscountValidation(null); setDiscountError(""); }}
              placeholder="Enter code"
              style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid #d0d5dd", fontSize: 14, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em" }}
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={!discountCodeInput.trim() || discountLoading}
              style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "#0f1720", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              {discountLoading ? "…" : "Apply"}
            </button>
          </div>
          {discountError && <div style={{ marginTop: 6, fontSize: 13, color: "#b42318", fontWeight: 600 }}>{discountError}</div>}
          {discountValidation && (
            <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>✓ Code applied: {discountValidation.code}</div>
              {discountValidation.subscription_discount_percent && (
                <div style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>
                  {discountValidation.subscription_discount_percent}% off
                  {discountValidation.subscription_discount_days ? ` for ${discountValidation.subscription_discount_days} days` : " (ongoing)"}
                </div>
              )}
            </div>
          )}
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#8a9ab0" }}>
            Founders code <strong>FOUNDERS</strong> is applied automatically when you join as a Founder.
          </p>
        </div>

        {/* ── Feature comparison matrix ───────────────────────────── */}
        <div style={{ background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14, overflow: "hidden", marginBottom: 32 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8faf9", borderBottom: "2px solid #e4e9f0" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#8a9ab0", width: "55%" }}>
                  Feature
                </th>
                <th style={{ padding: "12px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: GREEN, width: 90 }}>Verified</th>
                <th style={{ padding: "12px 0", textAlign: "center", fontSize: 12, fontWeight: 800, color: GREEN, width: 90, background: "#f0f7f4" }}>Pro</th>
                <th style={{ padding: "12px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: AMBER, width: 90 }}>Founders</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((section) => (
                <>
                  <CategoryHeader key={`cat-${section.category}`} label={section.category} />
                  {section.rows.map((row, idx) => (
                    <FeatureRow
                      key={row.label}
                      label={row.label}
                      v={row.v} p={row.p} f={row.f}
                      shade={idx % 2 === 1}
                    />
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Current status + cancel (paid subscribers only) ──────── */}
        {hasActiveStripeSubscription && (
          <div style={{ maxWidth: 440, background: "#fff", border: "1px solid #eaecf0", borderRadius: 16, padding: 22 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: "#0f1720" }}>Subscription status</h3>
            <div style={{ display: "grid", gap: 2 }}>
              <StatusRow label="Plan"         value={getSubscriptionPlanLabel(currentPlanCode)} />
              <StatusRow label="Status"       value={loading ? "Loading…" : getSubscriptionStatusLabel(subscription?.status)} />
              <StatusRow label="Period ends"  value={loading ? "Loading…" : currentPeriodEnd} />
              <StatusRow label="Auto-renew"   value={loading ? "Loading…" : getAutoRenewLabel(subscription)} />
              <StatusRow label="Marketplace"  value={loading ? "Loading…" : getMarketplaceSetupStatus(subscription)} />
            </div>

            {subscription?.cancel_at_period_end ? (
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #eaecf0", fontSize: 14, fontWeight: 700, color: "#667085", textAlign: "center" }}>
                Cancellation scheduled — access continues until period end
              </div>
            ) : (
              <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                {canCancel && (
                  <button
                    type="button"
                    onClick={handleSelectVerified}
                    style={{ width: "100%", borderRadius: 12, border: "1px solid #e4e9f0", background: "#f4f3ef", color: "#5b6675", padding: "11px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Downgrade to Verified (free)
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={!canCancel}
                  style={{ width: "100%", borderRadius: 12, border: "1px solid #fecaca", background: "#fff5f5", color: "#b42318", padding: "11px 14px", fontSize: 13, fontWeight: 700, cursor: canCancel ? "pointer" : "not-allowed", opacity: canCancel ? 1 : 0.5 }}
                >
                  Cancel Subscription
                </button>
                <p style={{ margin: 0, fontSize: 11, color: "#8a9ab0", textAlign: "center" }}>
                  Your menu and data are preserved when you cancel or downgrade.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </OperatorLayout>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────

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
    fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
    padding: "3px 8px", borderRadius: 999,
    background: color === AMBER ? "#fef3c7" : "#d1fae5",
    color: color === AMBER ? AMBER : "#065f46",
  };
}

function planBtn(variant, accentColor) {
  const base = {
    width: "100%", border: "none", borderRadius: 10,
    padding: "11px 12px", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  };
  if (variant === "primary")  return { ...base, background: accentColor, color: "#fff" };
  if (variant === "founders") return { ...base, background: AMBER, color: "#fff" };
  return { ...base, background: "#f4f3ef", color: "#5b6675" };
}

function banner(type) {
  const map = {
    success: { bg: "#f0fdf4", border: "#86efac", color: "#166534" },
    error:   { bg: "#fef2f2", border: "#fecaca", color: "#b42318" },
    warn:    { bg: "#fff7ed", border: "#fdba74", color: "#9a3412" },
  };
  const s = map[type];
  return {
    marginBottom: 16, background: s.bg, border: `1px solid ${s.border}`,
    color: s.color, borderRadius: 12, padding: "13px 16px",
    fontSize: 14, fontWeight: 600,
  };
}
