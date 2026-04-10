/**
 * ============================================================
 * File:    SubscriptionSelect.jsx
 * Path:    menubloc-frontend/src/pages/SubscriptionSelect.jsx
 * Date:    2026-04-09
 * Purpose:
 *   Onboarding step 2 — choose a profile plan (Verified or Pro).
 *   Reached after the simplified restaurant signup step.
 *
 *   Router state expected:
 *     restaurant_id    — numeric restaurant ID
 *     restaurant_name  — display name
 *     email            — owner email
 *     owner_token      — HMAC auth token (optional in evaluation mode)
 *     ingestion_method — "pdf" | "spreadsheet" | "ocr"
 *
 *   Plan choice:
 *     Verified → navigate to /restaurant/design-select (free)
 *     Pro      → create hosted checkout session → redirect to billing flow
 *
 *   Evaluation mode (VITE_ALLOW_OWNER_TOKEN_BYPASS=true):
 *     When the backend responds with { evaluation_mode: true }, no Stripe
 *     redirect occurs. Instead a notice is shown and the user can continue
 *     to the next onboarding step directly.
 *
 *   After successful Stripe checkout:
 *     Billing flow redirects to /restaurant/subscription?checkout_success=1&plan_code=<code>
 *     Onboarding state is recovered from sessionStorage and the user continues.
 * ============================================================
 */

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";
import { toConsumerErrorMessage } from "../lib/api.js";
import { LEGAL_VERSIONS } from "../content/legal.js";

const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "")
).replace(/\/$/, "");
const ONBOARDING_STATE_KEY = "grubbid.onboarding.state";

/**
 * VITE_ALLOW_OWNER_TOKEN_BYPASS=true
 *   Mirrors the backend bypass flag on the frontend.
 *   When true:
 *     - owner_token is not required to enter the onboarding context
 *     - evaluation_mode response from backend shows a notice instead of an error
 *   Must be false or unset in production.
 */
const BYPASS_MODE = import.meta.env.VITE_ALLOW_OWNER_TOKEN_BYPASS === "true";

const VERIFIED_PRICE_LABEL = "Free";
const PRO_PRICING = {
  monthly: {
    amount: "$39.99",
    suffix: "/ month",
    tableLabel: "$39.99 / month",
    badge: null,
  },
  annual: {
    amount: "$199.99",
    suffix: "per year",
    tableLabel: "$199.99 per year",
    badge: "Free QR signage included",
  },
};

const PLAN_CARD_FEATURES = {
  verified: [
    "Restaurant profile page",
    "Discoverable restaurant and menu items",
    "Menu editing with QR sharing",
  ],
  pro: [
    "Custom branding and featured dish",
    "Unlimited menus",
    "Adobe-supported design options",
    "Social and PDF publishing",
    "Online ordering and custom deals",
  ],
};

const COMPARISON_ROWS = [
  { feature: "Grubbid Restaurant Profile Page listing basic restaurant details", verified: "check", pro: "check" },
  { feature: "Restaurant and menu items discoverable on Grubbid", verified: "check", pro: "check" },
  { feature: "Logo, About Us, and featured dish shown on profile page", verified: "cross", pro: "check" },
  { feature: "Unlimited number of menus and menu items", verified: "1 menu, unlimited items", pro: "check" },
  { feature: "Customized menu design options supported by Adobe", verified: "cross", pro: "check" },
  { feature: "Menus auto-publishable to social media and PDF", verified: "cross", pro: "check" },
  { feature: "Menu editing and shareable with QR code", verified: "check", pro: "check" },
  { feature: "Create custom deals searchable by menu item or restaurant", verified: "cross", pro: "check" },
  { feature: "Online ordering for pickup and/or delivery", verified: "cross", pro: "check" },
  { feature: "Free QR door and table signage", verified: "cross", pro: "Annual plan only" },
];

const FUTURE_ROWS = [];

