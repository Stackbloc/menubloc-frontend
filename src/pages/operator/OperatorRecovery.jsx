import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { requestOperatorRecovery } from "../../lib/operatorApi.js";
import { AuthPageFrame, FormError, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

export default function OperatorRecovery() {
  const { isAuthenticated, loading } = useOperator();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/operator" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await requestOperatorRecovery(email.trim());
      setSent(true);
      void result;
    } catch (err) {
      setError(err.message || t("auth.recoveryFailed", "Unable to request recovery right now"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title={t("auth.recoverTitle", "Reset your password")}
      subtitle={t(
        "auth.recoverSubtitleLong",
        "Enter the email tied to your operator account and we'll send reset instructions.",
      )}
      footer={(
        <p style={styles.footer}>
          <Link to="/operator/login" style={styles.link}>
            {t("auth.backToSignIn", "Back to sign in")}
          </Link>
        </p>
      )}
    >
      {sent ? (
        <div style={styles.successNote}>
          {t("auth.recoverySent", "If an account exists, recovery instructions have been sent.")}
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="op-recovery-email" style={styles.label}>
              {t("auth.accountEmail", "Account email")}
            </label>
            <input
              id="op-recovery-email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder={t("auth.emailPlaceholder", "you@restaurant.com")}
            />
          </div>
          <FormError error={error} />
          <button
            type="submit"
            disabled={busy}
            style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
          >
            {busy
              ? t("auth.sending", "Sending…")
              : t("auth.sendRecoveryInstructions", "Send recovery instructions")}
          </button>
        </form>
      )}
    </AuthPageFrame>
  );
}
