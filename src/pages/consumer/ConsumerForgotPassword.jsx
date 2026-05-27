import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { forgotPassword } from "../../lib/consumerApi.js";
import { AuthPageFrame, FormError, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("auth.emailRequired", "Email is required"));
      return;
    }
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
      title={t("auth.recoverTitle", "Reset your password")}
      subtitle={t("auth.recoverSubtitle", "We will email you a reset link.")}
      footer={(
        <p style={styles.footer}>
          <Link to="/account/login" style={styles.link}>
            {t("auth.backToSignIn", "Back to sign in")}
          </Link>
        </p>
      )}
    >
      {submitted ? (
        <div style={styles.successNote}>
          {t("auth.recoverySent", "If an account exists, recovery instructions have been sent.")}
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="consumer-forgot-email" style={styles.label}>
              {t("auth.email", "Email")}
            </label>
            <input
              id="consumer-forgot-email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder={t("auth.consumerEmailPlaceholder", "you@example.com")}
            />
          </div>
          <FormError error={error} />
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : null) }}
          >
            {loading ? t("auth.sending", "Sending…") : t("auth.sendResetLink", "Send reset link")}
          </button>
        </form>
      )}
    </AuthPageFrame>
  );
}
