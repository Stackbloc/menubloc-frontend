/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorLogin.jsx
 * Updated: 2026-04-07
 * ============================================================
 */

import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function OperatorLogin() {
  const { login, isAuthenticated, isEmailVerified, loading, operator, restaurants } = useOperator();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && isAuthenticated) {
    const nextPath = restaurants?.length === 0 ? "/operator/claim" : "/operator";
    return <Navigate to={isEmailVerified ? nextPath : "/operator/verify-email"} replace state={{ email: operator?.email, nextPath }} />;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const nextErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";
    setFieldErrors(nextErrors);
    setFormError("");

    if (Object.values(nextErrors).some(Boolean)) {
      setFormError("Email and password are required.");
      return;
    }

    setBusy(true);
    try {
      const result = await login(email.trim(), password);
      const dest = result.restaurants?.length === 0 ? "/operator/claim" : "/operator";
      if (result.operator?.email_verified !== true) {
        navigate("/operator/verify-email", {
          replace: true,
          state: { email: email.trim(), nextPath: dest, autoSend: true },
        });
        return;
      }
      navigate(dest, { replace: true });
    } catch (err) {
      setFormError(err.message || "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Operator sign in"
      subtitle="Manage your restaurant on Grubbid."
      footer={(
        <>
          <p style={styles.footer}>
            <Link to="/operator/recover" style={styles.link}>Forgot password?</Link>
          </p>
          <p style={{ ...styles.footer, marginTop: "12px" }}>
            New to Grubbid?{" "}
            <Link to="/operator/signup" style={styles.link}>Create operator account</Link>
          </p>
        </>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="operator-login-email" style={styles.label}>Email</label>
          <input
            id="operator-login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((cur) => ({ ...cur, email: undefined }));
            }}
            style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : null) }}
            placeholder="you@restaurant.com"
            aria-invalid={fieldErrors.email ? "true" : "false"}
            required
            autoFocus
          />
          {fieldErrors.email ? <div style={styles.fieldError}>{fieldErrors.email}</div> : null}
        </div>

        <PasswordField
          id="operator-login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((cur) => ({ ...cur, password: undefined }));
          }}
          placeholder="Your password"
          error={fieldErrors.password}
        />

        <FormError error={formError} />

        <button
          type="submit"
          disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
