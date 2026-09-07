/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/RestaurantSignup.jsx
 * File: RestaurantSignup.jsx
 * Date: 2026-09-07
 * Purpose:
 *   Unified business account creation after type + invitation.
 *   restaurant / food_truck → POST /owner/profile;
 *   franchise → POST /operator/auth/register then POST /franchises/claim
 *   (Menuply review; no restaurant row).
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { buildLegalConsentPayload } from "../lib/legalConsent.js";
import { registerOperator } from "../lib/operatorApi.js";
import {
  FOOD_TRUCK_ANNUAL_PLAN_CODE,
  rememberIntendedCheckoutPlanCode,
} from "../lib/menuplyCheckoutPlans.js";
import {
  persistRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const PLAN_ENTRY_ROUTE = "/restaurant/signup";
const ORGANIZATION_ROUTE = "/restaurant/onboarding/organization";

const FRANCHISE_RELATIONSHIPS = [
  { value: "franchisor_corporate", label: "Franchisor / corporate representative" },
  { value: "master_franchisee", label: "Master franchisee" },
  { value: "area_developer", label: "Area developer" },
  { value: "other", label: "Other" },
];

function normalizeBusinessKind(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (value === "foodtruck" || value === "food_truck") return "food_truck";
  if (value === "franchise" || value === "multi") return "franchise";
  if (value === "restaurant" || value === "single") return "restaurant";
  return "restaurant";
}

function planLabel(t, planCode) {
  if (!planCode) return "";
  if (planCode === "franchise_review") {
    return t("signup.account.plan.franchise", "Franchise");
  }
  if (["standard", "standard_free", "published", "published_free", "verified", "starter"].includes(planCode)) {
    // Internal plan may be Standard; customer-facing label is Menuply only.
    return t("signup.account.plan.standard", "Menuply");
  }
  if (["starter_monthly", "starter_annual", "pro_monthly", "pro_annual", "pro_partner"].includes(planCode)) {
    return t("signup.account.plan.pro", "Pro");
  }
  if (["founders_monthly", "founders_annual"].includes(planCode)) {
    return t("signup.account.plan.founders", "Founder's");
  }
  if (planCode === "food_truck_annual" || planCode === "food_truck") {
    return t("signup.account.plan.foodTruck", "Food Truck");
  }
  return t(`signup.account.plan.${planCode}`, planCode);
}

const styles = {
  pageWrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
    background: "var(--gb-color-page)",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#0B0F0C",
  },
  pageMain: {
    flex: 1,
    width: "100%",
    maxWidth: 680,
    margin: "0 auto",
    padding: "32px 20px 56px",
  },
  header: { marginBottom: 28 },
  brand: { fontWeight: 800, fontSize: 18 },
  subbrand: { fontSize: 12, color: "#6B7280" },
  pageTitle: { fontSize: 28, fontWeight: 800, marginTop: 16, marginBottom: 8, letterSpacing: "-0.03em" },
  pageSubtitle: { fontSize: 15, color: "#374151", lineHeight: 1.6, maxWidth: 560 },
  section: {
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7280",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  fieldGroup: { marginBottom: 14 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
    color: "#374151",
  },
  required: { color: "#c00", marginLeft: 2 },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    padding: "0 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  inputError: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #FECACA",
    padding: "0 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  inputLocked: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    padding: "0 12px",
    fontSize: 14,
    background: "#F3F4F6",
    color: "#6B7280",
    boxSizing: "border-box",
    fontFamily: "inherit",
    cursor: "not-allowed",
  },
  identityLockHint: {
    marginTop: 5,
    fontSize: 11,
    color: "#9CA3AF",
  },
  row2: { display: "flex", gap: 12, flexWrap: "wrap" },
  halfField: { flex: "1 1 220px", marginBottom: 14 },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 86,
  },
  passwordToggle: {
    position: "absolute",
    top: 7,
    right: 8,
    height: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid #E5E7EB",
    background: "#ffffff",
    color: "#374151",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBanner: {
    background: "#FFF0F0",
    border: "1px solid #FECACA",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#DC2626",
  },
  fieldError: { fontSize: 12, color: "#DC2626", marginTop: 5 },
  helperText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  expectationCard: {
    marginTop: 12,
    padding: "14px 16px",
    borderRadius: 10,
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
  },
  expectationTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7280",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  expectationBody: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#374151",
  },
  planSummary: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    padding: "14px 16px",
    borderRadius: 10,
    background: "rgba(76,175,80,0.04)",
    border: "1.5px solid #4caf50",
    marginTop: 18,
  },
  planSummaryLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7280",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  planSummaryValue: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0B0F0C",
  },
  planSummaryLink: {
    color: "#4caf50",
    fontWeight: 800,
    textDecoration: "none",
  },
  checkboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    marginTop: 2,
    accentColor: "#4caf50",
    flex: "0 0 auto",
  },
  checkboxLabel: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#374151",
  },
  legalLink: {
    color: "#374151",
    fontWeight: 700,
    textDecoration: "underline",
  },
};

