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

const WHY_PRO_POINTS = [
  "Increase visibility in search results",
  "Run promotions and attract new customers",
  "Turn your menu into a revenue engine",
  "Accept orders directly with lower fees",
];

const s = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(255, 202, 142, 0.35), transparent 30%), radial-gradient(circle at top right, rgba(255, 243, 205, 0.55), transparent 32%), linear-gradient(180deg, #fffdf8 0%, #fff7ea 48%, #fff3df 100%)",
    padding: "28px 18px 72px",
    color: "#2a2118",
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
  },
  shell: {
    maxWidth: 1180,
    margin: "0 auto",
  },
  topLink: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: 18,
    color: "#6f5c48",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  },
  hero: {
    border: "1px solid rgba(112, 79, 38, 0.12)",
    borderRadius: 32,
    background: "rgba(255, 251, 242, 0.9)",
    boxShadow: "0 28px 80px rgba(118, 84, 36, 0.12)",
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
    background: "#fff3d6",
    border: "1px solid #f0d39b",
    color: "#9f5b14",
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
    color: "#6f5c48",
    maxWidth: 660,
    marginBottom: 0,
  },
  summaryCard: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    border: "1px solid rgba(112, 79, 38, 0.12)",
    background: "linear-gradient(180deg, #fffdf8 0%, #fff7ea 100%)",
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
    color: "#9f5b14",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#2a2118",
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
    background: done ? "#2a2118" : active ? "#fff3d6" : "rgba(255,255,255,0.7)",
    color: done ? "#fff" : active ? "#9f5b14" : "#9b8a76",
    border: active ? "1px solid #f0d39b" : "1px solid rgba(112, 79, 38, 0.12)",
    whiteSpace: "nowrap",
    fontSize: 12,
    fontWeight: 800,
  }),
  stepDivider: {
    flex: "0 0 10px",
    height: 1,
    background: "#ddc8ac",
  },
  toggleWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  toggle: {
    display: "inline-flex",
    padding: 6,
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(112, 79, 38, 0.12)",
    borderRadius: 999,
    boxShadow: "0 12px 30px rgba(118, 84, 36, 0.08)",
    gap: 6,
    flexWrap: "wrap",
  },
  toggleButton: (active) => ({
    border: 0,
    borderRadius: 999,
    padding: "12px 18px",
    minWidth: 170,
    background: active ? "#2a2118" : "transparent",
    color: active ? "#fff8ef" : "#6f5c48",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: active ? "0.02em" : "normal",
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
  }),
  sectionCard: {
    border: "1px solid rgba(112, 79, 38, 0.12)",
    borderRadius: 30,
    background: "rgba(255, 251, 242, 0.92)",
    boxShadow: "0 24px 80px rgba(118, 84, 36, 0.09)",
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
    border: highlighted ? "2px solid #d58a22" : "1px solid #ead9bd",
    background: highlighted
      ? "linear-gradient(180deg, #2a2118 0%, #3f2d1b 100%)"
      : "linear-gradient(180deg, #fffefb 0%, #fff8eb 100%)",
    color: highlighted ? "#fff8ef" : "#2a2118",
    boxShadow: highlighted
      ? "0 28px 90px rgba(103, 63, 15, 0.28)"
      : "0 12px 36px rgba(118, 84, 36, 0.08)",
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
    background: "#ffcf70",
    color: "#6f3a00",
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
    background: "rgba(255, 207, 112, 0.18)",
    border: "1px solid rgba(255, 207, 112, 0.35)",
    color: "#ffd98f",
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
    background: highlighted ? "#ffcf70" : "#2a2118",
    color: highlighted ? "#402500" : "#fff8ef",
    marginTop: 1,
  }),
  button: (primary, disabled) => ({
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    border: primary ? "1px solid #ffcf70" : "1px solid #d8c0a1",
    background: disabled
      ? "#c8b9aa"
      : primary
      ? "linear-gradient(180deg, #ffcf70 0%, #e9a739 100%)"
      : "#fffefb",
    color: primary ? "#3e2500" : "#2a2118",
    fontSize: 15,
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
    marginTop: "auto",
    boxShadow: primary ? "0 14px 28px rgba(202, 128, 29, 0.22)" : "none",
  }),
  footnote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 1.5,
    color: "#d7c8b9",
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
    color: "#6f5c48",
    lineHeight: 1.6,
    maxWidth: 620,
  },
  tableWrap: {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid #ead9bd",
    background: "#fffdf8",
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
    color: highlighted ? "#6f3a00" : "#7b6856",
    background: highlighted ? "#ffe8b5" : "#fff8eb",
    borderBottom: "1px solid #ead9bd",
  }),
  tdFeature: (muted) => ({
    padding: "14px 14px",
    borderBottom: "1px solid #f1e5d3",
    fontSize: 14,
    fontWeight: muted ? 700 : 800,
    color: muted ? "#8e7d6b" : "#2a2118",
    background: muted ? "#fffcf6" : "#fffdf8",
  }),
  tdValue: (highlighted, muted) => ({
    padding: "14px 12px",
    borderBottom: "1px solid #f1e5d3",
    textAlign: "center",
    fontSize: 14,
    fontWeight: highlighted ? 900 : 700,
    color: muted ? "#8e7d6b" : highlighted ? "#6f3a00" : "#4c3f33",
    background: highlighted ? "#fff7e0" : muted ? "#fffcf6" : "#fffdf8",
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
    background: "linear-gradient(180deg, #fffefb 0%, #fff7ea 100%)",
    border: "1px solid #ead9bd",
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
    color: "#6f5c48",
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
    color: "#fff8ef",
    fontSize: 12,
    fontWeight: 900,
    marginTop: 1,
  },
  pressurePanel: {
    borderRadius: 24,
    background: "linear-gradient(180deg, #2f2419 0%, #4b3318 100%)",
    border: "1px solid #6b4720",
    padding: 24,
    color: "#fff8ef",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  pressureTitle: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#ffcf70",
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
    color: "#ffcf70",
    marginBottom: 4,
  },
  pressureValue: {
    fontSize: 15,
    fontWeight: 800,
    color: "#fff8ef",
  },
  footerCta: {
    borderRadius: 28,
    border: "1px solid #ead9bd",
    background: "linear-gradient(135deg, #fff8ea 0%, #ffe5b2 100%)",
    boxShadow: "0 20px 60px rgba(118, 84, 36, 0.12)",
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
    color: "#6f5c48",
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
    color: primary ? "#fff8ef" : "#2a2118",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
  }),
  banner: (tone) => ({
    marginBottom: 18,
    padding: "13px 16px",
    borderRadius: 16,
    border: tone === "error" ? "1px solid #fecaca" : "1px solid #fed7aa",
    background: tone === "error" ? "#fef2f2" : "#fff7ed",
    color: tone === "error" ? "#991b1b" : "#9a3412",
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
          <div style={{ fontSize: 15, color: "#6f5c48" }}>Continuing to design step...</div>
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
                logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#fff7ea" }}
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

      </div>
    </div>
  );
}
