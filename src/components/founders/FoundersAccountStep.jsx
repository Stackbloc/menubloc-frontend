import { useState } from "react";
import { Link } from "react-router-dom";

const S = {
  backBtn: {
    background: "none",
    border: "none",
    color: "#667085",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
    marginBottom: 16,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#667085",
    marginBottom: 10,
  },
  heading: {
    fontSize: "clamp(1.55rem, 3.8vw, 2.1rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    color: "#101828",
    margin: "0 0 10px",
  },
  intro: {
    fontSize: 15,
    lineHeight: 1.75,
    color: "#475467",
    margin: "0 0 24px",
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: 18,
    padding: "20px 20px 16px",
    marginBottom: 14,
    boxShadow: "0 2px 8px rgba(15,23,32,0.03)",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#444",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
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
  optional: { color: "#667085", fontWeight: 400 },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #d7dce5",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
    fontFamily: "inherit",
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
    fontFamily: "inherit",
  },
  row2: { display: "flex", gap: 12, flexWrap: "wrap" },
  halfField: { flex: "1 1 200px", marginBottom: 14 },
  passwordWrap: { position: "relative" },
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
    fontFamily: "inherit",
  },
  helperText: { fontSize: 12, color: "#667085", marginTop: 5 },
  fieldError: { fontSize: 12, color: "#c00", marginTop: 5 },
  errorBanner: {
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#c00",
  },
  // Legal checkboxes — operational/compliance feel, compact and neutral.
  // Intentionally lighter than the philosophy agreement in Step 1.
  legalDivider: {
    fontSize: 11,
    fontWeight: 800,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 12,
  },
  checkboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    marginTop: 3,
    accentColor: "#444",
    flexShrink: 0,
    cursor: "pointer",
  },
  checkboxLabel: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#475467",
  },
  legalLink: {
    color: "#111",
    fontWeight: 700,
    textDecoration: "underline",
  },
  divider: {
    height: 1,
    background: "#e4e7ec",
    margin: "8px 0 20px",
  },
  submitBtn: (disabled) => ({
    width: "100%",
    height: 52,
    borderRadius: 16,
    border: 0,
    background: disabled ? "#d0d5dd" : "#1F4E3D",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    letterSpacing: "-0.01em",
    transition: "background 0.15s",
  }),
  signinNote: {
    fontSize: 12,
    color: "#667085",
    textAlign: "center",
    marginTop: 16,
  },
};

function PasswordInput({ id, name, label, value, visible, onChange, onToggle, error }) {
  return (
    <div style={S.fieldGroup}>
      <label htmlFor={id} style={S.label}>
        {label}<span style={S.required}>*</span>
      </label>
      <div style={S.passwordWrap}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={onChange}
          style={{ ...(error ? S.inputError : S.input), paddingRight: 86 }}
        />
        <button type="button" onClick={onToggle} style={S.passwordToggle}>
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <div style={S.fieldError}>{error}</div> : null}
    </div>
  );
}

