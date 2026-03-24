/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorSubscription.jsx
 * File: OperatorSubscription.jsx
 * Date: 2026-03-23
 * Purpose:
 *   Operator subscription page redesigned as a two-plan,
 *   restaurant-friendly pricing comparison focused on Free vs Pro.
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

const COMPARISON_ROWS = [
  { label: "Unlimited menu items", free: "Yes", pro: "Yes" },
  { label: "Number of menus", free: "1 menu", pro: "Unlimited" },
  { label: "Seasonal menus", free: "—", pro: "Yes" },
  { label: "Deals", free: "—", pro: "Yes" },
  { label: "Logo on profile/menu", free: "—", pro: "Yes" },
  { label: "About Us section", free: "—", pro: "Yes" },
  { label: "Featured dish", free: "—", pro: "Yes" },
  { label: "Product photo", free: "—", pro: "Yes" },
  { label: "QR codes", free: "Yes", pro: "Yes" },
  { label: "Phone dialer / web ordering", free: "—", pro: "Yes" },
  { label: "Design and print your own menus (powered by Adobe)", free: "—", pro: "Yes" },
];

const PRO_FEATURES = [
  "Unlimited menus",
  "Seasonal menus",
  "Deals",
  "Include logo on profile & menu",
  "About Us section",
  "Featured dish",
  "Phone dialer / web ordering",
  "Design and print your own menus (powered by Adobe)",
  "Product photo",
];

const FREE_FEATURES = [
  "Unlimited menu items",
  "1 menu",
  "QR codes",
];

function normalizeCurrentPlanSlug(subscription) {
  const slug = String(subscription?.slug || "").toLowerCase();
  if (slug === "pro") return "pro";
  return "free";
}

function PriceCard({
  title,
  price,
  billing,
  description,
  eyebrow,
  accent,
  background,
  border,
  features,
  current,
  ctaLabel,
  onCta,
  ctaDisabled,
  supportingLine,
  children,
}) {
  return (
    <section
      style={{
        background,
        border,
        borderRadius: 24,
        padding: 24,
        boxShadow: title === "Pro" ? "0 24px 60px rgba(153, 27, 27, 0.12)" : "0 18px 40px rgba(15, 23, 32, 0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 11px",
            borderRadius: 999,
            background: title === "Pro" ? "#fff1f1" : "#eef4ff",
            color: accent,
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 14,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1, color: "#0f1720", letterSpacing: "-0.04em" }}>
            {title}
          </h2>
          {current && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
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
              Current Plan
            </span>
          )}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: accent, letterSpacing: "-0.05em" }}>{price}</div>
          {billing ? <div style={{ fontSize: 15, color: "#475467", fontWeight: 600 }}>{billing}</div> : null}
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.65, color: "#475467" }}>{description}</p>
        {supportingLine ? (
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.55, color: "#1f2937", fontWeight: 600 }}>
            {supportingLine}
          </p>
        ) : null}
        {children}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          border: "1px solid rgba(15, 23, 32, 0.08)",
          padding: 18,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#667085", marginBottom: 12 }}>
          Included
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {features.map((feature) => (
            <div key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ color: accent, fontSize: 16, lineHeight: 1 }}>✓</span>
              <span style={{ fontSize: 14, lineHeight: 1.45, color: "#0f1720", fontWeight: 600 }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onCta}
        disabled={ctaDisabled}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 14,
          padding: "14px 16px",
          background: ctaDisabled ? "#d0d5dd" : accent,
          color: "#fff",
          fontSize: 15,
          fontWeight: 800,
          cursor: ctaDisabled ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          boxShadow: ctaDisabled ? "none" : "0 12px 24px rgba(15, 23, 32, 0.12)",
        }}
      >
        {ctaLabel}
      </button>
    </section>
  );
}

function ComparisonCell({ value, highlight = false }) {
  const positive = value === "Yes";
  return (
    <td
      style={{
        padding: "16px 14px",
        borderTop: "1px solid #eaecf0",
        textAlign: "center",
        fontSize: 14,
        fontWeight: positive ? 800 : 600,
        color: value === "—" ? "#98a2b3" : highlight && positive ? "#c62828" : "#0f1720",
        background: highlight ? "#fff8f8" : "#fff",
        whiteSpace: "nowrap",
      }}
    >
      {positive ? "✓" : value}
    </td>
  );
}

