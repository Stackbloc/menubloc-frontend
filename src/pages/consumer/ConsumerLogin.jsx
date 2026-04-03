import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  SocialAuthSection,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerLogin() {
  const { login, loginWithGoogle, loginWithApple } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => {
    const next = location.state?.redirectTo;
    return typeof next === "string" && next.trim() ? next : "/";
  }, [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [socialError, setSocialError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";

    setFieldErrors(nextErrors);
    setFormError("");
    setSocialError("");

    if (Object.values(nextErrors).some(Boolean)) {
      setFormError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(error.message || "Login failed. Please try again.");
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
      setSocialError(error.message || "Google sign-in failed. Please try again.");
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
      setSocialError(error.message || "Apple sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageFrame
      title="Log in"
      subtitle="Use your Grubbid account, Google, or Apple."
      footer={(
        <>
          <p style={styles.footer}>
            <Link to="/account/forgot-password" style={styles.link}>Forgot password?</Link>
          </p>
          <p style={{ ...styles.footer, marginTop: "12px" }}>
            New to Grubbid?{" "}
            <Link to="/account/signup" style={styles.link}>Create account</Link>
          </p>
        </>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="consumer-login-email" style={styles.label}>Email</label>
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
            placeholder="you@example.com"
            aria-invalid={fieldErrors.email ? "true" : "false"}
            aria-describedby={fieldErrors.email ? "consumer-login-email-error" : undefined}
            required
          />
          {fieldErrors.email ? <div id="consumer-login-email-error" style={styles.fieldError}>{fieldErrors.email}</div> : null}
        </div>

        <PasswordField
          id="consumer-login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          placeholder="Your password"
          error={fieldErrors.password}
          describedBy={fieldErrors.password ? "consumer-login-password-error" : undefined}
        />

        <FormError error={formError} />

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : null) }}
        >
          {loading ? "Logging in..." : "Log in"}
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
  );
}
