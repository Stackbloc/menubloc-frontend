import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
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

export default function OperatorResetPassword() {
  const { t } = useLanguage();
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
          setError(err.message || t("auth.resetLinkInvalid", "Reset link is invalid or expired"));
          setTokenState("invalid");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  async function handleSubmit(e) {
    e.preventDefault();
    const checklist = getPasswordChecklist(password);
    if (!checklist.minLength || !checklist.number || !checklist.uppercase) {
      setError(t("auth.passwordNotMet", "Password does not meet requirements"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch", "Passwords do not match"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await resetOperatorPassword(token, password);
      navigate("/operator", { replace: true });
    } catch (err) {
      setError(err.message || t("auth.unableResetPassword", "Unable to reset password"));
    } finally {
      setBusy(false);
    }
  }

  if (tokenState === "checking") {
    return (
      <AuthPageFrame title={t("auth.verifyingLink", "Verifying link…")} subtitle="">
        <p style={{ ...styles.subheading, textAlign: "center" }}>
          {t("auth.pleaseWait", "Please wait…")}
        </p>
      </AuthPageFrame>
    );
  }

  if (tokenState === "invalid") {
    return (
      <AuthPageFrame
        title={t("auth.linkExpiredTitle", "Link expired or invalid")}
        subtitle={error || t("auth.linkExpiredSubtitle", "This reset link has already been used or has expired.")}
        footer={(
          <p style={styles.footer}>
            <Link to="/operator/recover" style={styles.link}>
              {t("auth.requestNewLink", "Request a new link")}
            </Link>
          </p>
        )}
      >
        <div />
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame
      title={t("auth.setNewPasswordTitle", "Set a new password")}
      subtitle={
        email
          ? t("auth.resettingForEmail", "Resetting password for {email}").replace("{email}", email)
          : t("auth.chooseNewPassword", "Choose a new password for your operator account.")
      }
      footer={(
        <p style={styles.footer}>
          <Link to="/operator/login" style={styles.link}>
            {t("auth.backToSignIn", "Back to sign in")}
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <PasswordField
          id="op-new-password"
          label={t("auth.newPassword", "New password")}
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder={t("auth.passwordMinPlaceholder", "At least 8 characters")}
        />
        <PasswordChecklist password={password} />
        <PasswordField
          id="op-confirm-password"
          label={t("auth.confirmPassword", "Confirm password")}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          placeholder={t("auth.repeatNewPassword", "Repeat new password")}
        />
        <PasswordMatchStatus password={password} confirmPassword={confirmPassword} />
        <FormError error={error} />
        <button
          type="submit"
          disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy
            ? t("auth.resetting", "Resetting…")
            : t("auth.setNewPasswordButton", "Set new password")}
        </button>
      </form>
    </AuthPageFrame>
  );
}
