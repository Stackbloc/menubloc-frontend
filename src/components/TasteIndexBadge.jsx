import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:3001" : "")).replace(/\/$/, "");

const SCORE_LABELS = [
  { min: 125, text: "Highly rated among similar" },
  { min: 110, text: "Well-rated among similar" },
  { min: 95,  text: "Compares favorably to similar" },
];

function getScoreLabel(score) {
  for (const { min, text } of SCORE_LABELS) {
    if (score >= min) return text;
  }
  return null;
}

/**
 * Displays the Menuply Taste Index badge for a menu item.
 * - Fetches from /api/menu-items/:menuItemId/taste-index (non-blocking)
 * - Renders nothing if display_state is 'pending' or score label not met
 * - Renders an early_signal badge or full established badge
 *
 * Props:
 *   menuItemId  — numeric menu item id
 *   accent      — brand accent color (optional, defaults to green)
 */
export default function TasteIndexBadge({ menuItemId, accent = "#22C55E" }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!menuItemId) return;

    let cancelled = false;
    fetch(`${API}/api/menu-items/${menuItemId}/taste-index`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.ok) setData(json);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [menuItemId]);

  if (!data || data.display_state === "pending") return null;

  const softBg = `rgba(34,197,94,0.1)`;
  const border = `1px solid rgba(34,197,94,0.25)`;

  if (data.display_state === "early_signal") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 6,
          background: softBg,
          border,
          fontSize: 11,
          color: accent,
          fontWeight: 700,
          letterSpacing: "0.01em",
        }}
      >
        <span style={{ fontSize: 13 }}>◆</span>
        Early data · Rated {data.rating_count}×
      </div>
    );
  }

  const label = getScoreLabel(data.score);
  if (!label) return null;

  const cohortName = data.cohort_label
    ? data.cohort_label.replace(/_/g, " ").toLowerCase() + "s"
    : "similar items";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 8,
        background: softBg,
        border,
        fontSize: 12,
        color: accent,
        fontWeight: 700,
      }}
    >
      <span style={{ fontSize: 15 }}>◆</span>
      <span>
        Taste Index: {data.score}
        <span style={{ fontWeight: 400, marginLeft: 6, opacity: 0.8 }}>
          {label} {cohortName}
        </span>
      </span>
    </div>
  );
}
