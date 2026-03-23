/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorRecovery.jsx
 * File: OperatorRecovery.jsx
 * Date: 2026-03-23
 * Purpose:
 *   Operator account recovery request screen.
 *   Sends password reset instructions to the operator account email.
 * ============================================================
 */

import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { requestOperatorRecovery } from "../../lib/operatorApi.js";

const INPUT_STYLE = {
  width: "100%",
  padding: "11px 14px",
  fontSize: 14,
  border: "1.5px solid #e4e9f0",
  borderRadius: 10,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const BTN_PRIMARY = {
  width: "100%",
  padding: "12px 0",
  background: "#1F4E3D",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  letterSpacing: "-0.2px",
};

const BTN_DISABLED = {
  ...BTN_PRIMARY,
  opacity: 0.55,
  cursor: "not-allowed",
};

const LINK_STYLE = {
  color: "#1F4E3D",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};

export default function OperatorRecovery() {
  const { isAuthenticated, loading } = useOperator();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!loading && isAuthenticated) {
    return <Navigate to="/operator" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await requestOperatorRecovery(email.trim());
      setMessage(result.message || "If an account exists, recovery instructions have been sent.");
    } catch (err) {
      setError(err.message || "Unable to request recovery right now");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f4f3ef 0%, #eef5f2 100%)",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: 20,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
        padding: "36px 32px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 26, color: "#1F4E3D", letterSpacing: "-0.8px" }}>
            grubbid
          </div>
          <div style={{ fontSize: 13, color: "#8a9ab0", marginTop: 4 }}>
            Operator Recovery
          </div>
        </div>

        <div style={{
          background: "#f4f7f5",
          border: "1px solid #e4ece8",
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 13,
          color: "#44515d",
          marginBottom: 18,
        }}>
          Enter the email tied to your operator account. On Grubbid, that email is also your username.
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 5 }}>
              Account email
            </label>
            <input
              type="email"
              placeholder="you@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={INPUT_STYLE}
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
              color: "#b91c1c",
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              background: "#effaf3",
              border: "1px solid #b7e4c3",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
              color: "#166534",
            }}>
              {message}
            </div>
          )}

          <button type="submit" disabled={busy} style={busy ? BTN_DISABLED : BTN_PRIMARY}>
            {busy ? "Sending..." : "Send recovery instructions"}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Link to="/operator/login" style={LINK_STYLE}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
