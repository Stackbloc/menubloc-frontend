/**
 * Invite Me Out: diner chooses who may invite her out for want-to-eat items.
 * Separate from Join Me (future plans).
 *
 * variant="preset" — Edit View: no open checkbox, quiet options matching status lines.
 */

import * as s from "./myMenuplyStyles.js";

export default function InviteMeOutAudiencePicker({
  open,
  onOpenChange,
  audience,
  onAudienceChange,
  selectedIds,
  onSelectedIdsChange,
  candidates = [],
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

  const audienceRow = open ? (
    <div
      role="group"
      aria-label="Who can invite me out"
      style={preset ? styles.presetBox : styles.box}
    >
      <p style={preset ? styles.presetPrompt : styles.prompt}>Who can invite me out</p>
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
        <ul style={styles.list} data-testid="invite-me-out-select-list">
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
          Any accepted Connection can use Invite Me Out.
        </p>
      )}
    </div>
  ) : null;

  if (preset) {
    return <div data-testid="invite-me-out-audience">{audienceRow}</div>;
  }

  return (
    <div data-testid="invite-me-out-audience">
      <label style={styles.check}>
        <input
          type="checkbox"
          checked={open}
          disabled={disabled}
          onChange={(e) => onOpenChange(e.target.checked)}
        />
        Open to Invite Me Out
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
};
