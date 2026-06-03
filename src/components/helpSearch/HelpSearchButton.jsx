import React from "react";

export default function HelpSearchButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 60,
        border: "1px solid rgba(255,255,255,0.28)",
        borderRadius: 999,
        background: "#1F4E3D",
        color: "#fff",
        boxShadow: "0 14px 34px rgba(15, 23, 32, 0.22)",
        padding: "12px 16px",
        fontSize: 14,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      Search Help
    </button>
  );
}
