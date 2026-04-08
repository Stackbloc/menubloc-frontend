/**
 * File:    SubscriptionSelect.jsx
 * Path:    menubloc-frontend/src/pages/SubscriptionSelect.jsx
 * Purpose:
 *   Onboarding step 2 — choose a profile plan (Verified or Pro).
 *   Reached after the simplified restaurant signup step.
 *
 *   Router state expected:
 *     restaurant_id    — numeric restaurant ID
 *     restaurant_name  — display name
 *     email            — owner email
 *     owner_token      — HMAC auth token
 *     ingestion_method — "pdf" | "spreadsheet" | "ocr"
 *
 *   Plan choice:
 *     Verified → navigate to /restaurant/design-select (free, no payment)
 *     Pro      → create Stripe Checkout Session → redirect to Stripe hosted page
 *
 *   After Stripe payment:
 *     Stripe redirects to /restaurant/subscription?checkout_success=1&plan_code=<code>
 *     Onboarding state is recovered from sessionStorage and the user continues.
 *
 *   PayPal: RETIRED. All subscription billing is Stripe-only.
 */

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const ONBOARDING_STATE_KEY = "grubbid.onboarding.state";

const VERIFIED_PRICE_LABEL = "Free";
const PRO_PRICING = {
  monthly: {
    amount: "$79",
    suffix: "/ month",
    tableLabel: "$79 / month",
    buttonLabel: "Go Pro",
    badge: null,
  },
  annual: {
    amount: "$799",
    suffix: "/ year",
    tableLabel: "$799 / year",
    buttonLabel: "Go Pro",
    badge: "Best annual value",
  },
};

const PLAN_CARD_FEATURES = {
  verified: [
    "Menu hosting",
    "QR code access",
    "Basic profile",
  ],
  pro: [
    "Online ordering with Stripe",
    "Deals and promotions",
    "Full branding control",
    "Analytics and insights",
    "Multiple menus",
  ],
};

const COMPARISON_ROWS = [
  { feature: "Price", verified: VERIFIED_PRICE_LABEL, proKey: "tableLabel", emphasis: true },
  { feature: "Grubbid Profile Page", verified: "check", pro: "check" },
  { feature: "Menu Hosting", verified: "check", pro: "check" },
  { feature: "QR Code Access", verified: "Basic", pro: "Advanced Kit" },
  { feature: "Menu Editing", verified: "Limited", pro: "Full Access" },
  { feature: "Deals and Promotions", verified: "cross", pro: "check" },
  { feature: "Custom Branding (Logo, About)", verified: "cross", pro: "check" },
  { feature: "Featured Menu Items", verified: "cross", pro: "check" },
  { feature: "Analytics Dashboard", verified: "cross", pro: "check" },
  { feature: "Online Ordering (Stripe)", verified: "cross", pro: "check" },
  { feature: "Customer Insights", verified: "cross", pro: "check" },
  { feature: "Multiple Menus (Lunch/Dinner/etc.)", verified: "cross", pro: "check" },
  { feature: "Priority Placement in Search", verified: "cross", pro: "check" },
];

