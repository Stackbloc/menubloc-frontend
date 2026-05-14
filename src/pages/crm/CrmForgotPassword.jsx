import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useCrm } from "../../context/CrmContext.jsx";
import { forgotCrmPassword } from "../../lib/crmApi.js";
import { AuthPageFrame, FormError, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

export default function CrmForgotPassword() {
  const { loading, isAuthenticated } = useCrm();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/crm" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError("");
    try {
      await forgotCrmPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || "Unable to send reset email right now");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Reset your password"
      subtitle="Enter your CRM email and we'll send reset instructions."
      footer={<p style={styles.footer}><Link to="/crm/login" style={styles.link}>Back to sign in</Link></p>}
    >
      {sent ? (
        <div style={styles.successNote}>
          If an account exists for that email, reset instructions have been sent.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="crm-forgot-email" style={styles.label}>Email</label>
            <input
              id="crm-forgot-email" type="email" autoComplete="email" autoFocus required
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={styles.input} placeholder="you@menuply.com"
            />
          </div>
          <FormError error={error} />
          <button
            type="submit" disabled={busy}
            style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
          >
            {busy ? "Sending..." : "Send reset instructions"}
          </button>
        </form>
      )}
    </AuthPageFrame>
  );
}
