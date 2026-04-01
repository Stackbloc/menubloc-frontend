/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/consumer/ConsumerSignup.jsx
 * Purpose:  Consumer account creation page.
 * ============================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";

export default function ConsumerSignup() {
  const { signup } = useConsumer();
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    email: "",
    password: "",
    confirm_password: "",
    display_name: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!fields.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) return "Enter a valid email address";
    if (!fields.password) return "Password is required";
    if (fields.password.length < 8) return "Password must be at least 8 characters";
    if (fields.password !== fields.confirm_password) return "Passwords do not match";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signup({
        email: fields.email.trim(),
        password: fields.password,
        display_name: fields.display_name.trim() || undefined,
      });
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/" style={styles.brand}>Grubbid</Link>
        <h1 style={styles.heading}>Create account</h1>
        <p style={styles.subheading}>
          Save your food preferences and favorite locations.
        </p>

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              autoComplete="email"
              value={fields.email}
              onChange={(e) => set("email", e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              required
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              autoComplete="new-password"
              value={fields.password}
              onChange={(e) => set("password", e.target.value)}
              style={styles.input}
              placeholder="At least 8 characters"
              required
            />
          </label>

          <label style={styles.label}>
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              value={fields.confirm_password}
              onChange={(e) => set("confirm_password", e.target.value)}
              style={styles.input}
              placeholder="Repeat password"
              required
            />
          </label>

          <label style={styles.label}>
            Display name <span style={styles.optional}>(optional)</span>
            <input
              type="text"
              autoComplete="name"
              value={fields.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              style={styles.input}
              placeholder="How you want to be known"
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/account/login" style={styles.link}>Log in</Link>
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
    margin: "0 0 6px",
  },
  subheading: {
    fontSize: "14px",
    color: "#666",
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
  optional: {
    fontWeight: 400,
    color: "#999",
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
