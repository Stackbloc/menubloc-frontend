/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/RestaurantSignupEntry.jsx
 * File: RestaurantSignupEntry.jsx
 * Date: 2026-09-07
 * Purpose:
 *   Restaurant signup invitation — product opportunity + free account
 *   messaging + Sign Up. Internal plan code remains FREE_PLAN_CODE
 *   (published_free); never show "Standard" as customer-facing copy.
 *   Free account + no subscription fee only — marketplace commission applies
 *   later when the restaurant enables a merchant account / online ordering,
 *   so do not list commission rates on this invitation surface.
 * ============================================================
 */

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { FREE_PLAN_CODE } from "../lib/menuplyCheckoutPlans.js";

const ACCOUNT_ROUTE = "/restaurant/signup/account";
const FRANCHISE_ROUTE = "/franchises";
const FOOD_TRUCK_SIGNUP_ROUTE = "/foodtruck/signup";

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page)",
    padding: "28px 18px 72px",
    color: "var(--gb-color-ink)",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  },
  shell: {
    maxWidth: 720,
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
  inviteCard: {
    borderRadius: 28,
    border: "1px solid #eaecf0",
    background: "#ffffff",
    boxShadow: "0 18px 48px rgba(15, 23, 32, 0.08)",
    padding: "36px 32px 32px",
  },
  headline: {
    fontSize: "clamp(1.75rem, 4vw, 2.45rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
    color: "#0B0F0C",
    margin: "0 0 16px",
  },
  economics: {
    fontSize: "clamp(1.15rem, 2.5vw, 1.35rem)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.35,
    color: "#1F4E3D",
    margin: "0 0 20px",
  },
  body: {
    fontSize: 17,
    lineHeight: 1.65,
    color: "#374151",
    margin: "0 0 18px",
  },
  differentiator: {
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.45,
    color: "#0B0F0C",
    margin: "0 0 24px",
  },
  steps: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.55,
    color: "#1F4E3D",
    margin: "0 0 20px",
  },
  signUpButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 220,
    width: "100%",
    maxWidth: 360,
    padding: "16px 28px",
    borderRadius: 14,
    border: "none",
    background: "#1F4E3D",
    color: "#ffffff",
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: "0.01em",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 12px 28px rgba(31, 78, 61, 0.28)",
  },
  termsRow: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#667085",
  },
  termsLink: {
    color: "#1F4E3D",
    fontWeight: 700,
    textDecoration: "underline",
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

export default function RestaurantSignupEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const fromOperatorClaim = Boolean(
    location.state?.from === "operator_claim" || location.state?.create_listing
  );
  // Claim → new listing: choose single vs multi before invitation / details entry.
  const [listingScope, setListingScope] = useState(fromOperatorClaim ? null : "single");

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

  function handleSignUp() {
    // Internal entitlement: free/Standard plan code — never shown as "Standard" in UI.
    proceedWithPlanCode(FREE_PLAN_CODE);
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
                    "One independent restaurant location. Continue to join Menuply, then enter restaurant details."
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

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div style={styles.heroContent}>
            <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 8 }} />
            <div style={styles.eyebrow}>{t("signup.entry.eyebrow", "Restaurant Signup")}</div>
            {fromOperatorClaim ? (
              <div
                style={{
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
                }}
              >
                {t(
                  "signup.entry.createListing.banner",
                  "Creating a new listing for your operator account. Join Menuply, then enter restaurant details on the next screen."
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
                <span style={styles.foodTruckPrompt}>
                  {t("signup.entry.foodTruckOwner", "Food Truck Owner?")}
                </span>
                <Link to="/foodtruck/signup" style={styles.foodTruckLink}>
                  {t("signup.entry.foodTruckSignup", "Sign up")}
                </Link>
              </div>
            )}
          </div>
        </header>

        <section style={styles.inviteCard} aria-labelledby="restaurant-signup-invite-headline">
          <h1 id="restaurant-signup-invite-headline" style={styles.headline}>
            {t(
              "signup.entry.invite.headline",
              "Your Menu. More Ways to Be Discovered."
            )}
          </h1>
          <p style={styles.economics}>
            {t(
              "signup.entry.invite.economics",
              "Create and manage your free account. No subscription fee."
            )}
          </p>
          <p style={styles.body}>
            {t(
              "signup.entry.invite.body",
              "Menuply connects your restaurant menu to a social food experience where people discover what to eat, see what others are eating, make plans, discover events, and find restaurants."
            )}
          </p>
          <p style={styles.differentiator}>
            {t(
              "signup.entry.invite.differentiator",
              "Put your menu where the conversation about food is happening."
            )}
          </p>
          <p style={styles.steps}>
            {t(
              "signup.entry.invite.steps",
              "Claim your free profile. Upload and manage your menu. Join the community."
            )}
          </p>
          <button type="button" style={styles.signUpButton} onClick={handleSignUp}>
            {t("signup.entry.invite.cta", "Sign Up")}
          </button>
          <p style={styles.termsRow}>
            {t("signup.entry.invite.termsPrefix", "By continuing, you agree to the")}{" "}
            <Link to="/terms" target="_blank" rel="noreferrer" style={styles.termsLink}>
              {t("signup.entry.invite.termsLink", "Terms of Use")}
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