export default function OperatorSubscription() {
  const navigate = useNavigate();
  const { refreshSession } = useOperator();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.getSubscription()
      .then((data) => setSubscription(data))
      .catch((err) => setError(err.message || "Unable to load subscription."))
      .finally(() => setLoading(false));
  }, []);

  const currentPlanSlug = useMemo(() => normalizeCurrentPlanSlug(subscription), [subscription]);

  async function handleUpgradeToPro() {
    setUpgrading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/operator/subscription/upgrade`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_slug: "pro", billing_cycle: "monthly" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Upgrade failed");

      const updated = await api.getSubscription().catch(() => null);
      setSubscription(updated);
      await refreshSession().catch(() => null);
      setSuccess("Pro is active. Your restaurant can now unlock stronger branding, direct customer action, and premium menu tools.");
    } catch (err) {
      setError(err.message || "Upgrade failed");
    } finally {
      setUpgrading(false);
    }
  }

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
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 16,
            }}
          >
            Restaurant Growth
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 60px)", lineHeight: 0.95, letterSpacing: "-0.06em", maxWidth: 760 }}>
            Turn Your Menu Into a Customer Engine
          </h1>
          <p style={{ margin: "16px 0 0", maxWidth: 760, fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.88)" }}>
            Get your menu online for free. Upgrade when you&apos;re ready to send customers directly to your own ordering system, avoid third-party fees, instantly update your menu, and share it everywhere.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {[
              "Send customers directly to your own ordering system",
              "Avoid third-party fees by sending orders directly to your website",
              "Share your menu anywhere, including Instagram, Google, and your website",
              "No more outdated PDFs or reprinting menus",
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: "9px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <div
            style={{
              marginTop: 20,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b42318",
              borderRadius: 16,
              padding: "14px 16px",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            style={{
              marginTop: 20,
              background: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
              borderRadius: 16,
              padding: "14px 16px",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {success}
          </div>
        ) : null}

        <section style={{ marginTop: 28 }}>
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <PriceCard
              title="Free"
              price="$0"
              billing=""
              description="Best for getting your restaurant listed and menu live."
              eyebrow="Get Online Fast"
              accent="#1d4ed8"
              background="#f8fbff"
              border="1px solid #dbe7ff"
              features={FREE_FEATURES}
              current={currentPlanSlug === "free"}
              ctaLabel={currentPlanSlug === "free" ? "Current Plan" : "Get Started Free"}
              onCta={() => navigate("/operator")}
              ctaDisabled={currentPlanSlug === "free"}
            />

            <PriceCard
              title="Pro"
              price="$39.99"
              billing="/month"
              description="Best for restaurants that want stronger branding, direct customer action, instant menu updates, and better menu presentation."
              eyebrow="Built To Convert"
              accent="#b42318"
              background="linear-gradient(180deg, #fff8f7 0%, #ffffff 100%)"
              border="2px solid #f5b5ae"
              features={PRO_FEATURES}
              current={currentPlanSlug === "pro"}
              ctaLabel={currentPlanSlug === "pro" ? "Current Plan" : upgrading ? "Upgrading…" : "Upgrade to Pro"}
              onCta={handleUpgradeToPro}
              ctaDisabled={currentPlanSlug === "pro" || upgrading || loading}
              supportingLine="Avoid third-party fees by sending orders directly to your website."
            >
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "#fff1f1",
                  border: "1px solid #f5d2d2",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: "#b42318" }}>$399/year</div>
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#7a271a", fontWeight: 600 }}>
                  Early Access Pricing — Early Partners Lock in this rate as Grubbid continues growing.
                </div>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.6, color: "#475467" }}>
                No more outdated PDFs or reprinting menus — update once and it&apos;s live everywhere.
              </p>
            </PriceCard>
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <div style={{ maxWidth: 760 }}>
            <h2 style={{ margin: 0, fontSize: 28, color: "#0f1720", letterSpacing: "-0.04em" }}>What changes when you upgrade</h2>
            <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.7, color: "#475467" }}>
              Pro is built for restaurants that want to control how customers act after they find the menu. Make your menu instantly scannable and accessible, send customers directly to your own website, instantly update prices and products on the menu, and present a stronger Restaurant Profile Screen with About Us and Featured Dish.
            </p>
          </div>
        </section>

        <section
          style={{
            marginTop: 18,
            background: "#fff",
            border: "1px solid #eaecf0",
            borderRadius: 22,
            padding: "22px 20px",
            boxShadow: "0 18px 40px rgba(15, 23, 32, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "#fff1f1",
                color: "#b42318",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              ◎
            </div>
            <div style={{ maxWidth: 760 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#b42318", marginBottom: 6 }}>
                Pro Feature
              </div>
              <h3 style={{ margin: 0, fontSize: 24, color: "#0f1720", letterSpacing: "-0.04em" }}>Smart Menu Insights</h3>
              <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.7, color: "#475467" }}>
                Help customers understand what to order — not just read the menu.
              </p>
              <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.65, color: "#0f1720", fontWeight: 700 }}>
                Customers don&apos;t just see your menu — they understand it.
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "#667085" }}>
                When customers understand what to order, they&apos;re more likely to order.
              </p>
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: 24,
            background: "#fff",
            border: "1px solid #eaecf0",
            borderRadius: 24,
            padding: "22px 20px 20px",
            boxShadow: "0 18px 40px rgba(15, 23, 32, 0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#667085", marginBottom: 6 }}>
                Plan Comparison
              </div>
              <h3 style={{ margin: 0, fontSize: 24, color: "#0f1720", letterSpacing: "-0.04em" }}>Free vs Pro</h3>
            </div>
            <div style={{ fontSize: 13, color: "#475467", maxWidth: 420, lineHeight: 1.55 }}>
              Capture the customers you already have from Instagram, Google, your website, and QR codes.
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 700, borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
                      background: "#f8fafc",
                      color: "#475467",
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderTopLeftRadius: 16,
                    }}
                  >
                    Features
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "14px 16px",
                      background: "#f8fbff",
                      color: "#1d4ed8",
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Free
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "14px 16px",
                      background: "#fff1f1",
                      color: "#b42318",
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderTopRightRadius: 16,
                    }}
                  >
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td
                      style={{
                        padding: "16px 14px",
                        borderTop: "1px solid #eaecf0",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0f1720",
                        background: "#fff",
                      }}
                    >
                      {row.label}
                    </td>
                    <ComparisonCell value={row.free} />
                    <ComparisonCell value={row.pro} highlight />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ margin: "18px 2px 0", fontSize: 14, lineHeight: 1.65, color: "#475467", fontWeight: 600 }}>
            Pro helps restaurants send customers directly to their own website, avoid third-party fees, and keep menus current everywhere customers find them.
          </p>
        </section>
      </div>
    </OperatorLayout>
  );
}
