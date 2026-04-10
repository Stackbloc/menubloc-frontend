import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import { BrandLockup } from "../components/BrandLogo.jsx";
import { LEGAL_VERSIONS } from "../content/legal.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const PLAN_SELECTION_ROUTE = "/restaurant/subscription";

const styles = {
  page: {
    maxWidth: 640,
    margin: "40px auto",
    padding: "0 20px 60px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  header: { marginBottom: 28 },
  brand: { fontWeight: 800, fontSize: 18 },
  subbrand: { fontSize: 12, color: "#666" },
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
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#344054",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  optionCard: (selected) => ({
    border: selected ? "2px solid #111" : "1px solid #d7dce5",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 10,
    cursor: "pointer",
    background: selected ? "#fff" : "transparent",
  }),
  optionTitle: { fontWeight: 800, fontSize: 14, marginBottom: 4 },
  optionDesc: { fontSize: 13, color: "#555", lineHeight: 1.5 },
  errorBanner: {
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#c00",
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
  const { t } = useLanguage();
  const { operator, isAuthenticated: isOperatorAuthenticated, loading: operatorLoading } = useOperator();

  const [form, setForm] = useState({
    email: operator?.email || "",
    password: "",
    confirmPassword: "",
    restaurant_name: "",
    city: "",
    state: "",
    phone: "",
  });
  const [agreements, setAgreements] = useState({
    merchantTerms: false,
    privacyPolicy: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [menuChoice, setMenuChoice] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    if (!form.email.trim()) errors.email = t("signup.error.emailRequired");
    if (!isOperatorAuthenticated) {
      if (!form.password) errors.password = "Password is required.";
      else if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
      if (!form.confirmPassword) errors.confirmPassword = "Confirm your password.";
      else if (form.password !== form.confirmPassword) errors.confirmPassword = t("signup.error.passwordsDoNotMatch");
    }
    if (!form.restaurant_name.trim()) errors.restaurant_name = t("signup.error.restaurantNameRequired");
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.state.trim()) errors.state = "State is required.";
    if (!menuChoice) errors.menuChoice = "Choose whether you want to upload a PDF now or later.";
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
      const payload = {
        email: form.email.trim(),
        restaurant_name: form.restaurant_name.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        phone: form.phone.trim() || null,
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
      };
      if (!isOperatorAuthenticated) {
        payload.password = form.password;
      }

      const res = await fetch(`${API}/owner/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Signup failed (${res.status})`);
      }

      const { restaurant, owner_token } = data;
      const nextState = {
        restaurant_id: restaurant.id,
        restaurant_name: form.restaurant_name.trim(),
        email: form.email.trim(),
        owner_token,
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        phone: form.phone.trim(),
        ingestion_method: menuChoice === "pdf_now" ? "pdf" : "later",
        menu_choice: menuChoice,
      };

      nav(PLAN_SELECTION_ROUTE, { state: nextState });
    } catch (error) {
      setServerError(error.message || t("signup.error.signupFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <BrandLockup
          subtitle={t("signup.forRestaurants")}
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
          wrapperStyle={{ marginBottom: 6 }}
        />
        <div style={styles.pageTitle}>Create your restaurant account</div>
        <div style={styles.pageSubtitle}>
          Start with the basics. You will choose between Verified and Pro on the next step.
        </div>
      </div>

      {serverError ? <div style={styles.errorBanner}>{serverError}</div> : null}

      <form onSubmit={handleSubmit} noValidate>
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Account</div>

          {isOperatorAuthenticated ? (
            <div style={{ ...styles.helperText, marginBottom: 14 }}>
              Signed in as <strong>{form.email || operator?.email}</strong>. This new listing will be attached to your existing operator account.
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
            </>
          ) : null}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Restaurant basics</div>

          <div style={styles.fieldGroup}>
            <label htmlFor="restaurant_name" style={styles.label}>
              {t("signup.restaurantName")}<span style={styles.required}>*</span>
            </label>
            <input
              id="restaurant_name"
              name="restaurant_name"
              type="text"
              autoComplete="organization"
              value={form.restaurant_name}
              onChange={handleChange}
              style={fieldErrors.restaurant_name ? styles.inputError : styles.input}
            />
            {fieldErrors.restaurant_name ? <div style={styles.fieldError}>{fieldErrors.restaurant_name}</div> : null}
          </div>

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
                style={fieldErrors.city ? styles.inputError : styles.input}
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
                style={fieldErrors.state ? styles.inputError : styles.input}
              />
              {fieldErrors.state ? <div style={styles.fieldError}>{fieldErrors.state}</div> : null}
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="phone" style={styles.label}>
              {t("signup.phone")}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Menu timing</div>

          <div
            style={styles.optionCard(menuChoice === "pdf_now")}
            onClick={() => {
              setMenuChoice("pdf_now");
              setFieldErrors((current) => ({ ...current, menuChoice: "" }));
            }}
            role="radio"
            aria-checked={menuChoice === "pdf_now"}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setMenuChoice("pdf_now");
                setFieldErrors((current) => ({ ...current, menuChoice: "" }));
              }
            }}
          >
            <div style={styles.optionTitle}>Upload PDF now</div>
            <div style={styles.optionDesc}>
              Continue into plan selection, then move straight into PDF upload after you choose your plan and design.
            </div>
          </div>

          <div
            style={styles.optionCard(menuChoice === "upload_later")}
            onClick={() => {
              setMenuChoice("upload_later");
              setFieldErrors((current) => ({ ...current, menuChoice: "" }));
            }}
            role="radio"
            aria-checked={menuChoice === "upload_later"}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setMenuChoice("upload_later");
                setFieldErrors((current) => ({ ...current, menuChoice: "" }));
              }
            }}
          >
            <div style={styles.optionTitle}>Upload menu later</div>
            <div style={styles.optionDesc}>
              Finish account setup first and come back to your menu after plan selection.
            </div>
          </div>

          {fieldErrors.menuChoice ? <div style={styles.fieldError}>{fieldErrors.menuChoice}</div> : null}
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
          {submitting ? "Creating account..." : "Continue to Plan Selection"}
        </button>
      </form>
    </div>
  );
}