function normalizeOnboardingState(raw) {
  if (!raw || typeof raw !== "object") return null;

  const normalized = {
    restaurant_id: raw.restaurant_id ?? null,
    restaurant_name: raw.restaurant_name ?? "",
    email: raw.email ?? "",
    owner_token: raw.owner_token ?? "",
    ingestion_method: raw.ingestion_method ?? "",
    city: raw.city ?? "",
    state: raw.state ?? "",
    phone: raw.phone ?? "",
    menu_choice: raw.menu_choice ?? "",
    selected_plan: raw.selected_plan ?? raw.plan ?? "",
  };

  // In bypass/evaluation mode the owner_token is optional — restaurant_id alone
  // is sufficient to identify the context.  In production both are required.
  if (BYPASS_MODE) {
    return normalized.restaurant_id ? normalized : null;
  }
  return normalized.restaurant_id && normalized.owner_token ? normalized : null;
}

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
  thPlanWrap: {
    display: "inline-flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  thPlanName: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#1F4E3D",
  },
  thPlanPrice: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    background: "#ffffff",
    border: "1px solid #cfe0d8",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.01em",
    color: "#101828",
    boxShadow: "0 4px 12px rgba(15, 23, 32, 0.06)",
  },
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
    border:
      tone === "error"
        ? "1px solid #fecaca"
        : tone === "warning"
        ? "1px solid #fde68a"
        : "1px solid #cfe0d8",
    background:
      tone === "error"
        ? "#fef2f2"
        : tone === "warning"
        ? "#fffbeb"
        : "#eef6f1",
    color:
      tone === "error"
        ? "#991b1b"
        : tone === "warning"
        ? "#92400e"
        : "#1F4E3D",
    fontSize: 13,
    fontWeight: 700,
  }),
  evaluationNotice: {
    marginBottom: 18,
    padding: "18px 20px",
    borderRadius: 18,
    border: "1px solid #cfe0d8",
    background: "#eef6f1",
    color: "#1F4E3D",
  },
  evaluationTitle: {
    fontSize: 15,
    fontWeight: 900,
    marginBottom: 6,
  },
  evaluationBody: {
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 14,
    color: "#344054",
  },
  evaluationButton: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 18px",
    borderRadius: 12,
    border: "1px solid #1F4E3D",
    background: "#1F4E3D",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  legalNotice: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#667085",
  },
  legalLink: {
    color: "#1F4E3D",
    fontWeight: 800,
    textDecoration: "none",
  },
};

function renderCellValue(value) {
  if (value === "check") return <span aria-label="Included">&#10003;</span>;
  if (value === "cross") return <span aria-label="Not included">&#10005;</span>;
  if (value === "future") return <span aria-label="Coming soon">&#11036;</span>;
  return value;
}

