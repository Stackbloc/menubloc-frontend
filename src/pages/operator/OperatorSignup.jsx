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
import OperatorSmsAuthModal from "../../components/auth/OperatorSmsAuthModal.jsx";
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
  const { register, isAuthenticated, loading, sendSmsCode, verifySmsCode } = useOperator();
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
  const [smsOpen, setSmsOpen] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/operator" replace />;
  }

  function setField(key, value) {
    setFields((cur) => ({ ...cur, [key]: value }));
    setFieldErrors((cur) => ({ ...cur, [key]: undefined }));
  }

  function validate() {
    const errors = {};
    const checklist = getPasswordChecklist(fields.password);

    if (!fields.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (!fields.password) {
      errors.password = "Password is required";
    } else if (!(checklist.minLength && checklist.number && checklist.uppercase)) {
      errors.password = "Password must be at least 8 characters and include 1 uppercase letter and 1 number";
    }

    if (!fields.confirm_password) {
      errors.confirm_password = "Confirm your password";
    } else if (fields.password !== fields.confirm_password) {
      errors.confirm_password = "Passwords do not match";
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
        fields.full_name.trim() || undefined,
      );
      const dest = result.restaurants?.length === 0 ? "/operator/claim" : "/operator";
      navigate(dest, { replace: true });
    } catch (err) {
      setFormError(err.message || "Account creation failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Create operator account"
      subtitle="List and manage your restaurant on Grubbid."
      footer={(
        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/operator/login" style={styles.link}>Sign in</Link>
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
          <label htmlFor="operator-signup-email" style={styles.label}>Email</label>
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
          label="Password"
          autoComplete="new-password"
          value={fields.password}
          onChange={(e) => setField("password", e.target.value)}
          placeholder="Create a strong password"
          error={fieldErrors.password}
        />

        <PasswordChecklist password={fields.password} />

        <PasswordField
          id="operator-signup-confirm-password"
          label="Confirm password"
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
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setSmsOpen(true)}
          style={{ background: "none", border: "none", color: "#1F4E3D", fontWeight: 800, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}
        >
          Sign up with phone number
        </button>
      </div>

      <OperatorSmsAuthModal
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        sendSmsCode={sendSmsCode}
        verifySmsCode={verifySmsCode}
        onSuccess={() => navigate("/operator/claim", { replace: true })}
      />
    </AuthPageFrame>
  );
}
