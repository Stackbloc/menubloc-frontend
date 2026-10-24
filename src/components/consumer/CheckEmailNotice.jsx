/**
 * "Check your email" panel (2026-10-24): shown when sign-in or sign-up answers
 * `email_verification_required`. Resend uses the pending token from that response.
 */

import React, { useState } from "react";
import { requestEmailVerification } from "../../lib/consumerApi.js";
import { FormError, styles } from "./ConsumerAuthShared.jsx";

export default function CheckEmailNotice({ email, pendingToken, onBack }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setStatus("");
    setError("");
    setSending(true);
    try {
      await requestEmailVerification(pendingToken || null);
      setStatus("We sent a new link. It works for 24 hours.");
    } catch (err) {
      setError(err?.message || "Could not send a new link. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={styles.form} data-testid="check-email-notice">
      <p style={styles.subheading}>
        We sent a verification link to <strong>{email || "your email"}</strong>. Open it to finish, then sign in.
      </p>
      <p style={{ ...styles.subheading, fontSize: 13 }}>Can't find it? Check spam, or send a new link.</p>
      {status ? <p style={{ ...styles.subheading, fontSize: 13 }} role="status">{status}</p> : null}
      <FormError error={error} />
      <button
        type="button"
        onClick={handleResend}
        disabled={sending}
        style={{ ...styles.submitButton, ...(sending ? styles.submitButtonDisabled : null) }}
      >
        {sending ? "Sending…" : "Send a new link"}
      </button>
      {onBack ? (
        <button type="button" onClick={onBack} style={{ ...styles.link, background: "none", border: 0, cursor: "pointer", marginTop: 12 }}>
          Back to sign in
        </button>
      ) : null}
    </div>
  );
}

