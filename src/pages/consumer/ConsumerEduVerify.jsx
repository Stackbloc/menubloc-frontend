/**
 * Completes optional .edu email verification from a magic-link token.
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { peekEduVerification, confirmEduVerification } from "../../lib/consumerApi.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  AuthPageFrame,
  FormError,
  styles,
} from "../../components/consumer/ConsumerAuthShared.jsx";
import { formatEduVerificationBadge } from "../../lib/eduVerificationDisplay.js";

export default function ConsumerEduVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession } = useConsumer();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState("validating");
  const [peek, setPeek] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [badge, setBadge] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    peekEduVerification(token)
      .then((data) => {
        setPeek(data);
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function handleConfirm(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await confirmEduVerification(token);
      setBadge(
        result.edu_verification_badge ||
          formatEduVerificationBadge({
            institutionShort: result.edu_institution_short,
            institutionName: result.edu_institution_name,
          })
      );
      await refreshSession().catch(() => {});
      setState("done");
      setTimeout(() => navigate("/account", { replace: true }), 1800);
    } catch (err) {
      setError(err.message || "Unable to verify .edu address");
    } finally {
      setLoading(false);
    }
  }

  if (state === "validating") {
    return (
      <AuthPageFrame title="Verifying .edu link…" subtitle="">
        <p style={{ ...styles.subheading, textAlign: "center" }}>Please wait…</p>
      </AuthPageFrame>
    );
  }

  if (state === "invalid") {
    return (
      <AuthPageFrame title="Link expired" subtitle="Request a new .edu verification from your account.">
        <FormError error="This verification link is invalid or expired." />
        <Link to="/account" style={styles.link}>
          Back to account
        </Link>
      </AuthPageFrame>
    );
  }

  if (state === "done") {
    return (
      <AuthPageFrame title="School verified" subtitle="">
        <p style={{ ...styles.subheading, textAlign: "center" }}>{badge}</p>
        <p style={{ ...styles.subheading, textAlign: "center", fontSize: 13 }}>
          Affiliation signal only — not proof of current enrollment.
        </p>
      </AuthPageFrame>
    );
  }

  const school =
    peek?.institution_short || peek?.institution_name || peek?.email_domain || "your school";

  return (
    <AuthPageFrame title="Verify .edu address" subtitle={`Confirm affiliation with ${school}`}>
      <form onSubmit={handleConfirm}>
        <p style={styles.subheading}>
          This confirms you control a school email address. It does not prove current enrollment.
          Your email address is never shown publicly.
        </p>
        <FormError error={error} />
        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading ? "Verifying…" : "Confirm verification"}
        </button>
      </form>
    </AuthPageFrame>
  );
}
