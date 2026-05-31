import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import ShareButton from "../components/share/ShareButton.jsx";

const GOALS = [
  "Help diners save money through lower menu prices and better restaurant deals",
  "Help diners find the foods they are looking for more easily",
  "Provide diners with deeper insight into their dining choices",
];

function readSessionLocationLabel() {
  if (typeof window === "undefined") return null;
  try {
    return String(window.sessionStorage.getItem("grubbid.discovery.location") || "").trim() || null;
  } catch {
    return null;
  }
}

export default function JoinDinersPage() {
  const location = useLocation();
  const locationLabel = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const city = String(params.get("city") || "").trim();
    const state = String(params.get("state") || "").trim();
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    return readSessionLocationLabel();
  }, [location.search]);

  useEffect(() => {
    const preconnectId = "menuply-dm-sans-preconnect";
    const fontId = "menuply-dm-sans-font";
    if (!document.getElementById(preconnectId)) {
      const el = document.createElement("link");
      el.id = preconnectId;
      el.rel = "preconnect";
      el.href = "https://fonts.googleapis.com";
      document.head.appendChild(el);
    }
    if (!document.getElementById(fontId)) {
      const el = document.createElement("link");
      el.id = fontId;
      el.rel = "stylesheet";
      el.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
      document.head.appendChild(el);
    }
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <BrandLogo
          width={130}
          height={52}
          radius={0}
          pageColor="#0D0D0D"
          linkStyle={styles.logo}
          imageStyle={styles.logoImage}
        />

        <div style={styles.eyebrow}>For Diners</div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <h1 style={{ ...styles.heading, marginBottom: 0, flex: 1 }}>
            Join the Movement{locationLabel ? ` in ${locationLabel}` : ""}
          </h1>
          <ShareButton
            iconOnly
            size="compact"
            shareData={{
              title: "Menuply",
              text: "Join the movement to make dining out more affordable.",
              url: typeof window !== "undefined" ? `${window.location.origin}/join/diners` : "https://menuply.com/join/diners",
            }}
            analyticsContext={{ source: "join_diners" }}
            variant="menu"
          />
        </div>

        <p style={styles.paragraph}>
          Menuply is a new restaurant discovery and ordering platform. Our central premise is that
          dining out is becoming too expensive for many consumers. Menuply seeks to drastically reduce
          the cost of dining out by reducing the costs restaurants pay to reach diners.
        </p>

        <p style={styles.subheading}>
          We&apos;re building a platform designed around three simple goals:
        </p>

        <ul style={styles.goals}>
          {GOALS.map((g) => (
            <li key={g} style={styles.goalItem}>
              <span style={styles.dot} />
              <span>{g}</span>
            </li>
          ))}
        </ul>

        <p style={styles.paragraph}>
          We&apos;re building the Menuply network restaurant-by-restaurant and diner-by-diner across
          the country so we can create a stronger, lower-cost food ecosystem.
        </p>

        <p style={{ ...styles.paragraph, marginBottom: 0 }}>
          Create a free account today and join the movement. We&apos;ll notify you as restaurants,
          menus, deals, and new features become available
          {locationLabel ? ` in ${locationLabel}` : ""}.
        </p>

        <div style={styles.actions}>
          <Link to="/account/signup" style={styles.ctaPrimary}>
            Create Free Account
          </Link>
        </div>

        <footer style={styles.footer}>
          <Link to="/privacy" style={styles.footerLink}>Privacy</Link>
          {" · "}
          <Link to="/terms" style={styles.footerLink}>Terms</Link>
        </footer>
      </div>
    </main>
  );
}

const styles = {
  page: {
    boxSizing: "border-box",
    minHeight: "100dvh",
    background: "#0D0D0D",
    color: "#FFF",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
  },
  wrap: {
    boxSizing: "border-box",
    width: "100%",
    maxWidth: 480,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    marginBottom: 56,
    color: "#FFF",
  },
  logoImage: {
    filter: "none",
  },
  eyebrow: {
    display: "inline-block",
    background: "rgba(61,217,52,.1)",
    color: "#3DD934",
    fontSize: ".7rem",
    fontWeight: 700,
    letterSpacing: ".09em",
    textTransform: "uppercase",
    padding: "5px 13px",
    borderRadius: 100,
    border: "1px solid rgba(61,217,52,.2)",
    marginBottom: 20,
  },
  heading: {
    fontSize: "clamp(1.6rem,4.5vw,2.2rem)",
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: "-.025em",
    margin: "0 0 28px",
    color: "#FFFFFF",
  },
  subheading: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 1.75,
    margin: "0 0 12px",
  },
  paragraph: {
    fontSize: "1rem",
    color: "rgba(255,255,255,0.88)",
    lineHeight: 1.75,
    margin: "0 0 16px",
  },
  goals: {
    listStyle: "none",
    margin: "0 0 20px",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  goalItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: "1rem",
    color: "rgba(255,255,255,0.88)",
    lineHeight: 1.65,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#3DD934",
    flexShrink: 0,
    marginTop: 7,
  },
  actions: {
    marginTop: 36,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  ctaPrimary: {
    display: "block",
    background: "#3DD934",
    color: "#0D0D0D",
    textDecoration: "none",
    fontSize: "1rem",
    fontWeight: 700,
    padding: "14px 32px",
    borderRadius: 8,
    textAlign: "center",
  },
  footer: {
    marginTop: 52,
    fontSize: ".8rem",
    fontWeight: 500,
    color: "rgba(255,255,255,0.65)",
  },
  footerLink: {
    color: "rgba(255,255,255,0.85)",
    textDecoration: "none",
  },
};
