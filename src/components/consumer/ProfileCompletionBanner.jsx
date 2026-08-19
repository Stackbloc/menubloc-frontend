import React from "react";
import { Link } from "react-router-dom";

const bannerStyle = {
  margin: "0 0 16px",
  padding: "14px 16px",
  borderRadius: 12,
  background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
  border: "1px solid #bbf7d0",
};

export default function ProfileCompletionBanner({ message, actionTo = "/account?tab=profile", actionLabel = "Add location" }) {
  if (!message) return null;
  return (
    <div style={bannerStyle} role="status" data-testid="profile-completion-banner">
      <p style={{ margin: 0, fontSize: 14, color: "#14532d", lineHeight: 1.5, fontWeight: 600 }}>
        {message}
      </p>
      <p style={{ margin: "8px 0 0" }}>
        <Link
          to={actionTo}
          style={{ color: "#15803d", fontWeight: 700, fontSize: 14, textDecoration: "none" }}
        >
          {actionLabel} →
        </Link>
      </p>
    </div>
  );
}
