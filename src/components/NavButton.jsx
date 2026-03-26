import { Link, useNavigate } from "react-router-dom";

const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid rgba(18,34,28,0.14)",
  background: "rgba(255,255,255,0.76)",
  backdropFilter: "blur(10px)",
  color: "#11211a",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  lineHeight: 1,
};

/** Goes to "/" (Discovery) */
export function HomeButton() {
  return (
    <Link to="/" style={btnStyle}>
      ← Discovery
    </Link>
  );
}

/** Goes back one step in browser history */
export function BackButton() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)} style={btnStyle}>
      ← Back
    </button>
  );
}

/**
 * Standard page-level nav wrapper.
 * Provides consistent marginBottom: 20 on every page so the button
 * sits the same distance above the page content everywhere.
 *
 * Usage:
 *   <PageNav />       → HomeButton (links to /)
 *   <PageNav back />  → BackButton (browser history -1)
 */
export function PageNav({ back = false }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#11211a", marginBottom: 10 }}>
        Grubbid
      </div>
      <div>
        {back ? <BackButton /> : <HomeButton />}
      </div>
    </div>
  );
}
