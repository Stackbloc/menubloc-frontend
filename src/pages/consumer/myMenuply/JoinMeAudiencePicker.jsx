/**
 * Future-plan Join Me: anyone among Connections, or pick specific
 * Connections plus people with a pending Invite to Eat.
 *
 * variant="preset" — Edit View: no open checkbox, quiet options matching status lines.
 */

import * as s from "./myMenuplyStyles.js";

export default function JoinMeAudiencePicker({
  joinable,
  onJoinableChange,
  audience,
  onAudienceChange,
  selectedIds,
  onSelectedIdsChange,
  candidates = [],
  joinCapacity,
  onJoinCapacityChange,
  showCapacity = true,
  disabled = false,
  variant = "default",
}) {
  const selected = new Set((selectedIds || []).map((id) => Number(id)));
  const preset = variant === "preset";

  function toggle(id) {
    const n = Number(id);
    if (!n) return;
    const next = new Set(selected);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    onSelectedIdsChange([...next]);
  }

  const audienceRow = joinable ? (
    <div
      role={preset ? "group" : "dialog"}
      aria-label="Open to be joined by"
      style={preset ? styles.presetBox : styles.box}
    >
      <p style={preset ? styles.presetPrompt : styles.prompt}>Open to be joined by</p>
      <div style={preset ? styles.presetActions : s.actions}>
        <button
          type="button"
          disabled={disabled}
          style={
            preset
              ? audience === "connections"
                ? styles.presetOptOn
                : styles.presetOpt
              : audience === "connections"
                ? s.primaryBtn
                : s.chipBtn
          }
          onClick={() => onAudienceChange("connections")}
        >
          All Connects
        </button>
        <button
          type="button"
          disabled={disabled}
          style={
            preset
              ? audience === "selected"
                ? styles.presetOptOn
                : styles.presetOpt
              : audience === "selected"
                ? s.primaryBtn
                : s.chipBtn
          }
          onClick={() => onAudienceChange("selected")}
        >
          Select specific
        </button>
      </div>
      {audience === "selected" ? (
        <ul style={styles.list} data-testid="join-me-select-list">
          {candidates.length === 0 ? (
            <li style={s.muted}>No Connections or pending Invites yet.</li>
          ) : (
            candidates.map((person) => (
              <li key={`${person.source}-${person.id}`}>
                <label style={styles.check}>
                  <input
                    type="checkbox"
                    checked={selected.has(Number(person.id))}
                    disabled={disabled}
                    onChange={() => toggle(person.id)}
                  />
                  <span>
                    {person.display_name}
                    {person.source === "invite" ? (
                      <span style={styles.tag}> Pending Invite</span>
                    ) : person.source === "pending" ? (
                      <span style={styles.tag}> Pending Connect</span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>
      ) : (
        <p style={preset ? styles.presetHint : s.muted}>
          Any accepted Connection can see Join Me.
        </p>
      )}
      {showCapacity && typeof onJoinCapacityChange === "function" ? (
        <label style={preset ? styles.presetSeats : styles.seats}>
          How many openings
          <input
            type="number"
            min={1}
            max={99}
            value={joinCapacity}
            disabled={disabled}
            onChange={(e) => onJoinCapacityChange(e.target.value)}
            style={preset ? styles.presetNum : styles.num}
            aria-label="How many openings"
          />
        </label>
      ) : null}
    </div>
  ) : null;

  if (preset) {
    return <div data-testid="join-me-audience-dialog">{audienceRow}</div>;
  }

  return (
    <div data-testid="join-me-audience-dialog">
      <label style={styles.check}>
        <input
          type="checkbox"
          checked={joinable}
          disabled={disabled}
          onChange={(e) => onJoinableChange(e.target.checked)}
        />
        Open to Join Me
      </label>
      {audienceRow}
    </div>
  );
}

const styles = {
  check: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    margin: "8px 0",
  },
  box: {
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  presetBox: {
    marginTop: 8,
    padding: 0,
    border: "none",
    background: "transparent",
  },
  prompt: { margin: "0 0 8px", fontWeight: 700, color: "#0f172a" },
  presetPrompt: {
    margin: "0 0 6px",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
  },
  presetActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  presetOpt: {
    appearance: "none",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    minHeight: 32,
  },
  presetOptOn: {
    appearance: "none",
    font: "inherit",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    minHeight: 32,
  },
  presetHint: {
    margin: "6px 0 0",
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.4,
  },
  list: { listStyle: "none", margin: "8px 0 0", padding: 0 },
  tag: { fontSize: 11, fontWeight: 700, color: "#64748b" },
  seats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 10,
  },
  presetSeats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    marginTop: 8,
  },
  num: {
    width: 72,
    minHeight: 40,
    borderRadius: 10,
    border: "1.5px solid #d1d5db",
    padding: "0 8px",
    font: "inherit",
  },
  presetNum: {
    width: 56,
    minHeight: 32,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    padding: "0 8px",
    font: "inherit",
    fontSize: 13,
    background: "#fff",
  },
};
