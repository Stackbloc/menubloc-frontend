/**
 * Compact inline Join Me pill — Connect View / peer presentation.
 * Edit View uses JoinMeStatusLine for per-occasion eligibility instead.
 */

import { Link } from "react-router-dom";

export const JOIN_ME_BUTTON_FILL = "#173404";
export const JOIN_ME_CARD_ENDED_OPACITY = 0.55;

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  alignSelf: "center",
  padding: "8px 18px",
  borderRadius: 999,
  border: "none",
  background: JOIN_ME_BUTTON_FILL,
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
  lineHeight: 1.2,
  textDecoration: "none",
  cursor: "pointer",
  appearance: "none",
  whiteSpace: "nowrap",
  touchAction: "manipulation",
};

const endedStyle = {
  flexShrink: 0,
  alignSelf: "center",
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

/** Muted right-slot label when a plan/event is ended or join-closed. */
export function JoinMeEndedLabel({ children = "Ended", testId = "join-me-ended" }) {
  return (
    <span style={endedStyle} data-testid={testId}>
      {children}
    </span>
  );
}

/**
 * @param {object} props
 * @param {string} [props.href] — guest/peer join destination
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.disabled]
 * @param {string} [props.testId]
 */
export default function JoinMeButton({
  href = "",
  onClick,
  disabled = false,
  testId = "join-me-button",
  style: styleProp = null,
}) {
  const to = String(href || "").trim();
  const style = styleProp ? { ...pillStyle, ...styleProp } : pillStyle;

  if (to) {
    return (
      <Link
        to={to}
        data-testid={testId}
        aria-label="Join Me"
        style={{
          ...style,
          ...(disabled ? { opacity: 0.5, pointerEvents: "none" } : null),
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
      >
        Join Me
      </Link>
    );
  }

  return (
    <button
      type="button"
      data-testid={testId}
      aria-label="Join Me"
      disabled={disabled}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick?.(e);
      }}
    >
      Join Me
    </button>
  );
}
