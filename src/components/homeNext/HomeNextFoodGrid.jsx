import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFoodEntryPoints,
  FOOD_CHIP_BUTTON_STYLE,
  FOOD_CHIP_CONTEXT_AWARE_STYLE,
  splitFoodEntryPointRows,
} from "../../lib/homeNextEntryPoints.js";
import { buildHomeChipUrl } from "../../lib/homeNextNavigation.js";

function FoodChipRow({ entries, onChipClick }) {
  if (!entries.length) return null;
  return (
    <div className="home-next-food-chip-row">
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onChipClick(entry)}
          style={entry.contextAware ? FOOD_CHIP_CONTEXT_AWARE_STYLE : FOOD_CHIP_BUTTON_STYLE}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">
            {entry.icon}
          </span>
          <span>{entry.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function HomeNextFoodGrid({ autoLocation, appliedLocation, shouldUseGeoBrowse }) {
  const navigate = useNavigate();
  const [rowOne, rowTwo] = useMemo(() => splitFoodEntryPointRows(getFoodEntryPoints()), []);

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
      <div className="home-next-food-chip-rows">
        <FoodChipRow entries={rowOne} onChipClick={handleClick} />
        <FoodChipRow entries={rowTwo} onChipClick={handleClick} />
      </div>
    </section>
  );
}
