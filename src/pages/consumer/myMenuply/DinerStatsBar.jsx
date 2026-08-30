/** Selectable summary stats for My Menuply — Connects, Restaurants, Dishes, Home, Events. */

import * as s from "./myMenuplyStyles.js";

export default function DinerStatsBar({ stats = [], selectedId = "", onSelect }) {
  const rows = stats.filter((row) => row && row.label);
  if (!rows.length) return null;

  return (
    <div style={s.statsBar} data-testid="diner-stats-bar" role="tablist" aria-label="My Menuply libraries">
      {rows.map((row, index) => {
        const id = row.id || String(row.label || "").toLowerCase();
        const selected = selectedId === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            data-testid={`diner-stat-${id}`}
            onClick={() => onSelect?.(selected ? "" : id)}
            style={{
              ...s.statsCell,
              ...(index < rows.length - 1 ? s.statsCellDivider : null),
              ...s.statsCellButton,
              ...(selected ? s.statsCellSelected : null),
            }}
          >
            <span style={s.statsValue}>{row.value}</span>
            <span style={s.statsLabel}>{row.label}</span>
          </button>
        );
      })}
    </div>
  );
}
