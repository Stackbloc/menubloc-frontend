/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/RestaurantSignupEntry.jsx
 * File: RestaurantSignupEntry.jsx
 * Date: 2026-09-07
 * Purpose:
 *   Unified business signup invitation — choose Restaurant / Food truck /
 *   Franchise, then continue to one account form. Free-account messaging for
 *   restaurants; food truck keeps internal food_truck_annual plan stamp;
 *   franchise creates operator + Menuply review (no restaurant row).
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import {
  FREE_PLAN_CODE,
  FOOD_TRUCK_ANNUAL_PLAN_CODE,
} from "../lib/menuplyCheckoutPlans.js";

const ACCOUNT_ROUTE = "/restaurant/signup/account";

/** @typedef {"restaurant" | "food_truck" | "franchise"} BusinessKind */

function normalizeBusinessKind(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (value === "foodtruck" || value === "food_truck") return "food_truck";
  if (value === "restaurant" || value === "single") return "restaurant";
  if (value === "franchise" || value === "multi" || value === "multi_location") {
    return "franchise";
  }
  return null;
}

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
  changeTypeLink: {
    display: "inline",
    color: "#1F4E3D",
    fontSize: 13,
    fontWeight: 800,
    textDecoration: "underline",
    whiteSpace: "nowrap",
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

function collectClaimIdentity(claim = {}) {
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
  return claimIdentity;
}

export default function RestaurantSignupEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const fromOperatorClaim = Boolean(
    location.state?.from === "operator_claim" || location.state?.create_listing
  );

  const kindFromUrl = useMemo(
    () => normalizeBusinessKind(searchParams.get("kind")),
    [searchParams]
  );
  const kindFromState = useMemo(
    () => normalizeBusinessKind(location.state?.business_kind),
    [location.state?.business_kind]
  );

  // Restaurant invitation only after choosing restaurant (or ?kind=restaurant).
  // Food truck / franchise deep links skip invitation and open the account form.
  const [businessKind, setBusinessKind] = useState(
    /** @type {BusinessKind | null} */ (
      kindFromUrl === "restaurant" || kindFromState === "restaurant"
        ? "restaurant"
        : null
    )
  );

  function proceedToAccount(kind) {
    /** @type {BusinessKind} */
    const resolved = kind;
    const claimIdentity = collectClaimIdentity(location.state || {});
    const selectedPlan =
      resolved === "food_truck"
        ? FOOD_TRUCK_ANNUAL_PLAN_CODE
        : resolved === "franchise"
          ? "franchise_review"
          : FREE_PLAN_CODE;

    navigate(ACCOUNT_ROUTE, {
      state: {
        business_kind: resolved,
        selected_plan: selectedPlan,
        ...claimIdentity,
        ...(fromOperatorClaim
          ? { from: "operator_claim", create_listing: true }
          : {}),
      },
    });
  }

  useEffect(() => {
    if (kindFromUrl === "food_truck" || kindFromUrl === "franchise") {
      proceedToAccount(kindFromUrl);
    }
    // Deep-link auto-continue once on mount / kind change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot navigate
  }, [kindFromUrl]);

  function handleChooseKind(kind) {
    if (kind === "restaurant") {
      setBusinessKind("restaurant");
      return;
    }
    // Food truck + franchise go straight to the shared account form.
    proceedToAccount(kind);
  }

  function handleSignUp() {
    proceedToAccount(businessKind || "restaurant");
  }

  function handleChangeType() {
    setBusinessKind(null);
    if (kindFromUrl) {
      navigate("/restaurant/signup", {
        replace: true,
        state: fromOperatorClaim
          ? { from: "operator_claim", create_listing: true }
          : undefined,
      });
    }
  }

  if (kindFromUrl === "food_truck" || kindFromUrl === "franchise") {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
          <p style={{ ...styles.cadenceSubtitle, marginTop: 24 }}>
            {t("signup.entry.unified.continuing", "Continuing to account setup…")}
          </p>
        </div>
      </div>
    );
  }

  if (businessKind == null) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <header style={{ ...styles.hero, marginBottom: 36 }}>
            <div style={styles.heroContent}>
              <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 8 }} />
              <div style={styles.eyebrow}>
                {fromOperatorClaim
                  ? t("signup.entry.createListing.eyebrow", "Create a new listing")
                  : t("signup.entry.unified.eyebrow", "Business Signup")}
              </div>
            </div>
          </header>

          <div style={styles.cadenceShell}>
            <h1 style={styles.cadenceTitle}>
              {fromOperatorClaim
                ? t(
                    "signup.entry.createListing.title",
                    "Is this one restaurant, or more than one?"
                  )
                : t(
                    "signup.entry.unified.title",
                    "What kind of business are you signing up?"
                  )}
            </h1>
            <p style={styles.cadenceSubtitle}>
              {fromOperatorClaim
                ? t(
                    "signup.entry.createListing.subtitle",
                    "Choose how you operate, then enter your restaurant details on the next screens."
                  )
                : t(
                    "signup.entry.unified.subtitle",
                    "Restaurant, food truck, and franchise all start here. Franchise requests are reviewed by Menuply after you create an account."
                  )}
            </p>

            <div style={styles.cadenceOptions} data-testid="unified-signup-kind-chooser">
              <button
                type="button"
                style={styles.pathOption}
                onClick={() => handleChooseKind("restaurant")}
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
                onClick={() => handleChooseKind("food_truck")}
              >
                <span style={styles.pathOptionTitle}>
                  {t("signup.entry.createListing.foodTruckTitle", "Food truck")}
                </span>
                <span style={styles.pathOptionBody}>
                  {t(
                    "signup.entry.unified.foodTruckBody",
                    "Mobile operators — create your account on the next screen."
                  )}
                </span>
              </button>

              <button
                type="button"
                style={styles.pathOption}
                onClick={() => handleChooseKind("franchise")}
              >
                <span style={styles.pathOptionTitle}>
                  {t(
                    "signup.entry.createListing.multiTitle",
                    "Franchise / multiple locations"
                  )}
                </span>
                <span style={styles.pathOptionBody}>
                  {t(
                    "signup.entry.unified.franchiseBody",
                    "Create your operator account, then Menuply reviews your franchise request."
                  )}
                </span>
              </button>
            </div>

            {fromOperatorClaim ? (
              <div style={styles.cadenceActions}>
                <button
                  type="button"
                  style={styles.cadenceBack}
                  onClick={() => navigate("/operator/claim")}
                >
                  {t("signup.entry.createListing.back", "Back to claim search")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Restaurant invitation (food truck / franchise skip this and go to account).
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div style={styles.heroContent}>
            <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 8 }} />
            <div style={styles.eyebrow}>{t("signup.entry.eyebrow", "Restaurant Signup")}</div>
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
              {fromOperatorClaim
                ? t(
                    "signup.entry.createListing.banner",
                    "Creating a new listing for your operator account. Join Menuply, then enter restaurant details on the next screen."
                  )
                : t(
                    "signup.entry.unified.restaurantBanner",
                    "Signing up as a single restaurant. Food truck and franchise use the same signup path — change type if needed."
                  )}{" "}
              <button type="button" onClick={handleChangeType} style={styles.changeTypeLink}>
                {t("signup.entry.createListing.changeType", "Change listing type")}
              </button>
            </div>
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
