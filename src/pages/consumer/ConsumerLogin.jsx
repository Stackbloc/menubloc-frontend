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
  SocialAuthSection,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";
import { resolveConsumerAuthNext, withConsumerAuthNext } from "../../lib/consumerAuthNext.js";
import { resolveConsumerLoginErrorMessage } from "../../lib/consumerAuthErrors.js";

export default function ConsumerLogin() {
  const { login, loginWithGoogle, loginWithApple } = useConsumer();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => resolveConsumerAuthNext(location, "/"), [location]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [socialError, setSocialError] = useState("");
  const [loading, setLoading] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");

  function openPhoneVerification(payload) {
    setPhoneVerificationToken(payload?.phone_verification_token || "");
    setSmsOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const nextErrors = {};
    if (!trimmedEmail) nextErrors.email = t("auth.emailRequired", "Email is required");
    if (!password) nextErrors.password = t("auth.passwordRequired", "Password is required");

    setFieldErrors(nextErrors);
    setFormError("");
    setSocialError("");

    if (Object.values(nextErrors).some(Boolean)) {
      console.warn("LOGIN BLOCKED: missing required fields", {
        hasEmail: Boolean(trimmedEmail),
        hasPassword: Boolean(password),
      });
      setFormError(t("auth.emailAndPasswordRequired", "Email and password are required."));
      return;
    }

    setLoading(true);

    try {
      await login(trimmedEmail, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("LOGIN ERROR", err);
      if (err?.payload?.code === "phone_verification_required" || err?.payload?.requires_phone_verification) {
        openPhoneVerification(err.payload);
        return;
      }
      setFormError(
        resolveConsumerLoginErrorMessage(err, t("auth.signInFailed", "Sign in failed. Please try again."))
      );
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
      console.error("GOOGLE LOGIN ERROR", error);
      if (error?.payload?.code === "phone_verification_required" || error?.payload?.requires_phone_verification) {
        openPhoneVerification(error.payload);
        return;
      }
      setSocialError(
        resolveConsumerLoginErrorMessage(
          error,
          t("auth.googleSignInFailed", "Google sign-in failed. Please try again.")
        )
      );
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
      console.error("APPLE LOGIN ERROR", error);
      if (error?.payload?.code === "phone_verification_required" || error?.payload?.requires_phone_verification) {
        openPhoneVerification(error.payload);
        return;
      }
      setSocialError(
        resolveConsumerLoginErrorMessage(
          error,
          t("auth.appleSignInFailed", "Apple sign-in failed. Please try again.")
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StickyPageHeader />
      <AuthPageFrame
        showLogo={false}
        title={t("auth.consumerLoginTitle", "Log in")}
        subtitle={t("auth.consumerLoginSubtitle", "Welcome back to Menuply.")}
        footer={(
          <>
            <p style={styles.footer}>
              <Link to="/account/forgot-password" style={styles.link}>
                {t("auth.forgotPassword", "Forgot password?")}
              </Link>
            </p>
            <p style={{ ...styles.footer, marginTop: "12px" }}>
              {t("auth.newToMenuply", "New to Menuply?")}{" "}
              <Link to={withConsumerAuthNext("/account/signup", redirectTo)} style={styles.link}>
                {t("auth.createAccount", "Create account")}
              </Link>
            </p>
          </>
        )}
      >
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="consumer-login-email" style={styles.label}>{t("auth.email", "Email")}</label>
            <input
              id="consumer-login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : null) }}
              placeholder={t("auth.consumerEmailPlaceholder", "you@example.com")}
              aria-invalid={fieldErrors.email ? "true" : "false"}
              aria-describedby={fieldErrors.email ? "consumer-login-email-error" : undefined}
              required
            />
            {fieldErrors.email ? <div id="consumer-login-email-error" style={styles.fieldError}>{fieldErrors.email}</div> : null}
          </div>

          <PasswordField
            id="consumer-login-password"
            label={t("auth.password", "Password")}
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
            }}
            placeholder={t("auth.passwordPlaceholder", "Your password")}
            error={fieldErrors.password}
            describedBy={fieldErrors.password ? "consumer-login-password-error" : undefined}
          />

          <FormError error={formError} />

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : null) }}
          >
            {loading ? t("auth.loggingIn", "Logging in…") : t("auth.signIn", "Sign in")}
          </button>
        </form>

        <SocialAuthSection
          mode="login"
          disabled={loading}
          error={socialError}
          onError={setSocialError}
          onGoogleCredential={handleGoogle}
          onApplePayload={handleApple}
        />
      </AuthPageFrame>

      <SmsAuthModal
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        purpose="login"
        verificationToken={phoneVerificationToken || null}
        onSuccess={() => navigate(redirectTo, { replace: true })}
      />
      <BottomNav />
    </>
  );
}
