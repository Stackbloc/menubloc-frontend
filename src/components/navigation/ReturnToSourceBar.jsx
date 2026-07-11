import React from "react";
import { Link } from "react-router-dom";

export default function ReturnToSourceBar({ to, label = "Back" }) {
  if (!to) return null;

  return (
    <Link
      to={to}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        marginBottom: "0.85rem",
        color: "#374151",
        fontSize: "0.92rem",
        fontWeight: 600,
        textDecoration: "none",
        lineHeight: 1.2,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "1.05rem" }}>
        ←
      </span>
      <span>{label}</span>
    </Link>
  );
}
