import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";

export default function JoinPage() {
  useEffect(() => {
    const preconnectId = "menuply-dm-sans-preconnect";
    const fontId = "menuply-dm-sans-font";

    if (!document.getElementById(preconnectId)) {
      const preconnect = document.createElement("link");
      preconnect.id = preconnectId;
      preconnect.rel = "preconnect";
      preconnect.href = "https://fonts.googleapis.com";
      document.head.appendChild(preconnect);
    }

    if (!document.getElementById(fontId)) {
      const font = document.createElement("link");
      font.id = fontId;
      font.rel = "stylesheet";
      font.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
      document.head.appendChild(font);
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

        <div style={styles.eyebrow}>For Restaurant Owners</div>

        <h1 style={styles.heading}>
          Be among the first restaurants in your area on the Menuply network.
        </h1>

        <p style={styles.paragraph}>
          High commissions have forced restaurants to raise prices and surrender customer relationships
          to third-party platforms. Restaurants deserve a better deal.
        </p>
        <p style={styles.paragraph}>
          Menuply is a self-service, lower-cost alternative that helps restaurants keep more revenue and
          offer better value to diners.
        </p>
        <p style={{ ...styles.paragraph, marginBottom: 0 }}>
          Join us as we build a better deal for restaurants and diners alike.
        </p>

        <div style={styles.actions}>
          <Link
            to="/restaurant/signup/free-profile"
            style={styles.cta}
          >
            Join the Network →
          </Link>
          <p style={styles.reassurance}>No credit card · No commitment · Free to start</p>
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
  },
  paragraph: {
    fontSize: ".95rem",
    color: "#888",
    lineHeight: 1.75,
    margin: "0 0 16px",
  },
  actions: {
    marginTop: 36,
  },
  cta: {
    display: "inline-block",
    background: "#3DD934",
    color: "#0D0D0D",
    textDecoration: "none",
    fontSize: "1rem",
    fontWeight: 700,
    padding: "14px 32px",
    borderRadius: 8,
  },
  reassurance: {
    margin: "12px 0 0",
    fontSize: ".77rem",
    color: "#444",
    lineHeight: 1.75,
  },
  footer: {
    marginTop: 52,
    fontSize: ".75rem",
    color: "#444",
  },
  footerLink: {
    color: "inherit",
    textDecoration: "none",
  },
};
