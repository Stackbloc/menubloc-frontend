/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorResetPassword.jsx
 * File: OperatorResetPassword.jsx
 * Date: 2026-03-23
 * Purpose:
 *   Operator password reset screen for one-time reset tokens.
 * ============================================================
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  resetOperatorPassword,
  validateOperatorResetToken,
} from "../../lib/operatorApi.js";

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

export default function OperatorResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkToken() {
      if (!token) {
        setChecking(false);
        setValid(false);
        setError("Reset link is invalid or expired");
        return;
      }

      try {
        const result = await validateOperatorResetToken(token);
        if (!cancelled) {
          setValid(true);
          setEmail(result.email || "");
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setValid(false);
          setError(err.message || "Reset link is invalid or expired");
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    checkToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await resetOperatorPassword(token, password);
      navigate("/operator", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to reset password");
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
            Reset Operator Password
          </div>
        </div>

        {checking ? (
          <div style={{ textAlign: "center", color: "#5b6675", fontSize: 14 }}>
            Checking reset link...
          </div>
        ) : !valid ? (
          <div>
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
              color: "#b91c1c",
              marginBottom: 16,
            }}>
              {error || "Reset link is invalid or expired"}
            </div>
            <Link to="/operator/recover" style={LINK_STYLE}>
              Request a new reset link
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              background: "#f4f7f5",
              border: "1px solid #e4ece8",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 13,
              color: "#44515d",
              marginBottom: 18,
            }}>
              Resetting password for <strong>{email}</strong>.
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 5 }}>
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  style={INPUT_STYLE}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6675", display: "block", marginBottom: 5 }}>
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  style={INPUT_STYLE}
                  autoComplete="new-password"
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

              <button type="submit" disabled={busy} style={busy ? BTN_DISABLED : BTN_PRIMARY}>
                {busy ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
