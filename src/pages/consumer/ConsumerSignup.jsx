import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordChecklist,
  PasswordField,
  PasswordMatchStatus,
  SocialAuthSection,
  getPasswordChecklist,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerSignup() {
  const { signup, loginWithGoogle, loginWithApple } = useConsumer();
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

  function setField(key, value) {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validateFields() {
    const nextErrors = {};
    const checklist = getPasswordChecklist(fields.password);

    if (!fields.email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) nextErrors.email = "Enter a valid email address";

    if (!fields.password) nextErrors.password = "Password is required";
    else if (!(checklist.minLength && checklist.number && checklist.uppercase)) {
      nextErrors.password = "Password must be at least 8 characters and include 1 uppercase letter and 1 number";
    }

    if (!fields.confirm_password) nextErrors.confirm_password = "Confirm your password";
    else if (fields.password !== fields.confirm_password) nextErrors.confirm_password = "Passwords do not match";

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateFields();
    setFieldErrors(nextErrors);
    setFormError("");
    setSocialError("");

    if (Object.values(nextErrors).some(Boolean)) {
      setFormError("Fix the highlighted fields and try again.");
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
      setFormError(error.message || "Sign up failed. Please try again.");
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
      title="Create account"
      subtitle="Save your food preferences and favorite locations."
      footer={(
        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/account/login" style={styles.link}>Log in</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="consumer-signup-email" style={styles.label}>Email</label>
          <input
            id="consumer-signup-email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={(event) => setField("email", event.target.value)}
            style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : null) }}
            placeholder="you@example.com"
            aria-invalid={fieldErrors.email ? "true" : "false"}
            aria-describedby={fieldErrors.email ? "consumer-signup-email-error" : undefined}
            required
          />
          {fieldErrors.email ? <div id="consumer-signup-email-error" style={styles.fieldError}>{fieldErrors.email}</div> : null}
        </div>

        <PasswordField
          id="consumer-signup-password"
          label="Password"
          autoComplete="new-password"
          value={fields.password}
          onChange={(event) => setField("password", event.target.value)}
          placeholder="Create a strong password"
          error={fieldErrors.password}
          describedBy={[
            fieldErrors.password ? "consumer-signup-password-error" : null,
            "consumer-signup-password-rules",
          ].filter(Boolean).join(" ")}
        />

        <div id="consumer-signup-password-rules">
          <PasswordChecklist password={fields.password} />
        </div>

        <PasswordField
          id="consumer-signup-confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          value={fields.confirm_password}
          onChange={(event) => setField("confirm_password", event.target.value)}
          placeholder="Repeat password"
          error={fieldErrors.confirm_password}
          describedBy={fieldErrors.confirm_password ? "consumer-signup-confirm-password-error" : undefined}
        />

        <PasswordMatchStatus
          password={fields.password}
          confirmPassword={fields.confirm_password}
        />

        <div style={styles.fieldGroup}>
          <label htmlFor="consumer-signup-display-name" style={styles.label}>
            Display name <span style={styles.optional}>(optional)</span>
          </label>
          <input
            id="consumer-signup-display-name"
            type="text"
            autoComplete="name"
            value={fields.display_name}
            onChange={(event) => setField("display_name", event.target.value)}
            style={styles.input}
            placeholder="How you want to be known"
          />
        </div>

        <FormError error={formError} />

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : null) }}
        >
          {loading ? "Creating account..." : "Create account"}
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
    </AuthPageFrame>
  );
}