const FUTURE_ROWS = [
  { feature: "Advanced Menu Design (Adobe)", verified: "cross", pro: "future" },
  { feature: "Social Media Menu Exports", verified: "cross", pro: "future" },
  { feature: "Seasonal Menu Scheduling", verified: "cross", pro: "future" },
  { feature: "Menu Performance Insights", verified: "cross", pro: "future" },
  { feature: "Future Feature", verified: "cross", pro: "future" },
  { feature: "Future Feature", verified: "cross", pro: "future" },
];

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f6f6f3 0%, #eef5f2 100%)",
    padding: "28px 18px 72px",
    color: "#101828",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  },
  shell: {
    maxWidth: 1180,
    margin: "0 auto",
  },
  topLink: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: 18,
    color: "#667085",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  },
  hero: {
    border: "1px solid #d9e0ea",
    borderRadius: 32,
    background: "#ffffff",
    boxShadow: "0 18px 40px rgba(15, 23, 32, 0.06)",
    padding: "28px 24px 24px",
    marginBottom: 22,
    overflow: "hidden",
  },
  heroGrid: {
    display: "flex",
    gap: 22,
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  heroLeft: { flex: "1 1 520px" },
  heroRight: {
    flex: "0 1 320px",
    display: "flex",
    justifyContent: "flex-end",
    width: "100%",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    padding: "8px 12px",
    borderRadius: 999,
    background: "#eef6f1",
    border: "1px solid #cfe0d8",
    color: "#1F4E3D",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  heading: {
    fontSize: "clamp(2.2rem, 5vw, 4.25rem)",
    lineHeight: 0.95,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    marginBottom: 12,
    maxWidth: 640,
  },
  subheading: {
    fontSize: 17,
    lineHeight: 1.6,
    color: "#667085",
    maxWidth: 660,
    marginBottom: 0,
  },
  summaryCard: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    border: "1px solid #d9e0ea",
    background: "#f8fafc",
    borderRadius: 24,
    padding: 20,
    width: "100%",
  },
  summaryCell: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "#ffffff",
    border: "1px solid #f2e3c4",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#1F4E3D",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#101828",
    lineHeight: 1.35,
  },
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 22,
    flexWrap: "wrap",
  },
  step: (active, done) => ({
    padding: "8px 14px",
    borderRadius: 999,
    background: done ? "#1F4E3D" : active ? "#eef6f1" : "rgba(255,255,255,0.72)",
    color: done ? "#fff" : active ? "#1F4E3D" : "#98a2b3",
    border: active ? "1px solid #cfe0d8" : "1px solid #d9e0ea",
    whiteSpace: "nowrap",
    fontSize: 12,
    fontWeight: 800,
  }),
  stepDivider: {
    flex: "0 0 10px",
    height: 1,
    background: "#d9e0ea",
  },
  toggleWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  toggle: {
    display: "inline-flex",
    padding: 6,
    background: "#ffffff",
    border: "1px solid #d9e0ea",
    borderRadius: 999,
    boxShadow: "0 10px 24px rgba(15, 23, 32, 0.06)",
    gap: 6,
    flexWrap: "wrap",
  },
  toggleButton: (active) => ({
    border: 0,
    borderRadius: 999,
    padding: "12px 18px",
    minWidth: 170,
    background: active ? "#1F4E3D" : "transparent",
    color: active ? "#ffffff" : "#667085",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: active ? "0.02em" : "normal",
    fontFamily: "inherit",
  }),
  sectionCard: {
    border: "1px solid #d9e0ea",
    borderRadius: 30,
    background: "#ffffff",
    boxShadow: "0 18px 40px rgba(15, 23, 32, 0.05)",
    padding: "26px 22px",
    marginBottom: 22,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
    marginBottom: 18,
  },
  planCard: (highlighted) => ({
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    padding: "24px 22px 22px",
    border: highlighted ? "2px solid #1F4E3D" : "1px solid #eaecf0",
    background: highlighted
      ? "linear-gradient(135deg, #0f1720 0%, #1f4e3d 48%, #eef6f1 100%)"
      : "#ffffff",
    color: highlighted ? "#ffffff" : "#101828",
    boxShadow: highlighted
      ? "0 24px 60px rgba(15, 23, 32, 0.16)"
      : "0 12px 30px rgba(15, 23, 32, 0.04)",
    display: "flex",
    flexDirection: "column",
    minHeight: 380,
  }),
  planBadge: {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
    padding: "7px 12px",
    borderRadius: 999,
    background: "#eef6f1",
    color: "#1F4E3D",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  planEyebrow: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 8,
    color: "inherit",
    opacity: 0.78,
  },
  planName: {
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.95,
    marginBottom: 10,
  },
  planDesc: {
    fontSize: 15,
    lineHeight: 1.6,
    marginBottom: 18,
    opacity: 0.92,
  },
  priceRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 16,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.95,
  },
  priceSuffix: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 4,
    opacity: 0.78,
  },
  priceBadge: {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255, 255, 255, 0.12)",
    border: "1px solid rgba(255, 255, 255, 0.24)",
    color: "#d3f0e0",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 18px",
    display: "grid",
    gap: 10,
  },
  featureItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 14,
    lineHeight: 1.5,
  },
  featureMark: (highlighted) => ({
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    background: highlighted ? "#ffffff" : "#1F4E3D",
    color: highlighted ? "#1F4E3D" : "#ffffff",
    marginTop: 1,
  }),
  button: (primary, disabled) => ({
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    border: primary ? "1px solid #1F4E3D" : "1px solid #d0d5dd",
    background: disabled
      ? "#98a2b3"
      : primary
      ? "#1F4E3D"
      : "#ffffff",
    color: primary ? "#ffffff" : "#101828",
    fontSize: 15,
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    marginTop: "auto",
    boxShadow: primary ? "0 12px 24px rgba(31, 78, 61, 0.18)" : "none",
  }),
  footnote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  chartTitle: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    marginBottom: 6,
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#667085",
    lineHeight: 1.6,
    maxWidth: 620,
  },
  tableWrap: {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid #eaecf0",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: (highlighted) => ({
    textAlign: highlighted ? "center" : "left",
    padding: "16px 14px",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: highlighted ? "#1F4E3D" : "#667085",
    background: highlighted ? "#eef6f1" : "#f8fafc",
    borderBottom: "1px solid #eaecf0",
  }),
  tdFeature: (muted) => ({
    padding: "14px 14px",
    borderBottom: "1px solid #eaecf0",
    fontSize: 14,
    fontWeight: muted ? 700 : 800,
    color: muted ? "#98a2b3" : "#101828",
    background: muted ? "#fcfcfd" : "#ffffff",
  }),
  tdValue: (highlighted, muted) => ({
    padding: "14px 12px",
    borderBottom: "1px solid #eaecf0",
    textAlign: "center",
    fontSize: 14,
    fontWeight: highlighted ? 900 : 700,
    color: muted ? "#98a2b3" : highlighted ? "#1F4E3D" : "#344054",
    background: highlighted ? "#f4fbf7" : muted ? "#fcfcfd" : "#ffffff",
    minWidth: 150,
  }),
  whyGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 18,
    alignItems: "stretch",
  },
  whyPanel: {
    borderRadius: 24,
    background: "#ffffff",
    border: "1px solid #eaecf0",
    padding: 24,
  },
  whyTitle: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    marginBottom: 10,
  },
  whyIntro: {
    fontSize: 15,
    lineHeight: 1.65,
    color: "#667085",
    marginBottom: 14,
  },
  whyList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: 12,
  },
  whyItem: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.5,
  },
  whyMark: {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#2a2118",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 900,
    marginTop: 1,
  },
  pressurePanel: {
    borderRadius: 24,
    background: "linear-gradient(180deg, #2f2419 0%, #4b3318 100%)",
    border: "1px solid #6b4720",
    padding: 24,
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  pressureTitle: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#d3f0e0",
    marginBottom: 10,
  },
  pressureHeading: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 1,
    marginBottom: 12,
  },
  pressureText: {
    fontSize: 15,
    lineHeight: 1.65,
    color: "#eadfce",
    marginBottom: 18,
  },
  pressureStats: {
    display: "grid",
    gap: 10,
  },
  pressureStat: {
    borderRadius: 18,
    border: "1px solid rgba(255, 207, 112, 0.2)",
    background: "rgba(255, 255, 255, 0.04)",
    padding: "12px 14px",
  },
  pressureLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#d3f0e0",
    marginBottom: 4,
  },
  pressureValue: {
    fontSize: 15,
    fontWeight: 800,
    color: "#ffffff",
  },
  footerCta: {
    borderRadius: 28,
    border: "1px solid #ead9bd",
    background: "linear-gradient(135deg, #eef6f1 0%, #f8fafc 100%)",
    boxShadow: "0 20px 60px rgba(15, 23, 32, 0.08)",
    padding: "26px 24px",
    display: "flex",
    gap: 18,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  footerHeading: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 15,
    lineHeight: 1.65,
    color: "#667085",
    maxWidth: 620,
  },
  footerActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  footerButton: (primary) => ({
    minHeight: 48,
    padding: "0 18px",
    borderRadius: 16,
    border: primary ? "1px solid #2a2118" : "1px solid #c9b28f",
    background: primary ? "#2a2118" : "#fffdf8",
    color: primary ? "#ffffff" : "#101828",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
  }),
  banner: (tone) => ({
    marginBottom: 18,
    padding: "13px 16px",
    borderRadius: 16,
    border: tone === "error" ? "1px solid #fecaca" : "1px solid #cfe0d8",
    background: tone === "error" ? "#fef2f2" : "#eef6f1",
    color: tone === "error" ? "#991b1b" : "#1F4E3D",
    fontSize: 13,
    fontWeight: 700,
  }),
};

