import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCrm } from "../../context/CrmContext.jsx";
import { AuthPageFrame, FormError, PasswordField, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

export default function CrmLogin() {
  const { login, loading, isAuthenticated } = useCrm();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/crm" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";
    setFieldErrors(nextErrors);
    setFormError("");
    if (Object.values(nextErrors).some(Boolean)) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/crm", { replace: true });
    } catch (err) {
      setFormError(err.message || "Unable to sign in to CRM");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="CRM sign in"
      subtitle="Internal Menuply team access only."
      footer={<p style={styles.footer}><Link to="/crm/forgot-password" style={styles.link}>Forgot password?</Link></p>}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="crm-email" style={styles.label}>Email</label>
          <input
            id="crm-email" type="email" autoComplete="email" autoFocus required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors((c) => ({ ...c, email: undefined })); }}
            style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : null) }}
            placeholder="you@menuply.com"
          />
          {fieldErrors.email ? <div style={styles.fieldError}>{fieldErrors.email}</div> : null}
        </div>
        <PasswordField
          id="crm-password" label="Password" autoComplete="current-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((c) => ({ ...c, password: undefined })); }}
          placeholder="Your password" error={fieldErrors.password}
        />
        <FormError error={formError} />
        <button
          type="submit" disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy ? "Signing in..." : "Sign in to CRM"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
