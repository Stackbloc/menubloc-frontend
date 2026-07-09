/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorLogin.jsx
 * Updated: 2026-07-09
 * ============================================================
 */

import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { PageHero, PageShell } from "../../components/grubbid/GrubbidPrimitives.jsx";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { FormError, PasswordField } from "../../components/consumer/ConsumerAuthShared.jsx";

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

const formStyles = {
  form: {
    display: "grid",
    gap: 16,
    maxWidth: 420,
    marginTop: 8,
  },
  fieldGroup: {
    display: "grid",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    border: "1.5px solid #E5E7EB",
    borderRadius: 12,
    outline: "none",
    color: "#0B0F0C",
    background: "#fff",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  fieldError: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: 600,
  },
  submitButton: {
    display: "block",
    width: "100%",
    textAlign: "center",
    border: "none",
    borderRadius: 12,
    padding: "14px 20px",
    fontSize: 15,
    fontWeight: 800,
    background: "#1d4ed8",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  footer: {
    marginTop: 20,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 1.6,
    maxWidth: 420,
  },
  link: {
    color: "#1d4ed8",
    fontWeight: 700,
    textDecoration: "none",
  },
};

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
    <>
      <PageShell width="reading">
        <div style={{ marginBottom: 16 }}>
          <BrandLogo height={36} radius={8} matchPageBackground={false} />
        </div>

        <PageHero
          title={t("restaurants.landing.signIn", "Restaurant Sign In")}
          description={t(
            "auth.operatorSignInSubtitle",
            "Manage your restaurant on Menuply."
          )}
        />

        <form onSubmit={handleSubmit} noValidate style={formStyles.form}>
          <div style={formStyles.fieldGroup}>
            <label htmlFor="operator-login-email" style={formStyles.label}>{t("auth.email", "Email")}</label>
            <input
              id="operator-login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((cur) => ({ ...cur, email: undefined }));
              }}
              style={{ ...formStyles.input, ...(fieldErrors.email ? formStyles.inputError : null) }}
              placeholder={t("auth.emailPlaceholder", "you@restaurant.com")}
              aria-invalid={fieldErrors.email ? "true" : "false"}
              required
              autoFocus
            />
            {fieldErrors.email ? <div style={formStyles.fieldError}>{fieldErrors.email}</div> : null}
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
            style={{ ...formStyles.submitButton, ...(busy ? formStyles.submitButtonDisabled : null) }}
          >
            {busy ? t("auth.signingIn", "Signing in...") : t("auth.signIn", "Sign in")}
          </button>
        </form>

        <div style={formStyles.footer}>
          <p style={{ margin: 0 }}>
            <Link to="/operator/recover" style={formStyles.link}>{t("auth.forgotPassword", "Forgot password?")}</Link>
          </p>
          <p style={{ margin: "12px 0 0" }}>
            {t("auth.newToMenuply", "New to Menuply?")}{" "}
            <Link to="/restaurant/onboarding" style={formStyles.link}>
              {t("restaurants.landing.createAccount", "Create Restaurant Account")}
            </Link>
          </p>
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
