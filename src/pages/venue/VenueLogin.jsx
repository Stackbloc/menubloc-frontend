import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useVenue } from "../../context/VenueContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function VenueLogin() {
  const { login, isAuthenticated, loading } = useVenue();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/venue/advertising/inventory" replace />;
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
      navigate("/venue/advertising/inventory", { replace: true });
    } catch (err) {
      setFormError(err.message || "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Venue sign in"
      subtitle="Manage advertising inventory for your destination clusters."
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="venue-login-email" style={styles.label}>
            Email
          </label>
          <input
            id="venue-login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>
        <PasswordField
          id="venue-login-password"
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
