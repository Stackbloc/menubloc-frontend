/**
 * Make Me This audience — independent from Join Me plan settings.
 */

import * as s from "./myMenuplyStyles.js";

export default function MmtAudiencePicker({
  audience,
  onAudienceChange,
  selectedIds,
  onSelectedIdsChange,
  candidates = [],
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
    <div data-testid="mmt-audience-picker">
      <p style={styles.prompt}>Who can see this on your profile?</p>
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
        <ul style={styles.list} data-testid="mmt-select-list">
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
        <p style={s.muted}>Any accepted Connection can see and respond.</p>
      )}
    </div>
  );
}

const styles = {
  prompt: { margin: "0 0 8px", fontWeight: 700, color: "#0f172a" },
  list: { listStyle: "none", margin: "8px 0 0", padding: 0 },
  check: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    margin: "6px 0",
  },
  tag: { fontSize: 11, fontWeight: 700, color: "#64748b" },
};
