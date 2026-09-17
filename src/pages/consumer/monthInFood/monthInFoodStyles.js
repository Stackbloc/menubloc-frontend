/**
 * My Month in Food — editorial redesign tokens
 * Spec: docs/architecture/2026-09-17_month-in-food-redesign-spec.md
 */

export const FONT_DISPLAY = '"Fraunces", Georgia, "Times New Roman", serif';
export const FONT_BODY = '"Public Sans", system-ui, -apple-system, sans-serif';

/** Light tokens (dark via prefers-color-scheme CSS vars on page) */
export const CREAM = "#F7F2E7";
export const PAPER = "#FFFDF8";
export const FOREST = "#16302A";
export const MOSS = "#4B6F55";
export const AMBER = "#DE9E33";
export const CLAY = "#B6472F";
export const INK = "#231F19";
export const MUTED = "#5B5548";
export const HAIRLINE = "#DDD3BE";

/** @deprecated alias — prefer MOSS */
export const FOREST_BRIGHT = MOSS;
/** @deprecated alias — prefer FOREST */
export const FOREST_MID = FOREST;
/** @deprecated alias — prefer PAPER */
export const CARD = PAPER;
/** @deprecated alias — prefer HAIRLINE */
export const BORDER = HAIRLINE;

export const MONOGRAM_PALETTE = ["#16302A", "#4B6F55", "#DE9E33", "#B6472F", "#5B5548", "#2F4A3E"];

export const FONT_IMPORT =
  '@import url("https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600;1,9..144,700&family=Public+Sans:wght@400;500;600;700&display=swap");';

export const page = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--mif-cream, #F7F2E7)",
  fontFamily: FONT_BODY,
  padding: "0 0 calc(var(--bottom-nav-h, 72px) + 24px)",
  color: "var(--mif-ink, #231F19)",
};

export const inner = {
  maxWidth: 600,
  width: "100%",
  margin: "0 auto",
  padding: "16px 16px 0",
  boxSizing: "border-box",
  minWidth: 0,
};

export const sectionGap = {
  marginBottom: 56,
};

export const title = {
  margin: "0 0 10px",
  fontSize: "clamp(40px, 9vw, 56px)",
  lineHeight: 1.05,
  fontWeight: 600,
  fontFamily: FONT_DISPLAY,
  color: "var(--mif-ink, #231F19)",
  letterSpacing: "-0.02em",
  maxWidth: "100%",
  wordBreak: "break-word",
};

export const titleRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

export const monthPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "var(--mif-forest, #16302A)",
  color: "#fff",
  borderRadius: 999,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: FONT_BODY,
};

export const monthNavBtn = {
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
  padding: "0 4px",
  borderRadius: 4,
};

export const tagline = {
  margin: "14px 0 0",
  fontSize: 15,
  color: "var(--mif-ink-soft, #5B5548)",
  lineHeight: 1.45,
};

export const byline = {
  margin: "8px 0 0",
  fontSize: 14,
  color: "var(--mif-ink-soft, #5B5548)",
};

export const card = {
  background: "var(--mif-paper, #FFFDF8)",
  borderRadius: 16,
  padding: 18,
  border: "1px solid var(--mif-hairline, #DDD3BE)",
  marginBottom: 0,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const sectionHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  marginBottom: 14,
};

export const sectionTitle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 600,
  color: "var(--mif-ink, #231F19)",
  fontFamily: FONT_DISPLAY,
};

export const viewAll = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--mif-moss, #4B6F55)",
  textDecoration: "none",
};

export const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  border: "1px solid var(--mif-hairline, #DDD3BE)",
  borderRadius: 16,
  overflow: "hidden",
  background: "var(--mif-paper, #FFFDF8)",
};

export const statCell = {
  textAlign: "center",
  padding: "16px 10px",
  borderRight: "1px solid var(--mif-hairline, #DDD3BE)",
  borderBottom: "1px solid var(--mif-hairline, #DDD3BE)",
  boxSizing: "border-box",
};

export const statValue = {
  fontSize: 26,
  fontWeight: 600,
  fontFamily: FONT_DISPLAY,
  color: "var(--mif-ink, #231F19)",
  letterSpacing: "-0.02em",
};

export const statLabel = {
  fontSize: 12,
  color: "var(--mif-ink-soft, #5B5548)",
  fontWeight: 500,
  marginTop: 4,
  lineHeight: 1.25,
};

export const hScrollRail = {
  display: "flex",
  gap: 14,
  overflowX: "auto",
  maxWidth: "100%",
  minWidth: 0,
  WebkitOverflowScrolling: "touch",
  paddingBottom: 6,
  scrollbarWidth: "thin",
};

export const footer = {
  marginTop: 28,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  background: "var(--mif-forest, #16302A)",
  color: "#fff",
  padding: "28px 20px",
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  alignItems: "center",
  justifyContent: "space-between",
  minWidth: 0,
  borderRadius: 16,
};

export const footerTag = {
  margin: "6px 0 0",
  fontSize: 14,
  opacity: 0.9,
  fontFamily: FONT_DISPLAY,
  fontStyle: "italic",
};

export const qrBox = {
  width: 108,
  height: 108,
  background: "#fff",
  borderRadius: 12,
  padding: 6,
  boxSizing: "border-box",
};

export const muted = {
  color: "var(--mif-ink-soft, #5B5548)",
  fontSize: 14,
};

/** Legacy aliases used by older section fragments */
export const heroGrid = { display: "block", marginBottom: 0 };
export const heroMedia = {};
export const heroImg = {};
export const heroBadge = {};
export const statsBar = statsGrid;
export const columns = { display: "block" };
export const CUISINE_COLORS = MONOGRAM_PALETTE;
