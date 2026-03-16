/**
 * -------------------------------------------------------
 * File: ClaimVerify.jsx
 * Path: menubloc-frontend/src/pages/ClaimVerify.jsx
 * Created: 2026-02-25
 *
 * Purpose:
 *   Shows a friendly "Verifying..." screen, then forwards
 *   the browser to the backend claim endpoint which performs
 *   token verification and redirects back to the frontend.
 * -------------------------------------------------------
 */

import React, { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function ClaimVerify() {
  const [params] = useSearchParams();
  const token = params.get("token");

  useEffect(() => {
    if (!token) return;

    // IMPORTANT: Backend performs the verification. Frontend only forwards.
    const backendBase =
      import.meta.env.VITE_API_URL || "https://menubloc-backend.onrender.com";

    window.location.href = `${backendBase}/claim?token=${encodeURIComponent(
      token
    )}`;
  }, [token]);

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "80px auto",
        textAlign: "center",
        fontFamily: "sans-serif",
        padding: "0 16px",
      }}
    >
      <h1>Verifying your link…</h1>

      {!token ? (
        <>
          <p style={{ fontSize: "18px", marginTop: "16px" }}>
            This link is missing a token.
          </p>
          <p style={{ marginTop: "24px" }}>
            <Link to="/" style={{ textDecoration: "underline" }}>
              Return to Grubbid
            </Link>
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: "18px", marginTop: "16px" }}>
            One moment — we’re confirming your profile.
          </p>
          <p style={{ marginTop: "24px", opacity: 0.7 }}>
            If nothing happens after a few seconds, refresh this page.
          </p>
        </>
      )}
    </div>
  );
}