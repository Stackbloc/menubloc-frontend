import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import { useOwner } from "../../context/OwnerContext.jsx";
import { AuthPageFrame, FormError, PasswordField, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

const GENERIC_ERROR = "Unable to sign in. Please check your credentials and try again.";

export default function OwnerLogin() {
  const { t } = useLanguage();
  const { login, verify2FA, isAuthenticated, loading } = useOwner();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pending2FA, setPending2FA] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loading && isAuthenticated) return <Navigate to="/owner" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await login(email.trim(), password);
      if (result?.two_factor_required) {
        setPending2FA(true);
      } else {
        navigate("/owner", { replace: true });
      }
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify2FA(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await verify2FA(code.trim());
      navigate("/owner", { replace: true });
    } catch (err) {
      const msg = err?.status === 401 ? "Invalid or expired verification code." : GENERIC_ERROR;
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (pending2FA) {
    return (
      <AuthPageFrame
        title="Verification required"
        subtitle="A code was sent to your registered phone number."
      >
        <form onSubmit={handleVerify2FA} noValidate style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="owner-2fa-code" style={styles.label}>Verification code</label>
            <input
              id="owner-2fa-code" type="text" inputMode="numeric" autoComplete="one-time-code"
              autoFocus required maxLength={6} value={code} onChange={(e) => setCode(e.target.value)}
              style={styles.input} placeholder="6-digit code"
            />
          </div>
          <FormError error={error} />
          <button
            type="submit" disabled={busy}
            style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
          >
            {busy ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button" disabled={busy}
            onClick={() => { setPending2FA(false); setCode(""); setError(""); }}
            style={{ ...styles.submitButton, marginTop: 8, background: "transparent", color: "#666", border: "1px solid #ddd" }}
          >
            Back
          </button>
        </form>
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame
      title={t("owner.login.title", "Owner sign in")}
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
