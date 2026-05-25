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
    border: "1px solid #d9e0ea",
    borderRadius: 32,
    background: "#ffffff",
    boxShadow: "0 18px 40px rgba(15, 23, 32, 0.06)",
    padding: "28px 24px 24px",
    marginBottom: 22,
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
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  step: (active) => ({
    padding: "8px 14px",
    borderRadius: 999,
    background: active ? "#eef6f1" : "rgba(255,255,255,0.72)",
    color: active ? "#1F4E3D" : "#98a2b3",
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
  }),
};

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
        <section style={styles.hero}>
          <BrandLockup
            subtitle="for Restaurants"
            wrapperStyle={{ alignItems: "flex-start", marginBottom: 18 }}
            subtitleStyle={{ textAlign: "left", width: "100%", paddingLeft: 6 }}
            logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
          />

          <div style={styles.eyebrow}>Restaurant Signup</div>

          <div style={styles.steps}>
            <div style={styles.step(true)}>1. Choose plan</div>
            <div style={styles.stepDivider} />
            <div style={styles.step(false)}>2. Create account</div>
            <div style={styles.stepDivider} />
            <div style={styles.step(false)}>3. Finish onboarding</div>
          </div>
        </section>

        <section style={{
          marginBottom: 22,
          borderRadius: 20,
          border: "1px solid #d9e0ea",
          background: "#f8faf9",
          padding: "20px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#101828", marginBottom: 4 }}>
              Do you have a food truck?
            </div>
            <div style={{ fontSize: 14, color: "#667085", lineHeight: 1.5 }}>
              Food trucks have their own sign-up path with scheduling and location tools.
            </div>
          </div>
          <Link
            to="/foodtruck/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 44,
              padding: "0 20px",
              borderRadius: 12,
              border: "1.5px solid #1F4E3D",
              background: "#ffffff",
              color: "#1F4E3D",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            🚚 Sign up as a Food Truck
          </Link>
        </section>

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
