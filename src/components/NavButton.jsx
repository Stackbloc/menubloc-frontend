import React from "react";
import { Link, useNavigate } from "react-router-dom";

const style = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid rgba(18,34,28,0.14)",
  background: "rgba(255,255,255,0.76)",
  backdropFilter: "blur(10px)",
  color: "#11211a",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  lineHeight: 1,
};

/** Goes to "/" */
export function HomeButton() {
  return (
    <Link to="/" style={style}>
      ← Home
    </Link>
  );
}

/** Goes back one step in browser history */
export function BackButton() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)} style={style}>
      ← Back
    </button>
  );
}
