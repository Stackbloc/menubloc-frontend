/**
 * -------------------------------------------------------
 * File: ClaimSuccess.jsx
 * Path: menubloc-frontend/src/pages/ClaimSuccess.jsx
 * Created: 2026-02-25
 * Purpose:
 *   Landing page displayed after a restaurant
 *   successfully verifies ownership via email claim link.
 * -------------------------------------------------------
 */

import React from "react";
import { Link } from "react-router-dom";

export default function ClaimSuccess() {
  return (
    <div style={{
      maxWidth: "700px",
      margin: "80px auto",
      textAlign: "center",
      fontFamily: "sans-serif"
    }}>
      <h1>✅ Profile Confirmed</h1>

      <p style={{ fontSize: "18px", marginTop: "20px" }}>
        Your restaurant profile has been successfully verified.
      </p>

      <p>
        We are processing your menu now. Once complete,
        your menu will be live on Grubbid.
      </p>

      <div style={{ marginTop: "40px" }}>
        <Link to="/" style={{
          background: "#000",
          color: "#fff",
          padding: "12px 20px",
          textDecoration: "none",
          borderRadius: "6px"
        }}>
          Return to Grubbid
        </Link>
      </div>
    </div>
  );
}