/**
 * ============================================================
 * File:    SubscriptionSelect.jsx
 * Path:    menubloc-frontend/src/pages/SubscriptionSelect.jsx
 * Date:    2026-05-06
 * Purpose:
 *   Onboarding step 2 — choose a restaurant plan after account
 *   creation. Starter stays free, Pro uses Stripe
 *   checkout, and the Founders plan uses annual Stripe checkout.
 * ============================================================
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { toConsumerErrorMessage } from "../lib/api.js";
import { LEGAL_VERSIONS } from "../content/legal.js";
import {
  fetchRestaurantOnboardingProgress,
  navigateWithRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";
import {
  CHECKOUT_PRICE_LABELS,
  FREE_PLAN_CODE,
  buildOwnerStripeCheckoutBody,
  clearIntendedCheckoutPlanCode,
  fetchCheckoutPlanOptionsForDisplay,
  getMarketplaceCommissionDisclosure,
  indexPlansByCode,
  isFreePlanCode,
  isSelectablePaidPlanCode,
  readIntendedCheckoutPlanCode,
  resolveReturnedCheckoutPlanCode,
} from "../lib/menuplyCheckoutPlans.js";

/** Per Frontend API Base URL guardrail — never fall back to same-origin "" in production. */
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

/** After Menuply plan payment (or free skip): Information. QR merchandise reserved until Stripe catalog. */
const POST_PLAN_PAYMENT_ROUTE = "/restaurant/onboarding/information";

const PLAN_LABELS = {
  [FREE_PLAN_CODE]: "Starter",
  verified: "Starter",
  published_free: "Starter",
  founders_monthly: "Founder's",
  founders_annual: "Founder's",
  starter_monthly: "Pro",
  starter_annual: "Pro",
  // Legacy display labels for in-progress historical onboarding only.
  pro_partner: "Pro Partner",
  pro_monthly: "Pro Partner",
  pro_annual: "Pro Partner",
};

