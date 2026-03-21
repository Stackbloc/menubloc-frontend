/**
 * src/pages/operator/OperatorSubscription.jsx
 *
 * Route: /operator/subscription
 *
 * Shows:
 *   • Current plan + period
 *   • Plan comparison grid (key benefits)
 *   • Upgrade button (records intent in DB — wire Stripe to complete billing)
 */

import React, { useState, useEffect } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

// Benefits to highlight in the comparison grid (in display order)
const FEATURE_ROWS = [
  { key: "menu_item_count",    label: "Menu items",          format: (b) => b?.limit_count == null ? "Unlimited" : b?.limit_count ?? "—" },
  { key: "multiple_menus",     label: "Menus",               format: (b) => !b?.is_enabled ? "1 only" : b?.limit_count == null ? "Unlimited" : `Up to ${b.limit_count}` },
  { key: "seasonal_menus",     label: "Seasonal menus",      format: (b) => b?.is_enabled ? "✓" : "✗" },
  { key: "deals",              label: "Deals",               format: (b) => !b?.is_enabled ? "—" : b?.limit_count == null ? "Unlimited" : `Up to ${b.limit_count}` },
  { key: "logo_upload",        label: "Custom logo",         format: (b) => b?.is_enabled ? "✓" : "—" },
  { key: "about_us",           label: "About Us section",    format: (b) => b?.is_enabled ? "✓" : "—" },
  { key: "featured_dish",      label: "Featured dish",       format: (b) => b?.is_enabled ? "✓" : "—" },
  { key: "qr_codes",           label: "QR codes",            format: (b) => !b?.is_enabled ? "—" : b?.limit_count == null ? "Unlimited" : b.limit_count },
  { key: "analytics_basic",    label: "Analytics",           format: (b) => b?.is_enabled ? "Basic" : "—" },
  { key: "analytics_advanced", label: "Advanced analytics",  format: (b) => b?.is_enabled ? "✓" : "—" },
  { key: "support_priority",   label: "Support",             format: (b) => b?.config?.tier ? b.config.tier.charAt(0).toUpperCase() + b.config.tier.slice(1) : "Standard" },
  { key: "multi_location",     label: "Multi-location",      format: (b) => b?.is_enabled ? "✓" : "—" },
];

function planBenefitMap(benefits = []) {
  return Object.fromEntries((benefits).map(b => [b.key, b]));
}

