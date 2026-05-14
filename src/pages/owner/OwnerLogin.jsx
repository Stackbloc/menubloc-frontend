import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useOwner } from "../../context/OwnerContext.jsx";
import { AuthPageFrame, FormError, PasswordField, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

export default function OwnerLogin() {
  const { login, isAuthenticated, loading } = useOwner();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loading && isAuthenticated) return <Navigate to="/owner" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/owner", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Owner sign in"
      subtitle="Platform control and system-wide administrative access."
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="owner-email" style={styles.label}>Email</label>
          <input
            id="owner-email" type="email" autoComplete="email" autoFocus required
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={styles.input} placeholder="you@menuply.com"
          />
        </div>
        <PasswordField
          id="owner-password" label="Password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
        />
        <FormError error={error} />
        <button
          type="submit" disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy ? "Signing in..." : "Sign in to owner backend"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