const FOUNDERS_PLAN = {
  planCode: "founders_annual",
  priceLabel: CHECKOUT_PRICE_LABELS.founders_annual,
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
  [FREE_PLAN_CODE]: {
    title: "Starter",
    price: CHECKOUT_PRICE_LABELS[FREE_PLAN_CODE],
    description: "A simple published restaurant presence with public menu access on Menuply.",
    commissionPlanCode: FREE_PLAN_CODE,
    features: [
      "100% Free Profile with Fully Searchable, Verified Menu",
      "Basic restaurant profile",
      "1 editable menu listing",
      "QR menu access for customers",
      "Menu visibility on Menuply",
    ],
  },
  starter_annual: {
    title: "Pro",
    price: `${CHECKOUT_PRICE_LABELS.starter_monthly} or ${CHECKOUT_PRICE_LABELS.starter_annual}`,
    description:
      "Professional Menuply tools for growing restaurants — profiles, menus, QR Code, and online ordering.",
    commissionPlanCode: "starter_annual",
    features: [
      "All Starter benefits, plus logo and product photos",
      "Unlimited menus and menu items",
      "QR Code and social sharing",
      "Online ordering",
      "Customers can follow your restaurant",
    ],
  },
  founders_annual: {
    title: "Founder's",
    price: `${CHECKOUT_PRICE_LABELS.founders_monthly} or ${CHECKOUT_PRICE_LABELS.founders_annual}`,
    description:
      "Founders are early adopters who want to take back their restaurant's independence. Lock in early-bird Founder's pricing while availability remains open.",
    commissionPlanCode: "founders_annual",
    features: [
      "All Pro benefits, plus much more",
      "Premium menu management tools",
      "Create deals and promotions free of charge",
    ],
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
  foundersNotice: {
    marginBottom: 18,
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid #fcd34d",
    background: "#fffbeb",
    color: "#92400e",
    fontSize: 14,
    lineHeight: 1.55,
    fontWeight: 600,
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
  planCardStarter: {
    borderRadius: 28,
    padding: "24px 22px 22px",
    border: "2px solid #86b89a",
    background: "linear-gradient(160deg, #eef6f1 0%, #f7fbf9 55%, #ffffff 100%)",
    color: "#101828",
    boxShadow: "0 12px 30px rgba(31, 78, 61, 0.08)",
    display: "flex",
    flexDirection: "column",
    minHeight: 420,
  },
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
    marginBottom: 12,
    marginTop: 4,
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
  commissionDisclosure: {
    margin: "0 0 14px",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#eef6f1",
    border: "1px solid #cfe0d8",
    color: "#1F4E3D",
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.4,
  },
  commissionDisclosureFounders: {
    margin: "0 0 14px",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.4,
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
    marginTop: 10,
    marginBottom: 18,
    fontSize: 12,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.78)",
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
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

  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planError, setPlanError] = useState("");
  const [plansByCode, setPlansByCode] = useState(() => indexPlansByCode());
  const [autoCheckoutStarted, setAutoCheckoutStarted] = useState(false);
  const autoCheckoutRef = useRef(false);
  const [starterInterval, setStarterInterval] = useState(
    recovered.state?.selected_plan === "starter_monthly" ? "monthly" : "annual"
  );
  const [foundersInterval, setFoundersInterval] = useState(
    recovered.state?.selected_plan === "founders_monthly" ? "monthly" : "annual"
  );
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
  const starterCheckoutCode =
    starterInterval === "monthly" ? "starter_monthly" : "starter_annual";
  const foundersCheckoutCode =
    foundersInterval === "monthly" ? "founders_monthly" : "founders_annual";

  useEffect(() => {
    const next = resolveRestaurantOnboardingState({
      routeState: location.state,
      search: location.search,
    });
    setOnboardingState(next.state || null);
  }, [location.state, location.search]);

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
      const planCode = resolveReturnedCheckoutPlanCode(returnedPlanCode, FOUNDERS_PLAN.planCode);
      clearIntendedCheckoutPlanCode();
      // Success URL alone must not imply the paid subscription is already active.
      // Sync selected plan for onboarding continuity; paid status remains backend-authoritative.
      // QR merchandise reserved — skip qr-upsell purchase until Stripe catalog exists.
      const nextState = await syncRestaurantOnboardingProgress(onboardingState, {
        current_step_key: "restaurant_information",
        completed_step_keys: ["choose_plan", "subscription_checkout", "payment"],
        intake_path: intake_path || "independent_single_location",
        requested_location_count: requested_location_count || 1,
        selected_plan_code: planCode,
        manual_review_required: false,
        draft_payload: {
          temporary_selections: {
            selected_plan_code: planCode,
            checkout_processing: true,
          },
        },
      });
      if (cancelled) return;
      setOnboardingState(nextState);
      navigateWithRestaurantOnboardingState(nav, POST_PLAN_PAYMENT_ROUTE, {
        ...nextState,
        plan: planCode,
        selected_plan: planCode,
        subscription_status: "processing",
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

    clearIntendedCheckoutPlanCode();
    navigateWithRestaurantOnboardingState(nav, POST_PLAN_PAYMENT_ROUTE, {
      ...nextState,
      qr_token,
    });
  }

  function choosePublished() {
    if (!hasOnboardingContext) {
      nav("/restaurant/signup/account");
      return;
    }
    syncRestaurantOnboardingProgress(onboardingState, {
      current_step_key: "restaurant_information",
      completed_step_keys: ["choose_plan", "subscription_checkout", "payment"],
      intake_path: intake_path || "independent_single_location",
      requested_location_count: requested_location_count || 1,
      selected_plan_code: FREE_PLAN_CODE,
      manual_review_required: false,
      draft_payload: {
        temporary_selections: { selected_plan_code: FREE_PLAN_CODE },
      },
    })
      .then((stateValue) => {
        setOnboardingState(stateValue);
        continueToDesign(FREE_PLAN_CODE, {}, stateValue);
      })
      .catch((err) => {
        setPlanError(err.message || "Unable to continue.");
      });
  }

  function rememberPlanAndRedirectToAccount(planCode) {
    const code = String(planCode || "").trim().toLowerCase();
    if (code) {
      try {
        sessionStorage.setItem("menuply.intended_checkout_plan_code", code);
      } catch {
        /* ignore */
      }
    }
    nav(`/restaurant/signup/account${code ? `?plan=${encodeURIComponent(code)}` : ""}`);
  }

  async function submitRestaurantPlan(planCode) {
    if (!hasOnboardingContext) {
      const intended = planCode || readIntendedCheckoutPlanCode() || selected_plan;
      if (intended) {
        rememberPlanAndRedirectToAccount(intended);
        return;
      }
      nav("/restaurant/signup/account");
      return;
    }

    if (isFreePlanCode(planCode)) {
      choosePublished();
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
      if (restaurant_id) {
        successParams.set("restaurant_id", String(restaurant_id));
        cancelParams.set("restaurant_id", String(restaurant_id));
      }
      const successUrl = `${origin}/restaurant/subscription?${successParams.toString()}`;
      const cancelUrl = `${origin}/restaurant/subscription?${cancelParams.toString()}`;

      const checkoutBody = buildOwnerStripeCheckoutBody({
        restaurantId: restaurant_id,
        ownerToken: owner_token,
        email,
        planCode,
        successUrl,
        cancelUrl,
        legalAcceptance: {
          document_key: "subscription_terms",
          document_version: LEGAL_VERSIONS.subscriptionTerms,
        },
      });

      const res = await fetch(`${API}/owner/subscription/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutBody),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }

      if (json.no_checkout_plan === true) {
        const nextState = await syncRestaurantOnboardingProgress(syncedState, {
          current_step_key: "restaurant_information",
          completed_step_keys: ["choose_plan", "subscription_checkout", "payment"],
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
          current_step_key: "restaurant_information",
          completed_step_keys: ["choose_plan", "subscription_checkout", "payment"],
          intake_path: intake_path || "independent_single_location",
          requested_location_count: requested_location_count || 1,
          selected_plan_code: planCode,
          manual_review_required: false,
          draft_payload: {
            temporary_selections: { selected_plan_code: planCode },
          },
        });
        setOnboardingState(nextState);
        continueToDesign(planCode, { subscription_status: "active" }, nextState);
        return;
      }

      if (json.checkout_url) {
        window.location.href = json.checkout_url;
        return;
      }

      throw new Error("No checkout URL returned. Please try again.");
    } catch (err) {
      setIsSubmittingPlan(false);
      setAutoCheckoutStarted(false);
      autoCheckoutRef.current = false;
      setPlanError(
        toConsumerErrorMessage(
          err,
          err?.message && !String(err.message).includes("Failed to fetch")
            ? err.message
            : "Restaurant plan checkout is not configured on this site yet."
        )
      );
    }
  }

  useEffect(() => {
    if (checkoutSuccess || checkoutCancelled) return undefined;
    if (autoCheckoutRef.current || isSubmittingPlan) return undefined;

    const fromState = String(selected_plan || "").trim().toLowerCase();
    const fromIntended = String(readIntendedCheckoutPlanCode() || "").trim().toLowerCase();
    const fromQuery = String(searchParams.get("plan") || searchParams.get("selected_plan") || "")
      .trim()
      .toLowerCase();
    const presetPlan = [fromState, fromIntended, fromQuery].find(
      (code) => code && isSelectablePaidPlanCode(code)
    );

    if (!presetPlan) return undefined;

    if (!hasOnboardingContext) {
      rememberPlanAndRedirectToAccount(presetPlan);
      return undefined;
    }

    autoCheckoutRef.current = true;
    setAutoCheckoutStarted(true);
    submitRestaurantPlan(presetPlan);
    return undefined;
    // Intentionally once when preset paid plan + context are ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    checkoutSuccess,
    checkoutCancelled,
    hasOnboardingContext,
    selected_plan,
    restaurant_id,
    owner_token,
  ]);

  async function handleStarter() {
    await submitRestaurantPlan(starterCheckoutCode);
  }

  async function handleFounder() {
    await submitRestaurantPlan(foundersCheckoutCode);
  }

  if (checkoutSuccess) {
    return (
      <div style={s.page}>
        <div style={{ ...s.shell, textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>&#10003;</div>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
            Payment received
          </div>
          <div style={{ fontSize: 15, color: "#667085" }}>
            Activating your Menuply plan. Continuing setup in a moment…
          </div>
        </div>
      </div>
    );
  }

  if (autoCheckoutStarted || isSubmittingPlan) {
    return (
      <div style={s.page}>
        <div style={{ ...s.shell, textAlign: "center", paddingTop: 80 }}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 18 }} />
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
            Taking you to checkout…
          </div>
          <div style={{ fontSize: 15, color: "#667085" }}>
            Confirm your Menuply plan, then we&apos;ll bring you back to finish setting up your
            restaurant.
          </div>
          {planError ? (
            <div style={{ ...s.banner("error"), marginTop: 24, textAlign: "left" }}>{planError}</div>
          ) : null}
        </div>
      </div>
    );
  }

  const publishedCard = PLAN_CARDS[FREE_PLAN_CODE];
  const starterCard = PLAN_CARDS.starter_annual;
  const isPublishedSelected =
    selected_plan === FREE_PLAN_CODE || selected_plan === "verified" || selected_plan === "published";
  const isStarterSelected =
    selected_plan === "starter_monthly" || selected_plan === "starter_annual";
  const isFoundersSelected =
    selected_plan === "founders_monthly" || selected_plan === "founders_annual";

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <Link to="/restaurant/signup" style={s.topLink}>
          &larr; Back to restaurant signup
        </Link>

        <section style={s.hero}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 18 }} />

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
              Paid plan checkout keeps Menuply&apos;s existing Stripe-powered restaurant banking flow in place. Restaurant deposits stay tied to that restaurant banking setup when enabled.
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
            Selected during signup: {PLAN_LABELS[selected_plan] || "Founder's"}.
          </div>
        ) : null}

        {planError ? (
          <div style={s.banner("error")}>{planError}</div>
        ) : null}

        <div style={s.foundersNotice}>
          Founder&apos;s Membership is available for a limited time to early restaurant partners.
        </div>

        <section style={s.cardsGrid}>
          <article style={s.planCard(false)}>
            <div style={s.planEyebrow}>Starter</div>
            <div style={s.planName}>Starter</div>
            <div style={s.planDesc}>
              {publishedCard.description}
            </div>
            <div style={s.commissionDisclosure}>
              {getMarketplaceCommissionDisclosure(FREE_PLAN_CODE, { plansByCode })}
            </div>
            <div style={s.priceValue}>{publishedCard.price}</div>

            <ul style={s.featureList}>
              {publishedCard.features.map((feature) => (
                <li key={feature} style={s.featureItem}>
                  <span style={s.featureMark(false)}>&#10003;</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button type="button" style={s.button(false, false)} onClick={choosePublished}>
              {isPublishedSelected ? "Continue with Starter" : "Choose Starter"}
            </button>
          </article>

          <article style={s.planCardStarter}>
            <div style={s.planEyebrow}>Pro</div>
            <div style={s.planName}>Pro</div>
            <div style={s.planDesc}>{starterCard.description}</div>
            <div style={s.commissionDisclosure}>
              {getMarketplaceCommissionDisclosure(starterCheckoutCode, { plansByCode })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {[
                { key: "monthly", label: "Monthly", price: CHECKOUT_PRICE_LABELS.starter_monthly },
                { key: "annual", label: "Annual", price: CHECKOUT_PRICE_LABELS.starter_annual },
              ].map(({ key, label, price }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStarterInterval(key)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: starterInterval === key ? "1.5px solid #1F4E3D" : "1.5px solid #d0d5dd",
                    background: starterInterval === key ? "#ffffff" : "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    width: "100%",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#101828" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#1F4E3D" }}>{price}</span>
                </button>
              ))}
            </div>
            <div style={{ ...s.priceValue, color: "#1F4E3D" }}>
              {CHECKOUT_PRICE_LABELS[starterCheckoutCode]}
            </div>

            <ul style={s.featureList}>
              {starterCard.features.map((feature) => (
                <li key={feature} style={s.featureItem}>
                  <span style={s.featureMark(false)}>&#10003;</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={isSubmittingPlan}
              style={s.button(true, isSubmittingPlan)}
              onClick={handleStarter}
            >
              {isSubmittingPlan
                ? "Preparing checkout..."
                : isStarterSelected
                  ? "Continue with Pro"
                  : "Choose Pro"}
            </button>
          </article>

          <article style={s.planCard(true)}>
            <div style={s.limitedBadge}>Limited Availability</div>
            <div style={s.planEyebrow}>Founder&apos;s</div>
            <div style={s.planName}>Founder&apos;s</div>
            <div style={s.planDesc}>
              {PLAN_CARDS.founders_annual.description}
            </div>
            <div style={s.commissionDisclosureFounders}>
              {getMarketplaceCommissionDisclosure(foundersCheckoutCode, { plansByCode })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {[
                { key: "monthly", label: "Monthly", price: CHECKOUT_PRICE_LABELS.founders_monthly },
                { key: "annual", label: "Annual", price: CHECKOUT_PRICE_LABELS.founders_annual },
              ].map(({ key, label, price }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFoundersInterval(key)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: foundersInterval === key ? "1.5px solid #92400e" : "1.5px solid #e4e9f0",
                    background: foundersInterval === key ? "#fffbeb" : "#fff",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    width: "100%",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#101828" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>{price}</span>
                </button>
              ))}
            </div>
            <div style={s.priceValue}>
              {CHECKOUT_PRICE_LABELS[foundersCheckoutCode]}
            </div>

            <ul style={s.featureList}>
              {PLAN_CARDS.founders_annual.features.map((feature) => (
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
              onClick={handleFounder}
            >
              {isSubmittingPlan
                ? "Preparing checkout..."
                : isFoundersSelected
                  ? "Continue with Founder's"
                  : "Choose Founder's"}
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
