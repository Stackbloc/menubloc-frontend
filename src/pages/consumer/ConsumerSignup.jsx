import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { buildLegalConsentPayload } from "../../lib/legalConsent.js";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  SocialAuthSection,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerSignup() {
  const { signup, loginWithGoogle } = useConsumer();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => {
    const next = location.state?.redirectTo;
    return typeof next === "string" && next.trim() ? next : "/";
  }, [location.state]);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  const [formError, setFormError] = useState("");
  const [socialError, setSocialError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSocialError("");

    if (!email.trim()) { setFormError(t("auth.emailRequired", "Email is required.")); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setFormError(t("auth.validEmailRequired", "Enter a valid email address.")); return; }
    if (!password) { setFormError(t("auth.passwordRequired", "Password is required.")); return; }
    if (password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
    if (!legalConsent) {
      setFormError("You must agree to the Terms of Use and Privacy Policy and consent to electronic communications.");
      return;
    }

    setLoading(true);
    try {
      await signup({ email: email.trim(), password, confirm_password: password, ...buildLegalConsentPayload() });
      navigate("/account/welcome", { replace: true, state: { redirectTo } });
    } catch (error) {
      setFormError(error.message || t("auth.signUpFailed", "Sign up failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(credential) {
    setLoading(true);
    setFormError("");
    setSocialError("");
    try {
      if (!legalConsent) {
        setSocialError("You must agree to the Terms of Use and Privacy Policy and consent to electronic communications.");
        return;
      }
      await loginWithGoogle(credential, buildLegalConsentPayload());
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSocialError(error.message || t("auth.googleSignInFailed", "Google sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageFrame
      showLogo
      title="Join Menuply"
      subtitle="Discover menus and deals near you."
      footer={(
        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/account/login" style={styles.link}>Sign in</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="signup-email" style={styles.label}>Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="you@example.com"
            required
          />
        </div>

        <PasswordField
          id="signup-password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
        />

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={legalConsent}
            onChange={(event) => setLegalConsent(event.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.checkboxLabel}>
            I agree to the{" "}
            <Link to="/terms" target="_blank" rel="noreferrer" style={styles.link}>
              Terms of Use
            </Link>
            {" "}and{" "}
            <Link to="/privacy" target="_blank" rel="noreferrer" style={styles.link}>
              Privacy Policy
            </Link>
            {" "}and consent to receive electronic communications from Menuply regarding my account, orders, services, and important updates.
          </span>
        </label>

        <FormError error={formError} />

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : null) }}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <SocialAuthSection
        mode="signup"
        disabled={loading}
        error={socialError}
        onError={setSocialError}
        onGoogleCredential={handleGoogle}
        onApplePayload={null}
      />
    </AuthPageFrame>
  );
}
