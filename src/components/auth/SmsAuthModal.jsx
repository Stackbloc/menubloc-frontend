import { useEffect, useState } from "react";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  formatCodeSentNotice,
  resolveSmsAuthErrorMessage,
  SMS_AUTH_MESSAGES,
} from "../../lib/smsAuthMessages.js";

export default function SmsAuthModal({ open, onClose, onSuccess }) {
  const { sendSmsCode, verifySmsCode } = useConsumer();
  const [step, setStep] = useState("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verificationSid, setVerificationSid] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [expirationHint, setExpirationHint] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhoneInput("");
      setVerifiedPhone("");
      setVerificationSid("");
      setCode("");
      setLoading(false);
      setError("");
      setNotice("");
      setResendTimer(0);
      setExpirationHint("");
    }
  }, [open]);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const id = window.setTimeout(() => setResendTimer((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [resendTimer]);

  if (!open) return null;

  function applySendResult(result) {
    const canonicalPhone = result?.phone_number || verifiedPhone || phoneInput;
    setVerifiedPhone(canonicalPhone);
    setVerificationSid(result?.verification_sid || "");
    setStep("code");
    setNotice(
      formatCodeSentNotice({
        verificationTtlMinutes: result?.verification_ttl_minutes,
        expiresInSeconds: result?.expires_in_seconds,
      })
    );
    setExpirationHint(
      formatCodeSentNotice({
        verificationTtlMinutes: result?.verification_ttl_minutes,
        expiresInSeconds: result?.expires_in_seconds,
      })
    );
    setResendTimer(30);
  }

  async function handleSendCode(event) {
    if (event?.preventDefault) event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const phoneToSend = verifiedPhone || phoneInput;
      const result = await sendSmsCode(phoneToSend);
      applySendResult(result);
    } catch (err) {
      setError(resolveSmsAuthErrorMessage(err, SMS_AUTH_MESSAGES.sendFailed));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    if (!verifiedPhone) {
      setError(SMS_AUTH_MESSAGES.sendFailed);
      setStep("phone");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await verifySmsCode(verifiedPhone, code, verificationSid || null);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(resolveSmsAuthErrorMessage(err, SMS_AUTH_MESSAGES.verifyFailed));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        background: "rgba(15,23,42,0.52)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={() => onClose?.()}
      role="presentation"
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 24,
          background: "#fff",
          padding: 20,
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 28px 72px rgba(15,23,42,0.28)",
        }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in by text"
      >
        <div style={{ fontSize: 20, fontWeight: 900, color: "#11211a" }}>Verify your phone to continue</div>
        <div style={{ marginTop: 8, fontSize: 13, color: "#667085", lineHeight: 1.6 }}>
          We'll text you a one-time code. No password needed.
        </div>
        {expirationHint ? (
          <div style={{ marginTop: 8, fontSize: 12, color: "#667085", fontWeight: 700 }}>
            {expirationHint}
          </div>
        ) : null}

        {step === "phone" ? (
          <form onSubmit={handleSendCode} style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <input
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder="+1 213 555 1234"
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 14,
                border: "1px solid #d0d5dd",
                padding: "12px 14px",
                fontSize: 16,
                background: "#fff",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                border: "none",
                borderRadius: 16,
                background: "#11211a",
                color: "#fff",
                padding: "14px 16px",
                fontSize: 15,
                fontWeight: 900,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Sending code..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#667085", fontWeight: 700 }}>
              Code sent to {verifiedPhone}
            </div>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 14,
                border: "1px solid #d0d5dd",
                padding: "12px 14px",
                fontSize: 20,
                letterSpacing: 6,
                textAlign: "center",
                background: "#fff",
              }}
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                border: "none",
                borderRadius: 16,
                background: "#11211a",
                color: "#fff",
                padding: "14px 16px",
                fontSize: 15,
                fontWeight: 900,
                cursor: loading ? "wait" : "pointer",
                opacity: code.length !== 6 ? 0.7 : 1,
              }}
            >
              {loading ? "Verifying..." : "Verify code"}
            </button>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading || resendTimer > 0}
              style={{
                border: "1px solid rgba(17,33,26,0.12)",
                borderRadius: 16,
                background: "#fff",
                color: "#11211a",
                padding: "12px 14px",
                fontSize: 14,
                fontWeight: 800,
                cursor: loading || resendTimer > 0 ? "not-allowed" : "pointer",
                opacity: loading || resendTimer > 0 ? 0.6 : 1,
              }}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
            </button>
          </form>
        )}

        {notice ? <div style={{ marginTop: 12, fontSize: 13, color: "#14532d", fontWeight: 700 }}>{notice}</div> : null}
        {error ? <div style={{ marginTop: 12, fontSize: 13, color: "#991b1b", fontWeight: 700 }}>{error}</div> : null}

        <button
          type="button"
          onClick={() => onClose?.()}
          style={{
            marginTop: 16,
            border: "none",
            background: "transparent",
            color: "#667085",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
