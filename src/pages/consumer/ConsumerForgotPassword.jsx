/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/consumer/ConsumerForgotPassword.jsx
 * Purpose:  Consumer forgot password — collects email, shows neutral success.
 * ============================================================
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../lib/consumerApi.js";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";

export default function ConsumerForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      // On 503 (no email configured) show the server error; otherwise generic
      if (err?.status === 503) {
        setError(err.message);
      } else {
        setSubmitted(true); // Always show success to avoid email enumeration
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <StickyPageHeader />
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Reset password</h1>

        {submitted ? (
          <>
            <p style={styles.successMsg}>
              If an account exists with that email, reset instructions have been sent.
              Check your inbox.
            </p>
            <p style={styles.footer}>
              <Link to="/account/login" style={styles.link}>Back to Log in</Link>
            </p>
          </>
        ) : (
          <>
            <p style={styles.subheading}>
              Enter your email and we'll send a reset link if an account exists.
            </p>

            <form onSubmit={handleSubmit} noValidate style={styles.form}>
              <label style={styles.label}>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="you@example.com"
                  required
                />
              </label>

              {error && <p style={styles.error}>{error}</p>}

              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p style={styles.footer}>
              <Link to="/account/login" style={styles.link}>Back to Log in</Link>
            </p>
          </>
        )}
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
