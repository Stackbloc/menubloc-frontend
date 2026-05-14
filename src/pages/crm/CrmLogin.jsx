import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCrm } from "../../context/CrmContext.jsx";

export default function CrmLogin() {
  const { login, loading, isAuthenticated } = useCrm();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loading && isAuthenticated) {
    return <Navigate to="/crm" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigate("/crm", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in to CRM");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "linear-gradient(135deg, #edf3f7 0%, #f7f3ec 100%)", fontFamily: '"Instrument Sans", "Avenir Next", sans-serif' }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 20, padding: "36px 32px", boxShadow: "0 20px 50px rgba(15, 23, 32, 0.10)", border: "1px solid #d9e0ea" }}>
        <div style={{ marginBottom: 26, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: "#173f35" }}>Menuply</div>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#64748b" }}>
            Internal CRM Login
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@menuply.com" required style={inputStyle} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={inputStyle} />
          {error ? <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#b91c1c" }}>{error}</div> : null}
          <button type="submit" disabled={busy} style={busy ? disabledButtonStyle : buttonStyle}>
            {busy ? "Signing in..." : "Sign in to CRM"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  fontSize: 14,
  border: "1.5px solid #d9e0ea",
  borderRadius: 10,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const buttonStyle = {
  width: "100%",
  padding: "12px 0",
  background: "#173f35",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const disabledButtonStyle = {
  ...buttonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};
