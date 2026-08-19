export const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #F4FBF6 0%, #FFF8F0 42%, #F7F3EA 100%)",
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
  color: "#15803d",
  margin: "0 0 4px",
};

export const h1 = {
  margin: "0 0 6px",
  fontSize: 28,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  color: "#14532d",
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
  fontSize: 20,
  fontWeight: 900,
  color: "#14532d",
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
  color: "#fff",
  fontWeight: 800,
  fontSize: 14,
  textDecoration: "none",
  background: "#16a34a",
  borderRadius: 999,
  padding: "8px 14px",
};

export const nameList = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  margin: "8px 0 0",
};

export const nameLink = {
  color: "#14532d",
  fontWeight: 700,
  fontSize: 13,
  textDecoration: "none",
  background: "#dcfce7",
  borderRadius: 999,
  padding: "6px 12px",
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
  gap: 14,
};

export const photoCard = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  borderRadius: 20,
  overflow: "hidden",
  background: "#fff",
  boxShadow: "0 10px 28px rgba(20, 83, 45, 0.12)",
  border: "1px solid #bbf7d0",
};

export const photoButton = {
  ...photoCard,
  appearance: "none",
  border: "1px solid #bbf7d0",
  padding: 0,
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  font: "inherit",
};

/* Casual snapshot — a hotdog on a plate. Not an Instagram Stories hero. */
export const photo = {
  width: "100%",
  height: 168,
  objectFit: "cover",
  display: "block",
  background: "linear-gradient(180deg, #bbf7d0 0%, #86efac 100%)",
};

export const photoLabel = {
  padding: "10px 12px 12px",
  fontSize: 16,
  fontWeight: 900,
  color: "#14532d",
  lineHeight: 1.25,
  background: "#FFF8F0",
};

export const photoMeta = {
  margin: "4px 0 0",
  fontSize: 13,
  fontWeight: 600,
  color: "#3f6212",
  lineHeight: 1.35,
};

export const card = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  background: "#fff",
  border: "1px solid #bbf7d0",
  borderRadius: 16,
  padding: 14,
  marginBottom: 8,
  boxShadow: "0 6px 18px rgba(20, 83, 45, 0.08)",
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
  border: "1px solid #86efac",
  background: "#f0fdf4",
  color: "#14532d",
  fontSize: 12,
  fontWeight: 800,
  textDecoration: "none",
};

export const primaryBtn = {
  ...chipBtn,
  background: "#16a34a",
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
  boxShadow: "0 0 0 3px #86efac, 0 8px 20px rgba(20,83,45,0.14)",
  background: "#dcfce7",
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
  color: "#14532d",
};

export const aboutArea = {
  width: "100%",
  minHeight: 72,
  resize: "vertical",
  border: "1px solid #bbf7d0",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  lineHeight: 1.45,
  fontFamily: "inherit",
  color: "#14532d",
  background: "#f0fdf4",
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
