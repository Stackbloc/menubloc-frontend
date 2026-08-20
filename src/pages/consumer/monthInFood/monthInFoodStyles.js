/** My Month in Food — exhibit scoreboard palette */

export const CREAM = "#F7F3EA";
export const FOREST = "#14532d";
export const FOREST_MID = "#166534";
export const FOREST_BRIGHT = "#15803d";
export const INK = "#1c1917";
export const MUTED = "#78716c";
export const CARD = "#ffffff";
export const BORDER = "#e7e5e4";

export const page = {
  minHeight: "100vh",
  background: CREAM,
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  padding: "0 0 calc(var(--bottom-nav-h, 72px) + 24px)",
  color: INK,
};

export const inner = {
  maxWidth: 1080,
  margin: "0 auto",
  padding: "16px 16px 0",
  boxSizing: "border-box",
};

export const heroGrid = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 20,
  marginBottom: 20,
};

export const title = {
  margin: "0 0 10px",
  fontSize: 36,
  lineHeight: 1.1,
  fontWeight: 700,
  fontFamily: 'Georgia, "Times New Roman", serif',
  color: FOREST,
  letterSpacing: "-0.02em",
};

export const titleRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};

export const monthPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: FOREST,
  color: "#fff",
  borderRadius: 999,
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 700,
};

export const monthNavBtn = {
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
  padding: "0 2px",
};

export const tagline = {
  margin: "12px 0 0",
  fontSize: 15,
  color: MUTED,
  lineHeight: 1.45,
};

export const heroMedia = {
  position: "relative",
  borderRadius: 20,
  overflow: "hidden",
  minHeight: 200,
  background: `linear-gradient(145deg, ${FOREST} 0%, ${FOREST_MID} 55%, #0f3d24 100%)`,
  boxShadow: "0 16px 40px rgba(20,83,45,0.18)",
};

export const heroImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  minHeight: 200,
};

export const heroBadge = {
  position: "absolute",
  right: 14,
  bottom: 14,
  width: 112,
  height: 112,
  borderRadius: "50%",
  background: "rgba(15,23,42,0.82)",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 12,
  fontSize: 12,
  lineHeight: 1.25,
  fontFamily: 'Georgia, "Times New Roman", serif',
};

export const statsBar = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: 10,
  background: CARD,
  borderRadius: 18,
  padding: "14px 10px",
  boxShadow: "0 8px 24px rgba(28,25,23,0.06)",
  border: `1px solid ${BORDER}`,
  marginBottom: 22,
};

export const statCell = {
  textAlign: "center",
};

export const statValue = {
  fontSize: 22,
  fontWeight: 800,
  color: FOREST,
  letterSpacing: "-0.02em",
};

export const statLabel = {
  fontSize: 11,
  color: MUTED,
  fontWeight: 600,
  marginTop: 2,
};

export const columns = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 22,
};

export const card = {
  background: CARD,
  borderRadius: 18,
  padding: 16,
  border: `1px solid ${BORDER}`,
  boxShadow: "0 8px 24px rgba(28,25,23,0.05)",
  marginBottom: 16,
};

export const sectionHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 12,
};

export const sectionTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: INK,
  fontFamily: 'Georgia, "Times New Roman", serif',
};

export const viewAll = {
  fontSize: 12,
  fontWeight: 700,
  color: FOREST_BRIGHT,
  textDecoration: "none",
};

export const footer = {
  marginTop: 28,
  marginLeft: -16,
  marginRight: -16,
  background: FOREST,
  color: "#fff",
  padding: "28px 20px",
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  alignItems: "center",
  justifyContent: "space-between",
};

export const footerTag = {
  margin: "6px 0 0",
  fontSize: 13,
  opacity: 0.9,
  fontFamily: 'Georgia, "Times New Roman", serif',
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
  color: MUTED,
  fontSize: 14,
};

export const CUISINE_COLORS = ["#14532d", "#166534", "#ca8a04", "#b45309", "#78716c"];