export default function SubscriptionSelect() {
  const nav = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const checkoutSuccess = searchParams.get("checkout_success") === "1";
  const returnedPlanCode = searchParams.get("plan_code") || "";
  const checkoutCancelled = searchParams.get("checkout_cancelled") === "1";

  const [onboardingState, setOnboardingState] = useState(() => {
    const stateFromNavigation = normalizeOnboardingState(location.state);
    if (stateFromNavigation) return stateFromNavigation;

    if (!checkoutSuccess && !checkoutCancelled) {
      return null;
    }

    try {
      return normalizeOnboardingState(
        JSON.parse(window.sessionStorage.getItem(ONBOARDING_STATE_KEY) || "null")
      );
    } catch {
      return null;
    }
  });

  const [proInterval, setProInterval] = useState("monthly");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  // evaluationMode: set to the chosen plan_code when backend returns
  // evaluation_mode: true (ALLOW_OWNER_TOKEN_BYPASS=true on backend).
  const [evaluationMode, setEvaluationMode] = useState(null);

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
    selected_plan,
  } = onboardingState || {};

  // In bypass mode, only restaurant_id is required for onboarding context.
  // In production, owner_token must also be present.
  const hasOnboardingContext = BYPASS_MODE
    ? Boolean(restaurant_id)
    : Boolean(restaurant_id && owner_token);

  useEffect(() => {
    const stateFromNavigation = normalizeOnboardingState(location.state);
    if (!stateFromNavigation) return;

    setOnboardingState(stateFromNavigation);
    try {
      window.sessionStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(stateFromNavigation));
    } catch {
      // Storage is optional. Navigation state still carries the flow.
    }
  }, [location.state]);

  useEffect(() => {
    if (normalizeOnboardingState(location.state)) return;
    if (checkoutSuccess || checkoutCancelled) return;

    setOnboardingState(null);
    try {
      window.sessionStorage.removeItem(ONBOARDING_STATE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }, [location.state, checkoutSuccess, checkoutCancelled]);

  useEffect(() => {
    if (!checkoutSuccess) return;

    try {
      const saved = JSON.parse(window.sessionStorage.getItem(ONBOARDING_STATE_KEY) || "null");
      if (saved?.restaurant_id && (BYPASS_MODE || saved?.owner_token)) {
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

  useEffect(() => {
    if (selected_plan === "pro_annual") {
      setProInterval("annual");
      return;
    }
    if (selected_plan === "pro_monthly") {
      setProInterval("monthly");
    }
  }, [selected_plan]);

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

  function continueFromEvaluation() {
    const planCode = evaluationMode || "pro_monthly";
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
        billing_mode: "evaluation",
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
    setEvaluationMode(null);

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
      // Non-fatal.
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
          legal_acceptance: {
            document_key: "subscription_terms",
            document_version: LEGAL_VERSIONS.subscriptionTerms,
          },
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }

      // ── Evaluation mode: backend bypassed Stripe, show notice ─────────────
      if (json.evaluation_mode) {
        setIsCheckingOut(false);
        setEvaluationMode(planCode);
        return;
      }

      // ── Already active subscription ───────────────────────────────────────
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

      // ── Stripe checkout redirect ──────────────────────────────────────────
      if (json.checkout_url) {
        window.location.href = json.checkout_url;
        return;
      }

      throw new Error("No checkout URL returned. Please try again.");
    } catch (err) {
      setIsCheckingOut(false);
      setCheckoutError(
        toConsumerErrorMessage(
          err,
          API
            ? "Unable to start checkout. Please try again."
            : "Subscription checkout is not configured on this site yet."
        )
      );
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
                subtitleStyle={{ textAlign: "left", width: "100%", paddingLeft: 6 }}
                logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
              />

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

        {/* Evaluation mode notice — shown after backend returns evaluation_mode: true */}
        {evaluationMode ? (
          <div style={s.evaluationNotice}>
            <div style={s.evaluationTitle}>Evaluation mode: Stripe onboarding can be completed later.</div>
            <div style={s.evaluationBody}>
              Pro plan has been recorded for this restaurant. Payment setup is not yet configured in this
              environment. You can continue through the rest of onboarding now and connect billing when
              Stripe is ready.
            </div>
            <button
              type="button"
              style={s.evaluationButton}
              onClick={continueFromEvaluation}
            >
              Continue to Pro setup &rarr;
            </button>
          </div>
        ) : null}

        {checkoutCancelled && !evaluationMode ? (
          <div style={s.banner("warning")}>
            Checkout was cancelled. You can try again or start with Verified.
          </div>
        ) : null}

        {checkoutError && !evaluationMode ? (
          <div style={s.banner("error")}>{checkoutError}</div>
        ) : null}

        {selected_plan ? (
          <div style={s.banner("success")}>
            Selected during signup: {selected_plan === "verified" ? "Verified" : selected_plan === "pro_annual" ? "Pro Annual" : "Pro Monthly"}.
            {selected_plan === "verified" ? " Continue with Verified below." : " You can continue with that Pro option below or switch intervals here."}
          </div>
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
                  <th style={s.th(true)}>
                    <span style={s.thPlanWrap}>
                      <span style={s.thPlanName}>Pro</span>
                      <span style={s.thPlanPrice}>
                        {proInterval === "annual" ? "$199.99 annually" : "$39.99/month"}
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td style={s.tdFeature(false)}>{row.feature}</td>
                    <td style={s.tdValue(false, false)}>{renderCellValue(row.verified)}</td>
                    <td style={s.tdValue(true, false)}>{renderCellValue(row.pro)}</td>
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
                {hasOnboardingContext && selected_plan === "verified" ? "Continue with Verified" : hasOnboardingContext ? "Choose Verified" : "Get Started"}
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
                <div style={s.priceSuffix}>
                  {proInterval === "annual" ? "annually" : "/month"}
                </div>
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
                style={s.button(true, isCheckingOut || Boolean(evaluationMode))}
                onClick={evaluationMode ? continueFromEvaluation : handleProCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut
                  ? "Preparing checkout..."
                  : evaluationMode
                  ? "Continue to Pro setup \u2192"
                  : hasOnboardingContext && selected_plan === "pro_annual"
                  ? "Continue with Pro Annual"
                  : hasOnboardingContext && selected_plan === "pro_monthly"
                  ? "Continue with Pro Monthly"
                  : hasOnboardingContext
                  ? "Choose Pro"
                  : "Get Started"}
              </button>
              <div style={s.legalNotice}>
                By subscribing, you agree to the{" "}
                <Link to="/restaurant/subscription-terms" target="_blank" rel="noreferrer" style={s.legalLink}>
                  Restaurant Subscription Terms
                </Link>
                .
              </div>
              {checkoutError && !evaluationMode ? (
                <div style={{ ...s.banner("error"), marginTop: 12, marginBottom: 0 }}>
                  {checkoutError}
                </div>
              ) : null}
            </article>
          </div>
        </section>

      </div>
    </div>
  );
}
