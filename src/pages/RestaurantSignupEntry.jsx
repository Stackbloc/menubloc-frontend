/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/RestaurantSignupEntry.jsx
 * File: RestaurantSignupEntry.jsx
 * Date: 2026-05-06
 * Purpose:
 *   Restaurant onboarding entry screen for selecting a Menuply
 *   restaurant plan before account creation.
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import PlanComparisonTable from "../components/PlanComparisonTable.jsx";
import {
  CHECKOUT_PRICE_LABELS,
  FREE_PLAN_CODE,
  fetchCheckoutPlanOptionsForDisplay,
  getMarketplaceCommissionDisclosure,
  indexPlansByCode,
} from "../lib/menuplyCheckoutPlans.js";

const ACCOUNT_ROUTE = "/restaurant/signup/account";
const FRANCHISE_ROUTE = "/franchises";
const FOOD_TRUCK_SIGNUP_ROUTE = "/foodtruck/signup";

const SIGNUP_PLAN_OPTIONS = [
  {
    code: FREE_PLAN_CODE,
    family: "published",
    name: "Starter",
    price: CHECKOUT_PRICE_LABELS[FREE_PLAN_CODE],
    description: "A simple published restaurant presence with public menu access on Menuply.",
    cta: "Select Starter",
    tone: "default",
    commissionPlanCode: FREE_PLAN_CODE,
    features: [
      "100% Free Profile with Fully Searchable, Verified Menu",
      "Searchable restaurant listing on Menuply",
      "Restaurant profile page with logo, about us, featured dish (limited)",
      "One menu with unlimited menu items",
      "Edit menu and menu items with pricing tools",
      "Dynamic QR Code and shareable menus",
    ],
  },
  {
    code: "starter_annual",
    family: "starter",
    name: "Pro",
    priceLines: [CHECKOUT_PRICE_LABELS.starter_monthly, `or ${CHECKOUT_PRICE_LABELS.starter_annual}`],
    price: `${CHECKOUT_PRICE_LABELS.starter_monthly} or ${CHECKOUT_PRICE_LABELS.starter_annual}`,
    description:
      "Professional Menuply tools for growing restaurants — profiles, menus, QR Code, and online ordering.",
    cta: "Select Pro",
    tone: "starter",
    commissionPlanCode: "starter_annual",
    intervals: [
      { key: "monthly", code: "starter_monthly", label: "Monthly", price: CHECKOUT_PRICE_LABELS.starter_monthly },
      { key: "annual", code: "starter_annual", label: "Annual", price: CHECKOUT_PRICE_LABELS.starter_annual },
    ],
    features: [
      "All Starter benefits, plus logo and product photos",
      "Unlimited menus and menu items",
      "QR Code and social sharing",
      "Online ordering",
      "Customers can follow your restaurant",
    ],
  },
  {
    code: "founders_annual",
    family: "founder",
    name: "Founder's",
    priceLines: [CHECKOUT_PRICE_LABELS.founders_monthly, `or ${CHECKOUT_PRICE_LABELS.founders_annual}`],
    price: `${CHECKOUT_PRICE_LABELS.founders_monthly} or ${CHECKOUT_PRICE_LABELS.founders_annual}`,
    description:
      "Founders are early adopters who want to take back their restaurant's independence. Lock in early-bird Founder's pricing while availability remains open.",
    cta: "Select Founder's",
    tone: "founder",
    commissionPlanCode: "founders_annual",
    intervals: [
      { key: "monthly", code: "founders_monthly", label: "Monthly", price: CHECKOUT_PRICE_LABELS.founders_monthly },
      { key: "annual", code: "founders_annual", label: "Annual", price: CHECKOUT_PRICE_LABELS.founders_annual },
    ],
    features: [
      "All Pro benefits, plus much more",
      "Premium menu management tools",
      "Create deals and promotions free of charge",
    ],
  },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page)",
    padding: "28px 18px 72px",
    color: "var(--gb-color-ink)",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  },
  shell: {
    maxWidth: 1120,
    margin: "0 auto",
  },
  hero: {
    marginBottom: 28,
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  heroContent: {
    maxWidth: 700,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(110,231,183,0.12)",
    border: "1px solid rgba(110,231,183,0.3)",
    color: "#6EE7B7",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 28,
  },
  card: (tone, hovered) => {
    if (tone === "founder") {
      return {
        position: "relative",
        overflow: "hidden",
        borderRadius: 28,
        padding: "24px 22px 22px",
        border: "2px solid #1F4E3D",
        background: "linear-gradient(135deg, #0f1720 0%, #1f4e3d 48%, #eef6f1 100%)",
        color: "#ffffff",
        boxShadow: hovered
          ? "0 28px 64px rgba(15, 23, 32, 0.22), 0 0 0 3px #1F4E3D"
          : "0 24px 60px rgba(15, 23, 32, 0.16)",
        display: "flex",
        flexDirection: "column",
        minHeight: 360,
        cursor: "pointer",
        transition: "box-shadow 0.15s ease",
      };
    }
    if (tone === "starter") {
      return {
        position: "relative",
        overflow: "hidden",
        borderRadius: 28,
        padding: "24px 22px 22px",
        border: "2px solid #86b89a",
        background: "linear-gradient(160deg, #eef6f1 0%, #f7fbf9 55%, #ffffff 100%)",
        color: "#101828",
        boxShadow: hovered
          ? "0 16px 36px rgba(31, 78, 61, 0.14), 0 0 0 2px #1F4E3D"
          : "0 12px 30px rgba(31, 78, 61, 0.08)",
        display: "flex",
        flexDirection: "column",
        minHeight: 360,
        cursor: "pointer",
        transition: "box-shadow 0.15s ease",
      };
    }
    return {
      position: "relative",
      overflow: "hidden",
      borderRadius: 28,
      padding: "24px 22px 22px",
      border: "1px solid #eaecf0",
      background: "#ffffff",
      color: "#101828",
      boxShadow: hovered
        ? "0 16px 36px rgba(15, 23, 32, 0.10), 0 0 0 2px #1F4E3D"
        : "0 12px 30px rgba(15, 23, 32, 0.04)",
      display: "flex",
      flexDirection: "column",
      minHeight: 360,
      cursor: "pointer",
      transition: "box-shadow 0.15s ease",
    };
  },
  limitedBadge: {
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
  planName: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.95,
    marginBottom: 10,
  },
  // Match vertical gap used by paid plans: planName (10) + priceBlock paddingTop (14).
  price: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1.12,
    paddingTop: 14,
    marginBottom: 14,
  },
  commissionDisclosure: {
    margin: "4px 0 0",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.4,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.28)",
  },
  priceBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginBottom: 18,
    padding: "14px 0",
  },
  priceRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    opacity: 0.72,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
  },
  priceHint: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.78,
    lineHeight: 1.45,
  },
  description: {
    fontSize: 15,
    lineHeight: 1.6,
    marginBottom: 20,
    opacity: 0.92,
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 18px",
    display: "grid",
    gap: 10,
  },
  cadenceShell: {
    maxWidth: 560,
    margin: "0 auto",
    borderRadius: 28,
    border: "1px solid #eaecf0",
    background: "#ffffff",
    boxShadow: "0 18px 48px rgba(15, 23, 32, 0.08)",
    padding: "36px 32px 32px",
  },
  cadenceEyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#1F4E3D",
    marginBottom: 12,
  },
  cadenceTitle: {
    fontSize: "clamp(1.5rem, 3vw, 2rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
    color: "#0B0F0C",
    margin: "0 0 10px",
  },
  cadenceSubtitle: {
    fontSize: 16,
    lineHeight: 1.6,
    color: "#374151",
    marginBottom: 28,
  },
  cadenceOptions: {
    display: "grid",
    gap: 14,
    marginBottom: 28,
  },
  cadenceOption: (active) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    width: "100%",
    padding: "18px 20px",
    borderRadius: 18,
    border: active ? "2px solid #1F4E3D" : "1.5px solid #d0d5dd",
    background: active ? "rgba(31, 78, 61, 0.06)" : "#ffffff",
    boxShadow: active ? "0 10px 24px rgba(31, 78, 61, 0.10)" : "none",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
    color: "#101828",
  }),
  cadenceOptionLabel: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#1F4E3D",
  },
  cadenceOptionPrice: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  cadenceActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  cadenceBack: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1.5px solid #d0d5dd",
    background: "#fff",
    color: "#374151",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  cadenceContinue: (enabled) => ({
    padding: "12px 22px",
    borderRadius: 12,
    border: "none",
    background: enabled ? "#1F4E3D" : "#98a2b3",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: 14,
    cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "inherit",
  }),
  pathOption: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    width: "100%",
    padding: "18px 20px",
    borderRadius: 18,
    border: "1.5px solid #d0d5dd",
    background: "#ffffff",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
    color: "#101828",
  },
  pathOptionTitle: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  pathOptionBody: {
    fontSize: 14,
    lineHeight: 1.5,
    color: "#374151",
  },
  featureItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 14,
    lineHeight: 1.5,
  },
  featureMark: (tone) => ({
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    background: tone === "founder" ? "#ffffff" : "#1F4E3D",
    color: tone === "founder" ? "#1F4E3D" : "#ffffff",
    marginTop: 1,
  }),
  foodTruckRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  foodTruckPrompt: {
    fontSize: 14,
    fontWeight: 700,
    color: "#374151",
    lineHeight: 1.4,
  },
  foodTruckLink: {
    display: "inline",
    color: "#6EE7B7",
    fontSize: 13,
    fontWeight: 800,
    textDecoration: "none",
    whiteSpace: "nowrap",
    padding: 0,
    border: "none",
    background: "transparent",
  },
  foodTruckIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#6EE7B7",
  },
  selectHint: (tone, visible) => ({
    width: "100%",
    minHeight: 44,
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.01em",
    color: tone === "founder" ? "#ffffff" : "#1F4E3D",
    opacity: visible ? 1 : 0,
    transition: "opacity 120ms ease",
    pointerEvents: "none",
    userSelect: "none",
  }),
};

function FoodTruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 8H14V16H3V8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 10H18L21 13V16H14V10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 8V6H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function planTranslationKey(code) {
  if (code?.startsWith("starter") || code === "pro_partner") return "pro";
  if (code === "founders_annual" || code === "founders_monthly") return "founder";
  return "published";
}

function PlanPrice({ plan }) {
  if (Array.isArray(plan.intervals) && plan.intervals.length > 0) {
    return (
      <div style={styles.priceBlock}>
        {plan.intervals.map((interval) => (
          <div key={interval.key} style={styles.priceRow}>
            <span style={styles.priceLabel}>{interval.label}</span>
            <span style={styles.priceValue}>{interval.price}</span>
          </div>
        ))}
        <div style={styles.priceHint}>Billing period is chosen on the next step.</div>
      </div>
    );
  }

  return <div style={styles.price}>{plan.price}</div>;
}

export default function RestaurantSignupEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const fromOperatorClaim = Boolean(
    location.state?.from === "operator_claim" || location.state?.create_listing
  );
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [billingInterval, setBillingInterval] = useState(null);
  const [plansByCode, setPlansByCode] = useState(() => indexPlansByCode());
  // Claim → new listing: choose single vs multi before plan / details entry.
  const [listingScope, setListingScope] = useState(fromOperatorClaim ? null : "single");

  useEffect(() => {
    let cancelled = false;
    fetchCheckoutPlanOptionsForDisplay().then((result) => {
      if (cancelled) return;
      setPlansByCode(indexPlansByCode(result.plans));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const localizedPlans = useMemo(
    () => SIGNUP_PLAN_OPTIONS.map((plan) => {
      const key = planTranslationKey(plan.code);
      return {
        ...plan,
        name: t(`signup.entry.plan.${key}.name`, plan.name),
        price: t(`signup.entry.plan.${key}.price`, plan.price),
        description: t(`signup.entry.plan.${key}.description`, plan.description),
      };
    }),
    [t]
  );

  function proceedWithPlanCode(selectedPlan) {
    const claim = location.state || {};
    const claimIdentity = {};
    for (const key of [
      "restaurant_id",
      "restaurant_name",
      "city",
      "state",
      "address_line1",
      "postal_code",
      "phone",
      "website_url",
      "claim_source",
      "public_restaurant_slug_or_id",
    ]) {
      if (claim[key] != null && claim[key] !== "") {
        claimIdentity[key] = claim[key];
      }
    }

    navigate(ACCOUNT_ROUTE, {
      state: {
        selected_plan: selectedPlan,
        ...claimIdentity,
        ...(fromOperatorClaim
          ? { from: "operator_claim", create_listing: true }
          : {}),
      },
    });
  }

  function handlePlanSelect(plan) {
    if (Array.isArray(plan.intervals) && plan.intervals.length > 0) {
      setPendingPlan(plan);
      setBillingInterval(null);
      return;
    }
    proceedWithPlanCode(plan.code);
  }

  function handleBillingContinue() {
    if (!pendingPlan || !billingInterval) return;
    const match = pendingPlan.intervals.find((row) => row.key === billingInterval);
    if (!match?.code) return;
    proceedWithPlanCode(match.code);
  }

  if (fromOperatorClaim && listingScope == null) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <header style={{ ...styles.hero, marginBottom: 36 }}>
            <div style={styles.heroContent}>
              <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 8 }} />
              <div style={styles.eyebrow}>
                {t("signup.entry.createListing.eyebrow", "Create a new listing")}
              </div>
            </div>
          </header>

          <div style={styles.cadenceShell}>
            <h1 style={styles.cadenceTitle}>
              {t(
                "signup.entry.createListing.title",
                "Is this one restaurant, or more than one?"
              )}
            </h1>
            <p style={styles.cadenceSubtitle}>
              {t(
                "signup.entry.createListing.subtitle",
                "Choose how you operate, then enter your restaurant details on the next screens."
              )}
            </p>

            <div style={styles.cadenceOptions}>
              <button
                type="button"
                style={styles.pathOption}
                onClick={() => setListingScope("single")}
              >
                <span style={styles.pathOptionTitle}>
                  {t("signup.entry.createListing.singleTitle", "Single restaurant")}
                </span>
                <span style={styles.pathOptionBody}>
                  {t(
                    "signup.entry.createListing.singleBody",
                    "One independent restaurant location. Choose a plan, then enter restaurant details."
                  )}
                </span>
              </button>

              <button
                type="button"
                style={styles.pathOption}
                onClick={() => navigate(FRANCHISE_ROUTE)}
              >
                <span style={styles.pathOptionTitle}>
                  {t(
                    "signup.entry.createListing.multiTitle",
                    "Franchise / multiple locations"
                  )}
                </span>
                <span style={styles.pathOptionBody}>
                  {t(
                    "signup.entry.createListing.multiBody",
                    "Contact Menuply about a brand or multi-location group."
                  )}
                </span>
              </button>

              <button
                type="button"
                style={styles.pathOption}
                onClick={() => navigate(FOOD_TRUCK_SIGNUP_ROUTE)}
              >
                <span style={styles.pathOptionTitle}>
                  {t("signup.entry.createListing.foodTruckTitle", "Food truck")}
                </span>
                <span style={styles.pathOptionBody}>
                  {t(
                    "signup.entry.createListing.foodTruckBody",
                    "Use the food truck signup path for mobile operators."
                  )}
                </span>
              </button>
            </div>

            <div style={styles.cadenceActions}>
              <button
                type="button"
                style={styles.cadenceBack}
                onClick={() => navigate("/operator/claim")}
              >
                {t("signup.entry.createListing.back", "Back to claim search")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pendingPlan) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <header style={{ ...styles.hero, marginBottom: 36 }}>
            <div style={styles.heroContent}>
              <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 8 }} />
            </div>
          </header>

          <div style={styles.cadenceShell}>
            <div style={styles.cadenceEyebrow}>
              {t("signup.entry.cadence.eyebrow", "Confirm billing")}
            </div>
            <h1 style={styles.cadenceTitle}>
              {t(
                "signup.entry.cadence.title",
                `You have chosen the ${pendingPlan.name} subscription plan`
              )}
            </h1>
            <p style={styles.cadenceSubtitle}>
              {t(
                "signup.entry.cadence.subtitle",
                "Monthly or annual billing? Choose one option below, then continue to create your account."
              )}
            </p>

            <div
              style={{
                ...styles.commissionDisclosure,
                marginBottom: 20,
                background: "#eef6f1",
                border: "1px solid #cfe0d8",
                color: "#1F4E3D",
              }}
            >
              {getMarketplaceCommissionDisclosure(
                billingInterval
                  ? pendingPlan.intervals.find((i) => i.key === billingInterval)?.code ||
                      pendingPlan.commissionPlanCode
                  : pendingPlan.commissionPlanCode || pendingPlan.code,
                { plansByCode }
              )}
            </div>

            <div style={styles.cadenceOptions} role="radiogroup" aria-label="Billing period">
              {pendingPlan.intervals.map((interval) => {
                const active = billingInterval === interval.key;
                const priceDisplay = String(interval.price || "")
                  .replace("/month", " per month")
                  .replace("/year", " per year");
                return (
                  <button
                    key={interval.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    style={styles.cadenceOption(active)}
                    onClick={() => setBillingInterval(interval.key)}
                  >
                    <span style={styles.cadenceOptionLabel}>{interval.label}</span>
                    <span style={styles.cadenceOptionPrice}>{priceDisplay}</span>
                  </button>
                );
              })}
            </div>

            <div style={styles.cadenceActions}>
              <button
                type="button"
                style={styles.cadenceBack}
                onClick={() => {
                  setPendingPlan(null);
                  setBillingInterval(null);
                }}
              >
                {t("signup.entry.cadence.back", "Back to plans")}
              </button>
              <button
                type="button"
                style={styles.cadenceContinue(Boolean(billingInterval))}
                disabled={!billingInterval}
                onClick={handleBillingContinue}
              >
                {t("signup.entry.cadence.continue", "Continue to account")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div style={styles.heroContent}>
            <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 8 }} />
            <div style={styles.eyebrow}>{t("signup.entry.eyebrow", "Restaurant Signup")}</div>
            {fromOperatorClaim ? (
              <div style={{
                marginTop: 10,
                marginBottom: 4,
                padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(31, 78, 61, 0.08)",
                border: "1px solid rgba(31, 78, 61, 0.22)",
                fontSize: 14,
                fontWeight: 600,
                color: "#1F4E3D",
                lineHeight: 1.5,
                maxWidth: 660,
              }}>
                {t(
                  "signup.entry.createListing.banner",
                  "Creating a new listing for your operator account. Choose a plan, then enter restaurant details on the next screen."
                )}{" "}
                <button
                  type="button"
                  onClick={() => setListingScope(null)}
                  style={{
                    ...styles.foodTruckLink,
                    color: "#1F4E3D",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  {t("signup.entry.createListing.changeType", "Change listing type")}
                </button>
              </div>
            ) : (
              <div style={styles.foodTruckRow}>
                <span style={styles.foodTruckIcon} aria-hidden>
                  <FoodTruckIcon />
                </span>
                <span style={styles.foodTruckPrompt}>{t("signup.entry.foodTruckOwner", "Food Truck Owner?")}</span>
                <Link to="/foodtruck/signup" style={styles.foodTruckLink}>
                  {t("signup.entry.foodTruckSignup", "Sign up")}
                </Link>
              </div>
            )}
            <h1 style={{
              fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#0B0F0C",
              margin: "16px 0 0",
            }}>
              {t("signup.entry.title", "Choose your plan")}
            </h1>
            <div style={{
              fontSize: 16,
              lineHeight: 1.65,
              color: "#374151",
              maxWidth: 660,
              marginTop: 12,
            }}>
              {t(
                "signup.entry.subtitle",
                "Select the plan that fits how you want diners to discover and order from your menu. For paid plans, you will choose monthly or annual billing on the next screen."
              )}
            </div>
          </div>
        </header>

        <section style={styles.cardsGrid}>
          {localizedPlans.map((plan) => {
            const isHovered = hoveredPlan === plan.family;
            const selectLabel = `Select ${plan.name}`;

            return (
              <article
                key={plan.family}
                style={styles.card(plan.tone, isHovered)}
                onClick={() => handlePlanSelect(plan)}
                onMouseEnter={() => setHoveredPlan(plan.family)}
                onMouseLeave={() => setHoveredPlan(null)}
                tabIndex={0}
                role="button"
                aria-label={selectLabel}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handlePlanSelect(plan);
                  }
                }}
              >
                {plan.family === "founder" ? (
                  <div style={styles.limitedBadge}>{t("signup.entry.limitedAvailability", "Limited Availability")}</div>
                ) : null}
                <div style={styles.planName}>{plan.name}</div>
                <div style={styles.commissionDisclosure}>
                  {getMarketplaceCommissionDisclosure(plan.commissionPlanCode || plan.code, {
                    plansByCode,
                  })}
                </div>
                <PlanPrice plan={plan} />
                <div style={styles.description}>{plan.description}</div>

                <ul style={styles.featureList}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={styles.featureItem}>
                      <span style={styles.featureMark(plan.tone)}>&#10003;</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div style={styles.selectHint(plan.tone, isHovered)} aria-hidden={!isHovered}>
                  {selectLabel}
                </div>
              </article>
            );
          })}
        </section>

        <PlanComparisonTable />
      </div>
    </div>
  );
}
