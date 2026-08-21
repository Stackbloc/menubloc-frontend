/** My Menuply — exhibit palette: forest green, cream, photo-forward cards. */

export const GREEN = "#14532d";
export const GREEN_MID = "#166534";
export const GREEN_BRIGHT = "#15803d";
export const CREAM = "#faf8f5";
export const CREAM_DEEP = "#f3efe6";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#d1fae5";
const BORDER_INPUT = "#86efac";
const ACCENT = GREEN_BRIGHT;

export const page = {
  minHeight: "100vh",
  background: CREAM,
  fontFamily: "Inter, Arial, sans-serif",
  padding: "0 16px calc(var(--bottom-nav-h, 72px) + 16px)",
  maxWidth: 680,
  margin: "0 auto",
  boxSizing: "border-box",
};

export const pageHeroBand = {
  margin: "0 -16px 0",
  padding: "18px 16px 20px",
  background: "linear-gradient(165deg, #14532d 0%, #166534 48%, #15803d 100%)",
  color: "#fff",
  borderRadius: "0 0 24px 24px",
  boxShadow: "0 12px 32px rgba(20, 83, 45, 0.22)",
};

export const kicker = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.72)",
  margin: "0 0 6px",
};

export const h1 = {
  margin: "0 0 4px",
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#fff",
  fontFamily: 'Georgia, "Times New Roman", serif',
};

export const lead = {
  margin: "0 0 0",
  fontSize: 14,
  color: "rgba(255,255,255,0.88)",
  lineHeight: 1.5,
};

export const identitySection = {
  margin: "0 0 0",
  padding: "20px 16px",
  marginTop: -8,
  marginLeft: -16,
  marginRight: -16,
  background: "#fff",
  borderRadius: "20px 20px 0 0",
  borderTop: `1px solid ${BORDER}`,
  boxShadow: "0 -8px 24px rgba(20, 83, 45, 0.06)",
};

export const section = {
  margin: "0 0 0",
  padding: "22px 0",
  borderBottom: `1px solid ${BORDER}`,
};

export const presentationBlock = {
  marginTop: 28,
};

export const statsBar = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 0,
  margin: "16px 0 0",
  padding: "14px 8px",
  borderRadius: 16,
  background: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)",
  border: `1px solid ${BORDER}`,
  boxShadow: "0 4px 16px rgba(20, 83, 45, 0.08)",
};

export const statsCell = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  textAlign: "center",
  padding: "0 4px",
};

export const statsCellDivider = {
  borderRight: `1px solid ${BORDER}`,
};

export const statsCellButton = {
  appearance: "none",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const statsCellSelected = {
  background: "rgba(22, 163, 74, 0.12)",
  borderRadius: 12,
};

export const statsValue = {
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#14532d",
  lineHeight: 1.1,
};

export const statsLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: MUTED,
  lineHeight: 1.2,
};

export const displaySectionTitle = {
  margin: "0 0 12px",
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#14532d",
  fontFamily: 'Georgia, "Times New Roman", serif',
};

export const aboutTitleRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 8,
};

export const monthInFoodIconLink = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 10,
  color: GREEN_BRIGHT,
  background: "rgba(21, 128, 61, 0.08)",
  border: "1px solid rgba(21, 128, 61, 0.22)",
  textDecoration: "none",
  flex: "0 0 auto",
};

export const settingsIconLink = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 10,
  color: "#374151",
  background: "rgba(15, 23, 42, 0.04)",
  border: "1px solid rgba(15, 23, 42, 0.12)",
  textDecoration: "none",
  flex: "0 0 auto",
};

export const settingsTextLink = {
  fontSize: 14,
  fontWeight: 700,
  color: GREEN_BRIGHT,
  textDecoration: "none",
  flex: "0 0 auto",
};

export const sectionTitle = {
  margin: "0 0 4px",
  fontSize: 17,
  fontWeight: 800,
  color: GREEN,
  letterSpacing: "-0.02em",
  fontFamily: 'Georgia, "Times New Roman", serif',
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
  color: GREEN,
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  background: "#f0fdf4",
  border: `1.5px solid ${BORDER_INPUT}`,
  borderRadius: 999,
  padding: "8px 14px",
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
};

export const nameLink = {
  color: GREEN,
  fontWeight: 700,
  fontSize: 13,
  textDecoration: "none",
  background: "#f0fdf4",
  border: `1.5px solid ${BORDER_INPUT}`,
  borderRadius: 999,
  padding: "6px 12px",
};

