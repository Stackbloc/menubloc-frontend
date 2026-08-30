/**
 * Guest landing CTA — invitation to open a Menuply account after opening shared content.
 */

import { Link } from "react-router-dom";
import {
  MENUPLY_ACCOUNT_INVITE_BODY,
  MENUPLY_ACCOUNT_INVITE_HEADLINE,
  menuplyLoginPath,
  menuplySignupPath,
} from "../../lib/menuplyAccountInvite.js";

export default function MenuplyAccountInviteCard({
  nextPath = "/feed",
  variant = "light",
  testId = "menuply-account-invite",
}) {
  const signupTo = menuplySignupPath(nextPath);
  const loginTo = menuplyLoginPath(nextPath);
  const isDark = variant === "dark";

  return (
    <section
      style={isDark ? styles.darkCard : styles.card}
      data-testid={testId}
      aria-label="Menuply account invitation"
    >
      <p style={isDark ? styles.darkEyebrow : styles.eyebrow}>Join Menuply</p>
      <h2 style={isDark ? styles.darkTitle : styles.title}>{MENUPLY_ACCOUNT_INVITE_HEADLINE}</h2>
      <p style={isDark ? styles.darkBody : styles.body}>{MENUPLY_ACCOUNT_INVITE_BODY}</p>
      <div style={styles.actions}>
        <Link
          to={signupTo}
          style={isDark ? styles.darkPrimary : styles.primary}
          data-testid={`${testId}-signup`}
        >
          Create free account
        </Link>
        <Link
          to={loginTo}
          style={isDark ? styles.darkSecondary : styles.secondary}
          data-testid={`${testId}-login`}
        >
          Sign in
        </Link>
      </div>
    </section>
  );
}

const styles = {
  card: {
    marginTop: 16,
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #d6d3d1",
    background: "#fafaf9",
  },
  darkCard: {
    marginTop: 12,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(94, 234, 212, 0.35)",
    background: "rgba(16, 40, 32, 0.85)",
    color: "#e8f0ec",
  },
  eyebrow: {
    margin: 0,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#57534e",
  },
  darkEyebrow: {
    margin: 0,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#5eead4",
  },
  title: {
    margin: "6px 0 4px",
    fontSize: 17,
    fontWeight: 800,
    color: "#1c1917",
  },
  darkTitle: {
    margin: "6px 0 4px",
    fontSize: 16,
    fontWeight: 800,
    color: "#fff",
  },
  body: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.45,
    color: "#57534e",
  },
  darkBody: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.45,
    color: "rgba(232,240,236,0.82)",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 999,
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    textDecoration: "none",
  },
  darkPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 14px",
    borderRadius: 999,
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    textDecoration: "none",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #d6d3d1",
    color: "#44403c",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
  },
  darkSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#e8f0ec",
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
  },
};
