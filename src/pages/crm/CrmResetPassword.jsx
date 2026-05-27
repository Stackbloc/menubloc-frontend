import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useCrm } from "../../context/CrmContext.jsx";
import { verifyCrmResetToken, resetCrmPassword } from "../../lib/crmApi.js";
import {
  AuthPageFrame, FormError, PasswordField, PasswordChecklist,
  PasswordMatchStatus, getPasswordChecklist, styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function CrmResetPassword() {
  const { t } = useLanguage();
  const { loading, isAuthenticated, refreshSession } = useCrm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [tokenState, setTokenState] = useState("verifying");
  const [tokenEmail, setTokenEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loading && isAuthenticated) return <Navigate to="/crm" replace />;

  useEffect(() => {
    if (!token) { setTokenState("invalid"); return; }
    verifyCrmResetToken(token)
      .then((data) => { setTokenEmail(data.email || ""); setTokenState("valid"); })
      .catch(() => setTokenState("invalid"));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const checklist = getPasswordChecklist(password);
    if (!checklist.minLength || !checklist.number || !checklist.uppercase) {
      setError("Password does not meet requirements");
      return;
    }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setBusy(true);
    setError("");
    try {
      await resetCrmPassword(token, password);
      await refreshSession().catch(() => {});
      navigate("/crm", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to reset password right now");
    } finally {
      setBusy(false);
    }
  }

  if (tokenState === "verifying") {
    return (
      <AuthPageFrame title="Verifying link…" subtitle="">
        <p style={{ ...styles.subheading, textAlign: "center" }}>Please wait…</p>
      </AuthPageFrame>
    );
  }

  if (tokenState === "invalid") {
    return (
      <AuthPageFrame
        title="Link expired or invalid"
        subtitle="This reset link has already been used or has expired."
        footer={<p style={styles.footer}><Link to="/crm/forgot-password" style={styles.link}>Request a new link</Link></p>}
      >
        <div />
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame
      title="Set a new password"
      subtitle={tokenEmail ? `Resetting password for ${tokenEmail}` : "Choose a new CRM password."}
      footer={<p style={styles.footer}><Link to="/crm/login" style={styles.link}>Back to sign in</Link></p>}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <PasswordField
          id="crm-new-password" label="New password" autoComplete="new-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          placeholder="At least 8 characters"
        />
        <PasswordChecklist password={password} />
        <PasswordField
          id="crm-confirm-password" label="Confirm password" autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
          placeholder="Repeat new password"
        />
        <PasswordMatchStatus password={password} confirmPassword={confirmPassword} />
        <FormError error={error} />
        <button
          type="submit" disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy ? "Resetting…" : "Set new password"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
