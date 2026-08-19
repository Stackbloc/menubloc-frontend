/**
 * Compose tokens for I'm Eating / What Diners Are Saying — matches
 * DinerStatusComposer + profile readable surfaces (stone palette).
 */

export const INK = "#1c1917";
export const MUTED = "#78716c";
export const BORDER = "#d6d3d1";
export const LABEL = "#44403c";
export const DIVIDER = "#e7e5e4";

export const form = { display: "grid", gap: 8 };

export const fieldStack = form;

export const label = { fontSize: 13, fontWeight: 600, color: LABEL };

export const input = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  color: INK,
  background: "#fff",
};

export const textarea = {
  ...input,
  resize: "vertical",
  minHeight: 72,
};

export const actionRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

export const photoBtn = {
  appearance: "none",
  minHeight: 44,
  padding: "0 12px",
  borderRadius: 10,
  border: `1.5px solid ${BORDER}`,
  background: "#ffffff",
  color: LABEL,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "inherit",
  flexShrink: 0,
};

export const libraryLink = {
  appearance: "none",
  border: "none",
  background: "transparent",
  color: MUTED,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  fontFamily: "inherit",
};

export const textAction = {
  appearance: "none",
  border: "none",
  background: "transparent",
  color: MUTED,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
  fontFamily: "inherit",
  textDecoration: "underline",
};

export const primaryBtn = {
  appearance: "none",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  minHeight: 44,
  background: "linear-gradient(135deg, #16a34a, #15803d)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
  flexShrink: 0,
};

export const secondaryBtn = {
  appearance: "none",
  border: `1.5px solid ${BORDER}`,
  borderRadius: 10,
  padding: "10px 14px",
  minHeight: 44,
  background: "#fff",
  color: INK,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const joinBtn = {
  appearance: "none",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  minHeight: 44,
  background: INK,
  color: "#fff",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
  justifySelf: "start",
};

export function panelShell(compact) {
  if (!compact) return undefined;
  return {
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${DIVIDER}`,
  };
}

export const mediaThumb = {
  width: 56,
  height: 56,
  objectFit: "cover",
  borderRadius: 10,
  display: "block",
  background: "#f5f5f4",
  flexShrink: 0,
  border: `1px solid ${DIVIDER}`,
};

export const postedCard = {
  marginTop: 12,
  padding: "12px 14px",
  borderRadius: 12,
  border: `1px solid ${DIVIDER}`,
  background: "#fff",
  display: "grid",
  gap: 8,
};

export const kicker = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: MUTED,
};

export const error = { margin: "0 0 8px", color: "#b91c1c", fontSize: 13, fontWeight: 600 };
export const notice = { margin: "0 0 8px", color: "#14532d", fontSize: 13, fontWeight: 600 };
