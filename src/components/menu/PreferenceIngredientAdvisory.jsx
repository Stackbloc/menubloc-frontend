/**
 * Soft preference advisory for Foods I Avoid matches.
 * Not an allergen warning — allergen conflicts are hard-filtered off the menu.
 */
import React, { useMemo } from "react";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { matchAvoidedIngredients } from "../../lib/foodsToAvoidMatch.js";

const TONE = {
  dark: {
    color: "#FBBF24",
    muted: "rgba(251, 191, 36, 0.92)",
  },
  light: {
    color: "#B45309",
    muted: "#92400E",
  },
};

/**
 * @param {object} props
 * @param {object|null|undefined} props.item
 * @param {string[]|null|undefined} [props.foodsToAvoid] — optional override; defaults to ConsumerContext
 * @param {"dark"|"light"} [props.tone]
 * @param {React.CSSProperties} [props.style]
 */
export default function PreferenceIngredientAdvisory({
  item,
  foodsToAvoid: foodsToAvoidProp,
  tone = "dark",
  style = null,
}) {
  const { foodsToAvoid: foodsToAvoidCtx = [] } = useConsumer();
  const foodsToAvoid = foodsToAvoidProp ?? foodsToAvoidCtx;

  const matches = useMemo(
    () => matchAvoidedIngredients(item, foodsToAvoid),
    [item, foodsToAvoid],
  );

  if (!matches.length) return null;

  const colors = TONE[tone] || TONE.dark;

  return (
    <div
      role="note"
      aria-label="Preference ingredient notice"
      style={{
        marginTop: 8,
        fontSize: 13,
        lineHeight: 1.45,
        color: colors.color,
        fontWeight: 600,
        ...style,
      }}
    >
      <div style={{ marginBottom: 4 }}>⚠️ This item may contain:</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {matches.map((m) => (
          <li key={m.key} style={{ color: colors.muted, fontWeight: 600 }}>
            ✓ {m.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
