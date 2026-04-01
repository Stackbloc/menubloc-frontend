/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/consumer/ConsumerLogin.jsx
 * Purpose:  Consumer login page.
 * ============================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";

export default function ConsumerLogin() {
  const { login } = useConsumer();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/" style={styles.brand}>Grubbid</Link>
        <h1 style={styles.heading}>Log in</h1>

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

          <label style={styles.label}>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Your password"
              required
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p style={styles.footer}>
          <Link to="/account/forgot-password" style={styles.link}>Forgot password?</Link>
        </p>
        <p style={styles.footer}>
          New to Grubbid?{" "}
          <Link to="/account/signup" style={styles.link}>Create account</Link>
        </p>
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
    margin: "0 0 28px",
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
    marginTop: "4px",
  },
  footer: {
    textAlign: "center",
    marginTop: "14px",
    fontSize: "14px",
    color: "#666",
  },
  link: {
    color: "#1F4E3D",
    fontWeight: 600,
    textDecoration: "none",
  },
};
