/**
 * IndulgenceMeter.jsx
 * -------------------
 * Horizontal bar visualization for the dessert indulgence score.
 *
 * Props:
 *   indulgence: { score: number, level: string, drivers: string[] }
 *     - score   0–100
 *     - level   "light" | "moderate" | "rich" | "indulgent"
 *     - drivers string[] — e.g. ["High sugar", "Moderate fat"]
 */

import React from "react";

const LEVEL_META = {
  light:     { label: "Light treat",  color: "#22c55e" }, // green-500
  moderate:  { label: "Moderate",     color: "#eab308" }, // yellow-500
  rich:      { label: "Rich",         color: "#f97316" }, // orange-500
  indulgent: { label: "Indulgent",    color: "#ef4444" }, // red-500
};

export default function IndulgenceMeter({ indulgence }) {
  if (!indulgence || indulgence.score == null) return null;

  const { score, level, drivers = [] } = indulgence;
  const meta = LEVEL_META[level] || LEVEL_META.moderate;

  const markerLeft = `calc(${Math.min(100, Math.max(0, score))}% - 6px)`;

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.35rem",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1f2937" }}>
          Indulgence Meter
        </span>
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: meta.color,
          }}
        >
          {meta.label}
        </span>
      </div>

      {/* Track */}
      <div
        style={{
          position: "relative",
          height: "10px",
          borderRadius: "5px",
          background: "linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)",
          marginBottom: "0.5rem",
        }}
      >
        {/* Marker */}
        <div
          style={{
            position: "absolute",
            top: "-3px",
            left: markerLeft,
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#fff",
            border: `3px solid ${meta.color}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          }}
        />
      </div>

      {/* Driver chips */}
      {drivers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {drivers.map((d) => (
            <span
              key={d}
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.55rem",
                borderRadius: "999px",
                background: "#f3f4f6",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
