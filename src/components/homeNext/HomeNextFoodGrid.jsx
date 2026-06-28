import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ChipRail from "../chips/ChipRail.jsx";
import { getFoodEntryPoints } from "../../lib/homeNextEntryPoints.js";
import { buildHomeChipUrl } from "../../lib/homeNextNavigation.js";

const FOOD_CHIP_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  minHeight: 52,
  padding: "10px 16px",
  borderRadius: 14,
  border: "1.5px solid var(--gb-color-border)",
  background: "var(--gb-color-surface-strong)",
  color: "var(--gb-color-ink)",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
  boxShadow: "var(--gb-shadow-soft)",
  flex: "0 0 auto",
  whiteSpace: "nowrap",
};

export default function HomeNextFoodGrid({ autoLocation, appliedLocation, shouldUseGeoBrowse }) {
  const navigate = useNavigate();
  const chips = useMemo(() => getFoodEntryPoints(), []);

  const locationContext = { appliedLocation, autoLocation, shouldUseGeoBrowse };

  function handleClick(entry) {
    navigate(buildHomeChipUrl(entry, locationContext));
  }

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ padding: "0 16px", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
          I have an idea
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
          Start with a food — we&apos;ll help you narrow it down
        </p>
      </div>
      <div style={{ padding: "0 16px", minWidth: 0 }}>
        <ChipRail className="home-next-food-rail">
          {chips.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleClick(entry)}
              style={FOOD_CHIP_STYLE}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">
                {entry.icon}
              </span>
              <span>{entry.label}</span>
            </button>
          ))}
        </ChipRail>
      </div>
    </section>
  );
}
