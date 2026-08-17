import React from "react";
import { accountStyles as styles } from "./accountDashboardStyles.js";

export default function PreferenceChips({ options, selectedMap, onToggle, disabled = false, extraStart = null }) {
  return (
    <div style={styles.chipWrap} role="group">
      {extraStart}
      {options.map(({ key, label }) => {
        const selected = Boolean(selectedMap[key]);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onToggle(key, !selected)}
            style={{
              ...styles.chip,
              ...(selected ? styles.chipSelected : null),
              ...(disabled ? styles.chipDisabled : null),
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
