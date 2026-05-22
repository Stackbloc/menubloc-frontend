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
import {
  fetchRestaurantOnboardingProgress,
  navigateWithRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "")
).replace(/\/$/, "");

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

const OPTIONAL_ONBOARDING_MODULES = [
  {
    title: "QR starter kit",
    body:
      "QR codes are direct ordering infrastructure and customer access infrastructure. Free downloadable QR materials are prepared during onboarding, and printed kits stay optional.",
  },
  {
    title: "Equipment readiness",
    body:
      "Review tablet placement, power, alerts, printer or pickup workflow, and internet reliability. This is about operational readiness, not forced hardware.",
  },
  {
    title: "Launch deal",
    body:
      "Deals are simple launch offers that can help first-time customers try your restaurant. You can skip this now and decide later. Would you like to create a launch deal?",
  },
];

const PLAN_CARDS = {
  verified: {
    title: "Verified",
    price: "$0",
    description: "A simple verified restaurant presence with public menu access on Menuply.",
    features: [
      "Basic restaurant profile",
      "1 editable menu listing",
      "QR menu access for customers",
      "Menu visibility on Menuply",
    ],
  },
  pro_partner: {
    title: "Pro Partner",
    description:
      "For restaurants that want stronger customer pricing, direct ordering tools, and deeper customer engagement on a lower-cost platform.",
    features: [
      "Unlimited menus for time of day, events, seasonal menus, happy hour, and specials",
      "Advanced restaurant profile with logo, featured meal, and restaurant bio",
      "Billboard placement and functionality",
      "Shareable menus and dishes",
      "Follow functionality",
      "Deals and promotions",
      "Online ordering",
      "Built for lower-cost direct ordering operations",
      "Annual option with a lower effective monthly cost",
    ],
  },
  performance_partner: {
    title: "Performance Partner",
    price: "$0 upfront platform fee",
    description:
      "For restaurants that want full ordering, promotional capabilities, and launch support with no upfront platform fee.",
    features: [
      "Tablet included",
      "Full online ordering capabilities",
      "Deals and promotions",
      "Follow functionality",
      "Shareable menus and dishes",
      "Billboard functionality",
      "Reduced introductory marketplace commission rate for first 24 months",
      "Cancel anytime",
    ],
    footnote:
      "Early partner introductory rate applies for the first 24 months. After 24 months, commission reverts to the standard marketplace partner rate. Cancel anytime. If you switch to Pro Partner, an early conversion or equipment recovery fee may apply.",
  },
};

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
  noteCard: {
    marginTop: 18,
    borderRadius: 18,
    border: "1px solid #d9e0ea",
    background: "#f8faf9",
    padding: "16px 18px",
    color: "#475467",
    fontSize: 14,
    lineHeight: 1.65,
    maxWidth: 760,
  },
  noteKicker: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#1F4E3D",
    marginBottom: 8,
  },
  noteSectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#101828",
    marginBottom: 6,
  },
  noteParagraph: {
    marginBottom: 12,
  },
  noteCallout: {
    borderRadius: 14,
    border: "1px solid #cfe0d8",
    background: "#eef6f1",
    padding: "12px 14px",
    color: "#1F4E3D",
    marginBottom: 12,
  },
  annualNote: {
    marginTop: -4,
    marginBottom: 16,
    fontSize: 12,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.88)",
  },
  optionalSection: {
    marginTop: 26,
    padding: "22px",
    borderRadius: 24,
    border: "1px solid #d9e0ea",
    background: "#ffffff",
    boxShadow: "0 12px 30px rgba(15, 23, 32, 0.04)",
  },
  optionalHeading: {
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    marginBottom: 8,
  },
  optionalSubheading: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#667085",
    marginBottom: 16,
    maxWidth: 760,
  },
  optionalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  optionalCard: {
    borderRadius: 18,
    border: "1px solid #eaecf0",
    background: "#f8faf9",
    padding: "16px 16px 15px",
  },
  optionalKicker: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#1F4E3D",
    marginBottom: 8,
  },
  optionalTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#101828",
    marginBottom: 6,
  },
  optionalBody: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#475467",
  },
};

