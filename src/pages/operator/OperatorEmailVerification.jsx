import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  resendOperatorEmailCode,
  sendOperatorEmailCode,
  verifyOperatorEmailCode,
} from "../../lib/operatorApi.js";
import {
  navigateWithRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../../lib/restaurantOnboardingState.js";
import {
  AuthPageFrame,
  FormError,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";
import { isFoodTruckRestaurant } from "../../lib/foodTruckOnboarding.js";

export default function OperatorEmailVerification() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { operator, restaurants, isAuthenticated, isEmailVerified, refreshSession } = useOperator();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [showFoodTruckVerified, setShowFoodTruckVerified] = useState(false);
  const autoSent = useRef(false);

  const onboarding = resolveRestaurantOnboardingState({
    routeState: location.state,
    search: location.search,
  }).state;

  const email = useMemo(() => {
    return String(location.state?.email || operator?.email || onboarding?.email || "").trim().toLowerCase();
  }, [location.state, operator?.email, onboarding?.email]);

  const nextPath = useMemo(() => {
    if (location.state?.nextPath) return location.state.nextPath;
    if (onboarding?.restaurant_id) return "/restaurant/onboarding/organization";
    return restaurants?.length === 0 ? "/operator/claim" : "/operator";
  }, [location.state, onboarding, restaurants]);
  const isFoodTruckVerification = useMemo(() => {
    return (
      String(nextPath || "").includes("food_truck_onboarding=1") ||
      restaurants?.some((restaurant) => isFoodTruckRestaurant(restaurant))
    );
  }, [nextPath, restaurants]);

  useEffect(() => {
    if (showFoodTruckVerified) return;
    if (isAuthenticated && isEmailVerified) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, isEmailVerified, navigate, nextPath, showFoodTruckVerified]);

  useEffect(() => {
    if (!location.state?.autoSend || !email || autoSent.current) return;
    autoSent.current = true;
    handleSendCode(sendOperatorEmailCode);
  }, [email, location.state]);

  async function handleSendCode(sender) {
    if (!email) return;
    setSending(true);
    setFormError("");
    try {
      await sender(email);
      setInfo(t("auth.checkEmailCode", "Check your email for your verification code."));
    } catch (error) {
      setFormError(error.message || t("auth.unableSendCode", "Unable to send verification code."));
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    if (!email) {
      setFormError(t("auth.emailRequiredVerify", "Email is required to verify this account."));
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      await verifyOperatorEmailCode(email, code);
      if (isAuthenticated) {
        await refreshSession().catch(() => {});
      }
      if (isFoodTruckVerification) {
        setShowFoodTruckVerified(true);
        return;
      }
      if (onboarding?.restaurant_id) {
        const nextOnboarding = {
          ...onboarding,
          current_step_key: "business_organization",
          completed_step_keys: Array.from(
            new Set([
              ...(onboarding.completed_step_keys || []),
              "create_operator_account",
              "account_created",
              "email_verified",
            ])
          ),
        };
        try {
          await syncRestaurantOnboardingProgress(nextOnboarding, {
            current_step_key: "business_organization",
            completed_step_keys: nextOnboarding.completed_step_keys,
          });
        } catch {
          /* best-effort checkpoint */
        }
        navigateWithRestaurantOnboardingState(navigate, nextPath, nextOnboarding);
        return;
      }
      navigate(nextPath, { replace: true });
    } catch (error) {
      setFormError(error.message || t("auth.verificationFailed", "Verification failed."));
    } finally {
      setBusy(false);
    }
  }

  if (showFoodTruckVerified) {
    return (
      <AuthPageFrame
        title="Your email has been verified."
        subtitle={(
          <>
            Welcome to Menuply!
            <br />
            <br />
            Let's upload your restaurant menu so we can begin building your digital menu and make your Food Truck searchable on Menuply.
          </>
        )}
        footer={null}
      >
        <button
          type="button"
          onClick={() => navigate("/restaurant/pdf-upload?food_truck_onboarding=1", { replace: true })}
          style={styles.submitButton}
        >
          Upload Menu
        </button>
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame
      title={t("auth.verifyEmailTitle", "Verify your email")}
      subtitle={t(
        "auth.verifyEmailLongSubtitle",
        "Check your email for your verification code. If you don't see it, check spam or resend the code.",
      )}
      footer={(
        <p style={styles.footer}>
          <Link to="/operator/login" style={styles.link}>
            {t("auth.backToSignIn", "Back to sign in")}
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleVerify} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="operator-verify-email" style={styles.label}>{t("auth.email", "Email")}</label>
          <input
            id="operator-verify-email"
            type="email"
            value={email}
            readOnly
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label htmlFor="operator-verify-code" style={styles.label}>
            {t("auth.verificationCode", "Verification code")}
          </label>
          <input
            id="operator-verify-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            style={styles.input}
            placeholder="123456"
            autoFocus
          />
        </div>

        {info ? <div style={{ ...styles.footer, color: "#1F4E3D" }}>{info}</div> : null}
        {onboarding?.restaurant_id ? (
          <div style={{ ...styles.footer, color: "#475467", marginBottom: 12 }}>
            {t(
              "auth.onboardingReturnNote",
              "After verification, we will return you to restaurant onboarding and keep your setup progress in place.",
            )}
          </div>
        ) : null}
        <FormError error={formError} />

        <button
          type="submit"
          disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy ? t("auth.verifying", "Verifying…") : t("auth.verifyEmailButton", "Verify email")}
        </button>

        <button
          type="button"
          disabled={sending || !email}
          onClick={() => handleSendCode(resendOperatorEmailCode)}
          style={{ ...styles.submitButton, marginTop: 12, background: "#ffffff", color: "#101828", border: "1px solid #d0d5dd" }}
        >
          {sending ? t("auth.sending", "Sending…") : t("auth.resendCode", "Resend code")}
        </button>
      </form>
    </AuthPageFrame>
  );
}
