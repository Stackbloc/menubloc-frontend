import React from "react";
import { useNavigate } from "react-router-dom";
import { useFoodInterests } from "../../context/FoodInterestsContext.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";

export default function FoodInterestAuthPrompt() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const { authPromptVisible, dismissAuthPrompt } = useFoodInterests();

  if (isAuthenticated || !authPromptVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(var(--bottom-nav-h, 72px) + 14px)",
        zIndex: 240,
        borderRadius: 16,
        border: "1px solid rgba(34,197,94,0.24)",
        background: "rgba(11,15,12,0.96)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.45)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#F9FAFB" }}>Save Food Interests</div>
        <div style={{ marginTop: 2, fontSize: 12, color: "#9CA3AF", lineHeight: 1.4 }}>
          Your picks stay on this device until you sign in.
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate("/account/login")}
        style={{
          border: "none",
          borderRadius: 999,
          background: "#22C55E",
          color: "#0B0F0C",
          fontSize: 12,
          fontWeight: 800,
          padding: "9px 12px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={dismissAuthPrompt}
        aria-label="Dismiss"
        style={{
          border: "none",
          background: "transparent",
          color: "#6B7280",
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}
