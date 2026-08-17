/**
 * After a guest report is already live — optional account, never a gate.
 */
import { Link } from "react-router-dom";

export default function GuestContributeNextStep({
  nextPath = "/account/login",
  identityAction = "Join Me, Dining Crew, and a personal history",
}) {
  const to = `${nextPath}${nextPath.includes("?") ? "&" : "?"}next=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
  )}`;
  return (
    <div data-testid="guest-contribute-next-step" style={styles.wrap}>
      <p style={styles.title}>Your report is live.</p>
      <p style={styles.body}>
        Anyone can contribute. A Menuply account unlocks identity features like {identityAction}.
      </p>
      <Link to={to} style={styles.link}>
        Create a free account
      </Link>
    </div>
  );
}

const styles = {
  wrap: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  title: { margin: 0, fontSize: 14, fontWeight: 800, color: "#14532d" },
  body: { margin: "6px 0 8px", fontSize: 13, color: "#475569", lineHeight: 1.45 },
  link: { color: "#0f766e", fontWeight: 700, fontSize: 13, textDecoration: "none" },
};