export default function SubscriptionSelect() {
  const nav = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const checkoutSuccess = searchParams.get("checkout_success") === "1";
  const returnedPlanCode = searchParams.get("plan_code") || "";
  const checkoutCancelled = searchParams.get("checkout_cancelled") === "1";
  const recovered = resolveRestaurantOnboardingState({
    routeState: location.state,
    search: location.search,
  });
  const [onboardingState, setOnboardingState] = useState(recovered.state || null);

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
    intake_path,
    requested_location_count,
  } = onboardingState || {};

  const hasOnboardingContext = Boolean(restaurant_id && owner_token);

  useEffect(() => {
    const next = resolveRestaurantOnboardingState({
      routeState: location.state,
      search: location.search,
    });
    setOnboardingState(next.state || null);
  }, [location.state, location.search]);

  useEffect(() => {
    if (selected_plan === "pro_annual") {
      setProInterval("annual");
    }
  }, [selected_plan]);

  useEffect(() => {
    let cancelled = false;
    if (!hasOnboardingContext) return undefined;

    fetchRestaurantOnboardingProgress(onboardingState)
      .then((stateValue) => {
        if (!cancelled && stateValue) setOnboardingState(stateValue);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [hasOnboardingContext, restaurant_id, owner_token]);

  useEffect(() => {
    let cancelled = false;
    if (!checkoutSuccess || !hasOnboardingContext || !onboardingState) return undefined;

    (async () => {
      const planCode = returnedPlanCode === "pro_annual" ? "pro_annual" : "pro_monthly";
      const nextState = await syncRestaurantOnboardingProgress(onboardingState, {
        current_step_key: "basic_public_profile",
        completed_step_keys: ["choose_plan", "subscription_checkout"],
        intake_path: intake_path || "independent_single_location",
        requested_location_count: requested_location_count || 1,
        selected_plan_code: planCode,
        manual_review_required: false,
        draft_payload: {
          temporary_selections: { selected_plan_code: planCode },
        },
      });
      if (cancelled) return;
      setOnboardingState(nextState);
      navigateWithRestaurantOnboardingState(nav, "/restaurant/qr-upsell", {
        ...nextState,
        plan: planCode,
      });
    })().catch((err) => {
      if (!cancelled) {
        setPlanError(err.message || "Unable to restore onboarding after checkout.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    checkoutSuccess,
    returnedPlanCode,
    hasOnboardingContext,
    onboardingState,
    intake_path,
    requested_location_count,
    nav,
  ]);

  async function continueToDesign(planCode, extra = {}, sourceState = onboardingState) {
    const nextState = {
      restaurant_id: sourceState?.restaurant_id ?? restaurant_id,
      restaurant_name: sourceState?.restaurant_name ?? restaurant_name,
      email: sourceState?.email ?? email,
      owner_token: sourceState?.owner_token ?? owner_token,
      city: sourceState?.city ?? city,
      state: sourceState?.state ?? state,
      phone: sourceState?.phone ?? phone,
      menu_choice: sourceState?.menu_choice ?? menu_choice,
      plan: planCode,
      selected_plan: planCode,
      selected_plan_code: planCode,
      intake_path: sourceState?.intake_path ?? intake_path,
      requested_location_count: sourceState?.requested_location_count ?? requested_location_count,
      ingestion_method: sourceState?.ingestion_method ?? ingestion_method,
      ...extra,
    };

    let qr_token = null;
    try {
      const r = await fetch(`${API}/owner/qr/primary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: sourceState?.restaurant_id ?? restaurant_id,
          email: sourceState?.email ?? email,
          owner_token: sourceState?.owner_token ?? owner_token,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok && j.token) qr_token = j.token;
    } catch {
      // QR failure is non-blocking — onboarding continues regardless
    }

    navigateWithRestaurantOnboardingState(nav, "/restaurant/qr-upsell", {
      ...nextState,
      qr_token,
    });
  }

  function chooseVerified() {
    if (!hasOnboardingContext) {
      nav("/restaurant/signup");
      return;
    }
    syncRestaurantOnboardingProgress(onboardingState, {
      current_step_key: "basic_public_profile",
      completed_step_keys: ["choose_plan", "subscription_checkout"],
      intake_path: intake_path || "independent_single_location",
      requested_location_count: requested_location_count || 1,
      selected_plan_code: "verified",
      manual_review_required: false,
      draft_payload: {
        temporary_selections: { selected_plan_code: "verified" },
      },
    })
      .then((stateValue) => {
        setOnboardingState(stateValue);
        continueToDesign("verified", {}, stateValue);
      })
      .catch((err) => {
        setPlanError(err.message || "Unable to continue.");
      });
  }

  async function submitRestaurantPlan(planCode) {
    if (!hasOnboardingContext) {
      nav("/restaurant/signup");
      return;
    }

    setIsSubmittingPlan(true);
    setPlanError("");

    try {
      const syncedState = await syncRestaurantOnboardingProgress(onboardingState, {
        current_step_key: "subscription_checkout",
        completed_step_keys: ["choose_plan"],
        intake_path: intake_path || "independent_single_location",
        requested_location_count: requested_location_count || 1,
        selected_plan_code: planCode,
        manual_review_required: false,
        draft_payload: {
          temporary_selections: { selected_plan_code: planCode },
        },
      });
      setOnboardingState(syncedState);

      const origin = window.location.origin;
      const successParams = new URLSearchParams({
        checkout_success: "1",
        plan_code: planCode,
      });
      const cancelParams = new URLSearchParams({ checkout_cancelled: "1" });
      const successUrl = `${origin}/restaurant/subscription?${successParams.toString()}`;
      const cancelUrl = `${origin}/restaurant/subscription?${cancelParams.toString()}`;

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
        const nextState = await syncRestaurantOnboardingProgress(syncedState, {
          current_step_key: "basic_public_profile",
          completed_step_keys: ["choose_plan", "subscription_checkout"],
          intake_path: intake_path || "independent_single_location",
          requested_location_count: requested_location_count || 1,
          selected_plan_code: planCode,
          manual_review_required: false,
          draft_payload: {
            temporary_selections: { selected_plan_code: planCode },
          },
        });
        setOnboardingState(nextState);
        continueToDesign(planCode, {
          billing_mode: "no_upfront_platform_fee",
        }, nextState);
        return;
      }

      if (json.evaluation_mode) {
        continueToDesign(planCode, {
          billing_mode: "evaluation",
        }, syncedState);
        return;
      }

      if (json.already_active) {
        const nextState = await syncRestaurantOnboardingProgress(syncedState, {
          current_step_key: "basic_public_profile",
          completed_step_keys: ["choose_plan", "subscription_checkout"],
          intake_path: intake_path || "independent_single_location",
          requested_location_count: requested_location_count || 1,
          selected_plan_code: planCode,
          manual_review_required: false,
          draft_payload: {
            temporary_selections: { selected_plan_code: planCode },
          },
        });
        setOnboardingState(nextState);
        continueToDesign(planCode, {}, nextState);
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

          <div style={s.heading}>Built for Better Value</div>
          <div style={s.subheading}>
            Choose the plan that fits how you want to launch on a lean platform designed to create better outcomes for restaurants and diners.
          </div>
          <div style={s.noteCard}>
            <div style={s.noteKicker}>Menuply Partner Expectation</div>
            <div style={s.noteSectionTitle}>Why Menuply Exists</div>
            <div style={s.noteParagraph}>
              Many restaurants on higher-cost third-party platforms have had to raise menu prices simply to absorb platform fees. Menuply was built to help break that cycle with a fully self-service operating model and significantly lower platform costs.
            </div>
            <div style={s.noteSectionTitle}>Our Partner Expectation</div>
            <div style={s.noteParagraph}>
              Restaurants always control their own pricing. Menuply is designed for partners who choose to turn lower platform costs into better everyday pricing, meaningful deals, richer menu information, and more direct engagement for diners.
            </div>
            <div style={s.noteCallout}>
              <strong>Multipliers</strong> are restaurants aligned with that approach. They are central to the Menuply ecosystem, and restaurants that more closely reflect those principles may receive increased visibility opportunities within the platform.
            </div>
            <div>
              Paid plan checkout keeps Menuply's existing Stripe-powered restaurant banking flow in place. Restaurant deposits stay tied to that restaurant banking setup when enabled.
            </div>
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
            <div style={s.annualNote}>
              {proInterval === "annual"
                ? "Annual lowers your effective monthly cost. Founder annual pricing includes a 2-year introductory rate commitment."
                : "Monthly keeps launch costs flexible. You can move to annual later if it better fits your rollout."}
            </div>

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

        <section style={s.optionalSection}>
          <div style={s.optionalHeading}>Optional onboarding modules</div>
          <div style={s.optionalSubheading}>
            These are guidance cards only. They do not add required steps, new schema, or new backend behavior.
          </div>
          <div style={s.optionalGrid}>
            {OPTIONAL_ONBOARDING_MODULES.map((module) => (
              <article key={module.title} style={s.optionalCard}>
                <div style={s.optionalKicker}>Optional</div>
                <div style={s.optionalTitle}>{module.title}</div>
                <div style={s.optionalBody}>{module.body}</div>
              </article>
            ))}
          </div>
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
