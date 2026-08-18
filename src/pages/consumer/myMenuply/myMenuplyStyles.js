export const page = {
  minHeight: "100vh",
  background: "var(--gb-color-page, #f8fafc)",
  fontFamily: "Inter, Arial, sans-serif",
  padding: "16px 16px calc(var(--bottom-nav-h, 72px) + 16px)",
  maxWidth: 576,
  margin: "0 auto",
  boxSizing: "border-box",
};

export const kicker = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: "#9CA3AF",
  margin: "0 0 4px",
};

export const h1 = {
  margin: "0 0 6px",
  fontSize: 26,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  color: "#0B0F0C",
};

export const lead = {
  margin: "0 0 18px",
  fontSize: 14,
  color: "#667085",
  lineHeight: 1.45,
};

export const section = {
  margin: "0 0 28px",
};

export const sectionTitle = {
  margin: "0 0 4px",
  fontSize: 18,
  fontWeight: 900,
  color: "#0B0F0C",
};

export const sectionTitleLink = {
  color: "inherit",
  textDecoration: "none",
  font: "inherit",
};

export const labelRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  margin: "0 0 10px",
};

export const subLabel = {
  color: "#0B0F0C",
  fontWeight: 800,
  fontSize: 15,
  textDecoration: "none",
};

export const nameList = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  margin: "8px 0 0",
};

export const nameLink = {
  color: "#0B0F0C",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
};

export const sectionDesc = {
  margin: "0 0 12px",
  fontSize: 13,
  color: "#667085",
  lineHeight: 1.4,
};

export const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 8,
};

export const muted = { margin: 0, fontSize: 13, color: "#94A3B8" };
export const error = { margin: "0 0 12px", fontSize: 13, color: "#B42318" };

export const link = {
  color: "#0f766e",
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 13,
};

export const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
};

export const photoCard = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  borderRadius: 12,
  overflow: "hidden",
  background: "#e5e7eb",
  minHeight: 108,
};

export const photo = {
  width: "100%",
  height: 108,
  objectFit: "cover",
  display: "block",
};

export const photoLabel = {
  padding: "6px 8px 8px",
  fontSize: 11,
  fontWeight: 700,
  color: "#0B0F0C",
  lineHeight: 1.25,
  background: "#fff",
};

export const card = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  background: "#fff",
  border: "1px solid #e4e7ec",
  borderRadius: 14,
  padding: 12,
  marginBottom: 8,
};

export const actions = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 8,
  alignItems: "center",
};

export const chipBtn = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 28,
  padding: "0 10px",
  borderRadius: 999,
  border: "1px solid #d0d5dd",
  background: "#fff",
  color: "#1F4E3D",
  fontSize: 12,
  fontWeight: 800,
  textDecoration: "none",
};

export const primaryBtn = {
  ...chipBtn,
  background: "#1F4E3D",
  color: "#fff",
  border: "none",
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
  width: 112,
  height: 112,
  borderRadius: "50%",
  padding: 0,
  border: "3px solid #fff",
  boxShadow: "0 0 0 1px #e4e7ec, 0 8px 20px rgba(15,23,42,0.12)",
  background: "#e5e7eb",
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
  fontSize: 42,
  fontWeight: 900,
  color: "#1F4E3D",
  background: "linear-gradient(180deg, #ecfdf3 0%, #d1fae5 100%)",
};

export const identityCamera = {
  position: "absolute",
  right: 4,
  bottom: 4,
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#1F4E3D",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  fontSize: 14,
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
};

export const identityName = {
  margin: "4px 0 6px",
  fontSize: 22,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  color: "#0B0F0C",
};

export const aboutArea = {
  width: "100%",
  minHeight: 72,
  resize: "vertical",
  border: "1px solid #e4e7ec",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  lineHeight: 1.45,
  fontFamily: "inherit",
  color: "#0B0F0C",
  background: "#fff",
  boxSizing: "border-box",
};

export const aboutCount = {
  margin: "4px 0 0",
  fontSize: 11,
  color: "#98A2B3",
  textAlign: "right",
};

export const signInBox = {
  background: "#fff",
  border: "1px solid #e4e7ec",
  borderRadius: 16,
  padding: 20,
  textAlign: "center",
};
