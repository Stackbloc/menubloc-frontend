/**
 * Distributor-branded account creation.
 * Uses the same Menuply business account (operators) + email verification
 * as restaurant onboarding — not a separate auth system.
 */

import React, { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { buildLegalConsentPayload } from "../../lib/legalConsent.js";
import {
  AuthPageFrame,
  FormError,
  PasswordChecklist,
  PasswordField,
  PasswordMatchStatus,
  getPasswordChecklist,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function DistributorAccountSignup() {
  const { register, isAuthenticated, isEmailVerified, loading, operator } = useOperator();
  const navigate = useNavigate();
  const location = useLocation();

  const nextPath = useMemo(
    () => String(location.state?.nextPath || "/distributor").trim() || "/distributor",
    [location.state]
  );
  const claimId = location.state?.claimId || null;
  const prefills = location.state || {};

  const [fields, setFields] = useState({
    full_name: String(prefills.full_name || prefills.fullName || "").trim(),
    email: String(prefills.email || "").trim(),
    password: "",
    confirm_password: "",
  });
  const [legalConsent, setLegalConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && isAuthenticated) {
    return (
      <Navigate
        to={isEmailVerified ? nextPath : "/operator/verify-email"}
        replace
        state={{ email: operator?.email, nextPath, claimId, autoSend: !isEmailVerified }}
      />
    );
  }

  function setField(key, value) {
    setFields((cur) => ({ ...cur, [key]: value }));
    setFieldErrors((cur) => ({ ...cur, [key]: undefined }));
  }

  function validate() {
    const errors = {};
    const checklist = getPasswordChecklist(fields.password);
    if (!fields.full_name.trim()) errors.full_name = "Full name is required";
    if (!fields.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      errors.email = "Enter a valid email address";
    }
    if (!fields.password) errors.password = "Password is required";
    else if (!(checklist.minLength && checklist.number && checklist.uppercase)) {
      errors.password =
        "Password must be at least 8 characters and include 1 uppercase letter and 1 number";
    }
    if (!fields.confirm_password) errors.confirm_password = "Confirm your password";
    else if (fields.password !== fields.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    if (!legalConsent) {
      errors.legalConsent =
        "You must agree to the Terms of Use and Privacy Policy and consent to electronic communications.";
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    setFormError("");
    if (Object.values(errors).some(Boolean)) {
      setFormError("Fix the highlighted fields and try again.");
      return;
    }
    setBusy(true);
    try {
      const result = await register(
        fields.email.trim(),
        fields.password,
        fields.full_name.trim(),
        buildLegalConsentPayload()
      );
      if (result.operator?.email_verified !== true) {
        navigate("/operator/verify-email", {
          replace: true,
          state: {
            email: fields.email.trim(),
            nextPath,
            claimId,
            autoSend: true,
          },
        });
        return;
      }
      navigate(nextPath, { replace: true, state: { claimId } });
    } catch (err) {
      setFormError(err.message || "Sign up failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Create distributor account"
      subtitle="Claim and manage your Menuply distributor profile."
      footer={(
        <p style={styles.footer}>
          Already have a Menuply account?{" "}
          <Link
            to="/distributor/account/login"
            state={{ nextPath, claimId, email: fields.email }}
            style={styles.link}
          >
            Sign in
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="dist-signup-name" style={styles.label}>
            Full name
          </label>
          <input
            id="dist-signup-name"
            type="text"
            autoComplete="name"
            value={fields.full_name}
            onChange={(e) => setField("full_name", e.target.value)}
            style={{ ...styles.input, ...(fieldErrors.full_name ? styles.inputError : null) }}
            required
          />
          {fieldErrors.full_name ? <div style={styles.fieldError}>{fieldErrors.full_name}</div> : null}
        </div>
        <div style={styles.fieldGroup}>
          <label htmlFor="dist-signup-email" style={styles.label}>
            Business email
          </label>
          <input
            id="dist-signup-email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={(e) => setField("email", e.target.value)}
            style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : null) }}
            required
          />
          {fieldErrors.email ? <div style={styles.fieldError}>{fieldErrors.email}</div> : null}
        </div>
        <PasswordField
          id="dist-signup-password"
          label="Password"
          autoComplete="new-password"
          value={fields.password}
          onChange={(e) => setField("password", e.target.value)}
          error={fieldErrors.password}
        />
        <PasswordChecklist password={fields.password} />
        <PasswordField
          id="dist-signup-confirm"
          label="Confirm password"
          autoComplete="new-password"
          value={fields.confirm_password}
          onChange={(e) => setField("confirm_password", e.target.value)}
          error={fieldErrors.confirm_password}
        />
        <PasswordMatchStatus
          password={fields.password}
          confirmPassword={fields.confirm_password}
        />
        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={legalConsent}
            onChange={(event) => {
              setLegalConsent(event.target.checked);
              setFieldErrors((cur) => ({ ...cur, legalConsent: undefined }));
            }}
            style={styles.checkbox}
          />
          <span style={styles.checkboxLabel}>
            I agree to the{" "}
            <Link to="/terms" target="_blank" rel="noreferrer" style={styles.link}>
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link to="/privacy" target="_blank" rel="noreferrer" style={styles.link}>
              Privacy Policy
            </Link>{" "}
            and consent to receive electronic communications from Menuply regarding my
            account and services.
          </span>
        </label>
        {fieldErrors.legalConsent ? (
          <div style={styles.fieldError}>{fieldErrors.legalConsent}</div>
        ) : null}
        <FormError error={formError} />
        <button type="submit" disabled={busy} style={styles.submitButton}>
          {busy ? "Creating account…" : "Create distributor account"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
