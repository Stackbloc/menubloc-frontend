/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorSignup.jsx
 * Date: 2026-04-07
 * Purpose:
 *   Operator account creation. Uses the same shared auth UI
 *   components as the consumer auth flow.
 * ============================================================
 */

import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordChecklist,
  PasswordField,
  PasswordMatchStatus,
  getPasswordChecklist,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function OperatorSignup() {
  const { register, isAuthenticated, isEmailVerified, loading, operator, restaurants } = useOperator();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && isAuthenticated) {
    const nextPath = restaurants?.length === 0 ? "/operator/claim" : "/operator";
    return <Navigate to={isEmailVerified ? nextPath : "/operator/verify-email"} replace state={{ email: operator?.email, nextPath }} />;
  }

  function setField(key, value) {
    setFields((cur) => ({ ...cur, [key]: value }));
    setFieldErrors((cur) => ({ ...cur, [key]: undefined }));
  }

  function validate() {
    const errors = {};
    const checklist = getPasswordChecklist(fields.password);

    if (!fields.email.trim()) {
      errors.email = t("auth.emailRequired", "Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      errors.email = t("auth.validEmailRequired", "Enter a valid email address");
    }

    if (!fields.password) {
      errors.password = t("auth.passwordRequired", "Password is required");
    } else if (!(checklist.minLength && checklist.number && checklist.uppercase)) {
      errors.password = t("auth.passwordRules", "Password must be at least 8 characters and include 1 uppercase letter and 1 number");
    }

    if (!fields.confirm_password) {
      errors.confirm_password = t("auth.confirmPasswordRequired", "Confirm your password");
    } else if (fields.password !== fields.confirm_password) {
      errors.confirm_password = t("auth.passwordsDoNotMatch", "Passwords do not match");
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    setFormError("");

    if (Object.values(errors).some(Boolean)) {
      setFormError(t("auth.fixHighlightedFields", "Fix the highlighted fields and try again."));
      return;
    }

    setBusy(true);
    try {
      const result = await register(
        fields.email.trim(),
        fields.password,
        fields.full_name.trim() || undefined,
      );
      const dest = result.restaurants?.length === 0 ? "/operator/claim" : "/operator";
      if (result.operator?.email_verified !== true) {
        navigate("/operator/verify-email", {
          replace: true,
          state: { email: fields.email.trim(), nextPath: dest, autoSend: true },
        });
        return;
      }
      navigate(dest, { replace: true });
    } catch (err) {
      setFormError(err.message || t("auth.signUpFailed", "Sign up failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title={t("auth.operatorSignUpTitle", "Create operator account")}
      subtitle={t("auth.operatorSignUpSubtitle", "Start managing your restaurant on Menuply.")}
      footer={(
        <p style={styles.footer}>
          {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
          <Link to="/operator/login" style={styles.link}>{t("auth.signIn", "Sign in")}</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="operator-signup-name" style={styles.label}>
            Full name <span style={styles.optional}>(optional)</span>
          </label>
          <input
            id="operator-signup-name"
            type="text"
            autoComplete="name"
            value={fields.full_name}
            onChange={(e) => setField("full_name", e.target.value)}
            style={styles.input}
            placeholder="Jane Smith"
            autoFocus
          />
        </div>

        <div style={styles.fieldGroup}>
          <label htmlFor="operator-signup-email" style={styles.label}>{t("auth.email", "Email")}</label>
          <input
            id="operator-signup-email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={(e) => setField("email", e.target.value)}
            style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : null) }}
            placeholder="you@restaurant.com"
            aria-invalid={fieldErrors.email ? "true" : "false"}
            required
          />
          {fieldErrors.email ? <div style={styles.fieldError}>{fieldErrors.email}</div> : null}
        </div>

        <PasswordField
          id="operator-signup-password"
          label={t("auth.password", "Password")}
          autoComplete="new-password"
          value={fields.password}
          onChange={(e) => setField("password", e.target.value)}
          placeholder="Create a strong password"
          error={fieldErrors.password}
        />

        <PasswordChecklist password={fields.password} />

        <PasswordField
          id="operator-signup-confirm-password"
          label={t("auth.confirmPassword", "Confirm password")}
          autoComplete="new-password"
          value={fields.confirm_password}
          onChange={(e) => setField("confirm_password", e.target.value)}
          placeholder="Repeat password"
          error={fieldErrors.confirm_password}
        />

        <PasswordMatchStatus
          password={fields.password}
          confirmPassword={fields.confirm_password}
        />

        <FormError error={formError} />

        <button
          type="submit"
          disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy ? t("auth.signingUp", "Creating account...") : t("auth.createAccount", "Create account")}
        </button>
      </form>
    </AuthPageFrame>
  );
}
