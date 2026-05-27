import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { validateResetToken, resetPassword } from "../../lib/consumerApi.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  PasswordChecklist,
  PasswordMatchStatus,
  getPasswordChecklist,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerResetPassword() {
  const { t } = useLanguage();
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
    if (!token) {
      setTokenState("invalid");
      return;
    }
    validateResetToken(token)
      .then((data) => {
        setTokenEmail(data.email);
        setTokenState("valid");
      })
      .catch(() => setTokenState("invalid"));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const checklist = getPasswordChecklist(password);
    if (!checklist.minLength) {
      setError(t("auth.passwordNotMet", "Password does not meet requirements"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch", "Passwords do not match"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      await refreshSession().catch(() => {});
      setDone(true);
      setTimeout(() => navigate("/account", { replace: true }), 1800);
    } catch (err) {
      setError(err.message || t("auth.unableResetPassword", "Unable to reset password"));
    } finally {
      setLoading(false);
    }
  }

  if (tokenState === "validating") {
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
        subtitle={t("auth.linkExpiredSubtitle", "This reset link has already been used or has expired.")}
        footer={(
          <p style={styles.footer}>
            <Link to="/account/forgot-password" style={styles.link}>
              {t("auth.requestNewLink", "Request a new link")}
            </Link>
          </p>
        )}
      >
        <div />
      </AuthPageFrame>
    );
  }

  if (done) {
    return (
      <AuthPageFrame title={t("auth.setNewPasswordTitle", "Set a new password")} subtitle="">
        <div style={styles.successNote}>
          {t("auth.setNewPasswordButton", "Set new password")} — {t("auth.pleaseWait", "Please wait…")}
        </div>
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame
      title={t("auth.setNewPasswordTitle", "Set a new password")}
      subtitle={
        tokenEmail
          ? t("auth.resettingForEmail", "Resetting password for {email}").replace("{email}", tokenEmail)
          : t("auth.chooseNewPassword", "Choose a new password for your operator account.")
      }
      footer={(
        <p style={styles.footer}>
          <Link to="/account/login" style={styles.link}>
            {t("auth.backToSignIn", "Back to sign in")}
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <PasswordField
          id="consumer-new-password"
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
          id="consumer-confirm-password"
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
          disabled={loading}
          style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : null) }}
        >
          {loading ? t("auth.resetting", "Resetting…") : t("auth.setNewPasswordButton", "Set new password")}
        </button>
      </form>
    </AuthPageFrame>
  );
}
