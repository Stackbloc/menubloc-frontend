/**
 * src/pages/operator/OperatorSubscription.jsx
 *
 * Kit-style pricing comparison: persistent plan header row + feature matrix.
 * All Stripe checkout wiring preserved exactly from previous version.
 *
 * Layout:
 *   1. Alert banners (success / error / cancelled)
 *   2. Sticky plan header row — Verified | Pro | Founders
 *   3. Feature comparison matrix
 *   4. Checkout section (Stripe, discount codes)
 *   5. Current Status + account controls
 */

import { useEffect, useRef, useState } from "react";
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

// ── Feature matrix data ────────────────────────────────────────────────────
// v = Verified   p = Pro   f = Founders
const MATRIX = [
  {
    category: "Discovery & Presence",
    rows: [
      { label: "Searchable listing",  v: true,  p: true,  f: true  },
      { label: "Restaurant profile",  v: true,  p: true,  f: true  },
      { label: "QR menu",             v: true,  p: true,  f: true  },
      { label: "Public menu page",    v: true,  p: true,  f: true  },
      { label: "Social sharing",      v: true,  p: true,  f: true  },
      { label: "Followers",           v: true,  p: true,  f: true  },
    ],
  },
  {
    category: "Menu Management",
    rows: [
      { label: "PDF upload",          v: true,  p: true,  f: true  },
      { label: "Spreadsheet upload",  v: true,  p: true,  f: true  },
      { label: "Photo upload",        v: true,  p: true,  f: true  },
      { label: "Paste menu text",     v: true,  p: true,  f: true  },
      { label: "Edit & delete menus", v: true,  p: true,  f: true  },
      { label: "Publish / unpublish", v: true,  p: true,  f: true  },
      { label: "Manual item editing", v: true,  p: true,  f: true  },
      { label: "Multiple menus",      v: false, p: true,  f: true  },
    ],
  },
  {
    category: "Menu Intelligence",
    rows: [
      { label: "Structured menu fields",     v: true,  p: true, f: true },
      { label: "Preparation fields",         v: true,  p: true, f: true },
      { label: "Portion fields",             v: true,  p: true, f: true },
      { label: "Allergen fields",            v: true,  p: true, f: true },
      { label: "Nutrition enrichment",       v: false, p: true, f: true },
      { label: "Ingredient intelligence",    v: false, p: true, f: true },
      { label: "Advanced menu attributes",   v: false, p: true, f: true },
    ],
  },
  {
    category: "Pricing & Deals",
    rows: [
      { label: "Advanced pricing tools",  v: true,  p: true, f: true },
      { label: "Bulk price adjustments",  v: false, p: true, f: true },
      { label: "Compare pricing fields",  v: false, p: true, f: true },
      { label: "Deals",                   v: false, p: true, f: true },
      { label: "Billboard deals",         v: false, p: true, f: true },
    ],
  },
  {
    category: "Marketplace & Commerce",
    rows: [
      { label: "Marketplace ordering",   v: false, p: true, f: true },
      { label: "Direct ordering",        v: false, p: true, f: true },
      { label: "Future loyalty support", v: false, p: true, f: true },
    ],
  },
];

// ── Shared tokens ──────────────────────────────────────────────────────────
const GREEN  = "#1F4E3D";
const AMBER  = "#92400e";
const CHECK  = <span style={{ color: GREEN,  fontWeight: 800, fontSize: 15 }}>✓</span>;
const DASH   = <span style={{ color: "#d1d5db", fontWeight: 600, fontSize: 15 }}>—</span>;

function cell(flag) { return flag ? CHECK : DASH; }

