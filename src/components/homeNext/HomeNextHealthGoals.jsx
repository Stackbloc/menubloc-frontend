import { useNavigate } from "react-router-dom";
import ChipRail from "../chips/ChipRail.jsx";
import { HEALTH_GOAL_ENTRY_POINTS } from "../../lib/homeNextEntryPoints.js";
import { buildHomeSearchUrl } from "../../lib/homeNextNavigation.js";

export default function HomeNextHealthGoals({ autoLocation, appliedLocation, shouldUseGeoBrowse }) {
  const navigate = useNavigate();

  function handleClick(entry) {
    navigate(
      buildHomeSearchUrl({
        query: entry.query,
        filterKey: entry.filterKey || null,
        appliedLocation,
        autoLocation,
        shouldUseGeoBrowse,
      })
    );
  }

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ padding: "0 16px", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
          Health goals
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
          First-class paths into nutrition-aware search
        </p>
      </div>
      <div style={{ padding: "0 16px", minWidth: 0 }}>
        <ChipRail>
          {HEALTH_GOAL_ENTRY_POINTS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleClick(entry)}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                cursor: "pointer",
                border: "1.5px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.08)",
                color: "#15803d",
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {entry.icon} {entry.label}
            </button>
          ))}
        </ChipRail>
      </div>
    </section>
  );
}
