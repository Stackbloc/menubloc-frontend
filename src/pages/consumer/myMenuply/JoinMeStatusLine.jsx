/**
 * Edit View — quiet Join Me eligibility control (StatusToggle pattern).
 * Connect View uses JoinMeButton instead — do not mount this on Connect/peer cards.
 */

const lineStyle = {
  appearance: "none",
  border: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  font: "inherit",
  fontSize: 13,
  fontWeight: 600,
  color: "#64748b",
  cursor: "pointer",
  textAlign: "right",
  lineHeight: 1.3,
  flexShrink: 0,
  alignSelf: "center",
  maxWidth: "46%",
};

/**
 * @param {object} props
 * @param {boolean} props.open — Join Me eligibility on for this occasion
 * @param {(next: boolean) => void} [props.onToggle]
 * @param {boolean} [props.busy]
 * @param {string} [props.testId]
 */
export default function JoinMeStatusLine({
  open = false,
  onToggle,
  busy = false,
  testId = "join-me-status-line",
}) {
  const isOpen = Boolean(open);
  const state = isOpen ? "On" : "Off";
  const hint = isOpen ? "click to turn Off" : "click to turn On";
  const interactive = typeof onToggle === "function" && !busy;

  return (
    <button
      type="button"
      data-testid={testId}
      disabled={!interactive}
      aria-pressed={isOpen}
      style={{
        ...lineStyle,
        ...(busy || !interactive ? { opacity: 0.65, cursor: "default" } : null),
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!interactive) return;
        onToggle?.(!isOpen);
      }}
    >
      Join Me is {state} — {hint}
    </button>
  );
}
