import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  resendOperatorEmailCode,
  sendOperatorEmailCode,
  verifyOperatorEmailCode,
} from "../../lib/operatorApi.js";
import {
  navigateWithRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
} from "../../lib/restaurantOnboardingState.js";
import {
  AuthPageFrame,
  FormError,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";

export default function OperatorEmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { operator, restaurants, isAuthenticated, isEmailVerified, refreshSession } = useOperator();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
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
    if (onboarding?.restaurant_id) {
      return onboarding?.selected_plan === "verified" || onboarding?.plan === "verified"
        ? "/restaurant/design-select"
        : "/restaurant/subscription";
    }
    return restaurants?.length === 0 ? "/operator/claim" : "/operator";
  }, [location.state, onboarding, restaurants]);

  useEffect(() => {
    if (isAuthenticated && isEmailVerified) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, isEmailVerified, navigate, nextPath]);

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
      setInfo("Check your email for your verification code.");
    } catch (error) {
      setFormError(error.message || "Unable to send verification code.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    if (!email) {
      setFormError("Email is required to verify this account.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      await verifyOperatorEmailCode(email, code);
      if (isAuthenticated) {
        await refreshSession().catch(() => {});
      }
      if (onboarding?.restaurant_id) {
        navigateWithRestaurantOnboardingState(navigate, nextPath, onboarding);
        return;
      }
      navigate(nextPath, { replace: true });
    } catch (error) {
      setFormError(error.message || "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame
      title="Verify your email"
      subtitle="Check your email for your verification code. If you don’t see it, check spam or resend the code."
      footer={(
        <p style={styles.footer}>
          <Link to="/operator/login" style={styles.link}>Back to sign in</Link>
        </p>
      )}
    >
      <form onSubmit={handleVerify} noValidate style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="operator-verify-email" style={styles.label}>Email</label>
          <input
            id="operator-verify-email"
            type="email"
            value={email}
            readOnly
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label htmlFor="operator-verify-code" style={styles.label}>Verification code</label>
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
        <FormError error={formError} />

        <button
          type="submit"
          disabled={busy}
          style={{ ...styles.submitButton, ...(busy ? styles.submitButtonDisabled : null) }}
        >
          {busy ? "Verifying..." : "Verify email"}
        </button>

        <button
          type="button"
          disabled={sending || !email}
          onClick={() => handleSendCode(resendOperatorEmailCode)}
          style={{ ...styles.submitButton, marginTop: 12, background: "#ffffff", color: "#101828", border: "1px solid #d0d5dd" }}
        >
          {sending ? "Sending..." : "Resend code"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
