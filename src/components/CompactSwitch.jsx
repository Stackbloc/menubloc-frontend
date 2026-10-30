/**
 * Small two-choice switch, the app's CompactSwitch (menuply-mobile src/components/CompactSwitch.tsx):
 * "Edit profile ●— View profile". Same look as SearchShopModeToggle (Search ●— Menu Browser): the chosen
 * label is dark and bold and the knob sits on its side. Tapping a label picks it; tapping the switch
 * flips it. `value` false = left lit.
 */

const TRACK_W = 40;
const TRACK_H = 22;
const KNOB = 18;
const TRAVEL = TRACK_W - KNOB - 4;

export default function CompactSwitch({ left, right, value, onChange, testId = null }) {
  const pick = (next) => {
    if (next !== value) onChange?.(next);
  };
  return (
    <div role="radiogroup" aria-label={`${left} or ${right}`} data-testid={testId || undefined} style={styles.row}>
      <button
        type="button"
        role="radio"
        aria-checked={!value}
        data-testid={testId ? `${testId}-left` : undefined}
        onClick={() => pick(false)}
        style={{ ...styles.label, ...(!value ? styles.labelOn : null) }}
      >
        {left}
      </button>
      <button type="button" role="switch" aria-checked={value} aria-label={`${left} or ${right}`} onClick={() => pick(!value)} style={styles.track}>
        <span style={{ ...styles.knob, transform: `translateX(${value ? TRAVEL : 0}px)` }} />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value}
        data-testid={testId ? `${testId}-right` : undefined}
        onClick={() => pick(true)}
        style={{ ...styles.label, ...(value ? styles.labelOn : null) }}
      >
        {right}
      </button>
    </div>
  );
}

const styles = {
  row: { display: "inline-flex", alignItems: "center", gap: 8 },
  label: {
    border: "none",
    background: "transparent",
    padding: "11px 2px",
    margin: "-11px 0",
    fontSize: 13,
    lineHeight: "18px",
    fontWeight: 500,
    color: "#5c665f",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  labelOn: { fontWeight: 800, color: "#111613" },
  // Either side is a choice, not "off", so the track stays green both ways.
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    border: "none",
    background: "#22c55e",
    padding: 2,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxSizing: "border-box",
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
    transition: "transform 150ms",
    display: "block",
  },
};
