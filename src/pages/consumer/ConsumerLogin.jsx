import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SmsAuthModal from "../../components/auth/SmsAuthModal.jsx";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  SocialAuthSection,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export default function ConsumerLogin() {
  const { refreshSession, loginWithGoogle, loginWithApple } = useConsumer();
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
  const [smsOpen, setSmsOpen] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const nextErrors = {};
    if (!trimmedEmail) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";

    setFieldErrors(nextErrors);
    setFormError("");
    setSocialError("");

    if (Object.values(nextErrors).some(Boolean)) {
      console.warn("LOGIN BLOCKED: missing required fields", {
        hasEmail: Boolean(trimmedEmail),
        hasPassword: Boolean(password),
      });
      setFormError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      console.log("LOGIN CLICKED");
      console.log("EMAIL:", trimmedEmail);
      console.log("API BASE:", API_BASE);
      console.log("ABOUT TO FETCH");

      const res = await fetch(`${API_BASE}/api/consumer-auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      console.log("FETCH RESPONSE", res.status);

      let payload = {};
      try {
        payload = await res.json();
      } catch (parseError) {
        console.error("LOGIN RESPONSE PARSE ERROR", parseError);
      }

      if (!res.ok) {
        const message = payload?.error || `Login failed (${res.status})`;
        throw new Error(message);
      }

      await refreshSession();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("LOGIN ERROR", err);
      setFormError(err?.message || "Login failed. Please try again.");
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
      console.error("APPLE LOGIN ERROR", error);
      setSocialError(error.message || "Apple sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StickyPageHeader />
      <AuthPageFrame
        showLogo={false}
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

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setSmsOpen(true)}
            style={{ background: "none", border: "none", color: "#1F4E3D", fontWeight: 800, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}
          >
            Sign in with phone number
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
