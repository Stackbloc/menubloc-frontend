import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../lib/consumerApi.js";
import { AuthPageFrame, FormError, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      if (err?.status === 503) {
        setError(err.message);
      } else {
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageFrame
      title="Reset password"
      subtitle="Enter your email and we'll send a reset link if an account exists."
      footer={<p style={styles.footer}><Link to="/account/login" style={styles.link}>Back to sign in</Link></p>}
    >
      {submitted ? (
        <div style={styles.successNote}>
          If an account exists with that email, reset instructions have been sent. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="consumer-forgot-email" style={styles.label}>Email</label>
            <input
              id="consumer-forgot-email" type="email" autoComplete="email" autoFocus required
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={styles.input} placeholder="you@example.com"
            />
          </div>
          <FormError error={error} />
          <button
            type="submit" disabled={loading}
            style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : null) }}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthPageFrame>
  );
}
