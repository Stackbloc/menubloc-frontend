/**
 * Campus live glance — Shortest line / Best food today.
 * Derived from per-venue reports. Phase 1: scroll to On Campus row on tap.
 */

import React from "react";

function GlanceTile({ title, emptyLabel, entry, onSelect }) {
  const has = Boolean(entry?.restaurant_id && entry?.status);
  return (
    <button
      type="button"
      data-testid={`campus-live-glance-${title === "Shortest line" ? "line" : "food"}`}
      onClick={() => {
        if (has && onSelect) onSelect(entry.restaurant_id);
      }}
      style={{
        ...styles.tile,
        cursor: has ? "pointer" : "default",
      }}
      disabled={!has}
    >
      <div style={styles.tileTitle}>{title}</div>
      {has ? (
        <>
          <div style={styles.tileVenue}>{entry.name}</div>
          <div style={styles.tileStatus}>
            {entry.status.label}
            {entry.status.age_label ? (
              <span style={styles.age}> · {entry.status.age_label}</span>
            ) : null}
          </div>
        </>
      ) : (
        <div style={styles.empty}>{emptyLabel}</div>
      )}
    </button>
  );
}

export default function CampusLiveGlanceBar({ glance, onSelectVenue = null, loading = false }) {
  if (loading && !glance) {
    return (
      <div data-testid="campus-live-glance" style={styles.bar} aria-busy="true">
        <div style={styles.muted}>Checking campus…</div>
      </div>
    );
  }

  const data = glance || { shortest_line: null, best_food: null };
  const bothEmpty = !data.shortest_line && !data.best_food;

  return (
    <div data-testid="campus-live-glance" style={styles.bar} aria-label="Campus right now">
      {bothEmpty ? (
        <div style={styles.fullEmpty} data-testid="campus-live-glance-empty">
          No reports yet
        </div>
      ) : (
        <div style={styles.row}>
          <GlanceTile
            title="Shortest line"
            emptyLabel="No reports yet"
            entry={data.shortest_line}
            onSelect={onSelectVenue}
          />
          <GlanceTile
            title="Best food today"
            emptyLabel="No reports yet"
            entry={data.best_food}
            onSelect={onSelectVenue}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  bar: {
    margin: "0 0 12px",
    padding: "10px 0 2px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  tile: {
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d1fae5",
    background: "linear-gradient(180deg, #ecfdf5 0%, #fff 100%)",
    minHeight: 72,
  },
  tileTitle: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#0f766e",
    marginBottom: 4,
  },
  tileVenue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.25,
  },
  tileStatus: {
    marginTop: 2,
    fontSize: 13,
    color: "#374151",
  },
  age: { color: "#6b7280", fontWeight: 600 },
  empty: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  fullEmpty: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
    fontWeight: 600,
  },
  muted: { fontSize: 13, color: "#6b7280" },
};
