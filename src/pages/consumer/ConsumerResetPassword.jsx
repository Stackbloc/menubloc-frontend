/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/consumer/ConsumerResetPassword.jsx
 * Purpose:
 *   Consumer reset password page. Reads ?token= from URL,
 *   validates it with the backend, then shows the new-password form.
 * ============================================================
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { validateResetToken, resetPassword } from "../../lib/consumerApi.js";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";

export default function ConsumerResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession } = useConsumer();
  const token = searchParams.get("token") || "";

  const [tokenState, setTokenState] = useState("validating"); // validating | valid | invalid
  const [tokenEmail, setTokenEmail] = useState(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      return;
    }

    validateResetToken(token)
      .then((data) => {
        setTokenEmail(data.email);
        setTokenState("valid");
      })
      .catch(() => {
        setTokenState("invalid");
      });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await resetPassword(token, password);
      await refreshSession().catch(() => {});
      setDone(true);
      setTimeout(() => navigate("/account", { replace: true }), 1800);
    } catch (err) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (tokenState === "validating") {
    return (
      <>
      <StickyPageHeader />
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.subheading}>Validating reset link…</p>
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  if (tokenState === "invalid") {
    return (
      <>
      <StickyPageHeader />
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Link expired</h1>
          <p style={styles.subheading}>
            This reset link is invalid or has expired. Request a new one.
          </p>
          <p style={styles.footer}>
            <Link to="/account/forgot-password" style={styles.link}>Request new link</Link>
          </p>
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  if (done) {
    return (
      <>
      <StickyPageHeader />
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.successMsg}>Password reset. Redirecting to your account…</p>
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  return (
    <>
    <StickyPageHeader />
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Set new password</h1>
        {tokenEmail && (
          <p style={styles.subheading}>For account: {tokenEmail}</p>
        )}

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <label style={styles.label}>
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="At least 8 characters"
              required
            />
          </label>

          <label style={styles.label}>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              placeholder="Repeat new password"
              required
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Saving…" : "Set new password"}
          </button>
        </form>
      </div>
    </div>
    <BottomNav />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0B0F0C",
    padding: "24px 16px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  card: {
    background: "#121A14",
    borderRadius: "16px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
    border: "1px solid #1F2937",
  },
  brand: {
    display: "block",
    fontSize: "20px",
    fontWeight: 800,
    color: "#22C55E",
    textDecoration: "none",
    marginBottom: "24px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#FFFFFF",
    margin: "0 0 8px",
  },
  subheading: {
    fontSize: "14px",
    color: "#9CA3AF",
    margin: "0 0 24px",
  },
  successMsg: {
    fontSize: "15px",
    color: "#22C55E",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: "8px",
    padding: "14px 16px",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#D1D5DB",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #374151",
    background: "#1A2419",
    color: "#FFFFFF",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
  },
  error: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#F87171",
    margin: 0,
  },
  btn: {
    padding: "12px 20px",
    borderRadius: "10px",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontSize: "15px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  footer: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "14px",
    color: "#9CA3AF",
  },
  link: {
    color: "#22C55E",
    fontWeight: 600,
    textDecoration: "none",
  },
};