function PlanColumn({ plan, isCurrent, onUpgrade, upgrading }) {
  const [hover, setHover] = useState(false);
  const bmap = planBenefitMap(plan.benefits);
  const isEnterprise = plan.slug === "enterprise";

  return (
    <div
      style={{
        flex: 1,
        border: isCurrent ? "2px solid #1F4E3D" : "1.5px solid #e4e9f0",
        borderRadius: 14,
        overflow: "hidden",
        background: isCurrent ? "#f0fdf4" : "#fff",
        position: "relative",
      }}
    >
      {isCurrent && (
        <div style={{
          background: "#1F4E3D", color: "#fff",
          fontSize: 10, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.8px", textAlign: "center", padding: "4px 0",
        }}>
          Current Plan
        </div>
      )}

      <div style={{ padding: "18px 16px 14px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1720", marginBottom: 4 }}>{plan.name}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1F4E3D", lineHeight: 1 }}>
          {isEnterprise ? "Custom" : plan.monthly_price_cents === 0 ? "Free" : `$${(plan.monthly_price_cents / 100).toFixed(0)}`}
          {!isEnterprise && plan.monthly_price_cents > 0 && <span style={{ fontSize: 12, color: "#8a9ab0", fontWeight: 500 }}>/mo</span>}
        </div>
        {!isEnterprise && plan.annual_price_cents > 0 && (
          <div style={{ fontSize: 11, color: "#8a9ab0", marginTop: 3 }}>
            ${(plan.annual_price_cents / 100).toFixed(0)}/yr (save {Math.round(100 - (plan.annual_price_cents / (plan.monthly_price_cents * 12)) * 100)}%)
          </div>
        )}
      </div>

      {/* Feature values */}
      <div style={{ borderTop: "1px solid #e8ecf2" }}>
        {FEATURE_ROWS.map((row, i) => {
          const b = bmap[row.key];
          const val = row.format(b);
          const positive = val === "✓" || (typeof val === "number" && val > 0) || val === "Unlimited" || val === "Priority" || val === "Dedicated";
          return (
            <div
              key={row.key}
              style={{
                padding: "8px 16px",
                borderBottom: i < FEATURE_ROWS.length - 1 ? "1px solid #f0f0ec" : "none",
                fontSize: 12,
                fontWeight: positive ? 600 : 400,
                color: val === "✗" || val === "—" ? "#c8d0da" : positive ? "#1F4E3D" : "#5b6675",
                textAlign: "center",
              }}
            >
              {val}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ padding: "14px 16px" }}>
        {isCurrent ? (
          <div style={{ textAlign: "center", fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✓ Active</div>
        ) : isEnterprise ? (
          <a
            href="mailto:hello@grubbid.com?subject=Enterprise inquiry"
            style={{
              display: "block", textAlign: "center",
              background: "#f4f3ef", color: "#0f1720",
              padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Contact us
          </a>
        ) : (
          <button
            onClick={() => onUpgrade(plan.slug)}
            disabled={upgrading === plan.slug}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              width: "100%",
              background: hover ? "#163d2f" : "#1F4E3D",
              color: "#fff", border: "none",
              borderRadius: 8, padding: "9px 0",
              fontSize: 13, fontWeight: 700,
              cursor: upgrading === plan.slug ? "not-allowed" : "pointer",
              opacity: upgrading === plan.slug ? 0.65 : 1,
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
          >
            {upgrading === plan.slug ? "Switching…" : `Upgrade to ${plan.name}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function OperatorSubscription() {
  const { operator } = useOperator();

  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [upgrading, setUpgrading]       = useState(null);
  const [upgraded, setUpgraded]         = useState(null);
  const [error, setError]               = useState("");

  useEffect(() => {
    Promise.all([
      api.getSubscription().catch(() => null),
      api.getPlans(),
    ])
      .then(([sub, plansData]) => {
        setSubscription(sub);
        const HIDDEN = ["public", "free"];
        setPlans((plansData.plans || []).filter(p => !HIDDEN.includes(p.slug)));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(planSlug) {
    setUpgrading(planSlug);
    setError("");
    try {
      await api.getSubscription(); // refresh for plan_id
      const res = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "")}/operator/subscription/upgrade`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_slug: planSlug, billing_cycle: "monthly" }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upgrade failed");
      setUpgraded(json.plan?.name || planSlug);
      // Refresh subscription
      const updated = await api.getSubscription().catch(() => null);
      setSubscription(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setUpgrading(null);
    }
  }

  const currentPlanSlug = subscription?.slug || "free";

  return (
    <OperatorLayout title="Subscription">
      <div style={{ maxWidth: 900 }}>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, padding: "10px 14px",
            color: "#b91c1c", fontSize: 13, marginBottom: 20,
            display: "flex", justifyContent: "space-between",
          }}>
            {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: 700 }}>✕</button>
          </div>
        )}

        {upgraded && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #86efac",
            borderRadius: 10, padding: "12px 16px",
            color: "#16a34a", fontSize: 14, fontWeight: 600, marginBottom: 20,
          }}>
            ✓ Upgraded to <strong>{upgraded}</strong>. Your new features are active.
            {" "}<span style={{ fontSize: 12, color: "#5b6675", fontWeight: 400 }}>
              Billing will be configured when Stripe is connected.
            </span>
          </div>
        )}

        {/* Current plan summary */}
        {!loading && subscription && (
          <div style={{
            background: "#fff", border: "1px solid #e4e9f0",
            borderRadius: 14, padding: "18px 22px",
            marginBottom: 32, display: "flex", gap: 24, alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8a9ab0", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Current plan</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1F4E3D" }}>{subscription.name}</div>
              {subscription.billing_cycle && subscription.subscription_status !== "cancelled" && (
                <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 3 }}>
                  Billed {subscription.billing_cycle}
                  {subscription.current_period_end && ` · renews ${new Date(subscription.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feature rows legend */}
        {!loading && plans.length > 0 && (
          <div style={{ display: "flex", gap: 0 }}>
            {/* Row labels */}
            <div style={{ width: 180, flexShrink: 0, border: "1.5px solid #e4e9f0", borderRadius: 14, overflow: "hidden", background: "#f8f7f4" }}>
              <div style={{ padding: "18px 16px 68px" }}>
                {/* Spacer aligns with plan header */}
              </div>
              <div style={{ borderTop: "1px solid #e8ecf2" }}>
                {FEATURE_ROWS.map((row, i) => (
                  <div
                    key={row.key}
                    style={{
                      padding: "8px 16px",
                      borderBottom: i < FEATURE_ROWS.length - 1 ? "1px solid #f0f0ec" : "none",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#5b6675",
                    }}
                  >
                    {row.label}
                  </div>
                ))}
              </div>
              <div style={{ height: 54 }} /> {/* CTA area */}
            </div>

            {/* Plan columns */}
            <div style={{ display: "flex", flex: 1, gap: 10, paddingLeft: 10 }}>
              {plans.map(plan => (
                <PlanColumn
                  key={plan.id}
                  plan={plan}
                  isCurrent={plan.slug === currentPlanSlug}
                  onUpgrade={handleUpgrade}
                  upgrading={upgrading}
                />
              ))}
            </div>
          </div>
        )}

        {loading && <p style={{ color: "#8a9ab0", fontSize: 13 }}>Loading plans…</p>}
      </div>
    </OperatorLayout>
  );
}