function renderCellValue(value) {
  if (value === "check") return <span aria-label="Included">&#10003;</span>;
  if (value === "cross") return <span aria-label="Not included">&#10005;</span>;
  if (value === "future") return <span aria-label="Coming soon">&#11036;</span>;
  return value;
}

function comparisonValue(row, interval) {
  if (row.proKey) return PRO_PRICING[interval][row.proKey];
  return row.pro;
}

export default function SubscriptionSelect() {
  const nav = useNavigate();
  const location = useLocation();

  const [proInterval, setProInterval] = useState("monthly");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const {
    restaurant_id,
    restaurant_name,
    email,
    owner_token,
    ingestion_method,
    city,
    state,
    phone,
    menu_choice,
  } = location.state || {};

  const hasOnboardingContext = Boolean(restaurant_id && owner_token);

  const params = new URLSearchParams(location.search);
  const checkoutSuccess = params.get("checkout_success") === "1";
  const returnedPlanCode = params.get("plan_code") || "";
  const checkoutCancelled = params.get("checkout_cancelled") === "1";

  useEffect(() => {
    if (!checkoutSuccess) return;

    try {
      const saved = JSON.parse(window.sessionStorage.getItem(ONBOARDING_STATE_KEY) || "null");
      if (saved?.restaurant_id && saved?.owner_token) {
        window.sessionStorage.removeItem(ONBOARDING_STATE_KEY);
        nav("/restaurant/design-select", {
          state: {
            ...saved,
            plan: returnedPlanCode.includes("annual") ? "pro_annual" : "pro_monthly",
          },
        });
      }
    } catch {
      // sessionStorage unavailable — fall through to normal page render.
    }
  }, [checkoutSuccess, returnedPlanCode, nav]);

  function chooseVerified() {
    if (!hasOnboardingContext) {
      nav("/restaurant/signup");
      return;
    }
    nav("/restaurant/design-select", {
      state: {
        restaurant_id,
        restaurant_name,
        email,
        owner_token,
        city,
        state,
        phone,
        menu_choice,
        plan: "verified",
        ingestion_method,
      },
    });
  }

  async function handleProCheckout() {
    if (!hasOnboardingContext) {
      nav("/restaurant/signup");
      return;
    }

    const planCode = proInterval === "annual" ? "pro_annual" : "pro_monthly";
    setIsCheckingOut(true);
    setCheckoutError("");

    try {
      window.sessionStorage.setItem(
        ONBOARDING_STATE_KEY,
        JSON.stringify({
          restaurant_id,
          restaurant_name,
          email,
          owner_token,
          city,
          state,
          phone,
          menu_choice,
          ingestion_method,
        })
      );
    } catch {
      // Non-fatal — user will need to re-enter state on return if storage fails.
    }

    const origin = window.location.origin;
    const successUrl = `${origin}/restaurant/subscription?checkout_success=1&plan_code=${planCode}`;
    const cancelUrl = `${origin}/restaurant/subscription?checkout_cancelled=1`;

    try {
      const res = await fetch(`${API}/owner/subscription/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id,
          owner_token,
          email,
          plan_code: planCode,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }

      if (json.already_active) {
        nav("/restaurant/design-select", {
          state: {
            restaurant_id,
            restaurant_name,
            email,
            owner_token,
            city,
            state,
            phone,
            menu_choice,
            plan: planCode,
            ingestion_method,
          },
        });
        return;
      }

      if (json.checkout_url) {
        window.location.href = json.checkout_url;
        return;
      }

      throw new Error("No checkout URL returned. Please try again.");
    } catch (err) {
      setIsCheckingOut(false);
      setCheckoutError(err.message || "Unable to start checkout. Please try again.");
    }
  }

  if (checkoutSuccess) {
    return (
      <div style={s.page}>
        <div style={{ ...s.shell, textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>&#10003;</div>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Payment confirmed</div>
          <div style={{ fontSize: 15, color: "#667085" }}>Continuing to design step...</div>
        </div>
      </div>
    );
  }

  const proPricing = PRO_PRICING[proInterval];

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <Link to="/restaurant/signup" style={s.topLink}>
          &larr; Back to restaurant signup
        </Link>

        <section style={s.hero}>
          <div style={s.heroGrid}>
            <div style={s.heroLeft}>
              <BrandLockup
                subtitle="for Restaurants"
                wrapperStyle={{ alignItems: "flex-start", marginBottom: 18 }}
                subtitleStyle={{ textAlign: "left" }}
                logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
              />

              <div style={s.eyebrow}>Grubbid restaurant subscriptions</div>
              <div style={s.heading}>Choose Your Plan</div>
              <div style={s.subheading}>
                Simple pricing. Powerful tools to grow your restaurant.
              </div>

              {hasOnboardingContext ? (
                <div style={s.steps}>
                  <div style={s.step(false, true)}>1. Account</div>
                  <div style={s.stepDivider} />
                  <div style={s.step(true, false)}>2. Choose plan</div>
                  <div style={s.stepDivider} />
                  <div style={s.step(false, false)}>3. Design</div>
                  <div style={s.stepDivider} />
                  <div style={s.step(false, false)}>4. Upload menu</div>
                </div>
              ) : null}
            </div>

            {hasOnboardingContext ? (
              <div style={s.heroRight}>
                <div style={s.summaryCard}>
                  <div style={s.summaryCell}>
                    <div style={s.summaryLabel}>Restaurant</div>
                    <div style={s.summaryValue}>{restaurant_name || "Restaurant"}</div>
                  </div>
                  {(city || state) ? (
                    <div style={s.summaryCell}>
                      <div style={s.summaryLabel}>Location</div>
                      <div style={s.summaryValue}>{[city, state].filter(Boolean).join(", ")}</div>
                    </div>
                  ) : null}
                  {phone ? (
                    <div style={s.summaryCell}>
                      <div style={s.summaryLabel}>Phone</div>
                      <div style={s.summaryValue}>{phone}</div>
                    </div>
                  ) : null}
                  {email ? (
                    <div style={s.summaryCell}>
                      <div style={s.summaryLabel}>Email</div>
                      <div style={s.summaryValue}>{email}</div>
                    </div>
                  ) : null}
                  {menu_choice ? (
                    <div style={s.summaryCell}>
                      <div style={s.summaryLabel}>Menu</div>
                      <div style={s.summaryValue}>
                        {menu_choice === "pdf_now" ? "Upload PDF now" : "Upload later"}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {checkoutCancelled ? (
          <div style={s.banner("warning")}>
            Checkout was cancelled. You can try again or start with Verified.
          </div>
        ) : null}

        {checkoutError ? (
          <div style={s.banner("error")}>{checkoutError}</div>
        ) : null}

        <div style={s.toggleWrap}>
          <div style={s.toggle}>
            <button
              type="button"
              style={s.toggleButton(proInterval === "monthly")}
              onClick={() => setProInterval("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              style={s.toggleButton(proInterval === "annual")}
              onClick={() => setProInterval("annual")}
            >
              Annual
            </button>
          </div>
        </div>

        <section style={s.sectionCard}>
          <div style={s.chartHeader}>
            <div>
              <div style={s.chartTitle}>Plan Comparison</div>
              <div style={s.chartSubtitle}>
                Verified gets you live fast. Pro gives you the tools that turn your menu into an active growth channel.
              </div>
            </div>
          </div>

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th(false)}>Feature</th>
                  <th style={s.th(false)}>Verified</th>
                  <th style={s.th(true)}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td style={s.tdFeature(false)}>{row.feature}</td>
                    <td style={s.tdValue(false, false)}>{renderCellValue(row.verified)}</td>
                    <td style={s.tdValue(true, false)}>{renderCellValue(comparisonValue(row, proInterval))}</td>
                  </tr>
                ))}
                {FUTURE_ROWS.map((row) => (
                  <tr key={`future-${row.feature}`}>
                    <td style={s.tdFeature(true)}>{row.feature}</td>
                    <td style={s.tdValue(false, true)}>{renderCellValue(row.verified)}</td>
                    <td style={s.tdValue(true, true)}>{renderCellValue(row.pro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={s.sectionCard}>
          <div style={s.cardsGrid}>
            <article style={s.planCard(false)}>
              <div style={s.planEyebrow}>Verified</div>
              <div style={s.planName}>Verified</div>
              <div style={s.planDesc}>
                Get your restaurant online with a clean, simple menu presence.
              </div>
              <div style={s.priceRow}>
                <div style={s.priceValue}>{VERIFIED_PRICE_LABEL}</div>
              </div>

              <ul style={s.featureList}>
                {PLAN_CARD_FEATURES.verified.map((feature) => (
                  <li key={feature} style={s.featureItem}>
                    <span style={s.featureMark(false)}>&#10003;</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button style={s.button(false, false)} onClick={chooseVerified}>
                {hasOnboardingContext ? "Choose Verified" : "Get Started"}
              </button>
            </article>

            <article style={s.planCard(true)}>
              <div style={s.planBadge}>Most Popular</div>
              <div style={s.planEyebrow}>Pro</div>
              <div style={s.planName}>Pro</div>
              <div style={s.planDesc}>
                Everything you need to grow, promote, and sell.
              </div>
              <div style={s.priceRow}>
                <div style={s.priceValue}>{proPricing.amount}</div>
                <div style={s.priceSuffix}>{proPricing.suffix}</div>
              </div>
              {proPricing.badge ? <div style={s.priceBadge}>{proPricing.badge}</div> : null}

              <ul style={s.featureList}>
                {PLAN_CARD_FEATURES.pro.map((feature) => (
                  <li key={feature} style={s.featureItem}>
                    <span style={s.featureMark(true)}>&#10003;</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                style={s.button(true, isCheckingOut)}
                onClick={handleProCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut
                  ? "Preparing checkout..."
                  : hasOnboardingContext
                  ? "Go Pro with Stripe"
                  : "Get Started"}
              </button>

              {hasOnboardingContext ? (
                <div style={s.footnote}>
                  Clicking Pro sends you to secure Stripe checkout, then back into menu design.
                </div>
              ) : null}
            </article>
          </div>
        </section>

      </div>
    </div>
  );
}
