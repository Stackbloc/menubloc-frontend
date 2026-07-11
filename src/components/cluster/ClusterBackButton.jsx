import React from "react";
import { useNavigate } from "react-router-dom";

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
};

export default function ClusterBackButton({ fallbackTo = "/clusters", label = "Back" }) {
  const navigate = useNavigate();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackTo);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label === "Back" ? "Go back" : `Go back: ${label}`}
      style={BACK_BUTTON_STYLE}
    >
      <span aria-hidden="true" style={{ fontSize: "1.05rem", lineHeight: 1 }}>
        ←
      </span>
      <span>{label}</span>
    </button>
  );
}
