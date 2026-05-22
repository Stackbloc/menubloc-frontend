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
 *
 * Public display rules (MVP):
 *   - Only renders when display_state === "established"
 *   - Only renders when rating_count >= 10
 *   - Only renders when score exists and has a qualifying label (>= 95)
 *   - Returns null in ALL other cases — no placeholder, no pending state, no gap
 *
 * early_signal (3–9 ratings) is collected in the database but NOT shown publicly.
 * pending (< 3 ratings) is never shown.
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

  if (!data) return null;
  if (data.display_state !== "established") return null;
  if (!data.score) return null;
  if ((data.rating_count || 0) < 10) return null;

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
        marginTop: 8,
        padding: "4px 10px",
        borderRadius: 8,
        background: "rgba(34,197,94,0.1)",
        border: "1px solid rgba(34,197,94,0.25)",
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