function submitBtnStyle(disabled) {
  return {
    width: "100%",
    height: 48,
    borderRadius: 10,
    border: 0,
    background: disabled ? "#F3F4F6" : "#4caf50",
    color: disabled ? "#9CA3AF" : "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: 4,
    fontFamily: "inherit",
  };
}

function PasswordInput({
  id,
  name,
  label,
  value,
  visible,
  onChange,
  onToggle,
  error,
}) {
  return (
    <div style={styles.fieldGroup}>
      <label htmlFor={id} style={styles.label}>
        {label}<span style={styles.required}>*</span>
      </label>
      <div style={styles.passwordWrap}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={onChange}
          style={{
            ...(error ? styles.inputError : styles.input),
            ...styles.passwordInput,
          }}
        />
        <button type="button" onClick={onToggle} style={styles.passwordToggle}>
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <div style={styles.fieldError}>{error}</div> : null}
    </div>
  );
}

export default function RestaurantSignup() {
  const nav = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { operator, isAuthenticated: isOperatorAuthenticated, loading: operatorLoading } = useOperator();
  const businessKind = normalizeBusinessKind(location.state?.business_kind);
  const isFoodTruck = businessKind === "food_truck";
  const isFranchise = businessKind === "franchise";
  const selectedPlan =
    location.state?.selected_plan ||
    (isFoodTruck
      ? FOOD_TRUCK_ANNUAL_PLAN_CODE
      : isFranchise
        ? "franchise_review"
        : "");
  const selectedPlanLabel = planLabel(t, selectedPlan);
  const claimRestaurantId = Number(location.state?.restaurant_id) || 0;
  const isClaimIdentityLocked = claimRestaurantId > 0 && !isFranchise;
  const CLAIM_LOCKED_FIELDS = new Set(["restaurant_name", "city", "state"]);

  const [form, setForm] = useState({
    email: operator?.email || "",
    password: "",
    confirmPassword: "",
    restaurant_name: String(location.state?.restaurant_name || "").trim(),
    city: String(location.state?.city || "").trim(),
    state: String(location.state?.state || "").trim(),
    phone: String(location.state?.phone || "").trim(),
    owner_name: "",
    claimant_title: "",
    company_website: "",
    relationship_to_brand: "",
    notes: "",
  });
  const [agreements, setAgreements] = useState({
    legalConsent: false,
    authorizationConfirmed: false,
  });

  // Sync email from operator once the async session resolves.
  // useState initializer runs before the session loads, so form.email
  // starts as "" even when the user is already signed in.
  useEffect(() => {
    if (operator?.email) {
      setForm((current) => ({ ...current, email: current.email || operator.email }));
    }
  }, [operator?.email]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [serverErrorDetail, setServerErrorDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [qrReveal, setQrReveal] = useState(null);
  const [postSignupNav, setPostSignupNav] = useState(null);
  const [qrCopied, setQrCopied] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    if (isClaimIdentityLocked && CLAIM_LOCKED_FIELDS.has(name)) return;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleAgreementChange(event) {
    const { name, checked } = event.target;
    setAgreements((current) => ({ ...current, [name]: checked }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function describeSignupFailure(error) {
    const rawMessage = String(error?.message || "").trim();
    const lower = rawMessage.toLowerCase();
    const status = Number(error?.status) || 0;

    if (/failed to fetch|networkerror|load failed|network request failed/i.test(rawMessage)) {
      return {
        title: "We could not reach Menuply right now.",
        detail: "Check your connection or retry in a moment. Your restaurant details are still here.",
      };
    }

    if (status === 400 || status === 409 || status === 422) {
      return {
        title: rawMessage || "We need a few details corrected before we can create this restaurant account.",
        detail: "Review the fields above, make any needed corrections, and try again.",
      };
    }

    if (status >= 500) {
      return {
        title: "Menuply could not finish creating this restaurant account.",
        detail: "Nothing was cleared from the form. Please retry in a moment.",
      };
    }

    if (/required|invalid|already exists|must/i.test(lower)) {
      return {
        title: rawMessage || "Some restaurant details still need attention.",
        detail: "Review the form and try again. Your entered information has been preserved.",
      };
    }

    return {
      title: rawMessage || t("signup.error.signupFailed"),
      detail: "Please retry. Your entered information is still available on this page.",
    };
  }

  function validate() {
    const errors = {};

    if (!form.email.trim()) errors.email = t("signup.error.emailRequired");
    if (!isOperatorAuthenticated) {
      if (!form.password) errors.password = "Password is required.";
      else if (!(form.password.length >= 8 && /\d/.test(form.password) && /[A-Z]/.test(form.password))) {
        errors.password = "Password must be at least 8 characters and include 1 uppercase letter and 1 number";
      }
      if (!form.confirmPassword) errors.confirmPassword = "Confirm your password.";
      else if (form.password !== form.confirmPassword) errors.confirmPassword = t("signup.error.passwordsDoNotMatch");
    }

    if (isFranchise) {
      if (!form.restaurant_name.trim()) errors.restaurant_name = "Brand name is required.";
      if (!form.owner_name.trim()) errors.owner_name = "Your full name is required.";
      if (!form.claimant_title.trim()) errors.claimant_title = "Your corporate title is required.";
      if (!form.relationship_to_brand) {
        errors.relationship_to_brand = "Please select your relationship to the brand.";
      }
      if (!agreements.authorizationConfirmed) {
        errors.authorizationConfirmed =
          "You must confirm authorization to contact Menuply on behalf of this brand.";
      }
    } else {
      if (!form.restaurant_name.trim()) {
        errors.restaurant_name = isFoodTruck
          ? "Truck name is required."
          : t("signup.error.restaurantNameRequired");
      }
      if (!form.city.trim()) errors.city = "City is required.";
      if (!form.state.trim()) errors.state = "State is required.";
      if (isFoodTruck) {
        if (!form.owner_name.trim()) errors.owner_name = "Owner name is required.";
        if (!form.phone.trim()) errors.phone = "Phone number is required.";
      }
    }

    if (!agreements.legalConsent) {
      errors.legalConsent =
        "You must agree to the Terms of Use and Privacy Policy and consent to electronic communications.";
    }

    return errors;
  }

  async function submitFranchiseSignup() {
    const consent = buildLegalConsentPayload();
    const fullName = form.owner_name.trim();
    const email = form.email.trim();

    if (!isOperatorAuthenticated) {
      await registerOperator(email, form.password, fullName, consent);
    }

    const res = await fetch(`${API}/franchises/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_name: form.restaurant_name.trim(),
        claimant_name: fullName,
        claimant_title: form.claimant_title.trim(),
        claimant_email: email,
        claimant_phone: form.phone.trim() || null,
        company_website: form.company_website.trim() || null,
        relationship_to_brand: form.relationship_to_brand,
        notes: form.notes.trim() || null,
        authorization_confirmed: true,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const signupError = new Error(data?.error || `Franchise request failed (${res.status})`);
      signupError.status = res.status;
      throw signupError;
    }

    nav("/operator/verify-email", {
      replace: true,
      state: {
        autoSend: true,
        franchise_pending_review: true,
        email,
        nextPath: "/operator",
      },
    });
  }

  async function submitOwnerProfileSignup() {
    const payload = {
      email: form.email.trim(),
      restaurant_name: form.restaurant_name.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      phone: form.phone.trim() || null,
      ...buildLegalConsentPayload(),
    };
    if (isClaimIdentityLocked) {
      payload.restaurant_id = claimRestaurantId;
    }
    if (!isOperatorAuthenticated) {
      payload.password = form.password;
    }
    if (isFoodTruck) {
      payload.category = "food_truck";
      payload.manager_name = form.owner_name.trim();
      payload.full_name = form.owner_name.trim();
      payload.signup_source = "food_truck_signup";
      payload.selected_plan = FOOD_TRUCK_ANNUAL_PLAN_CODE;
    }

    const res = await fetch(`${API}/owner/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const signupError = new Error(data?.error || `Signup failed (${res.status})`);
      signupError.status = res.status;
      throw signupError;
    }

    if (isFoodTruck) {
      rememberIntendedCheckoutPlanCode(FOOD_TRUCK_ANNUAL_PLAN_CODE);
    }

    const { restaurant, owner_token, primary_qr } = data;
    const baseState = persistRestaurantOnboardingState({
      restaurant_id: restaurant.id,
      restaurant_name: form.restaurant_name.trim(),
      email: form.email.trim(),
      owner_token,
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      address_line1: String(location.state?.address_line1 || "").trim(),
      claim_source: String(location.state?.claim_source || "").trim(),
      phone: form.phone.trim(),
      ingestion_method: "later",
      selected_plan: selectedPlan,
    });
    const draftState = await syncRestaurantOnboardingProgress(baseState, {
      current_step_key:
        selectedPlan === "verified" ||
        selectedPlan === "published_free" ||
        selectedPlan === "published" ||
        isFoodTruck
          ? "basic_public_profile"
          : "choose_plan",
      completed_step_keys: ["create_operator_account", "public_restaurant_information"],
      intake_path: isFoodTruck ? "food_truck_signup" : "independent_single_location",
      requested_location_count: 1,
      selected_plan_code: selectedPlan || null,
      manual_review_required: false,
      draft_payload: {
        temporary_selections: {
          selected_plan_code: selectedPlan || null,
          menu_upload_mode: "upload_later",
        },
        optional_modules: {
          qr_starter_kit: { status: "not_started" },
          equipment_readiness: { status: "not_started" },
        },
      },
    });

    const navTarget = {
      path: "/operator/verify-email",
      opts: {
        replace: true,
        state: {
          ...draftState,
          nextPath: isFoodTruck ? "/operator" : ORGANIZATION_ROUTE,
          autoSend: true,
          plan: selectedPlan,
          post_locations_path: "/restaurant/menu-upload-choice",
        },
      },
    };

    if (primary_qr?.token) {
      setQrReveal(primary_qr);
      setPostSignupNav(navTarget);
    } else {
      nav(navTarget.path, navTarget.opts);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    setServerErrorDetail("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      if (isFranchise) {
        await submitFranchiseSignup();
      } else {
        await submitOwnerProfileSignup();
      }
    } catch (error) {
      const failure = describeSignupFailure(error);
      setServerError(failure.title);
      setServerErrorDetail(failure.detail);
    } finally {
      setSubmitting(false);
    }
  }

  // QR reveal panel shown after successful signup
  if (qrReveal && postSignupNav) {
    const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
    const base = import.meta.env.VITE_PUBLIC_APP_URL || "https://menuply.com";
    const imageUrl = `${API_BASE}${qrReveal.image_url}`;
    const destUrl = qrReveal.destination_path
      ? `${base}${qrReveal.destination_path}`
      : null;

    async function handleQrCopy() {
      if (!destUrl) return;
      try {
        await navigator.clipboard.writeText(destUrl);
        setQrCopied(true);
        setTimeout(() => setQrCopied(false), 2000);
      } catch { /* silent */ }
    }

    function handleQrDownload() {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = "menuply-qr.png";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    }

    return (
      <div style={styles.pageWrap}>
        <main style={styles.pageMain}>
          <div style={styles.header}>
            <BrandLogo height={48} radius={14} matchPageBackground={false} />
            <div style={styles.pageTitle}>Your account is ready!</div>
            <div style={styles.pageSubtitle}>
              Your menu QR code has been generated. Print it, display it, or share the link.
            </div>
          </div>

          <div style={{ maxWidth: 400, margin: "0 auto", padding: "0 0 40px" }}>
            <div style={{
              background: "#fff", border: "1px solid #e4e9f0",
              borderRadius: 16, padding: "24px", marginBottom: 20,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            }}>
              <img
                src={imageUrl}
                alt="Your Menuply menu QR code"
                style={{ width: 180, height: 180, display: "block" }}
              />
              {destUrl && (
                <div style={{
                  fontSize: 11, color: "#667085", wordBreak: "break-all",
                  background: "#f8fafc", border: "1px solid #e4e9f0",
                  borderRadius: 6, padding: "6px 10px", width: "100%", textAlign: "center",
                }}>
                  {destUrl}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={handleQrCopy}
                  style={{
                    background: qrCopied ? "#f0faf6" : "#f8fafc",
                    color: qrCopied ? "#1F4E3D" : "#344054",
                    border: "1px solid #e4e9f0",
                    borderRadius: 8, padding: "9px 18px",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {qrCopied ? "Copied!" : "Copy link"}
                </button>
                <button
                  type="button"
                  onClick={handleQrDownload}
                  style={{
                    background: "#4caf50", color: "#fff",
                    border: "none", borderRadius: 8,
                    padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Download QR
                </button>
              </div>
              <p style={{ fontSize: 12, color: "#aab4c0", textAlign: "center", margin: 0 }}>
                Your QR code is always available in My Account &rarr; QR Code.
              </p>
            </div>

            <button
              type="button"
              onClick={() => nav(postSignupNav.path, postSignupNav.opts)}
              style={{
                width: "100%", height: 48, borderRadius: 10,
                border: 0, background: "#4caf50", color: "#fff",
                fontWeight: 800, fontSize: 15, cursor: "pointer",
              }}
            >
              Continue to verify email &rarr;
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div style={styles.pageWrap}>
      <main style={styles.pageMain}>
      <div style={styles.header}>
        <BrandLogo height={48} radius={14} matchPageBackground={false} />
        <div style={styles.pageTitle}>
          {isFranchise
            ? t("signup.account.franchisePageTitle", "Create your franchise account")
            : isFoodTruck
              ? t("signup.account.foodTruckPageTitle", "Create your food truck account")
              : t("signup.account.pageTitle", "Create your Menuply account")}
        </div>
        <div style={styles.pageSubtitle}>
          {isFranchise
            ? t(
                "signup.account.franchiseSubtitle",
                "Create your operator account. Menuply will review your franchise request before brand locations are activated."
              )
            : isFoodTruck
              ? t(
                  "signup.account.foodTruckSubtitle",
                  "Get your food truck on Menuply and start building your presence in the community."
                )
              : t(
                  "signup.account.pageSubtitleDetails",
                  "Get your restaurant on Menuply and start building your presence in the community."
                )}
        </div>
        {selectedPlanLabel ? (
          <div style={styles.planSummary}>
            <div>
              <div style={styles.planSummaryLabel}>
                {t("signup.account.selectedPlan", "Joining")}
              </div>
              <div style={styles.planSummaryValue}>{selectedPlanLabel}</div>
            </div>
            <Link to={PLAN_ENTRY_ROUTE} style={styles.planSummaryLink}>
              {t("signup.account.changePlan", "Back")}
            </Link>
          </div>
        ) : null}
      </div>

      {serverError ? (
        <div style={styles.errorBanner}>
          <div style={{ fontWeight: 700, marginBottom: serverErrorDetail ? 4 : 0 }}>{serverError}</div>
          {serverErrorDetail ? <div>{serverErrorDetail}</div> : null}
        </div>
      ) : null}
      {!selectedPlanLabel ? (
        <div style={styles.errorBanner}>
          {t("signup.account.choosePlanFirst", "Start restaurant signup to continue.")}{" "}
          <Link to={PLAN_ENTRY_ROUTE}>{t("signup.account.goToPricing", "Sign Up")}</Link>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div style={styles.section}>
          <div style={styles.sectionTitle}>{t("signup.account.sectionAccount", "Account")}</div>

          {isOperatorAuthenticated ? (
            <div style={{ ...styles.helperText, marginBottom: 14 }}>
              {t("signup.account.signedInAs", "Signed in as")}{" "}
              <strong>{form.email || operator?.email}</strong>.{" "}
              {t(
                "signup.account.signedInAttachSuffix",
                "This new listing will be attached to your existing operator account."
              )}
            </div>
          ) : null}

          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              {t("signup.email")}<span style={styles.required}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              readOnly={isOperatorAuthenticated}
              style={fieldErrors.email ? styles.inputError : styles.input}
            />
            {fieldErrors.email ? <div style={styles.fieldError}>{fieldErrors.email}</div> : null}
          </div>

          {!isOperatorAuthenticated ? (
            <>
              <PasswordInput
                id="password"
                name="password"
                label={t("signup.password", "Password")}
                value={form.password}
                visible={showPassword}
                onChange={handleChange}
                onToggle={() => setShowPassword((current) => !current)}
                error={fieldErrors.password}
              />

              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label={t("signup.confirmPassword", "Confirm password")}
                value={form.confirmPassword}
                visible={showConfirmPassword}
                onChange={handleChange}
                onToggle={() => setShowConfirmPassword((current) => !current)}
                error={fieldErrors.confirmPassword}
              />

              {!fieldErrors.confirmPassword && form.confirmPassword ? (
                <div style={styles.helperText}>
                  {form.password === form.confirmPassword
                    ? t("signup.account.passwordsMatch", "Passwords match.")
                    : t("signup.account.passwordsNoMatch", "Passwords do not match.")}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            {isFranchise
              ? t("signup.account.sectionFranchiseBasics", "Franchise request")
              : isFoodTruck
                ? t("signup.account.sectionFoodTruckBasics", "Food truck basics")
                : t("signup.account.sectionRestaurantBasics", "Restaurant basics")}
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="restaurant_name" style={styles.label}>
              {isFranchise
                ? "Brand name"
                : isFoodTruck
                  ? "Truck name"
                  : t("signup.restaurantName")}
              <span style={styles.required}>*</span>
            </label>
            <input
              id="restaurant_name"
              name="restaurant_name"
              type="text"
              autoComplete="organization"
              value={form.restaurant_name}
              onChange={handleChange}
              readOnly={isClaimIdentityLocked}
              aria-readonly={isClaimIdentityLocked ? "true" : undefined}
              style={
                fieldErrors.restaurant_name
                  ? styles.inputError
                  : isClaimIdentityLocked
                    ? styles.inputLocked
                    : styles.input
              }
            />
            {fieldErrors.restaurant_name ? <div style={styles.fieldError}>{fieldErrors.restaurant_name}</div> : null}
            {isClaimIdentityLocked ? (
              <div style={styles.identityLockHint}>
                {t(
                  "signup.account.identityLockedHint",
                  "Protected listing identity — must match the Menuply / Common Knowledge restaurant and cannot be edited here."
                )}
              </div>
            ) : null}
          </div>

          {(isFoodTruck || isFranchise) ? (
            <div style={styles.fieldGroup}>
              <label htmlFor="owner_name" style={styles.label}>
                {isFranchise ? "Your full name" : "Owner name"}
                <span style={styles.required}>*</span>
              </label>
              <input
                id="owner_name"
                name="owner_name"
                type="text"
                autoComplete="name"
                value={form.owner_name}
                onChange={handleChange}
                style={fieldErrors.owner_name ? styles.inputError : styles.input}
              />
              {fieldErrors.owner_name ? <div style={styles.fieldError}>{fieldErrors.owner_name}</div> : null}
            </div>
          ) : null}

          {isFranchise ? (
            <>
              <div style={styles.fieldGroup}>
                <label htmlFor="claimant_title" style={styles.label}>
                  Corporate title<span style={styles.required}>*</span>
                </label>
                <input
                  id="claimant_title"
                  name="claimant_title"
                  type="text"
                  value={form.claimant_title}
                  onChange={handleChange}
                  style={fieldErrors.claimant_title ? styles.inputError : styles.input}
                />
                {fieldErrors.claimant_title ? (
                  <div style={styles.fieldError}>{fieldErrors.claimant_title}</div>
                ) : null}
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="relationship_to_brand" style={styles.label}>
                  Relationship to brand<span style={styles.required}>*</span>
                </label>
                <select
                  id="relationship_to_brand"
                  name="relationship_to_brand"
                  value={form.relationship_to_brand}
                  onChange={handleChange}
                  style={fieldErrors.relationship_to_brand ? styles.inputError : styles.input}
                >
                  <option value="">Select…</option>
                  {FRANCHISE_RELATIONSHIPS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.relationship_to_brand ? (
                  <div style={styles.fieldError}>{fieldErrors.relationship_to_brand}</div>
                ) : null}
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="company_website" style={styles.label}>
                  Company website
                </label>
                <input
                  id="company_website"
                  name="company_website"
                  type="url"
                  value={form.company_website}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="https://"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="notes" style={styles.label}>
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...styles.input, height: "auto", padding: "10px 12px" }}
                />
              </div>
            </>
          ) : null}

          {!isFranchise ? (
            <div style={styles.row2}>
              <div style={styles.halfField}>
                <label htmlFor="city" style={styles.label}>
                  {t("signup.city")}<span style={styles.required}>*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={handleChange}
                  readOnly={isClaimIdentityLocked}
                  aria-readonly={isClaimIdentityLocked ? "true" : undefined}
                  style={
                    fieldErrors.city
                      ? styles.inputError
                      : isClaimIdentityLocked
                        ? styles.inputLocked
                        : styles.input
                  }
                />
                {fieldErrors.city ? <div style={styles.fieldError}>{fieldErrors.city}</div> : null}
              </div>

              <div style={styles.halfField}>
                <label htmlFor="state" style={styles.label}>
                  {t("signup.state")}<span style={styles.required}>*</span>
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  autoComplete="address-level1"
                  maxLength={2}
                  value={form.state}
                  onChange={handleChange}
                  readOnly={isClaimIdentityLocked}
                  aria-readonly={isClaimIdentityLocked ? "true" : undefined}
                  style={
                    fieldErrors.state
                      ? styles.inputError
                      : isClaimIdentityLocked
                        ? styles.inputLocked
                        : styles.input
                  }
                />
                {fieldErrors.state ? <div style={styles.fieldError}>{fieldErrors.state}</div> : null}
              </div>
            </div>
          ) : null}

          <div style={styles.fieldGroup}>
            <label htmlFor="phone" style={styles.label}>
              {t("signup.phone")}
              {isFoodTruck ? <span style={styles.required}>*</span> : null}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              style={fieldErrors.phone ? styles.inputError : styles.input}
            />
            {fieldErrors.phone ? <div style={styles.fieldError}>{fieldErrors.phone}</div> : null}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>{t("signup.account.sectionLegal", "Legal")}</div>

          {isFranchise ? (
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                name="authorizationConfirmed"
                checked={agreements.authorizationConfirmed}
                onChange={handleAgreementChange}
                style={styles.checkbox}
              />
              <span style={styles.checkboxLabel}>
                I confirm I am authorized to contact Menuply on behalf of this brand.
              </span>
            </label>
          ) : null}
          {fieldErrors.authorizationConfirmed ? (
            <div style={styles.fieldError}>{fieldErrors.authorizationConfirmed}</div>
          ) : null}

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="legalConsent"
              checked={agreements.legalConsent}
              onChange={handleAgreementChange}
              style={styles.checkbox}
            />
            <span style={styles.checkboxLabel}>
              I agree to the{" "}
              <Link to="/terms" target="_blank" rel="noreferrer" style={styles.legalLink}>
                Terms of Use
              </Link>
              {" "}and{" "}
              <Link to="/privacy" target="_blank" rel="noreferrer" style={styles.legalLink}>
                Privacy Policy
              </Link>
              {" "}and consent to receive electronic communications from Menuply regarding my account, orders, services, and important updates.
            </span>
          </label>
          {fieldErrors.legalConsent ? <div style={styles.fieldError}>{fieldErrors.legalConsent}</div> : null}
        </div>

        <button type="submit" style={submitBtnStyle(submitting || !selectedPlanLabel || operatorLoading)} disabled={submitting || !selectedPlanLabel || operatorLoading}>
          {submitting
            ? t("signup.account.creatingAccount", "Creating account...")
            : t("signup.account.createAccountButton", "Create account")}
        </button>
      </form>
      </main>
      <SiteFooter />
    </div>
  );
}
