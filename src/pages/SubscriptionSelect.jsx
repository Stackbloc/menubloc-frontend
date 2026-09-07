/**
 * ============================================================
 * File:    SubscriptionSelect.jsx
 * Path:    menubloc-frontend/src/pages/SubscriptionSelect.jsx
 * Date:    2026-09-07
 * Purpose:
 *   Mid-onboarding join surface for restaurants that still land on
 *   `/restaurant/subscription` (checkout return, paid preset, checkpoints).
 *   Primary message matches invitation economics: Menuply free path
 *   (FREE_PLAN_CODE / published_free) — never "Standard" as customer copy.
 *   Pro / Founder's remain optional paid upgrades via existing Stripe checkout.
 *   Cold `/pricing` redirects to `/restaurant/signup` (see App.jsx).
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
const INVITATION_SIGNUP_ROUTE = "/restaurant/signup";

const PLAN_LABELS = {
  [FREE_PLAN_CODE]: "Menuply",
  verified: "Menuply",
  published_free: "Menuply",
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

const OPTIONAL_PAID_CARDS = {
  starter_annual: {
    title: "Pro",
    description:
      "Optional paid tools for growing restaurants — profiles, menus, QR, and online ordering.",
    features: [
      "Logo and product photos",
      "Unlimited menus and menu items",
      "QR Code and social sharing",
      "Online ordering",
      "Customers can follow your restaurant",
    ],
  },
  founders_annual: {
    title: "Founder's",
    description:
      "Optional early-adopter membership with locked Founder's pricing while availability remains open.",
    features: [
      "All Pro benefits, plus more",
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
    maxWidth: 720,
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
  inviteCard: {
    borderRadius: 28,
    border: "1px solid #eaecf0",
    background: "#ffffff",
    boxShadow: "0 18px 48px rgba(15, 23, 32, 0.08)",
    padding: "36px 32px 32px",
    marginBottom: 22,
  },
  heading: {
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
  steps: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.55,
    color: "#1F4E3D",
    margin: "0 0 28px",
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
  primaryButton: (disabled) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 360,
    minHeight: 54,
    padding: "16px 28px",
    borderRadius: 14,
    border: "none",
    background: disabled ? "#98a2b3" : "#1F4E3D",
    color: "#ffffff",
    fontSize: 17,
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    boxShadow: disabled ? "none" : "0 12px 24px rgba(31, 78, 61, 0.18)",
  }),
  optionalSection: {
    marginTop: 8,
    padding: "22px",
    borderRadius: 24,
    border: "1px solid #d9e0ea",
    background: "#ffffff",
    boxShadow: "0 12px 30px rgba(15, 23, 32, 0.04)",
  },
  optionalHeading: {
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    marginBottom: 8,
  },
  optionalSubheading: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#667085",
    marginBottom: 14,
  },
  optionalToggle: {
    width: "100%",
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid #d0d5dd",
    background: "#f8faf9",
    color: "#101828",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: 16,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  planCard: (highlighted) => ({
    borderRadius: 22,
    padding: "20px 18px 18px",
    border: highlighted ? "2px solid #1F4E3D" : "1px solid #eaecf0",
    background: highlighted
      ? "linear-gradient(135deg, #0f1720 0%, #1f4e3d 48%, #eef6f1 100%)"
      : "#f8faf9",
    color: highlighted ? "#ffffff" : "#101828",
    display: "flex",
    flexDirection: "column",
    minHeight: 360,
  }),
  planCardPro: {
    borderRadius: 22,
    padding: "20px 18px 18px",
    border: "2px solid #86b89a",
    background: "linear-gradient(160deg, #eef6f1 0%, #f7fbf9 55%, #ffffff 100%)",
    color: "#101828",
    display: "flex",
    flexDirection: "column",
    minHeight: 360,
  },
  limitedBadge: {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 12,
    padding: "6px 10px",
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
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.95,
    marginBottom: 10,
  },
  planDesc: {
    fontSize: 14,
    lineHeight: 1.55,
    marginBottom: 14,
    opacity: 0.92,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.95,
    marginBottom: 14,
  },
  commissionDisclosure: {
    margin: "0 0 12px",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#eef6f1",
    border: "1px solid #cfe0d8",
    color: "#1F4E3D",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.4,
  },
  commissionDisclosureFounders: {
    margin: "0 0 12px",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.4,
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 16px",
    display: "grid",
    gap: 8,
  },
  featureItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 13,
    lineHeight: 1.5,
  },
  featureMark: (highlighted) => ({
    flexShrink: 0,
    width: 20,
    height: 20,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 900,
    background: highlighted ? "#ffffff" : "#1F4E3D",
    color: highlighted ? "#1F4E3D" : "#ffffff",
    marginTop: 1,
  }),
  button: (primary, disabled) => ({
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: primary ? "1px solid #1F4E3D" : "1px solid #d0d5dd",
    background: disabled ? "#98a2b3" : primary ? "#1F4E3D" : "#ffffff",
    color: primary ? "#ffffff" : "#101828",
    fontSize: 14,
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    marginTop: "auto",
  }),
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
  const [showOptionalPaid, setShowOptionalPaid] = useState(false);
  const [proInterval, setProInterval] = useState(
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
  const proCheckoutCode =
    proInterval === "monthly" ? "starter_monthly" : "starter_annual";
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
      nav(INVITATION_SIGNUP_ROUTE);
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
      nav(INVITATION_SIGNUP_ROUTE);
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
    setShowOptionalPaid(true);
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

  async function handlePro() {
    await submitRestaurantPlan(proCheckoutCode);
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

  const proCard = OPTIONAL_PAID_CARDS.starter_annual;
  const isProSelected =
    selected_plan === "starter_monthly" || selected_plan === "starter_annual";
  const isFoundersSelected =
    selected_plan === "founders_monthly" || selected_plan === "founders_annual";
  const shouldExpandOptionalPaid =
    showOptionalPaid || isProSelected || isFoundersSelected || checkoutCancelled;

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <Link to={INVITATION_SIGNUP_ROUTE} style={s.topLink}>
          &larr; Back to restaurant signup
        </Link>

        <section style={s.inviteCard} aria-labelledby="subscription-invite-headline">
          <BrandLogo height={48} radius={14} matchPageBackground={false} linkStyle={{ marginBottom: 18 }} />

          <h1 id="subscription-invite-headline" style={s.heading}>
            Your Menu. More Ways to Be Discovered.
          </h1>
          <p style={s.economics}>12% commission. No subscription fee.</p>
          <p style={s.body}>
            Join Menuply with a free restaurant profile. Put your menu where the conversation about
            food is happening — then claim, upload, and manage your menu in the community.
          </p>
          <p style={s.steps}>
            Continue with Menuply — claim your free profile, upload your menu, join the community.
          </p>

          <button
            type="button"
            style={s.primaryButton(false)}
            onClick={choosePublished}
          >
            Continue with Menuply
          </button>
        </section>

        {checkoutCancelled ? (
          <div style={s.banner("warning")}>
            Checkout was cancelled. You can continue with Menuply free, or open optional paid upgrades
            below.
          </div>
        ) : null}

        {selected_plan && !isFreePlanCode(selected_plan) ? (
          <div style={s.banner("success")}>
            Selected during signup: {PLAN_LABELS[selected_plan] || selected_plan}.
          </div>
        ) : null}

        {planError ? (
          <div style={s.banner("error")}>{planError}</div>
        ) : null}

        <section style={s.optionalSection} aria-label="Optional paid upgrades">
          <div style={s.optionalHeading}>Optional paid upgrades</div>
          <div style={s.optionalSubheading}>
            Not required to join. Pro and Founder&apos;s keep Menuply&apos;s existing Stripe checkout
            if you already intended a paid plan.
          </div>

          {!shouldExpandOptionalPaid ? (
            <button
              type="button"
              style={s.optionalToggle}
              onClick={() => setShowOptionalPaid(true)}
            >
              Show Pro and Founder&apos;s options
            </button>
          ) : (
            <section style={s.cardsGrid}>
              <article style={s.planCardPro}>
                <div style={s.planEyebrow}>Optional</div>
                <div style={s.planName}>Pro</div>
                <div style={s.planDesc}>{proCard.description}</div>
                <div style={s.commissionDisclosure}>
                  {getMarketplaceCommissionDisclosure(proCheckoutCode, { plansByCode })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                  {[
                    { key: "monthly", label: "Monthly", price: CHECKOUT_PRICE_LABELS.starter_monthly },
                    { key: "annual", label: "Annual", price: CHECKOUT_PRICE_LABELS.starter_annual },
                  ].map(({ key, label, price }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProInterval(key)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: proInterval === key ? "1.5px solid #1F4E3D" : "1.5px solid #d0d5dd",
                        background: proInterval === key ? "#ffffff" : "rgba(255,255,255,0.7)",
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
                  {CHECKOUT_PRICE_LABELS[proCheckoutCode]}
                </div>

                <ul style={s.featureList}>
                  {proCard.features.map((feature) => (
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
                  onClick={handlePro}
                >
                  {isSubmittingPlan
                    ? "Preparing checkout..."
                    : isProSelected
                      ? "Continue with Pro"
                      : "Choose Pro"}
                </button>
              </article>

              <article style={s.planCard(true)}>
                <div style={s.limitedBadge}>Limited Availability</div>
                <div style={s.planEyebrow}>Optional</div>
                <div style={s.planName}>Founder&apos;s</div>
                <div style={s.planDesc}>
                  {OPTIONAL_PAID_CARDS.founders_annual.description}
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
                  {OPTIONAL_PAID_CARDS.founders_annual.features.map((feature) => (
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
          )}
        </section>

        {shouldExpandOptionalPaid ? (
          <div style={s.legalNotice}>
            By continuing with a paid plan, you agree to the{" "}
            <Link to="/restaurant/subscription-terms" target="_blank" rel="noreferrer" style={s.legalLink}>
              Restaurant Plan Terms
            </Link>
            .
          </div>
        ) : null}
      </div>
    </div>
  );
}