function billingLabel(interval) {
  if (interval === "month") return "/month";
  if (interval === "year") return "/year";
  return "";
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

// Map plan code → logical tier for current-plan indicator
function getPlanTier(planCode) {
  if (!planCode) return "verified";
  if (planCode === "founders_annual") return "founders";
  if (planCode?.startsWith("pro")) return "pro";
  return "verified";
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 12,
      paddingTop: 12, borderTop: "1px solid #eaecf0",
    }}>
      <span style={{ fontSize: 13, color: "#475467", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0f1720", fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function CategoryHeader({ label }) {
  return (
    <tr>
      <td colSpan={4} style={{
        padding: "20px 16px 8px",
        fontSize: 11, fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.07em", color: "#8a9ab0",
        background: "#f8faf9",
        borderTop: "1px solid #e4e9f0",
      }}>
        {label}
      </td>
    </tr>
  );
}

function FeatureRow({ label, v, p, f, shade }) {
  return (
    <tr style={{ background: shade ? "#f8faf9" : "#fff" }}>
      <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151", fontWeight: 500, borderRight: "1px solid #f0f4f8" }}>
        {label}
      </td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 90 }}>{cell(v)}</td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 90, background: shade ? "#f0f7f4" : "#f8fdf9" }}>{cell(p)}</td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 90 }}>{cell(f)}</td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function OperatorSubscription() {
  const { selectedRestaurant } = useOperator();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State (all preserved from previous version) ──────────────────────────
  const [planOptions, setPlanOptions]         = useState([]);
  const [subscription, setSubscription]       = useState(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState("pro_monthly");
  const [loading, setLoading]                 = useState(false);
  const [isCheckingOut, setIsCheckingOut]     = useState(false);
  const [message, setMessage]                 = useState("");
  const [error, setError]                     = useState("");
  const [discountCodeInput, setDiscountCodeInput]   = useState("");
  const [discountValidation, setDiscountValidation] = useState(null);
  const [discountLoading, setDiscountLoading]       = useState(false);
  const [discountError, setDiscountError]           = useState("");

  const checkoutRef = useRef(null);

  // ── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    getCheckoutPlans()
      .then((data) => {
        const filtered = (data.plans || []).filter((p) =>
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

  const checkoutResult = searchParams.get("checkout");

  useEffect(() => {
    if (checkoutResult === "success") {
      setMessage("Subscription activated. Your plan is now live.");
      setSearchParams({}, { replace: true });
      refreshSubscription();
    } else if (checkoutResult === "cancelled") {
      setSearchParams({}, { replace: true });
    }
  }, [checkoutResult]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Handlers (all preserved) ─────────────────────────────────────────────
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
        cancelUrl:  `${origin}/operator/subscription?checkout=cancelled`,
        discountCode: discountValidation?.code || undefined,
      });
      if (result.already_active) {
        setMessage("This restaurant already has an active subscription for that plan.");
        await refreshSubscription();
        setIsCheckingOut(false);
        return;
      }
      if (!result.checkout_url) throw new Error("No checkout URL returned from server.");
      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err.message || "Unable to start checkout.");
      setIsCheckingOut(false);
    }
  }

  async function handleCancelSubscription() {
    if (!selectedRestaurant?.id) {
      setError("Select a restaurant before cancelling.");
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

  // ── Derived values ───────────────────────────────────────────────────────
  const currentPlanCode  = subscription?.plan_code || null;
  const currentTier      = getPlanTier(currentPlanCode);
  const currentStatus    = getSubscriptionStatusLabel(subscription?.status);
  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString() : "N/A";

  const hasActiveStripeSubscription = Boolean(
    subscription?.stripe_subscription_id && subscription?.current_period_end
  );
  const canCancel =
    hasActiveStripeSubscription &&
    ["active", "trialing", "past_due"].includes(subscription?.status) &&
    !subscription?.cancel_at_period_end;

  const monthlyPlan  = planOptions.find(p => p.code === "pro_monthly");
  const annualPlan   = planOptions.find(p => p.code === "pro_annual");
  const foundersPlan = planOptions.find(p => p.code === "founders_annual") || annualPlan;

  function scrollToCheckout(code) {
    setSelectedPlanCode(code);
    setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <OperatorLayout title="Subscription">
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>

        {/* ── Alert banners ──────────────────────────────────────────── */}
        {checkoutResult === "cancelled" && !message && !error && (
          <div style={banner("warn")}>Checkout was cancelled. No charge was made.</div>
        )}
        {error   && <div style={banner("error")}>{error}</div>}
        {message && <div style={banner("success")}>{message}</div>}

        {/* ── Plan header row ─────────────────────────────────────────── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "#fff",
          paddingTop: 4, paddingBottom: 4,
          marginBottom: 0,
        }}>
          {/* Column headers label row */}
          <div style={planGridStyle}>
            <PlanHeaderCard
              tier="verified"
              name="Verified"
              badge={currentTier === "verified" ? "Current plan" : null}
              price="Free"
              priceSub="Always"
              bullets={[
                "Searchable listing",
                "Single menu support",
                "QR / menu hosting",
                "Upload-first onboarding",
                "Basic operator tools",
              ]}
              accentColor={GREEN}
              borderColor="#d1e7dd"
              bg="#f8faf9"
              cta={currentTier === "verified" ? null : {
                label: "Downgrade to Verified",
                variant: "muted",
                onClick: canCancel ? handleCancelSubscription : null,
                disabled: !canCancel,
              }}
            />
            <PlanHeaderCard
              tier="pro"
              name="Pro"
              badge={currentTier === "pro" ? "Current plan" : null}
              price={
                monthlyPlan
                  ? <>{formatMoney(monthlyPlan.amount_cents)}<span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>/mo</span></>
                  : "—"
              }
              priceSub={annualPlan ? `${formatMoney(annualPlan.amount_cents)}/year` : ""}
              bullets={[
                "Multiple menus",
                "Advanced pricing controls",
                "Deals & billboards",
                "Marketplace capabilities",
                "Direct ordering",
              ]}
              accentColor={GREEN}
              borderColor={GREEN}
              bg="#fff"
              highlighted
              cta={currentTier !== "pro" ? {
                label: "Upgrade to Pro",
                variant: "primary",
                onClick: () => scrollToCheckout("pro_monthly"),
              } : null}
              secondaryCta={currentTier !== "pro" && annualPlan ? {
                label: "Pay annually",
                onClick: () => scrollToCheckout("pro_annual"),
              } : null}
            />
            <PlanHeaderCard
              tier="founders"
              name="Founders"
              badge="Limited time"
              badgeStyle={{ background: "#fef3c7", color: AMBER }}
              price={
                foundersPlan
                  ? <>{formatMoney(foundersPlan.amount_cents)}<span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>/yr</span></>
                  : "—"
              }
              priceSub="Pricing guaranteed for 3 years"
              bullets={[
                "All Pro capabilities",
                "Annual billing only",
                "3-year price guarantee",
                "Limited availability",
              ]}
              accentColor={AMBER}
              borderColor="#fcd34d"
              bg="#fffbeb"
              cta={currentTier !== "founders" ? {
                label: "Join as Founder",
                variant: "founders",
                onClick: () => scrollToCheckout(foundersPlan?.code || "pro_annual"),
              } : (currentTier === "founders" ? { label: "Current plan", variant: "muted", disabled: true } : null)}
            />
          </div>
        </div>

        {/* ── Feature comparison matrix ────────────────────────────────── */}
        <div style={{
          background: "#fff",
          border: "1px solid #e4e9f0",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 32,
        }}>
          {/* Matrix column headers */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8faf9", borderBottom: "2px solid #e4e9f0" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#8a9ab0", width: "50%" }}>
                  Feature
                </th>
                <th style={{ padding: "12px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: GREEN, width: 90 }}>
                  Verified
                </th>
                <th style={{ padding: "12px 0", textAlign: "center", fontSize: 12, fontWeight: 800, color: GREEN, width: 90, background: "#f0f7f4" }}>
                  Pro
                </th>
                <th style={{ padding: "12px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: AMBER, width: 90 }}>
                  Founders
                </th>
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
                      v={row.v}
                      p={row.p}
                      f={row.f}
                      shade={idx % 2 === 1}
                    />
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Checkout + Current Status ────────────────────────────────── */}
        <div ref={checkoutRef} style={{ scrollMarginTop: 80 }} />
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0,1fr) minmax(280px,0.85fr)" }}
          className="operator-responsive-split">

          {/* Checkout card */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}>Checkout</h3>

            {/* Billing interval selector */}
            <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {planOptions.map(plan => (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => setSelectedPlanCode(plan.code)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: selectedPlanCode === plan.code ? `1.5px solid ${GREEN}` : "1.5px solid #e4e9f0",
                    background: selectedPlanCode === plan.code ? "#f0f7f4" : "#fff",
                    color: selectedPlanCode === plan.code ? GREEN : "#6b7280",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {plan.billing_interval === "month" ? "Monthly" : "Annual"}
                  {" — "}
                  {formatMoney(plan.amount_cents)}
                  {billingLabel(plan.billing_interval)}
                  {plan.code === "founders_annual" && " · Founders"}
                </button>
              ))}
            </div>

            <p style={{ margin: "12px 0 0", fontSize: 14, color: "#6b7280" }}>
              {selectedRestaurant?.restaurant_name
                ? `Billing restaurant: ${selectedRestaurant.restaurant_name}`
                : "Select a restaurant from the sidebar."}
            </p>

            {/* Discount code */}
            <div style={{ marginTop: 16, borderTop: "1px solid #eaecf0", paddingTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475467", marginBottom: 8 }}>Have a discount code?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={discountCodeInput}
                  onChange={(e) => { setDiscountCodeInput(e.target.value.toUpperCase()); setDiscountValidation(null); setDiscountError(""); }}
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
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>Code applied: {discountValidation.code}</div>
                  {discountValidation.subscription_discount_percent && (
                    <div style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>
                      {discountValidation.subscription_discount_percent}% off
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
                marginTop: 16, width: "100%", border: "none", borderRadius: 12,
                background: isCheckingOut ? "#94a3b8" : GREEN,
                color: "#fff", padding: "13px 16px",
                fontSize: 15, fontWeight: 800,
                cursor: isCheckingOut ? "wait" : "pointer",
              }}
            >
              {isCheckingOut ? "Redirecting to Stripe…" : `Subscribe — ${getSubscriptionPlanLabel(selectedPlanCode)}`}
            </button>
          </div>

          {/* Current Status card */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}>Current Status</h3>
            <div style={{ marginTop: 14, display: "grid", gap: 2 }}>
              <StatusRow label="Plan"               value={getSubscriptionPlanLabel(currentPlanCode)} />
              <StatusRow label="Status"             value={loading ? "Loading…" : currentStatus} />
              <StatusRow label="Period ends"        value={loading ? "Loading…" : currentPeriodEnd} />
              <StatusRow label="Auto-renew"         value={loading ? "Loading…" : getAutoRenewLabel(subscription)} />
              <StatusRow label="Marketplace"        value={loading ? "Loading…" : getMarketplaceSetupStatus(subscription)} />
            </div>

            {hasActiveStripeSubscription ? (
              subscription?.cancel_at_period_end ? (
                <div style={{
                  marginTop: 16, padding: "12px 14px", borderRadius: 12,
                  background: "#f8fafc", border: "1px solid #eaecf0",
                  fontSize: 14, fontWeight: 700, color: "#667085", textAlign: "center",
                }}>
                  Cancellation scheduled at period end
                </div>
              ) : (
                <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={!canCancel}
                    style={{
                      width: "100%", borderRadius: 12, border: "1px solid #fecaca",
                      background: "#fff5f5", color: "#b42318",
                      padding: "11px 14px", fontSize: 13, fontWeight: 700,
                      cursor: canCancel ? "pointer" : "not-allowed",
                    }}
                  >
                    Cancel Subscription
                  </button>
                  {canCancel && (
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      style={{
                        width: "100%", borderRadius: 12, border: "1px solid #e4e9f0",
                        background: "#f4f3ef", color: "#5b6675",
                        padding: "11px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Downgrade to Verified (free)
                    </button>
                  )}
                </div>
              )
            ) : null}
          </div>
        </div>

      </div>
    </OperatorLayout>
  );
}

// ── Plan header card ───────────────────────────────────────────────────────
function PlanHeaderCard({
  name, badge, badgeStyle, price, priceSub, bullets,
  accentColor, borderColor, bg, highlighted,
  cta, secondaryCta,
}) {
  return (
    <div style={{
      background: bg,
      border: `${highlighted ? 2 : 1.5}px solid ${borderColor}`,
      borderRadius: 14,
      padding: "18px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: accentColor }}>{name}</span>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
            padding: "3px 8px", borderRadius: 999,
            background: badgeStyle?.background || "#d1fae5",
            color: badgeStyle?.color || "#065f46",
            ...badgeStyle,
          }}>
            {badge}
          </span>
        )}
      </div>

      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          {price}
        </div>
        {priceSub && (
          <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 2 }}>{priceSub}</div>
        )}
      </div>

      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
        {bullets.map(b => (
          <li key={b} style={{ fontSize: 12, color: "#374151", display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ color: accentColor, fontWeight: 700, flexShrink: 0 }}>✓</span>
            {b}
          </li>
        ))}
      </ul>

      {cta && (
        <button
          type="button"
          onClick={cta.onClick || undefined}
          disabled={cta.disabled}
          style={ctaBtnStyle(cta.variant, accentColor, cta.disabled)}
        >
          {cta.label}
        </button>
      )}
      {secondaryCta && (
        <button
          type="button"
          onClick={secondaryCta.onClick}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: accentColor, fontWeight: 600, padding: "2px 0",
            textDecoration: "underline", fontFamily: "inherit",
          }}
        >
          {secondaryCta.label}
        </button>
      )}
    </div>
  );
}

function ctaBtnStyle(variant, accentColor, disabled) {
  const base = {
    width: "100%", border: "none", borderRadius: 10,
    padding: "9px 12px", fontSize: 12, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    opacity: disabled ? 0.5 : 1,
  };
  if (variant === "primary")  return { ...base, background: accentColor, color: "#fff" };
  if (variant === "founders") return { ...base, background: "#92400e",   color: "#fff" };
  return { ...base, background: "#f4f3ef", color: "#5b6675" };
}

// ── Style helpers ──────────────────────────────────────────────────────────
const planGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
  padding: "8px 0",
};

const sectionCard = {
  background: "#fff",
  border: "1px solid #eaecf0",
  borderRadius: 16,
  padding: 22,
  boxShadow: "0 8px 24px rgba(15, 23, 32, 0.04)",
};

const sectionTitle = {
  margin: 0,
  fontSize: 20,
  color: "#0f1720",
  letterSpacing: "-0.04em",
  fontWeight: 800,
};

function banner(type) {
  const map = {
    success: { bg: "#f0fdf4", border: "#86efac", color: "#166534" },
    error:   { bg: "#fef2f2", border: "#fecaca", color: "#b42318" },
    warn:    { bg: "#fff7ed", border: "#fdba74", color: "#9a3412" },
  };
  const s = map[type];
  return {
    marginBottom: 16,
    background: s.bg, border: `1px solid ${s.border}`,
    color: s.color, borderRadius: 12, padding: "13px 16px",
    fontSize: 14, fontWeight: 600,
  };
}
