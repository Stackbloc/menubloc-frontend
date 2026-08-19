/**
 * Future-plan Join Me: anyone among Connections, or pick specific
 * Connections plus people with a pending Invite to Eat.
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
  disabled = false,
}) {
  const selected = new Set((selectedIds || []).map((id) => Number(id)));

  function toggle(id) {
    const n = Number(id);
    if (!n) return;
    const next = new Set(selected);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    onSelectedIdsChange([...next]);
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
      {joinable ? (
        <div role="dialog" aria-label="Open to be joined by" style={styles.box}>
          <p style={styles.prompt}>Open to be joined by</p>
          <div style={s.actions}>
            <button
              type="button"
              disabled={disabled}
              style={audience === "connections" ? s.primaryBtn : s.chipBtn}
              onClick={() => onAudienceChange("connections")}
            >
              Anyone Connect
            </button>
            <button
              type="button"
              disabled={disabled}
              style={audience === "selected" ? s.primaryBtn : s.chipBtn}
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
            <p style={s.muted}>Any accepted Connection can see Join Me.</p>
          )}
          <label style={styles.seats}>
            How many openings
            <input
              type="number"
              min={1}
              max={99}
              value={joinCapacity}
              disabled={disabled}
              onChange={(e) => onJoinCapacityChange(e.target.value)}
              style={styles.num}
              aria-label="How many openings"
            />
          </label>
        </div>
      ) : null}
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
    color: "#14532d",
    margin: "8px 0",
  },
  box: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  prompt: { margin: "0 0 8px", fontWeight: 800, color: "#14532d" },
  list: { listStyle: "none", margin: "8px 0 0", padding: 0 },
  tag: { fontSize: 11, fontWeight: 700, color: "#15803d" },
  seats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#14532d",
    marginTop: 10,
  },
  num: {
    width: 72,
    minHeight: 40,
    borderRadius: 10,
    border: "1.5px solid #86efac",
    padding: "0 8px",
    font: "inherit",
  },
};
