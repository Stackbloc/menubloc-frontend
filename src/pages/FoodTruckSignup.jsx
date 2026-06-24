/**
 * ============================================================
 * File: FoodTruckSignup.jsx
 * Path: menubloc-frontend/src/pages/FoodTruckSignup.jsx
 * Date: 2026-05-26
 * Purpose:
 *   Food truck owner signup — create the account first, then
 *   collect operational details later from the operator dashboard.
 *
 *   On submit: calls POST /owner/profile with category='food_truck'
 *   Returns { restaurant, owner_token }.
 *   Then calls POST /owner/subscription/checkout-session and
 *   redirects to Stripe Checkout.
 *
 * Route: /foodtruck/signup
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { LEGAL_VERSIONS } from "../content/legal.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { buildLegalConsentPayload } from "../lib/legalConsent.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const SESSION_KEY = "grubbid.foodtruck.signup";

const PLAN_FEATURES = [
  "Public food truck profile page",
  "Marketplace ordering for pickup and delivery",
  "Dynamic QR menu access and shareable menu links",
  "Deals and billboard visibility tools",
  "Menu uploads, analytics, and multiple menus",
  "Live pickup and service location updates",
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
  heading: {
    fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    lineHeight: 1.08,
    color: "#101828",
    margin: "10px 0 12px",
  },
  subheading: {
    fontSize: 16,
    lineHeight: 1.65,
    color: "#667085",
    maxWidth: 660,
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 400px) minmax(0, 1fr)",
    gap: 20,
    alignItems: "start",
  },
  pricingCard: {
    position: "sticky",
    top: 24,
    borderRadius: 28,
    padding: "24px 22px 22px",
    border: "1px solid #eaecf0",
    background: "#ffffff",
    color: "#101828",
    boxShadow: "0 12px 30px rgba(15, 23, 32, 0.04)",
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
  planName: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.95,
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    marginBottom: 10,
  },
  planDescription: {
    fontSize: 15,
    lineHeight: 1.6,
    marginBottom: 18,
    color: "#667085",
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
    color: "#344054",
  },
  featureMark: {
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    background: "#1F4E3D",
    color: "#ffffff",
    marginTop: 1,
  },
  formStack: {
    minWidth: 0,
  },
  formCard: {
    background: "#ffffff",
    border: "1px solid #d9e0ea",
    borderRadius: 28,
    boxShadow: "0 12px 30px rgba(15, 23, 32, 0.04)",
    overflow: "hidden",
  },
  formCardHeader: {
    padding: "26px 24px 18px",
    borderBottom: "1px solid #eaecf0",
  },
  formCardTitle: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    margin: 0,
    color: "#101828",
  },
  formCardBody: {
    padding: 24,
  },
  section: {
    background: "#f7f7fb",
    border: "1px solid #efeff6",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "#444",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  fieldGroup: { marginBottom: 14 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
    color: "#333",
  },
  required: { color: "#c00", marginLeft: 2 },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #d7dce5",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },
  inputError: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #c00",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },
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
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#344054",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBanner: {
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#c00",
  },
  successBanner: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 16,
    fontSize: 14,
    color: "#166534",
    fontWeight: 600,
  },
  cancelledBanner: {
    background: "#fff7ed",
    border: "1px solid #fdba74",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#9a3412",
  },
  fieldError: { fontSize: 12, color: "#c00", marginTop: 5 },
  helperText: { fontSize: 12, color: "#667085", marginTop: 6 },
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
    accentColor: "#111",
    flex: "0 0 auto",
  },
  checkboxLabel: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#344054",
  },
  legalLink: {
    color: "#111",
    fontWeight: 700,
    textDecoration: "underline",
  },
};

function submitBtnStyle(disabled) {
  return {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: 0,
    background: disabled ? "#98a2b3" : "#111",
    color: "#fff",
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

export default function FoodTruckSignup() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const checkoutResult = searchParams.get("checkout");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    truck_name: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreements, setAgreements] = useState({ legalConsent: false });

  useEffect(() => {
    if (checkoutResult === "success") {
      setCheckoutSuccess(true);
      setSearchParams({}, { replace: true });
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    } else if (checkoutResult === "cancelled") {
      setSearchParams({}, { replace: true });
      try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) setForm(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, [checkoutResult]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleAgreementChange(event) {
    const { name, checked } = event.target;
    setAgreements((current) => ({ ...current, [name]: checked }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const errors = {};
    if (!form.email.trim()) errors.email = "Email is required.";
    if (!form.password) errors.password = "Password is required.";
    else if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword) errors.confirmPassword = "Confirm your password.";
    else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    if (!form.truck_name.trim()) errors.truck_name = "Truck name is required.";
    if (!agreements.legalConsent) {
      errors.legalConsent = "You must agree to the Terms of Use and Privacy Policy and consent to electronic communications.";
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API}/owner/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          restaurant_name: form.truck_name.trim(),
          category: "food_truck",
          ...buildLegalConsentPayload(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Signup failed (${res.status})`);
      }

      const { restaurant, owner_token } = data;
      const email = form.email.trim();
      const origin = window.location.origin;

      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(form)); } catch { /* ignore */ }

      const checkoutRes = await fetch(`${API}/owner/subscription/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          owner_token,
          email,
          plan_code: "food_truck_annual",
          success_url: `${origin}/foodtruck/signup?checkout=success`,
          cancel_url: `${origin}/foodtruck/signup?checkout=cancelled`,
          legal_acceptance: {
            document_key: "merchant_terms",
            document_version: LEGAL_VERSIONS.merchantTerms,
          },
        }),
      });

      const checkoutData = await checkoutRes.json().catch(() => null);
      if (!checkoutRes.ok || !checkoutData?.ok) {
        throw new Error(checkoutData?.error || "Failed to start checkout.");
      }

      if (!checkoutData.checkout_url) {
        throw new Error("No checkout URL returned.");
      }

      window.location.href = checkoutData.checkout_url;
    } catch (err) {
      setServerError(err.message || "Signup failed. Please try again.");
      setSubmitting(false);
    }
  }

  if (checkoutSuccess) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
        <div style={styles.successBanner}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>You are listed!</div>
          Your Menuply Food Truck Annual plan is active. You can finish your truck profile, menu, and live location details from the operator dashboard.
        </div>
          <a
            href="/foodtruck/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px 22px",
              borderRadius: 16,
              background: "#1F4E3D",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 12px 24px rgba(31, 78, 61, 0.18)",
            }}
          >
            Go to your dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div style={styles.heroContent}>
            {/* Keep the food-truck signup entry aligned with the restaurant shell. */}
            <BrandLogo height={48} radius={14} matchPageBackground={false} />
            <div style={styles.eyebrow}>{t("foodTruck.signup.title", "Food truck sign up")}</div>
            <h1 style={styles.heading}>{t("foodTruck.signup.subtitle", "List your truck and share your live menu with diners.")}</h1>
            <div style={styles.subheading}>
              Join Menuply with a food truck plan built for mobile operators. Create your account now, then add your live pickup location, menus, hours, and other truck details from the operator dashboard.
            </div>
          </div>
        </header>

        {checkoutResult === "cancelled" && !serverError ? (
          <div style={styles.cancelledBanner}>
            Checkout was cancelled. No charge was made. Complete your details below and try again.
          </div>
        ) : null}

        {serverError ? <div style={styles.errorBanner}>{serverError}</div> : null}

        <div style={styles.contentGrid}>
          <aside style={styles.pricingCard}>
            <div style={styles.planBadge}>Food Truck Annual</div>
            <div style={styles.planName}>Menuply Food Truck Plan</div>
            <div style={styles.planPrice}>$39/year</div>
            <div style={styles.planDescription}>
              A Menuply subscription built for food trucks that want full operator tools plus mobile pickup and service location support.
            </div>
            <ul style={styles.featureList}>
              {PLAN_FEATURES.map((feature) => (
                <li key={feature} style={styles.featureItem}>
                  <span style={styles.featureMark}>&#10003;</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div style={styles.planFootnote}>
              Your truck can start with the essentials here. Live service location updates, menu uploads, profile details, and operating setup continue from the operator dashboard after signup.
            </div>
          </aside>

          <div style={styles.formStack}>
            <div style={styles.formCard}>
              <div style={styles.formCardHeader}>
                <h2 style={styles.formCardTitle}>Create your account</h2>
                <div style={{ ...styles.helperText, marginTop: 8 }}>
                  Only the essentials are needed here. Food truck basics, menus, and live service locations can be added later from the operator dashboard.
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate style={styles.formCardBody}>
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Account</div>

                  <div style={styles.fieldGroup}>
                    <label htmlFor="email" style={styles.label}>
                      Email<span style={styles.required}>*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      style={fieldErrors.email ? styles.inputError : styles.input}
                    />
                    {fieldErrors.email ? <div style={styles.fieldError}>{fieldErrors.email}</div> : null}
                  </div>

                  <PasswordInput
                    id="password"
                    name="password"
                    label="Password"
                    value={form.password}
                    visible={showPassword}
                    onChange={handleChange}
                    onToggle={() => setShowPassword((current) => !current)}
                    error={fieldErrors.password}
                  />

                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm password"
                    value={form.confirmPassword}
                    visible={showConfirmPassword}
                    onChange={handleChange}
                    onToggle={() => setShowConfirmPassword((current) => !current)}
                    error={fieldErrors.confirmPassword}
                  />

                  {!fieldErrors.confirmPassword && form.confirmPassword ? (
                    <div style={styles.helperText}>
                      {form.password === form.confirmPassword ? "Passwords match." : "Passwords do not match."}
                    </div>
                  ) : null}

                  <div style={styles.fieldGroup}>
                    <label htmlFor="truck_name" style={styles.label}>
                      Food Truck Name<span style={styles.required}>*</span>
                    </label>
                    <input
                      id="truck_name"
                      name="truck_name"
                      type="text"
                      autoComplete="organization"
                      value={form.truck_name}
                      onChange={handleChange}
                      style={fieldErrors.truck_name ? styles.inputError : styles.input}
                    />
                    {fieldErrors.truck_name ? <div style={styles.fieldError}>{fieldErrors.truck_name}</div> : null}
                  </div>
                </div>

                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Legal</div>

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

                <button type="submit" style={submitBtnStyle(submitting)} disabled={submitting}>
                  {submitting ? "Redirecting to Stripe..." : "Create account"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
