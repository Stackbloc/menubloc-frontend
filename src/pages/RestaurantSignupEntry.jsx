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

import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import PlanComparisonTable from "../components/PlanComparisonTable.jsx";
import {
  CHECKOUT_PRICE_LABELS,
  FREE_PLAN_CODE,
} from "../lib/menuplyCheckoutPlans.js";

const ACCOUNT_ROUTE = "/restaurant/signup/account";

const SIGNUP_PLAN_OPTIONS = [
  {
    code: FREE_PLAN_CODE,
    name: "Published",
    price: CHECKOUT_PRICE_LABELS[FREE_PLAN_CODE],
    description: "A simple published restaurant presence with public menu access on Menuply.",
    cta: "Continue with Published",
    featured: false,
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
    code: "founders_annual",
    name: "Founder's",
    price: CHECKOUT_PRICE_LABELS.founders_annual,
    description:
      "Be among the first restaurants to join the movement and take back your restaurant's independence. Lock in early-bird Founder's pricing while availability remains open.",
    cta: "Continue with Founder's",
    featured: true,
    features: [
      "All benefits in Published, plus much more.",
      "Guaranteed, no increase pricing for 24 months",
      "Publish Deals free during first year (subject to quantity limits)",
      "Premium menu tools",
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
    gap: 18,
  },
  foundersNotice: {
    marginBottom: 18,
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid rgba(252, 211, 77, 0.35)",
    background: "rgba(252, 211, 77, 0.08)",
    color: "#101828",
    fontSize: 14,
    lineHeight: 1.55,
    fontWeight: 600,
  },
  card: (featured, hovered) => ({
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    padding: "24px 22px 22px",
    border: featured ? "2px solid #1F4E3D" : "1px solid #eaecf0",
    background: featured
      ? "linear-gradient(135deg, #0f1720 0%, #1f4e3d 48%, #eef6f1 100%)"
      : "#ffffff",
    color: featured ? "#ffffff" : "#101828",
    boxShadow: hovered
      ? featured
        ? "0 28px 64px rgba(15, 23, 32, 0.22), 0 0 0 3px #1F4E3D"
        : "0 16px 36px rgba(15, 23, 32, 0.10), 0 0 0 2px #1F4E3D"
      : featured
        ? "0 24px 60px rgba(15, 23, 32, 0.16)"
        : "0 12px 30px rgba(15, 23, 32, 0.04)",
    display: "flex",
    flexDirection: "column",
    minHeight: 360,
    cursor: "pointer",
    transition: "box-shadow 0.15s ease",
  }),
  badge: {
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
  price: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1.12,
    marginBottom: 10,
  },
  priceStack: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  priceSecondary: {
    fontSize: 22,
    fontWeight: 850,
    opacity: 0.9,
  },
  description: {
    fontSize: 15,
    lineHeight: 1.6,
    marginBottom: 18,
    opacity: 0.92,
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
  featureMark: (featured) => ({
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    background: featured ? "#ffffff" : "#1F4E3D",
    color: featured ? "#1F4E3D" : "#ffffff",
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
  button: (featured) => ({
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    border: featured ? "1px solid #1F4E3D" : "1px solid #d0d5dd",
    background: featured ? "#1F4E3D" : "#ffffff",
    color: featured ? "#ffffff" : "#101828",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: "auto",
    boxShadow: featured ? "0 12px 24px rgba(31, 78, 61, 0.18)" : "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  }),
};

function FoodTruckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h11v8H3V6zm11 2h3l3 3v3h-6V8zM6 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 8V6H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function planTranslationKey(code) {
  if (code === "pro_partner" || code?.startsWith("starter")) return "pro";
  if (code === "founders_annual" || code === "founders_monthly") return "founder";
  return "published";
}

function PlanPrice({ plan }) {
  if (plan.code === "pro_partner") {
    const [monthly, annual] = plan.price.split(/\s+(?:or|o|或)\s+/i);
    return (
      <div style={{ ...styles.price, ...styles.priceStack }}>
        <span>{monthly || "$49/month"}</span>
        <span style={styles.priceSecondary}>{annual || "$399/year"}</span>
      </div>
    );
  }

  return <div style={styles.price}>{plan.price}</div>;
}

export default function RestaurantSignupEntry() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const localizedPlans = useMemo(
    () => SIGNUP_PLAN_OPTIONS.map((plan) => {
      const key = planTranslationKey(plan.code);
      return {
        ...plan,
        name: t(`signup.entry.plan.${key}.name`, plan.name),
        price: t(`signup.entry.plan.${key}.price`, plan.price),
        description: t(`signup.entry.plan.${key}.description`, plan.description),
        cta: t(`signup.entry.plan.${key}.cta`, plan.cta),
      };
    }),
    [t]
  );

  function handlePlanSelect(selectedPlan) {
    navigate(ACCOUNT_ROUTE, {
      state: {
        selected_plan: selectedPlan,
      },
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div style={styles.heroContent}>
            <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 8 }} />
            <div style={styles.eyebrow}>{t("signup.entry.eyebrow", "Restaurant Signup")}</div>
            <div style={styles.foodTruckRow}>
              <span style={styles.foodTruckIcon} aria-hidden>
                <FoodTruckIcon />
              </span>
              <span style={styles.foodTruckPrompt}>{t("signup.entry.foodTruckOwner", "Food Truck Owner?")}</span>
              <Link to="/foodtruck/signup" style={styles.foodTruckLink}>
                {t("signup.entry.foodTruckSignup", "Sign up")}
              </Link>
            </div>
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
                "Select the plan that fits how you want diners to discover and order from your menu."
              )}
            </div>
          </div>
        </header>

        <div style={styles.foundersNotice}>
          {t(
            "signup.entry.foundersNotice",
            "Founder's Membership is available for a limited time to early restaurant partners."
          )}
        </div>

        <section style={styles.cardsGrid}>
          {localizedPlans.map((plan) => (
            <article
              key={plan.code}
              style={styles.card(plan.featured, hoveredPlan === plan.code)}
              onClick={() => handlePlanSelect(plan.code)}
              onMouseEnter={() => setHoveredPlan(plan.code)}
              onMouseLeave={() => setHoveredPlan(null)}
              tabIndex={0}
              role="button"
              aria-label={plan.cta}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handlePlanSelect(plan.code); } }}
            >
              {plan.code === "founders_annual" ? (
                <div style={styles.limitedBadge}>{t("signup.entry.limitedAvailability", "Limited Availability")}</div>
              ) : null}
              <div style={styles.planName}>{plan.name}</div>
              <PlanPrice plan={plan} />
              <div style={styles.description}>{plan.description}</div>

              <ul style={styles.featureList}>
                {plan.features.map((feature) => (
                  <li key={feature} style={styles.featureItem}>
                    <span style={styles.featureMark(plan.featured)}>&#10003;</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div style={styles.button(plan.featured)}>{plan.cta}</div>
            </article>
          ))}
        </section>

        <PlanComparisonTable />
      </div>
    </div>
  );
}
