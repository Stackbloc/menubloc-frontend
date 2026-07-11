/**
 * Path: menubloc-frontend/src/components/cluster/ClusterCityStarterChecklist.jsx
 * Purpose: Checklist-style Starter Cluster progress (no percentage scores).
 * Modified: 2026-07-11
 */

import React from "react";

export default function ClusterCityStarterChecklist({ checklist = [] }) {
  if (!Array.isArray(checklist) || checklist.length === 0) return null;

  return (
    <ul
      style={{
        margin: "0.5rem 0 0",
        padding: 0,
        listStyle: "none",
        display: "grid",
        gap: "0.3rem",
        fontSize: "0.78rem",
        color: "#4b5563",
        lineHeight: 1.35,
      }}
    >
      {checklist.map((item) => {
        const symbol = item.complete ? "✓" : item.pending ? "○" : "○";
        const color = item.complete ? "#15803d" : "#6b7280";
        return (
          <li key={item.id || item.label} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
            <span aria-hidden="true" style={{ color, fontWeight: 700, flexShrink: 0 }}>
              {symbol}
            </span>
            <span>{item.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
