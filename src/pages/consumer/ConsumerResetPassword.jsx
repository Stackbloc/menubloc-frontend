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
import { BrandLogo } from "../../components/BrandLogo.jsx";

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
      <div style={styles.page}>
        <div style={styles.card}>
          <BrandLogo width={132} height={84} radius={20} pageColor="#ffffff" linkStyle={{ marginBottom: 24 }} />
          <p style={styles.subheading}>Validating reset link…</p>
        </div>
      </div>
    );
  }

  if (tokenState === "invalid") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <BrandLogo width={132} height={84} radius={20} pageColor="#ffffff" linkStyle={{ marginBottom: 24 }} />
          <h1 style={styles.heading}>Link expired</h1>
          <p style={styles.subheading}>
            This reset link is invalid or has expired. Request a new one.
          </p>
          <p style={styles.footer}>
            <Link to="/account/forgot-password" style={styles.link}>Request new link</Link>
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <BrandLogo width={132} height={84} radius={20} pageColor="#ffffff" linkStyle={{ marginBottom: 24 }} />
          <p style={styles.successMsg}>Password reset. Redirecting to your account…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <BrandLogo width={132} height={84} radius={20} pageColor="#ffffff" linkStyle={{ marginBottom: 24 }} />
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
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f6f3",
    padding: "24px 16px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  },
  brand: {
    display: "block",
    fontSize: "20px",
    fontWeight: 800,
    color: "#1F4E3D",
    textDecoration: "none",
    marginBottom: "24px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#0f1720",
    margin: "0 0 8px",
  },
  subheading: {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 24px",
  },
  successMsg: {
    fontSize: "15px",
    color: "#1F4E3D",
    background: "#f0f7f4",
    border: "1px solid #c3dfd5",
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
    color: "#0f1720",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
  },
  error: {
    background: "#fff3f3",
    border: "1px solid #f5c6c6",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#c0392b",
    margin: 0,
  },
  btn: {
    padding: "12px 20px",
    borderRadius: "10px",
    background: "#1F4E3D",
    color: "#ffffff",
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
    color: "#666",
  },
  link: {
    color: "#1F4E3D",
    fontWeight: 600,
    textDecoration: "none",
  },
};
