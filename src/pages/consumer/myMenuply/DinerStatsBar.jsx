/** Presentation stats row — read-only summary for My Menuply hero. */

import * as s from "./myMenuplyStyles.js";

export default function DinerStatsBar({ stats = [] }) {
  const rows = stats.filter((row) => row && row.label);
  if (!rows.length) return null;

  return (
    <div style={s.statsBar} data-testid="diner-stats-bar">
      {rows.map((row, index) => (
        <div
          key={row.label}
          style={{
            ...s.statsCell,
            ...(index < rows.length - 1 ? s.statsCellDivider : null),
          }}
        >
          <span style={s.statsValue}>{row.value}</span>
          <span style={s.statsLabel}>{row.label}</span>
        </div>
      ))}
    </div>
  );
}
