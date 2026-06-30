/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorLogin.jsx
 * Updated: 2026-04-07
 * ============================================================
 */

import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  AuthPageFrame,
  FormError,
  PasswordField,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

function resolveOnboardingDest(restaurant) {
  if (!restaurant) return "/operator/claim";
  const step = restaurant.current_step_key;
  if (!step) return restaurant.has_published_menu ? "/operator" : "/restaurant/onboarding/welcome";
  switch (step) {
    case "menu_live": return "/operator";
    case "import_menu": return "/restaurant/onboarding/welcome";
    case "process_menu": return "/restaurant/onboarding/processing";
    case "review_menu":
    case "publish_menu": return "/operator/menulab";
    default: return "/operator";
  }
}

function onboardingStateForResume(restaurant, email, routeState) {
  if (!restaurant) return undefined;
  return {
    restaurant_id: routeState?.restaurant_id || restaurant.id,
    restaurant_name: routeState?.restaurant_name || restaurant.restaurant_name,
    email,
  };
}

function resolvePostLoginDest(restaurant, preferredNextPath) {
  const nextPath = String(preferredNextPath || "").trim();
  if (nextPath.startsWith("/")) return nextPath;
  return resolveOnboardingDest(restaurant);
}

export default function OperatorLogin() {
  const { login, isAuthenticated, isEmailVerified, loading, operator, restaurants } = useOperator();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const preferredNextPath = location.state?.nextPath;

  const [email, setEmail] = useState(() => String(location.state?.email || "").trim());
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromState = String(location.state?.email || "").trim();
    if (fromState) setEmail(fromState);
  }, [location.state?.email]);

  if (!loading && isAuthenticated) {
    if (!isEmailVerified) {
      const dest = restaurants?.length === 0
        ? "/operator/claim"
        : resolvePostLoginDest(restaurants?.[0], preferredNextPath);
      return <Navigate to="/operator/verify-email" replace state={{ email: operator?.email, nextPath: dest }} />;
    }
    if (!restaurants?.length) return <Navigate to="/operator/claim" replace />;
    const dest = resolvePostLoginDest(restaurants[0], preferredNextPath);
    return (
      <Navigate
        to={dest}
        replace
        state={onboardingStateForResume(restaurants[0], operator?.email, location.state)}
      />
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const nextErrors = {};
    if (!email.trim()) nextErrors.email = t("auth.emailRequired", "Email is required");
    if (!password) nextErrors.password = t("auth.passwordRequired", "Password is required");
    setFieldErrors(nextErrors);
    setFormError("");

    if (Object.values(nextErrors).some(Boolean)) {
      setFormError(t("auth.emailAndPasswordRequired", "Email and password are required."));
      return;
    }

    setBusy(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.restaurants?.length) {
        navigate("/operator/claim", { replace: true });
        return;
      }
      const dest = resolvePostLoginDest(result.restaurants[0], preferredNextPath);
      if (result.operator?.email_verified !== true) {
        navigate("/operator/verify-email", {
          replace: true,
          state: { email: email.trim(), nextPath: dest, autoSend: true },
        });
        return;
      }
      navigate(dest, {
        replace: true,
        state: onboardingStateForResume(result.restaurants[0], email.trim(), location.state),
      });
    } catch (err) {
      setFormError(err.message || t("auth.signInFailed", "Sign in failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title={t("auth.operatorSignInTitle", "Operator sign in")}
      subtitle={t("auth.operatorSignInSubtitle", "Manage your restaurant on Menuply.")}
      footer={(
        <>
          <p style={styles.footer}>
            <Link to="/operator/recover" style={styles.link}>{t("auth.forgotPassword", "Forgot password?")}</Link>
          </p>
          <p style={{ ...styles.footer, marginTop: "12px" }}>
            {t("auth.newToMenuply", "New to Menuply?")}{" "}
            <Link to="/operator/signup" style={styles.link}>{t("auth.createAccount", "Create operator account")}</Link>
          </p>
        </>
      )}
    >
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="operator-login-email" style={styles.label}>{t("auth.email", "Email")}</label>
          <input
            id="operator-login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((cur) => ({ ...cur, email: undefined }));
            }}
            style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : null) }}
            placeholder={t("auth.emailPlaceholder", "you@restaurant.com")}
            aria-invalid={fieldErrors.email ? "true" : "false"}
            required
            autoFocus
          />
          {fieldErrors.email ? <div style={styles.fieldError}>{fieldErrors.email}</div> : null}
        </div>

        <PasswordField
          id="operator-login-password"
          label={t("auth.password", "Password")}
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((cur) => ({ ...cur, password: undefined }));
          }}
          placeholder={t("auth.passwordPlaceholder", "Your password")}
          error={fieldErrors.password}
        />

        <FormError error={formError} />

        <button
          type="submit"
          disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy ? t("auth.signingIn", "Signing in...") : t("auth.signIn", "Sign in")}
        </button>
      </form>
    </AuthPageFrame>
  );
}
