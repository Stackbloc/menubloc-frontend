import React from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { STATUS_LABEL, STATUS_TONE } from "./knowledgeFormat.js";

/**
 * Shared bits for Owner → Knowledge Library and Training Lab (plan 50).
 * Andre's UI rules: no oval or green pills, compact buttons sized to their label,
 * secondary actions as plain text links.
 */

const TONE_TEXT = {
  ok: "#146c2e",
  warn: "#93370d",
  bad: "#b42318",
  info: "#1849a9",
  muted: OWNER_COLORS.muted,
};

/** Neutral square-cornered tag; the meaning is carried by the text color, never a green fill. */
export function Tag({ tone = "muted", children, title }) {
  return (
    <span
      title={title}
      style={{
        display: "inline-block",
        padding: "1px 7px",
        borderRadius: 5,
        border: `1px solid ${OWNER_COLORS.line}`,
        background: "#fff",
        color: TONE_TEXT[tone] || TONE_TEXT.muted,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function TextLink({ onClick, children, tone = "info", disabled = false, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "none",
        background: "none",
        padding: 0,
        color: disabled ? OWNER_COLORS.muted : TONE_TEXT[tone] || TONE_TEXT.info,
        fontWeight: 700,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function StatusTag({ status }) {
  if (!status) return null;
  return <Tag tone={STATUS_TONE[status] || "muted"}>{STATUS_LABEL[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}</Tag>;
}
