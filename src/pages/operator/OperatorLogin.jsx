/**
 * src/pages/operator/OperatorLogin.jsx
 *
 * Sign in / Create account screen.
 * On success: redirect to /operator/dashboard
 */

import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";

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

export default function OperatorLogin() {
  const { login, register, isAuthenticated, loading } = useOperator();
  const navigate = useNavigate();

  const [mode, setMode]         = useState("login"); // "login" | "register"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");

  // Already logged in
  if (!loading && isAuthenticated) {
    return <Navigate to="/operator" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = mode === "login"
        ? await login(email.trim(), password)
        : await register(email.trim(), password, fullName.trim() || undefined);
      // New operators with no restaurant go to claim flow; returning operators go to dashboard
      const dest = result.restaurants.length === 0 ? "/operator/claim" : "/operator";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong");
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
        maxWidth: 400,
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
        padding: "36px 32px",
      }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 26, color: "#1F4E3D", letterSpacing: "-0.8px" }}>
            grubbid
          </div>
          <div style={{ fontSize: 13, color: "#8a9ab0", marginTop: 4 }}>
            Operator Portal
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: "flex",
          background: "#f4f3ef",
          borderRadius: 10,
          padding: 3,
          marginBottom: 24,
        }}>
          {["login", "register"].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#0f1720" : "#8a9ab0",
                boxShadow: mode === m ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 5 }}>
                Full name
              </label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={INPUT_STYLE}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@restaurant.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={INPUT_STYLE}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              placeholder={mode === "register" ? "At least 8 characters" : ""}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={mode === "register" ? 8 : undefined}
              style={INPUT_STYLE}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
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

          <button
            type="submit"
            disabled={busy}
            style={busy ? BTN_DISABLED : BTN_PRIMARY}
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