export const textLink = {
  color: GREEN_BRIGHT,
  fontWeight: 700,
  fontSize: 13,
  textDecoration: "none",
};

export const textLinkBtn = {
  appearance: "none",
  border: "none",
  background: "transparent",
  color: GREEN_BRIGHT,
  fontWeight: 700,
  fontSize: 13,
  padding: 0,
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "underline",
};

export const textLinkAccent = {
  color: GREEN,
  fontWeight: 800,
  fontSize: 13,
  textDecoration: "none",
};

export const dayNavShell = {
  display: "grid",
  gridTemplateColumns: "44px 1fr 44px",
  alignItems: "center",
  gap: 10,
  margin: "0 0 18px",
  padding: "10px 12px",
  borderRadius: 16,
  background: "linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)",
  border: `2px solid ${GREEN_BRIGHT}`,
  boxShadow: "0 6px 20px rgba(20, 83, 45, 0.12)",
};

export const dayNavBtn = {
  appearance: "none",
  border: "none",
  background: GREEN,
  borderRadius: "50%",
  width: 40,
  height: 40,
  fontSize: 24,
  lineHeight: 1,
  color: "#fff",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 2px 8px rgba(20, 83, 45, 0.25)",
};

export const dayNavBtnDisabled = {
  opacity: 0.35,
  cursor: "default",
  background: "#94a3b8",
  boxShadow: "none",
};

export const dayNavLabel = {
  display: "block",
  fontSize: 17,
  fontWeight: 800,
  color: GREEN,
  letterSpacing: "-0.02em",
  fontFamily: 'Georgia, "Times New Roman", serif',
};

export const dayNavSub = {
  display: "block",
  marginTop: 2,
  fontSize: 12,
  fontWeight: 700,
  color: GREEN_BRIGHT,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

export const dayNavToday = {
  appearance: "none",
  border: "none",
  background: "transparent",
  color: GREEN_BRIGHT,
  fontSize: 12,
  fontWeight: 700,
  marginTop: 4,
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
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
  borderRadius: 16,
  overflow: "hidden",
  background: "#fff",
  border: `1px solid ${BORDER}`,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

export const heroCard = {
  ...photoCard,
  position: "relative",
};

export const heroMediaWrap = {
  position: "relative",
  width: "100%",
  background: "#f1f5f9",
};

export const heroOverlayTop = {
  position: "absolute",
  top: 10,
  left: 10,
  right: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
  pointerEvents: "none",
};

export const heroOverlayBottom = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "48px 14px 14px",
  background: "linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.72) 100%)",
  pointerEvents: "none",
};

export const heroBadge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.92)",
  color: "#334155",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.02em",
  boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
};

export const heroTitle = {
  margin: 0,
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "#fff",
  lineHeight: 1.25,
  textShadow: "0 1px 8px rgba(0,0,0,0.35)",
};

export const heroMeta = {
  margin: "4px 0 0",
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(255,255,255,0.88)",
};

export const heroCaption = {
  margin: "8px 0 0",
  fontSize: 14,
  color: "#fff",
  lineHeight: 1.45,
  textShadow: "0 1px 6px rgba(0,0,0,0.3)",
};

export const heroBody = {
  padding: "14px 16px 16px",
  background: "#fff",
};

export const heroActions = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 10,
  alignItems: "center",
};

export const heroDotNav = {
  display: "flex",
  justifyContent: "center",
  gap: 6,
  marginTop: 10,
};

export const heroDot = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  border: "none",
  padding: 0,
  cursor: "pointer",
  background: "#cbd5e1",
};

export const heroDotActive = {
  background: "#15803d",
  width: 18,
  borderRadius: 999,
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
  height: 320,
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
  padding: "14px 16px 16px",
  fontSize: 17,
  fontWeight: 800,
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
  border: `3px solid ${GREEN_BRIGHT}`,
  boxShadow: "0 4px 16px rgba(20, 83, 45, 0.18)",
  background: "#f0fdf4",
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
  background: GREEN,
  color: "#fff",
  display: "grid",
  placeItems: "center",
  fontSize: 11,
  fontWeight: 700,
  boxShadow: "0 2px 6px rgba(20, 83, 45, 0.35)",
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

export const profileMediaAddTile = {
  minHeight: 96,
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  background: "#fff",
  color: MUTED,
  fontWeight: 700,
  fontSize: 22,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export const profileMediaAddLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: MUTED,
  textAlign: "center",
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
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: GREEN,
  fontFamily: 'Georgia, "Times New Roman", serif',
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
  borderRadius: 16,
  padding: 20,
  textAlign: "center",
  boxShadow: "0 4px 16px rgba(20, 83, 45, 0.06)",
};

export const nameList = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  margin: "8px 0 0",
};

