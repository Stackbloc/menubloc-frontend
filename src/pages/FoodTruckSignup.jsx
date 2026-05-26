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
import { BrandLockup } from "../components/BrandLogo.jsx";
import { LEGAL_VERSIONS } from "../content/legal.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const SESSION_KEY = "grubbid.foodtruck.signup";

const styles = {
  page: {
    maxWidth: 640,
    margin: "40px auto",
    padding: "0 20px 60px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  header: { marginBottom: 28 },
  pageTitle: { fontSize: 28, fontWeight: 800, marginTop: 20, marginBottom: 6, letterSpacing: "-0.03em" },
  pageSubtitle: { fontSize: 15, color: "#555", lineHeight: 1.6, maxWidth: 560 },
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
  expectationCard: {
    marginTop: 12,
    padding: "14px 16px",
    borderRadius: 14,
    background: "#f8faf9",
    border: "1px solid #d9e0ea",
  },
  expectationTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "#1F4E3D",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  expectationBody: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#475467",
  },
  planSummary: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    padding: "14px 16px",
    borderRadius: 14,
    background: "#eef6f1",
    border: "1px solid #cfe0d8",
    marginTop: 18,
  },
  planSummaryLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#1F4E3D",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  planSummaryValue: {
    fontSize: 16,
    fontWeight: 800,
    color: "#101828",
  },
  planSummaryMeta: {
    color: "#1F4E3D",
    fontWeight: 800,
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
  const [agreements, setAgreements] = useState({
    merchantTerms: false,
    privacyPolicy: false,
  });

  useEffect(() => {
    if (checkoutResult === "success") {
      setCheckoutSuccess(true);
      setSearchParams({}, { replace: true });
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    } else if (checkoutResult === "cancelled") {
      setSearchParams({}, { replace: true });
      try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          setForm(JSON.parse(saved));
        }
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
    if (!agreements.merchantTerms) errors.merchantTerms = "You must agree to the Merchant Terms of Service.";
    if (!agreements.privacyPolicy) errors.privacyPolicy = "You must agree to the Privacy Policy.";

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
          legal_acceptances: [
            {
              document_key: "merchant_terms",
              document_version: LEGAL_VERSIONS.merchantTerms,
            },
            {
              document_key: "privacy_policy",
              document_version: LEGAL_VERSIONS.privacyPolicy,
            },
          ],
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
        <BrandLockup
          subtitle="for Food Trucks"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
        />
        <div style={{ ...styles.successBanner, marginTop: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>You are listed!</div>
          Your Menuply Food Truck Annual plan is active. You can finish your truck profile and operating details from the operator dashboard.
        </div>
        <a
          href="/foodtruck/dashboard"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 16,
            padding: "13px 0",
            borderRadius: 12,
            background: "#111",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Go to your dashboard
        </a>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <BrandLockup
          subtitle="for Food Trucks"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
          wrapperStyle={{ marginBottom: 6 }}
        />
        <div style={styles.pageTitle}>Create your food truck account</div>
        <div style={styles.pageSubtitle}>
          Enter your food truck account details to continue with your selected plan.
        </div>
        <div style={styles.planSummary}>
          <div>
            <div style={styles.planSummaryLabel}>Selected plan</div>
            <div style={styles.planSummaryValue}>Food Truck Annual</div>
          </div>
          <div style={styles.planSummaryMeta}>$39/year</div>
        </div>
        <div style={styles.expectationCard}>
          <div style={styles.expectationTitle}>Food Trucks on Menuply</div>
          <div style={styles.expectationBody}>
            Food trucks bring creativity, energy, and local character to the food industry. They introduce new flavors, serve communities in flexible ways, and often become the starting point for some of the most innovative restaurant concepts. We are proud to offer a plan designed specifically to reflect the unique role food trucks play in the restaurant industry every day.
          </div>
        </div>
        <div style={{ ...styles.helperText, marginTop: 10 }}>
          Only the essentials are needed here. You can add service areas, pickup locations, menu details, and profile information later from the operator dashboard.
        </div>
      </div>

      {checkoutResult === "cancelled" && !serverError ? (
        <div style={styles.cancelledBanner}>
          Checkout was cancelled. No charge was made. Complete your details below and try again.
        </div>
      ) : null}

      {serverError ? <div style={styles.errorBanner}>{serverError}</div> : null}

      <form onSubmit={handleSubmit} noValidate>
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

          <div style={styles.helperText}>
            Menus, service locations, live pickup details, hours, and profile information can all be added later from the operator dashboard.
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Legal</div>

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="merchantTerms"
              checked={agreements.merchantTerms}
              onChange={handleAgreementChange}
              style={styles.checkbox}
            />
            <span style={styles.checkboxLabel}>
              I agree to the{" "}
              <Link to="/restaurant/terms" target="_blank" rel="noreferrer" style={styles.legalLink}>
                Merchant Terms of Service
              </Link>
              .
            </span>
          </label>
          {fieldErrors.merchantTerms ? <div style={styles.fieldError}>{fieldErrors.merchantTerms}</div> : null}

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="privacyPolicy"
              checked={agreements.privacyPolicy}
              onChange={handleAgreementChange}
              style={styles.checkbox}
            />
            <span style={styles.checkboxLabel}>
              I agree to the{" "}
              <Link to="/privacy" target="_blank" rel="noreferrer" style={styles.legalLink}>
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {fieldErrors.privacyPolicy ? <div style={styles.fieldError}>{fieldErrors.privacyPolicy}</div> : null}
        </div>

        <button type="submit" style={submitBtnStyle(submitting)} disabled={submitting}>
          {submitting ? "Redirecting to Stripe..." : "Create account and continue to payment"}
        </button>

        <div style={{ fontSize: 11, color: "#667085", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
          You will be taken to Stripe to complete your $39/year subscription.
        </div>
      </form>
    </div>
  );
}
