/**
 * Distributor-branded sign in for claim / account linking.
 * Uses the same Menuply business account login as restaurants (operators table).
 * Does not require an existing distributor membership (claimants may not have one yet).
 */

import React, { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function DistributorAccountLogin() {
  const { login, isAuthenticated, isEmailVerified, loading, operator } = useOperator();
  const navigate = useNavigate();
  const location = useLocation();

  const nextPath = useMemo(
    () => String(location.state?.nextPath || "/distributor").trim() || "/distributor",
    [location.state]
  );
  const claimId = location.state?.claimId || null;

  const [email, setEmail] = useState(() => String(location.state?.email || "").trim());
  const [password, setPassword] = useState("");
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

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!email.trim() || !password) {
      setFormError("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      const result = await login(email.trim(), password);
      if (result.operator?.email_verified !== true) {
        navigate("/operator/verify-email", {
          replace: true,
          state: {
            email: email.trim(),
            nextPath,
            claimId,
            autoSend: true,
          },
        });
        return;
      }
      navigate(nextPath, { replace: true, state: { claimId } });
    } catch (err) {
      setFormError(err.message || "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Distributor sign in"
      subtitle="Sign in to continue claiming or managing your Menuply distributor profile."
      footer={(
        <p style={styles.footer}>
          New to Menuply?{" "}
          <Link
            to="/distributor/account/signup"
            state={{ nextPath, claimId, email }}
            style={styles.link}
          >
            Create distributor account
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="dist-account-login-email" style={styles.label}>
            Business email
          </label>
          <input
            id="dist-account-login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>
        <PasswordField
          id="dist-account-login-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <FormError error={formError} />
        <button type="submit" disabled={busy} style={styles.submitButton}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
