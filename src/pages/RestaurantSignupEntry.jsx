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

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";
import PlanComparisonTable from "../components/PlanComparisonTable.jsx";

const ACCOUNT_ROUTE = "/restaurant/signup/account";

const PLAN_OPTIONS = [
  {
    code: "verified",
    name: "Verified",
    price: "$0",
    description: "A simple verified restaurant presence with public menu access on Menuply.",
    cta: "Continue with Verified",
    featured: false,
    features: [
      "Searchable restaurant listing on Menuply",
      "Restaurant profile page with logo, about us, featured dish (limited)",
      "One menu with unlimited menu items",
      "Edit menu and menu items with pricing tools",
      "Dynamic QR Code and shareable menus",
    ],
  },
  {
    code: "pro_partner",
    name: "Pro Partner",
    price: "$49/month or $399/year",
    description:
      "For restaurants that want stronger customer pricing, direct ordering tools, and deeper customer engagement on a lower-cost platform.",
    cta: "Continue with Pro Partner",
    featured: true,
    features: [
      "Unlimited menus with scheduled/timed display options",
      "Full restaurant profile with logo, billboard, about us, featured dish",
      "Menu item photos",
      "Ingredient-rich, fully searchable menu content",
      "Diners can follow your profile and receive offers and updates",
      "Social share for menus and menu items",
      "Billboard placement in profile and search results",
      "Deals and promotions page",
      "Marketplace ordering (pickup and delivery)",
    ],
  },
  {
    code: "founders_annual",
    name: "Founder",
    price: "$299/year",
    description:
      "Everything in Pro Partner, with a 24-month price guarantee.",
    cta: "Continue with Founder",
    featured: false,
    features: [
      "Everything included in Pro Partner",
      "24-month price guarantee",
    ],
  },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f6f6f3 0%, #eef5f2 100%)",
    padding: "28px 18px 72px",
    color: "#101828",
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
    background: "#eef6f1",
    border: "1px solid #cfe0d8",
    color: "#1F4E3D",
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
    letterSpacing: "-0.03em",
    marginBottom: 10,
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
    color: "#344054",
    lineHeight: 1.4,
  },
  foodTruckLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 18px",
    borderRadius: 12,
    border: "1px solid #1F4E3D",
    background: "#ffffff",
    color: "#1F4E3D",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  foodTruckIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#1F4E3D",
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

export default function RestaurantSignupEntry() {
  const navigate = useNavigate();
  const [hoveredPlan, setHoveredPlan] = useState(null);

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
            <BrandLockup
              logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
              wrapperStyle={{ marginBottom: 8 }}
            />
            <div style={styles.eyebrow}>Restaurant Signup</div>
            <div style={styles.foodTruckRow}>
              <span style={styles.foodTruckIcon} aria-hidden>
                <FoodTruckIcon />
              </span>
              <span style={styles.foodTruckPrompt}>Food Truck Owner?</span>
              <Link to="/foodtruck/signup" style={styles.foodTruckLink}>
                Signup
              </Link>
            </div>
            <h1 style={{
              fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#101828",
              margin: "16px 0 0",
            }}>
              Pick the Subscription Right for Your Restaurant
            </h1>
            <div style={{
              fontSize: 16,
              lineHeight: 1.65,
              color: "#667085",
              maxWidth: 660,
              marginTop: 12,
            }}>
              Create your restaurant account with Menuply, then continue with the plan that fits your operation.
            </div>
          </div>
        </header>

        <section style={styles.cardsGrid}>
          {PLAN_OPTIONS.map((plan) => (
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
              {plan.featured ? <div style={styles.badge}>Most Popular</div> : null}
              <div style={styles.planName}>{plan.name}</div>
              <div style={styles.price}>{plan.price}</div>
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