export default function FoundersAccountStep({
  onBack,
  form,
  agreements,
  fieldErrors,
  serverError,
  serverErrorDetail,
  submitting,
  onChange,
  onAgreementChange,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <>
      <button type="button" style={S.backBtn} onClick={onBack}>
        ← Back
      </button>
      <div style={S.stepLabel}>Step 3 of 3 — Create your account</div>
      <h2 style={S.heading}>Create your restaurant account.</h2>
      <p style={S.intro}>
        Just the basics. You can add your menu, photos, and settings after you&apos;re in.
      </p>

      {serverError ? (
        <div style={S.errorBanner}>
          <div style={{ fontWeight: 700, marginBottom: serverErrorDetail ? 4 : 0 }}>
            {serverError}
          </div>
          {serverErrorDetail ? <div>{serverErrorDetail}</div> : null}
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate>
        <div style={S.section}>
          <div style={S.sectionLabel}>Your restaurant</div>

          <div style={S.fieldGroup}>
            <label htmlFor="restaurant_name" style={S.label}>
              Restaurant name<span style={S.required}>*</span>
            </label>
            <input
              id="restaurant_name"
              name="restaurant_name"
              type="text"
              autoComplete="organization"
              value={form.restaurant_name}
              onChange={onChange}
              style={fieldErrors.restaurant_name ? S.inputError : S.input}
            />
            {fieldErrors.restaurant_name ? (
              <div style={S.fieldError}>{fieldErrors.restaurant_name}</div>
            ) : null}
          </div>

          <div style={S.fieldGroup}>
            <label htmlFor="contact_name" style={S.label}>
              Owner / contact name{" "}
              <span style={S.optional}>(optional)</span>
            </label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              autoComplete="name"
              value={form.contact_name}
              onChange={onChange}
              style={S.input}
            />
          </div>

          <div style={S.row2}>
            <div style={S.halfField}>
              <label htmlFor="city" style={S.label}>
                City<span style={S.required}>*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                value={form.city}
                onChange={onChange}
                style={fieldErrors.city ? S.inputError : S.input}
              />
              {fieldErrors.city ? (
                <div style={S.fieldError}>{fieldErrors.city}</div>
              ) : null}
            </div>
            <div style={S.halfField}>
              <label htmlFor="state" style={S.label}>
                State<span style={S.required}>*</span>
              </label>
              <input
                id="state"
                name="state"
                type="text"
                autoComplete="address-level1"
                maxLength={2}
                placeholder="e.g. TX"
                value={form.state}
                onChange={onChange}
                style={fieldErrors.state ? S.inputError : S.input}
              />
              {fieldErrors.state ? (
                <div style={S.fieldError}>{fieldErrors.state}</div>
              ) : null}
            </div>
          </div>

          <div style={S.fieldGroup}>
            <label htmlFor="phone" style={S.label}>
              Phone number <span style={S.optional}>(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={onChange}
              style={S.input}
            />
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionLabel}>Account</div>

          <div style={S.fieldGroup}>
            <label htmlFor="email" style={S.label}>
              Email<span style={S.required}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              style={fieldErrors.email ? S.inputError : S.input}
            />
            {fieldErrors.email ? (
              <div style={S.fieldError}>{fieldErrors.email}</div>
            ) : null}
          </div>

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            value={form.password}
            visible={showPassword}
            onChange={onChange}
            onToggle={() => setShowPassword((v) => !v)}
            error={fieldErrors.password}
          />

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            value={form.confirmPassword}
            visible={showConfirmPassword}
            onChange={onChange}
            onToggle={() => setShowConfirmPassword((v) => !v)}
            error={fieldErrors.confirmPassword}
          />

          {!fieldErrors.confirmPassword && form.confirmPassword ? (
            <div style={S.helperText}>
              {form.password === form.confirmPassword
                ? "Passwords match."
                : "Passwords do not match."}
            </div>
          ) : null}
        </div>

        <div style={S.section}>
          <div style={S.legalDivider}>Legal agreements</div>

          <label style={S.checkboxRow}>
            <input
              type="checkbox"
              name="merchantTerms"
              checked={agreements.merchantTerms}
              onChange={onAgreementChange}
              style={S.checkbox}
            />
            <span style={S.checkboxLabel}>
              I agree to the{" "}
              <Link
                to="/restaurant/terms"
                target="_blank"
                rel="noreferrer"
                style={S.legalLink}
              >
                Merchant Terms of Service
              </Link>
              .
            </span>
          </label>
          {fieldErrors.merchantTerms ? (
            <div style={S.fieldError}>{fieldErrors.merchantTerms}</div>
          ) : null}

          <label style={S.checkboxRow}>
            <input
              type="checkbox"
              name="privacyPolicy"
              checked={agreements.privacyPolicy}
              onChange={onAgreementChange}
              style={S.checkbox}
            />
            <span style={S.checkboxLabel}>
              I agree to the{" "}
              <Link
                to="/privacy"
                target="_blank"
                rel="noreferrer"
                style={S.legalLink}
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {fieldErrors.privacyPolicy ? (
            <div style={S.fieldError}>{fieldErrors.privacyPolicy}</div>
          ) : null}
        </div>

        <div style={S.divider} />

        <button
          type="submit"
          style={S.submitBtn(submitting)}
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Join Menuply"}
        </button>

        <p style={S.signinNote}>
          Already have an account?{" "}
          <Link to="/operator/login" style={{ color: "#1F4E3D", fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </form>
    </>
  );
}
