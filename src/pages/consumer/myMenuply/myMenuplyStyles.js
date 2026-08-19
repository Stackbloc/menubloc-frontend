/** My Menuply — aligned with account dashboard / site neutrals (not pastel social-app theme). */

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e5e7eb";
const BORDER_INPUT = "#d1d5db";
const ACCENT = "#15803d";

export const page = {
  minHeight: "100vh",
  background: "var(--gb-color-page, #ffffff)",
  fontFamily: "Inter, Arial, sans-serif",
  padding: "16px 16px calc(var(--bottom-nav-h, 72px) + 16px)",
  maxWidth: 680,
  margin: "0 auto",
  boxSizing: "border-box",
};

export const kicker = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: MUTED,
  margin: "0 0 4px",
};

export const h1 = {
  margin: "0 0 6px",
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: INK,
};

export const lead = {
  margin: "0 0 18px",
  fontSize: 14,
  color: MUTED,
  lineHeight: 1.5,
};

export const section = {
  margin: "0 0 0",
  padding: "20px 0",
  borderBottom: `1px solid ${BORDER}`,
};

export const sectionTitle = {
  margin: "0 0 4px",
  fontSize: 16,
  fontWeight: 800,
  color: INK,
  letterSpacing: "-0.02em",
};

export const sectionTitleLink = {
  color: "inherit",
  textDecoration: "none",
  font: "inherit",
};

export const cardTitleLink = {
  color: INK,
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 15,
};

export const labelRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  margin: "0 0 10px",
};

export const subLabel = {
  color: INK,
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  background: "#ffffff",
  border: `1.5px solid ${BORDER_INPUT}`,
  borderRadius: 10,
  padding: "8px 14px",
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
};

export const nameList = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  margin: "8px 0 0",
};

export const nameLink = {
  color: INK,
  fontWeight: 700,
  fontSize: 13,
  textDecoration: "none",
  background: "#ffffff",
  border: `1.5px solid ${BORDER_INPUT}`,
  borderRadius: 999,
  padding: "6px 12px",
};

export const sectionDesc = {
  margin: "0 0 12px",
  fontSize: 14,
  color: MUTED,
  lineHeight: 1.5,
};

export const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 8,
};

export const muted = { margin: 0, fontSize: 14, color: MUTED, lineHeight: 1.5 };

export const crewPurpose = {
  margin: "6px 0 0",
  fontSize: 14,
  color: "#334155",
  lineHeight: 1.45,
};

export const crewPurposeLabel = {
  fontWeight: 700,
  color: INK,
  marginRight: 6,
};
export const error = { margin: "0 0 12px", fontSize: 13, color: "#B42318" };

export const link = {
  color: ACCENT,
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 14,
};

export const grid = {
  display: "grid",
  gap: 12,
};

export const photoCard = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  borderRadius: 12,
  overflow: "hidden",
  background: "#fff",
  border: `1px solid ${BORDER}`,
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

export const photoButton = {
  ...photoCard,
  appearance: "none",
  border: `1px solid ${BORDER}`,
  padding: 0,
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  font: "inherit",
  position: "relative",
  overflow: "hidden",
};

export const photo = {
  width: "100%",
  height: 168,
  objectFit: "cover",
  display: "block",
  background: "#f1f5f9",
};

/** Compact eating row when there is no photo/video yet — save hero size for real media. */
export const eatingRowCompact = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  borderRadius: 12,
  background: "#fff",
  border: `1px solid ${BORDER}`,
  padding: "12px 14px",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

export const eatingMediaAddBtn = {
  appearance: "none",
  display: "inline-flex",
  alignItems: "center",
  minHeight: 32,
  padding: "0 10px",
  marginTop: 8,
  borderRadius: 999,
  border: `1.5px dashed ${BORDER_INPUT}`,
  background: "#fafafa",
  color: MUTED,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const photoLabel = {
  padding: "10px 12px 12px",
  fontSize: 15,
  fontWeight: 700,
  color: INK,
  lineHeight: 1.35,
  background: "#fff",
};

export const photoMeta = {
  margin: "4px 0 0",
  fontSize: 13,
  fontWeight: 500,
  color: MUTED,
  lineHeight: 1.35,
};

export const photoHintBar = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "8px 10px",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  textAlign: "center",
  pointerEvents: "none",
};