/* —— What I Ate meal-period day board —— */
export const mealBoard = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  marginTop: 8,
};

export const mealBoardTrack = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "stretch",
};

export const mealBoardHint = {
  margin: "4px 0 0",
  fontSize: 13,
  color: MUTED,
};

export const mealBoardHero = {
  display: "grid",
  gap: 18,
  marginTop: 4,
};

export const mealRow = {
  display: "grid",
  gridTemplateColumns: "88px 1fr",
  gap: 10,
  alignItems: "stretch",
};

export const mealRowStack = {
  display: "grid",
  gap: 8,
};

export const mealRowLabel = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: GREEN,
  paddingTop: 10,
  lineHeight: 1.3,
};

export const mealRowTrack = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  paddingBottom: 4,
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "thin",
};

export const mealRowStackTrack = {
  display: "grid",
  gap: 12,
};

export const mealHolder = {
  flex: "0 0 168px",
  width: 168,
  minHeight: 168,
  borderRadius: 16,
  overflow: "hidden",
  background: "#fff",
  border: `1px solid ${BORDER}`,
  boxShadow: "0 10px 28px rgba(20, 83, 45, 0.1)",
  position: "relative",
};

/** Full-width dish photo / logo hero for What I'm Eating. */
export const mealHeroCard = {
  width: "100%",
  borderRadius: 18,
  overflow: "hidden",
  background: "#0f172a",
  border: `1px solid ${BORDER}`,
  boxShadow: "0 14px 36px rgba(20, 83, 45, 0.14)",
  position: "relative",
};

export const mealHeroMediaBtn = {
  appearance: "none",
  border: "none",
  padding: 0,
  margin: 0,
  width: "100%",
  minHeight: 220,
  aspectRatio: "4 / 3",
  display: "block",
  position: "relative",
  cursor: "pointer",
  background: "#0f172a",
  font: "inherit",
  textAlign: "left",
};

export const mealHeroMedia = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  position: "absolute",
  inset: 0,
};

export const mealHeroLogo = {
  width: "58%",
  height: "58%",
  maxWidth: 220,
  maxHeight: 220,
  objectFit: "contain",
  display: "block",
  position: "absolute",
  left: "50%",
  top: "42%",
  transform: "translate(-50%, -50%)",
  background: "#fff",
  borderRadius: 16,
  padding: 12,
  boxSizing: "border-box",
};

export const mealHeroOverlayTop = {
  position: "absolute",
  top: 12,
  left: 12,
  right: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
  pointerEvents: "none",
  zIndex: 1,
};

export const mealHeroScrim = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "40px 14px 14px",
  background: "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.84) 100%)",
  color: "#fff",
  zIndex: 1,
};

export const mealHeroTitle = {
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1.25,
  letterSpacing: "-0.02em",
};

export const mealHeroMeta = {
  marginTop: 4,
  fontSize: 13,
  fontWeight: 600,
  opacity: 0.92,
  color: "#fff",
  textDecoration: "none",
};

export const mealHolderMediaBtn = {
  appearance: "none",
  border: "none",
  padding: 0,
  margin: 0,
  width: "100%",
  height: 168,
  display: "block",
  position: "relative",
  cursor: "pointer",
  background: "#0f172a",
  font: "inherit",
  textAlign: "left",
};

export const mealHolderOverlayTop = {
  position: "absolute",
  top: 8,
  left: 8,
  right: 8,
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  pointerEvents: "none",
  zIndex: 1,
};

export const mealHolderBadge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 8px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.92)",
  color: "#334155",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.02em",
  boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
};

export const mealHolderDelete = {
  position: "absolute",
  top: 8,
  right: 8,
  zIndex: 2,
  appearance: "none",
  border: "none",
  borderRadius: 8,
  padding: "5px 9px",
  fontSize: 11,
  fontWeight: 700,
  background: "rgba(15, 23, 42, 0.82)",
  color: "#fff",
  cursor: "pointer",
  boxShadow: "0 2px 10px rgba(15,23,42,0.25)",
};

/** Long-press Delete on hub cards (crews / events / plans) — not hover. */
export const hubCardDelete = {
  ...mealHolderDelete,
};

export const hubCardShell = {
  position: "relative",
};

export const mealHolderBadgeDark = {
  display: "inline-flex",
  alignItems: "center",
  alignSelf: "flex-start",
  padding: "3px 8px",
  borderRadius: 999,
  background: "rgba(20, 83, 45, 0.12)",
  color: GREEN,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.02em",
  marginBottom: 4,
};

