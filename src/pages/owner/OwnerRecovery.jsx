import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useOwner } from "../../context/OwnerContext.jsx";
import { requestOperatorRecovery } from "../../lib/operatorApi.js";
import { AuthPageFrame, FormError, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

/**
 * Owner password recovery — same operators table + /operator/auth/forgot,
 * with audience=owner so the email links to /owner/reset-password.
 */
export default function OwnerRecovery() {
  const { isAuthenticated, loading } = useOwner();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/owner" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await requestOperatorRecovery(email.trim(), { audience: "owner" });
      setSent(true);
    } catch (err) {
      setError(err.message || "Unable to request recovery right now");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Reset your password"
      subtitle="Enter the email for your owner account and we'll send reset instructions."
      footer={(
        <p style={styles.footer}>
          <Link to="/owner/login" style={styles.link}>Back to owner sign in</Link>
        </p>
      )}
    >
      {sent ? (
        <div style={styles.successNote}>
          If an account exists for that email, reset instructions have been sent.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="owner-recovery-email" style={styles.label}>Account email</label>
            <input
              id="owner-recovery-email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@menuply.com"
            />
          </div>
          <FormError error={error} />
          <button
            type="submit"
            disabled={busy}
            style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
          >
            {busy ? "Sending…" : "Send recovery instructions"}
          </button>
        </form>
      )}
    </AuthPageFrame>
  );
}
