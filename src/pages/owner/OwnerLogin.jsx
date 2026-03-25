import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useOwner } from "../../context/OwnerContext.jsx";
import { OWNER_COLORS } from "./OwnerLayout.jsx";

export default function OwnerLogin() {
  const { login, isAuthenticated, loading } = useOwner();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loading && isAuthenticated) {
    return <Navigate to="/owner" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/owner", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: OWNER_COLORS.page, fontFamily: '"Instrument Sans", "Avenir Next", sans-serif' }}>
      <div style={{ width: "100%", maxWidth: 430, background: "rgba(255,253,248,0.94)", border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 24, padding: 34, boxShadow: "0 20px 80px rgba(86, 47, 29, 0.12)" }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: OWNER_COLORS.muted, marginBottom: 10 }}>
          Owner Backend
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.05em", color: OWNER_COLORS.ink, marginBottom: 10 }}>Platform control.</div>
        <div style={{ color: OWNER_COLORS.muted, fontSize: 14, marginBottom: 24 }}>
          Separate owner authentication with system-wide visibility and administrative access.
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: OWNER_COLORS.muted }}>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoFocus style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: OWNER_COLORS.muted }}>Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={inputStyle} />
          </label>
          {error ? (
            <div style={{ background: "#fff1ef", border: "1px solid #f2c8bf", color: "#8b2e1a", borderRadius: 12, padding: "10px 12px", fontSize: 13 }}>
              {error}
            </div>
          ) : null}
          <button type="submit" disabled={busy} style={buttonStyle(busy)}>
            {busy ? "Signing in..." : "Sign in to owner backend"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  fontSize: 15,
  boxSizing: "border-box",
};

function buttonStyle(disabled) {
  return {
    marginTop: 4,
    padding: "13px 14px",
    borderRadius: 12,
    border: "none",
    background: OWNER_COLORS.accent,
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}
