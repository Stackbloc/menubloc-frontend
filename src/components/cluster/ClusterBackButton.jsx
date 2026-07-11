import React from "react";
import { Link } from "react-router-dom";

const BACK_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  border: "none",
  background: "transparent",
  padding: "0.15rem 0",
  margin: 0,
  color: "#374151",
  fontSize: "0.92rem",
  fontWeight: 600,
  cursor: "pointer",
  lineHeight: 1.2,
  textDecoration: "none",
};

export default function ClusterBackButton({ fallbackTo = "/clusters", label = "Back" }) {
  return (
    <Link
      to={fallbackTo}
      aria-label={label === "Back" ? "Go back" : label}
      style={BACK_BUTTON_STYLE}
    >
      <span aria-hidden="true" style={{ fontSize: "1.05rem", lineHeight: 1 }}>
        ←
      </span>
      <span>{label}</span>
    </Link>
  );
}
