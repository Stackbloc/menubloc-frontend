/**
 * ============================================================
 * File: FoodTruckSignup.jsx
 * Path: menubloc-frontend/src/pages/FoodTruckSignup.jsx
 * Date: 2026-09-07
 * Purpose:
 *   Food truck owner signup — Menuply invitation messaging + account
 *   creation. Create the account first, then collect operational
 *   details later from the operator dashboard.
 *
 *   On submit: calls POST /owner/profile with category='food_truck'
 *   and internal selected_plan FOOD_TRUCK_ANNUAL_PLAN_CODE (or free
 *   join codes elsewhere). Never show customer-facing "Standard".
 *   Paid checkout (if any) lives in the Operator Panel — not on this page.
 *
 * Route: /foodtruck/signup
 * ============================================================
 */

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { API_BASE } from "../lib/api.js";
import { buildLegalConsentPayload } from "../lib/legalConsent.js";
import {
  FOOD_TRUCK_ANNUAL_PLAN_CODE,
  rememberIntendedCheckoutPlanCode,
} from "../lib/menuplyCheckoutPlans.js";

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
  formCard: {
    background: "#ffffff",
    border: "1px solid #d9e0ea",
    borderRadius: 28,
    boxShadow: "0 12px 30px rgba(15, 23, 32, 0.04)",
    overflow: "hidden",
    marginBottom: 28,
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
  inviteCard: {
    borderRadius: 28,
    border: "1px solid #eaecf0",
    background: "#ffffff",
    boxShadow: "0 18px 48px rgba(15, 23, 32, 0.08)",
    padding: "32px 28px 28px",
    marginBottom: 24,
  },
  inviteHeadline: {
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
    margin: "0 0 18px",
  },
  inviteBody: {
    fontSize: 16,
    lineHeight: 1.65,
    color: "#374151",
    margin: "0 0 14px",
  },
  inviteSteps: {
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.55,
    color: "#1F4E3D",
    margin: 0,
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
  const [searchParams] = useSearchParams();
  const accountCreatedFromUrl = searchParams.get("created") === "1";

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    truck_name: "",
    city: "",
    state: "",
    owner_name: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(accountCreatedFromUrl);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreements, setAgreements] = useState({ legalConsent: false });

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
    else if (!(form.password.length >= 8 && /\d/.test(form.password) && /[A-Z]/.test(form.password))) {
      errors.password = "Password must be at least 8 characters and include 1 uppercase letter and 1 number";
    }
    if (!form.confirmPassword) errors.confirmPassword = "Confirm your password.";
    else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    if (!form.truck_name.trim()) errors.truck_name = "Truck name is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.state.trim()) errors.state = "State is required.";
    if (!form.owner_name.trim()) errors.owner_name = "Owner name is required.";
    if (!form.phone.trim()) errors.phone = "Phone number is required.";
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
      const res = await fetch(`${API_BASE}/owner/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          restaurant_name: form.truck_name.trim(),
          category: "food_truck",
          city: form.city.trim(),
          state: form.state.trim(),
          manager_name: form.owner_name.trim(),
          full_name: form.owner_name.trim(),
          phone: form.phone.trim(),
          signup_source: "food_truck_signup",
          selected_plan: FOOD_TRUCK_ANNUAL_PLAN_CODE,
          ...buildLegalConsentPayload(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Signup failed (${res.status})`);
      }

      rememberIntendedCheckoutPlanCode(FOOD_TRUCK_ANNUAL_PLAN_CODE);
      setAccountCreated(true);
      setSubmitting(false);
    } catch (err) {
      setServerError(err.message || "Signup failed. Please try again.");
      setSubmitting(false);
    }
  }

  if (accountCreated) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
        <div style={styles.successBanner}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Account created</div>
          You can now sign in to verify your email and continue food-truck onboarding.
        </div>
          <a
            href="/operator/login"
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
            Continue to email verification
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
            <BrandLogo height={48} radius={14} matchPageBackground={false} />
            <div style={styles.eyebrow}>{t("foodTruck.signup.title", "Food truck sign up")}</div>
          </div>
        </header>

        <section style={styles.inviteCard} aria-labelledby="food-truck-signup-invite-headline">
          <h1 id="food-truck-signup-invite-headline" style={styles.inviteHeadline}>
            Your Menu. More Ways to Be Discovered.
          </h1>
          <p style={styles.economics}>12% commission. No subscription fee.</p>
          <p style={styles.inviteBody}>
            Menuply connects your food truck menu to a social food experience where people discover
            what to eat, see what others are eating, make plans, and find trucks nearby.
          </p>
          <p style={styles.inviteSteps}>
            Claim your free profile. Upload and manage your menu. Join the community.
          </p>
        </section>

        {serverError ? <div style={styles.errorBanner}>{serverError}</div> : null}

        <div style={styles.formCard}>
          <div style={styles.formCardHeader}>
            <h2 style={styles.formCardTitle}>Create your account</h2>
            <div style={{ ...styles.helperText, marginTop: 8 }}>
              These basics create your food-truck account and Menuply listing. Menu upload and public
              profile details come next.
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

              <div style={styles.fieldGroup}>
                <label htmlFor="city" style={styles.label}>
                  City<span style={styles.required}>*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={handleChange}
                  style={fieldErrors.city ? styles.inputError : styles.input}
                />
                {fieldErrors.city ? <div style={styles.fieldError}>{fieldErrors.city}</div> : null}
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="state" style={styles.label}>
                  State<span style={styles.required}>*</span>
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={handleChange}
                  style={fieldErrors.state ? styles.inputError : styles.input}
                />
                {fieldErrors.state ? <div style={styles.fieldError}>{fieldErrors.state}</div> : null}
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="owner_name" style={styles.label}>
                  Owner name<span style={styles.required}>*</span>
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

              <div style={styles.fieldGroup}>
                <label htmlFor="phone" style={styles.label}>
                  Phone number<span style={styles.required}>*</span>
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
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