export const photoHoverHint = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  background: "rgba(15, 23, 42, 0.45)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  textAlign: "center",
  padding: 16,
  pointerEvents: "none",
};

export const planSummaryBtn = {
  appearance: "none",
  width: "100%",
  textAlign: "left",
  border: `1px solid ${BORDER}`,
  background: "#fff",
  borderRadius: 12,
  padding: "14px 16px",
  font: "inherit",
  fontWeight: 700,
  fontSize: 15,
  color: INK,
  cursor: "pointer",
  marginBottom: 8,
};

export const card = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  background: "#fff",
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 14,
  marginBottom: 8,
  boxShadow: "none",
};

export const actions = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 8,
  alignItems: "center",
};

export const socialActions = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  marginTop: 10,
  alignItems: "center",
};

export const chipBtn = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 999,
  border: `1.5px solid ${BORDER_INPUT}`,
  background: "#ffffff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
};

export const primaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 10,
  background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
  color: "#0B0F0C",
  fontSize: 14,
  fontWeight: 800,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "none",
};

export const avatar = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  objectFit: "cover",
  background: "#e5e7eb",
};

export const identity = {
  display: "flex",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 14,
};

export const identityPhotoBtn = {
  position: "relative",
  width: 96,
  height: 96,
  borderRadius: "50%",
  padding: 0,
  border: `2px solid ${BORDER}`,
  boxShadow: "none",
  background: "#f8fafc",
  overflow: "hidden",
  cursor: "pointer",
  flexShrink: 0,
};

export const identityPhoto = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

export const identityInitial = {
  width: "100%",
  height: "100%",
  display: "grid",
  placeItems: "center",
  fontSize: 36,
  fontWeight: 700,
  color: "#334155",
  background: "#f1f5f9",
};

export const identityCamera = {
  position: "absolute",
  right: 4,
  bottom: 4,
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#0f172a",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  fontSize: 11,
  fontWeight: 700,
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
};

export const profileMediaGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
  gap: 10,
};

export const profileMediaTile = {
  position: "relative",
  borderRadius: 10,
  overflow: "hidden",
  background: "#f8fafc",
  border: `1px solid ${BORDER}`,
  minHeight: 96,
};

export const profileMediaThumb = {
  width: "100%",
  height: 96,
  objectFit: "cover",
  display: "block",
  background: "#f1f5f9",
};

export const profileMediaRemove = {
  position: "absolute",
  right: 4,
  top: 4,
  border: "none",
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 700,
  background: "rgba(15, 23, 42, 0.78)",
  color: "#fff",
  cursor: "pointer",
};

export const profileMediaAdd = {
  minHeight: 96,
  borderRadius: 10,
  border: `1.5px dashed ${BORDER_INPUT}`,
  background: "#fafafa",
  color: MUTED,
  fontWeight: 700,
  fontSize: 12,
  padding: 8,
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  justifyContent: "center",
};

export const profileMediaCaptureBtn = {
  appearance: "none",
  flex: "1 1 0",
  minWidth: 0,
  border: `1px solid ${BORDER_INPUT}`,
  borderRadius: 8,
  background: "#ffffff",
  color: INK,
  fontWeight: 700,
  fontSize: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const identityName = {
  margin: "4px 0 6px",
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: INK,
};

export const aboutArea = {
  width: "100%",
  minHeight: 72,
  resize: "vertical",
  border: `1.5px solid ${BORDER_INPUT}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  lineHeight: 1.5,
  fontFamily: "inherit",
  color: INK,
  background: "#ffffff",
  boxSizing: "border-box",
};

export const aboutCount = {
  margin: "4px 0 0",
  fontSize: 11,
  color: "#94a3b8",
  textAlign: "right",
};

export const signInBox = {
  background: "#fff",
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 20,
  textAlign: "center",
};
