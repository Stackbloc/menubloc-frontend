import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { validateResetToken, resetPassword } from "../../lib/consumerApi.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  AuthPageFrame, FormError, PasswordField, PasswordChecklist,
  PasswordMatchStatus, getPasswordChecklist, styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession } = useConsumer();
  const token = searchParams.get("token") || "";

  const [tokenState, setTokenState] = useState("validating");
  const [tokenEmail, setTokenEmail] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setTokenState("invalid"); return; }
    validateResetToken(token)
      .then((data) => { setTokenEmail(data.email); setTokenState("valid"); })
      .catch(() => setTokenState("invalid"));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const checklist = getPasswordChecklist(password);
    if (!checklist.minLength) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      await refreshSession().catch(() => {});
      setDone(true);
      setTimeout(() => navigate("/account", { replace: true }), 1800);
    } catch (err) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (tokenState === "validating") {
    return (
      <AuthPageFrame title="Verifying link…" subtitle="">
        <p style={{ ...styles.subheading, textAlign: "center" }}>Please wait…</p>
      </AuthPageFrame>
    );
  }

  if (tokenState === "invalid") {
    return (
      <AuthPageFrame
        title="Link expired"
        subtitle="This reset link is invalid or has expired."
        footer={<p style={styles.footer}><Link to="/account/forgot-password" style={styles.link}>Request a new link</Link></p>}
      >
        <div />
      </AuthPageFrame>
    );
  }

  if (done) {
    return (
      <AuthPageFrame title="Password reset" subtitle="">
        <div style={styles.successNote}>Password reset successfully. Redirecting to your account…</div>
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame
      title="Set new password"
      subtitle={tokenEmail ? `For account: ${tokenEmail}` : "Choose a new password for your account."}
      footer={<p style={styles.footer}><Link to="/account/login" style={styles.link}>Back to sign in</Link></p>}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <PasswordField
          id="consumer-new-password" label="New password" autoComplete="new-password"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
          placeholder="At least 8 characters"
        />
        <PasswordChecklist password={password} />
        <PasswordField
          id="consumer-confirm-password" label="Confirm new password" autoComplete="new-password"
          value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
          placeholder="Repeat new password"
        />
        <PasswordMatchStatus password={password} confirmPassword={confirmPassword} />
        <FormError error={error} />
        <button
          type="submit" disabled={loading}
          style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : null) }}
        >
          {loading ? "Saving…" : "Set new password"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
