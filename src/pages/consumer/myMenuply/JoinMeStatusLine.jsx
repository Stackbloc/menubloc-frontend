/**
 * Quiet Join Me status line — same pattern as Edit View StatusToggle
 * (“Join Crew is On — click to turn Off”). Never a green pill.
 */

const statusBtn = {
  appearance: "none",
  width: "100%",
  textAlign: "left",
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  borderRadius: 12,
  padding: "10px 12px",
  font: "inherit",
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
  cursor: "pointer",
  minHeight: 44,
  marginTop: 8,
};

export default function JoinMeStatusLine({
  open = false,
  busy = false,
  onToggle,
  testId = "join-me-status-line",
}) {
  const state = open ? "On" : "Off";
  const hint = open ? "click to turn Off" : "click to turn On";
  if (typeof onToggle !== "function") return null;
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!open);
      }}
      style={statusBtn}
    >
      Join Me is {state} — {hint}
    </button>
  );
}
