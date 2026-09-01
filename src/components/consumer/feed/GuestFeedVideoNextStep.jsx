/**
 * After guest Feed video is live — optional signup, never a gate.
 */

import { Link } from "react-router-dom";

export default function GuestFeedVideoNextStep({ onDismiss, nextPath = "/account/signup" }) {
  const returnTo = encodeURIComponent("/feed");
  const signupTo = `${nextPath}${nextPath.includes("?") ? "&" : "?"}next=${returnTo}`;

  return (
    <div data-testid="guest-feed-video-next-step" style={styles.wrap}>
      <p style={styles.title}>Your video is live on the Feed.</p>
      <p style={styles.body}>
        Anyone can watch. Create a free Menuply account to claim your video, unlock Join Me, and
        build your profile.
      </p>
      <div style={styles.actions}>
        <Link to={signupTo} style={styles.primary}>
          Create a free account
        </Link>
        <button type="button" style={styles.secondary} onClick={() => onDismiss?.()}>
          Not now
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    left: 16,
    right: 16,
    bottom: "calc(var(--feed-primary-nav-h, 72px) + 16px)",
    zIndex: 1250,
    margin: 0,
    padding: "14px 16px",
    borderRadius: 14,
    background: "#101512",
    border: "1px solid rgba(94, 234, 212, 0.35)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
    fontFamily: "Inter, Arial, sans-serif",
  },
  title: { margin: 0, fontSize: 16, fontWeight: 900, color: "#e8f0ec" },
  body: { margin: "8px 0 12px", fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.72)" },
  actions: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" },
  primary: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 10,
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    textDecoration: "none",
  },
  secondary: {
    border: 0,
    background: "transparent",
    color: "rgba(255,255,255,0.72)",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    padding: "8px 4px",
  },
};
