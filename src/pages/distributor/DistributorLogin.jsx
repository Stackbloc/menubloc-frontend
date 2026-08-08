import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDistributor } from "../../context/DistributorContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function DistributorLogin() {
  const { login, isAuthenticated, loading } = useDistributor();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/distributor" replace />;
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
      await login(email.trim(), password);
      navigate("/distributor", { replace: true });
    } catch (err) {
      setFormError(err.message || "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Distributor sign in"
      subtitle="Connect with restaurants that report using your distribution network."
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="dist-login-email" style={styles.label}>
            Email
          </label>
          <input
            id="dist-login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>
        <PasswordField
          id="dist-login-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {formError ? <FormError error={formError} /> : null}
        <button type="submit" disabled={busy} style={styles.submitButton}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
