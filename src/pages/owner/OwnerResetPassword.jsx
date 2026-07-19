import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetOperatorPassword, validateOperatorResetToken } from "../../lib/operatorApi.js";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  PasswordChecklist,
  PasswordMatchStatus,
  getPasswordChecklist,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

/**
 * Owner password reset — reuses operator reset token APIs (same operators table).
 */
export default function OwnerResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [tokenState, setTokenState] = useState("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setTokenState("invalid");
      return;
    }
    validateOperatorResetToken(token)
      .then((result) => {
        if (!cancelled) {
          setEmail(result.email || "");
          setTokenState("valid");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Reset link is invalid or expired");
          setTokenState("invalid");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const checklist = getPasswordChecklist(password);
    if (!checklist.minLength || !checklist.number || !checklist.uppercase) {
      setError("Password does not meet requirements");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await resetOperatorPassword(token, password);
      navigate("/owner/login", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to reset password");
    } finally {
      setBusy(false);
    }
  }

  if (tokenState === "checking") {
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
        subtitle={error || "This reset link has already been used or has expired."}
        footer={(
          <p style={styles.footer}>
            <Link to="/owner/recover" style={styles.link}>Request a new link</Link>
          </p>
        )}
      >
        <div />
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame
      title="Set a new password"
      subtitle={
        email
          ? `Resetting password for ${email}`
          : "Choose a new password for your owner account."
      }
      footer={(
        <p style={styles.footer}>
          <Link to="/owner/login" style={styles.link}>Back to owner sign in</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <PasswordField
          id="owner-new-password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="At least 8 characters"
        />
        <PasswordChecklist password={password} />
        <PasswordField
          id="owner-confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          placeholder="Repeat new password"
        />
        <PasswordMatchStatus password={password} confirmPassword={confirmPassword} />
        <FormError error={error} />
        <button
          type="submit"
          disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy ? "Resetting…" : "Set new password"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
