/**
 * ============================================================
 * File:    SubscriptionSelect.jsx
 * Path:    menubloc-frontend/src/pages/SubscriptionSelect.jsx
 * Date:    2026-05-06
 * Purpose:
 *   Onboarding step 2 — choose a restaurant plan after account
 *   creation. Verified stays free, Pro Partner uses Stripe
 *   checkout, and Performance Partner continues with no upfront
 *   platform fee.
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
const BYPASS_MODE = import.meta.env.VITE_ALLOW_OWNER_TOKEN_BYPASS === "true";

const PLAN_LABELS = {
  verified: "Verified",
  pro_partner: "Pro Partner",
  performance_partner: "Performance Partner",
  pro_monthly: "Pro Partner",
  pro_annual: "Pro Partner",
};

const PRO_INTERVALS = {
  monthly: { planCode: "pro_monthly", priceLabel: "$39.99/month" },
  annual: { planCode: "pro_annual", priceLabel: "$299/year" },
};

const PLAN_CARDS = {
  verified: {
    title: "Verified",
    price: "$0",
    description: "A simple verified restaurant presence on Menuply.",
    features: [
      "Basic restaurant profile",
      "1 editable menu listing",
      "QR code for your menu",
      "Menu visibility on Menuply",
    ],
  },
  pro_partner: {
    title: "Pro Partner",
    description:
      "For restaurants that want advanced tools, ordering, sharing, and stronger customer engagement.",
    features: [
      "Unlimited menus for time of day, events, seasonal menus, happy hour, and specials",
      "Advanced restaurant profile with logo, featured meal, and restaurant bio",
      "Billboard placement and functionality",
      "Shareable menus and dishes",
      "Follow functionality",
      "Deals and promotions",
      "Online ordering",
      "Lower transaction-based pricing when eligible",
    ],
  },
  performance_partner: {
    title: "Performance Partner",
    price: "$0 upfront platform fee",
    description:
      "For restaurants that want full ordering and promotional capabilities with no upfront platform fee.",
    features: [
      "Tablet included",
      "Full online ordering capabilities",
      "Deals and promotions",
      "Follow functionality",
      "Shareable menus and dishes",
      "Billboard functionality",
      "Cancel anytime",
    ],
    footnote:
      "Cancel anytime. If you switch to Pro Partner, an early conversion or equipment recovery fee may apply.",
  },
};

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

  if (BYPASS_MODE) return normalized.restaurant_id ? normalized : null;
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
  },
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
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
  },
  planCard: (highlighted) => ({
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
    minHeight: 420,
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
  intervalToggle: {
    display: "inline-flex",
    padding: 6,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: 999,
    gap: 6,
    marginBottom: 16,
  },
  intervalButton: (active) => ({
    border: 0,
    borderRadius: 999,
    padding: "10px 14px",
    background: active ? "#ffffff" : "transparent",
    color: active ? "#101828" : "#ffffff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  }),
  priceValue: {
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.95,
    marginBottom: 16,
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
    background: disabled ? "#98a2b3" : primary ? "#1F4E3D" : "#ffffff",
    color: primary ? "#ffffff" : "#101828",
    fontSize: 15,
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    marginTop: "auto",
    boxShadow: primary ? "0 12px 24px rgba(31, 78, 61, 0.18)" : "none",
  }),
  footnote: {
    marginTop: "auto",
    marginBottom: 14,
    fontSize: 12,
    lineHeight: 1.55,
    color: "#475467",
  },
  legalNotice: {
    marginTop: 18,
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

    if (!checkoutSuccess && !checkoutCancelled) return null;

    try {
      return normalizeOnboardingState(
        JSON.parse(window.sessionStorage.getItem(ONBOARDING_STATE_KEY) || "null")
      );
    } catch {
      return null;
    }
  });

  const [proInterval, setProInterval] = useState("monthly");
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planError, setPlanError] = useState("");

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
      // optional
    }
  }, [location.state]);

  useEffect(() => {
    if (selected_plan === "pro_annual") {
      setProInterval("annual");
    }
  }, [selected_plan]);

  useEffect(() => {
    if (!checkoutSuccess) return;

    try {
      const saved = JSON.parse(window.sessionStorage.getItem(ONBOARDING_STATE_KEY) || "null");
      if (saved?.restaurant_id && (BYPASS_MODE || saved?.owner_token)) {
        window.sessionStorage.removeItem(ONBOARDING_STATE_KEY);
        nav("/restaurant/design-select", {
          state: {
            ...saved,
            plan: returnedPlanCode === "pro_annual" ? "pro_annual" : "pro_monthly",
          },
        });
      }
    } catch {
      // optional
    }
  }, [checkoutSuccess, returnedPlanCode, nav]);

  function continueToDesign(planCode, extra = {}) {
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
        ...extra,
      },
    });
  }

  function chooseVerified() {
    if (!hasOnboardingContext) {
      nav("/restaurant/signup");
      return;
    }
    continueToDesign("verified");
  }

  async function submitRestaurantPlan(planCode) {
    if (!hasOnboardingContext) {
      nav("/restaurant/signup");
      return;
    }

    setIsSubmittingPlan(true);
    setPlanError("");

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
      // optional
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

      if (json.no_checkout_plan === true) {
        continueToDesign(planCode, {
          billing_mode: "no_upfront_platform_fee",
        });
        return;
      }

      if (json.evaluation_mode) {
        continueToDesign(planCode, {
          billing_mode: "evaluation",
        });
        return;
      }

      if (json.already_active) {
        continueToDesign(planCode);
        return;
      }

      if (json.checkout_url) {
        window.location.href = json.checkout_url;
        return;
      }

      throw new Error("No checkout URL returned. Please try again.");
    } catch (err) {
      setIsSubmittingPlan(false);
      setPlanError(
        toConsumerErrorMessage(
          err,
          API
            ? "Unable to continue with this plan. Please try again."
            : "Restaurant plan checkout is not configured on this site yet."
        )
      );
    }
  }

  async function handleProPartner() {
    const selectedInterval = PRO_INTERVALS[proInterval] || PRO_INTERVALS.monthly;
    await submitRestaurantPlan(selectedInterval.planCode);
  }

  async function handlePerformancePartner() {
    await submitRestaurantPlan("performance_partner");
  }

  if (checkoutSuccess) {
    return (
      <div style={s.page}>
        <div style={{ ...s.shell, textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>&#10003;</div>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Plan confirmed</div>
          <div style={{ fontSize: 15, color: "#667085" }}>Continuing to design step...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <Link to="/restaurant/signup" style={s.topLink}>
          &larr; Back to restaurant signup
        </Link>

        <section style={s.hero}>
          <BrandLockup
            subtitle="for Restaurants"
            wrapperStyle={{ alignItems: "flex-start", marginBottom: 18 }}
            subtitleStyle={{ textAlign: "left", width: "100%", paddingLeft: 6 }}
            logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
          />

          <div style={s.heading}>Choose your restaurant plan</div>
          <div style={s.subheading}>
            Clear restaurant plans for getting listed, growing your brand, and enabling ordering on Menuply.
          </div>
        </section>

        {checkoutCancelled ? (
          <div style={s.banner("warning")}>
            Checkout was cancelled. You can choose a different plan or try again.
          </div>
        ) : null}

        {selected_plan ? (
          <div style={s.banner("success")}>
            Selected during signup: {PLAN_LABELS[selected_plan] || "Pro Partner"}.
          </div>
        ) : null}

        {planError ? (
          <div style={s.banner("error")}>{planError}</div>
        ) : null}

        <section style={s.cardsGrid}>
          <article style={s.planCard(false)}>
            <div style={s.planEyebrow}>Verified</div>
            <div style={s.planName}>Verified</div>
            <div style={s.planDesc}>
              {PLAN_CARDS.verified.description}
            </div>
            <div style={s.priceValue}>{PLAN_CARDS.verified.price}</div>

            <ul style={s.featureList}>
              {PLAN_CARDS.verified.features.map((feature) => (
                <li key={feature} style={s.featureItem}>
                  <span style={s.featureMark(false)}>&#10003;</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button type="button" style={s.button(false, false)} onClick={chooseVerified}>
              {selected_plan === "verified" ? "Continue with Verified" : "Choose Verified"}
            </button>
          </article>

          <article style={s.planCard(true)}>
            <div style={s.planBadge}>Most Popular</div>
            <div style={s.planEyebrow}>Pro Partner</div>
            <div style={s.planName}>Pro Partner</div>
            <div style={s.planDesc}>
              {PLAN_CARDS.pro_partner.description}
            </div>
            <div style={s.intervalToggle}>
              <button
                type="button"
                style={s.intervalButton(proInterval === "monthly")}
                onClick={() => setProInterval("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                style={s.intervalButton(proInterval === "annual")}
                onClick={() => setProInterval("annual")}
              >
                Annual
              </button>
            </div>
            <div style={s.priceValue}>{PRO_INTERVALS[proInterval].priceLabel}</div>

            <ul style={s.featureList}>
              {PLAN_CARDS.pro_partner.features.map((feature) => (
                <li key={feature} style={s.featureItem}>
                  <span style={s.featureMark(true)}>&#10003;</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={isSubmittingPlan}
              style={s.button(true, isSubmittingPlan)}
              onClick={handleProPartner}
            >
              {isSubmittingPlan ? "Preparing checkout..." : "Choose Pro Partner"}
            </button>
          </article>

          <article style={s.planCard(false)}>
            <div style={s.planEyebrow}>Performance Partner</div>
            <div style={s.planName}>Performance Partner</div>
            <div style={s.planDesc}>
              {PLAN_CARDS.performance_partner.description}
            </div>
            <div style={s.priceValue}>{PLAN_CARDS.performance_partner.price}</div>

            <ul style={s.featureList}>
              {PLAN_CARDS.performance_partner.features.map((feature) => (
                <li key={feature} style={s.featureItem}>
                  <span style={s.featureMark(false)}>&#10003;</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div style={s.footnote}>
              {PLAN_CARDS.performance_partner.footnote}
            </div>

            <button
              type="button"
              disabled={isSubmittingPlan}
              style={s.button(false, isSubmittingPlan)}
              onClick={handlePerformancePartner}
            >
              Choose Performance Partner
            </button>
          </article>
        </section>

        <div style={s.legalNotice}>
          By continuing with a paid or performance-based plan, you agree to the{" "}
          <Link to="/restaurant/subscription-terms" target="_blank" rel="noreferrer" style={s.legalLink}>
            Restaurant Plan Terms
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
