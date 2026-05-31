import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SmsAuthModal from "../../components/auth/SmsAuthModal.jsx";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  PasswordMatchStatus,
  SocialAuthSection,
  getPasswordChecklist,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerSignup() {
  const { signup, loginWithGoogle, loginWithApple } = useConsumer();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => {
    const next = location.state?.redirectTo;
    return typeof next === "string" && next.trim() ? next : "/";
  }, [location.state]);

  const [fields, setFields] = useState({
    email: "",
    password: "",
    confirm_password: "",
    display_name: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [socialError, setSocialError] = useState("");
  const [loading, setLoading] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);

  function setField(key, value) {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validateFields() {
    const nextErrors = {};
    const checklist = getPasswordChecklist(fields.password);

    if (!fields.email.trim()) nextErrors.email = t("auth.emailRequired", "Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      nextErrors.email = t("auth.validEmailRequired", "Enter a valid email address");
    }

    if (!fields.password) nextErrors.password = t("auth.passwordRequired", "Password is required");
    else if (!(checklist.minLength && checklist.number && checklist.uppercase)) {
      nextErrors.password = t("auth.passwordRules", "Password must be at least 8 characters and include 1 uppercase letter and 1 number");
    }

    if (!fields.confirm_password) nextErrors.confirm_password = t("auth.confirmPasswordRequired", "Confirm your password");
    else if (fields.password !== fields.confirm_password) {
      nextErrors.confirm_password = t("auth.passwordsDoNotMatch", "Passwords do not match");
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateFields();
    setFieldErrors(nextErrors);
    setFormError("");
    setSocialError("");

    if (Object.values(nextErrors).some(Boolean)) {
      setFormError(t("auth.fixHighlightedFields", "Fix the highlighted fields and try again."));
      return;
    }

    setLoading(true);
    try {
      await signup({
        email: fields.email.trim(),
        password: fields.password,
        confirm_password: fields.confirm_password,
        display_name: fields.display_name.trim() || undefined,
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const payload = error?.payload || {};
      setFormError(error.message || t("auth.signUpFailed", "Sign up failed. Please try again."));
      setFieldErrors(payload.field_errors || {});
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(credential) {
    setLoading(true);
    setFormError("");
    setSocialError("");
    try {
      await loginWithGoogle(credential);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSocialError(error.message || t("auth.googleSignInFailed", "Google sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleApple(payload) {
    setLoading(true);
    setFormError("");
    setSocialError("");
    try {
      await loginWithApple(payload);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSocialError(error.message || t("auth.appleSignInFailed", "Apple sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <StickyPageHeader />
    <AuthPageFrame
      showLogo={false}
      title={t("auth.consumerSignUpTitle", "Create your account")}
      subtitle={t("auth.consumerSignUpPageSubtitle", "Save your food preferences and favorite locations.")}
      footer={(
        <p style={styles.footer}>
          {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
          <Link to="/account/login" style={styles.link}>{t("auth.signIn", "Sign in")}</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="consumer-signup-email" style={styles.label}>{t("auth.email", "Email")}</label>
          <input
            id="consumer-signup-email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={(event) => setField("email", event.target.value)}
            style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : null) }}
            placeholder={t("auth.consumerEmailPlaceholder", "you@example.com")}
            aria-invalid={fieldErrors.email ? "true" : "false"}
            aria-describedby={fieldErrors.email ? "consumer-signup-email-error" : undefined}
            required
          />
          {fieldErrors.email ? <div id="consumer-signup-email-error" style={styles.fieldError}>{fieldErrors.email}</div> : null}
        </div>

        <PasswordField
          id="consumer-signup-password"
          label={t("auth.password", "Password")}
          autoComplete="new-password"
          value={fields.password}
          onChange={(event) => setField("password", event.target.value)}
          placeholder={t("auth.createStrongPassword", "Create a strong password")}
          error={fieldErrors.password}
          hint="Min. 8 characters · 1 uppercase · 1 number"
          describedBy={fieldErrors.password ? "consumer-signup-password-error" : undefined}
        />

        <PasswordField
          id="consumer-signup-confirm-password"
          label={t("auth.confirmPassword", "Confirm password")}
          autoComplete="new-password"
          value={fields.confirm_password}
          onChange={(event) => setField("confirm_password", event.target.value)}
          placeholder={t("auth.repeatPassword", "Repeat password")}
          error={fieldErrors.confirm_password}
          describedBy={fieldErrors.confirm_password ? "consumer-signup-confirm-password-error" : undefined}
        />

        <PasswordMatchStatus
          password={fields.password}
          confirmPassword={fields.confirm_password}
        />

        <div style={styles.fieldGroup}>
          <label htmlFor="consumer-signup-display-name" style={styles.label}>
            {t("auth.displayName", "Display name")}{" "}
            <span style={styles.optional}>{t("auth.displayNameOptional", "(optional)")}</span>
          </label>
          <input
            id="consumer-signup-display-name"
            type="text"
            autoComplete="name"
            value={fields.display_name}
            onChange={(event) => setField("display_name", event.target.value)}
            style={styles.input}
            placeholder={t("auth.displayNamePlaceholder", "How you want to be known")}
          />
        </div>

        <FormError error={formError} />

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : null) }}
        >
          {loading ? t("auth.signingUp", "Creating account…") : t("auth.createAccount", "Create account")}
        </button>
      </form>

      <SocialAuthSection
        mode="signup"
        disabled={loading}
        error={socialError}
        onError={setSocialError}
        onGoogleCredential={handleGoogle}
        onApplePayload={handleApple}
      />

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setSmsOpen(true)}
          style={{ background: "none", border: "none", color: "#1F4E3D", fontWeight: 800, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}
        >
          {t("auth.signUpWithPhone", "Sign up with phone number")}
        </button>
      </div>
    </AuthPageFrame>

    <SmsAuthModal
      open={smsOpen}
      onClose={() => setSmsOpen(false)}
      onSuccess={() => navigate(redirectTo, { replace: true })}
    />
    <BottomNav />
    </>
  );
}
