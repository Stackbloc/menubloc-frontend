import React from "react";
import { NavLink } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS } from "../OwnerLayout.jsx";

export const PHMS_TABS = [
  { to: "/owner/phms", label: "Health Checks", end: true },
  { to: "/owner/phms/incidents", label: "Incidents" },
];

export function PhmsShell({ children, title = "Platform Health", actions = null }) {
  return (
    <OwnerLayout title={title} actions={actions}>
      <PhmsSubNav />
      {children}
    </OwnerLayout>
  );
}

function PhmsSubNav() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 22,
      }}
    >
      {PHMS_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          style={({ isActive }) => ({
            padding: "8px 14px",
            borderRadius: 999,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            color: isActive ? OWNER_COLORS.accent : OWNER_COLORS.ink,
            background: isActive ? OWNER_COLORS.accentSoft : "#fff",
            border: `1px solid ${isActive ? OWNER_COLORS.line : "#ead9ce"}`,
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