export const mealHolderMedia = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

export const mealHolderLogo = {
  width: "72%",
  height: "72%",
  maxWidth: 120,
  maxHeight: 120,
  objectFit: "contain",
  display: "block",
  position: "absolute",
  left: "50%",
  top: "42%",
  transform: "translate(-50%, -50%)",
  background: "#fff",
  borderRadius: 12,
  padding: 8,
  boxSizing: "border-box",
};

export const mealHolderScrim = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "28px 10px 10px",
  background: "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.82) 100%)",
  color: "#fff",
};

export const mealHolderTitle = {
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.25,
  letterSpacing: "-0.01em",
};

export const mealHolderMeta = {
  marginTop: 2,
  fontSize: 11,
  fontWeight: 600,
  opacity: 0.9,
  color: "inherit",
  textDecoration: "none",
};

export const mealHolderText = {
  appearance: "none",
  border: "none",
  width: "100%",
  minHeight: 168,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 4,
  background: CREAM_DEEP,
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
  boxSizing: "border-box",
};

export const mealHolderTitleDark = {
  fontSize: 14,
  fontWeight: 800,
  color: INK,
  lineHeight: 1.25,
};

export const mealHolderMetaDark = {
  fontSize: 12,
  fontWeight: 600,
  color: GREEN_BRIGHT,
  textDecoration: "none",
};

export const mealHolderCaption = {
  fontSize: 11,
  color: MUTED,
  lineHeight: 1.35,
  marginTop: 4,
};

export const mealHolderLink = {
  marginTop: "auto",
  fontSize: 12,
  fontWeight: 700,
  color: GREEN_BRIGHT,
  textDecoration: "underline",
};

export const mealHolderEmpty = {
  appearance: "none",
  flex: "0 0 168px",
  width: 168,
  minHeight: 168,
  borderRadius: 16,
  border: `1.5px dashed ${BORDER_INPUT}`,
  background: "rgba(255,255,255,0.55)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  font: "inherit",
  color: MUTED,
};

export const mealHolderEmptyLabel = {
  fontSize: 13,
  fontWeight: 700,
  color: GREEN_MID,
};

export const mealHolderCameraBtn = {
  appearance: "none",
  border: "none",
  background: "transparent",
  width: "100%",
  minHeight: 168,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  color: GREEN,
  font: "inherit",
  padding: 0,
};

/* —— Upcoming Plans bold list —— */
export const plansPanel = {
  marginTop: 4,
};

export const plansEmpty = {
  margin: "8px 0 0",
  padding: "18px 16px",
  borderRadius: 16,
  background: "linear-gradient(165deg, #14532d 0%, #166534 55%, #15803d 100%)",
  color: "#fff",
  boxShadow: "0 12px 28px rgba(20, 83, 45, 0.2)",
};

export const plansEmptyText = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  lineHeight: 1.4,
};

export const plansEmptyLink = {
  color: "#bbf7d0",
  fontWeight: 800,
  textDecoration: "underline",
};

export const planCardBold = {
  appearance: "none",
  width: "100%",
  textAlign: "left",
  border: `1px solid ${BORDER}`,
  background: "#fff",
  borderRadius: 16,
  padding: "16px 16px 14px",
  font: "inherit",
  cursor: "pointer",
  marginBottom: 10,
  boxShadow: "0 10px 24px rgba(20, 83, 45, 0.08)",
  display: "block",
};

export const planCardBoldOpen = {
  boxShadow: "0 12px 28px rgba(20, 83, 45, 0.14)",
  borderColor: BORDER_INPUT,
};

export const planCardDate = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: GREEN_BRIGHT,
  marginBottom: 4,
};

export const planCardTitle = {
  fontSize: 17,
  fontWeight: 800,
  color: INK,
  letterSpacing: "-0.02em",
  lineHeight: 1.25,
};

export const planCardMeta = {
  marginTop: 4,
  fontSize: 13,
  color: MUTED,
  fontWeight: 600,
};

export const plansCalendarBtn = {
  appearance: "none",
  border: `1.5px solid ${BORDER_INPUT}`,
  background: "#fff",
  color: GREEN,
  borderRadius: 999,
  width: 40,
  height: 40,
  display: "inline-grid",
  placeItems: "center",
  cursor: "pointer",
  flexShrink: 0,
  boxShadow: "0 4px 12px rgba(20, 83, 45, 0.1)",
};
