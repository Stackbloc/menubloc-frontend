/**
 * Confirms a diner's account email from the emailed link (2026-10-24).
 * Confirming doesn't sign in (the link may be opened on another device).
 */

import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { peekEmailVerification, confirmEmailVerification } from "../../lib/consumerApi.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { AuthPageFrame, FormError, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerVerifyEmail() {
  const [searchParams] = useSearchParams();
  const { refreshSession } = useConsumer();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState("validating");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    peekEmailVerification(token)
      .then(() => setState("ready"))
      .catch(() => setState("invalid"));
  }, [token]);

  async function handleConfirm(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmEmailVerification(token);
      await refreshSession().catch(() => {});
      setState("done");
    } catch (err) {
      setError(err.message || "Unable to verify your email");
    } finally {
      setLoading(false);
    }
  }

  if (state === "validating") {
    return (
      <AuthPageFrame title="Checking your link…" subtitle="">
        <p style={{ ...styles.subheading, textAlign: "center" }}>Please wait…</p>
      </AuthPageFrame>
    );
  }

  if (state === "invalid") {
    return (
      <AuthPageFrame title="Link expired" subtitle="Sign in to get a new verification link.">
        <FormError error="This verification link is invalid or expired." />
        <Link to="/account/login" style={styles.link}>
          Go to sign in
        </Link>
      </AuthPageFrame>
    );
  }

  if (state === "done") {
    return (
      <AuthPageFrame title="Email verified" subtitle="">
        <p style={{ ...styles.subheading, textAlign: "center" }}>Thanks! Your email is confirmed.</p>
        <Link to="/account/login" style={styles.link} data-testid="verify-email-sign-in">
          Sign in
        </Link>
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame title="Verify your email" subtitle="Confirm this is your Menuply email address.">
      <form onSubmit={handleConfirm}>
        <FormError error={error} />
        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading ? "Verifying…" : "Verify email"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
