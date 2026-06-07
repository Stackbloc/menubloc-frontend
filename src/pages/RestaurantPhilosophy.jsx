import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PLAN_ROUTE = "/restaurant/signup";
const LOGO_SRC = "/menuplyofficialsmalllogo.png";

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#141a14",
    color: "#f0ede6",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 17,
    lineHeight: 1.65,
    WebkitFontSmoothing: "antialiased",
  },
  shell: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "48px 24px 80px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 40,
  },
  logoImage: {
    height: 36,
    width: "auto",
    display: "block",
  },
  sectionLabel: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#f0ede6",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 4,
    padding: "3px 10px",
    marginBottom: 20,
  },
  heading: {
    fontSize: "clamp(28px, 6vw, 42px)",
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: "-0.5px",
    color: "#f0ede6",
    margin: "0 0 28px",
  },
  bodyText: {
    color: "#c9c4bb",
    margin: "0 0 18px",
  },
  heroSubhead: {
    color: "#ded9d0",
    fontSize: 18,
    margin: "0 0 28px",
  },
  bodyTextLast: {
    color: "#c9c4bb",
    margin: "0 0 32px",
  },
  goalSection: {
    marginBottom: 28,
  },
  goalIntro: {
    color: "#c9c4bb",
    margin: "0 0 14px",
  },
  goalList: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    margin: 0,
    padding: 0,
  },
  goalItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    color: "#c9c4bb",
  },
  goalDot: {
    flexShrink: 0,
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#4caf50",
    marginTop: 8,
  },
  card: {
    background: "#1e261e",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "22px 24px",
    color: "#c9c4bb",
    marginBottom: 24,
  },
  faqCard: {
    background: "#1e261e",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "22px 24px",
    marginBottom: 24,
    position: "relative",
  },
  faqBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#4caf50",
    background: "rgba(76,175,80,0.15)",
    border: "1px solid rgba(76,175,80,0.3)",
    borderRadius: 4,
    padding: "3px 9px",
    marginBottom: 12,
  },
  faqTitle: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.3px",
    color: "#f0ede6",
    margin: "0 48px 10px 0",
    lineHeight: 1.2,
  },
  faqIntro: {
    color: "#9e9a92",
    margin: "0 0 14px",
  },
  viewLink: {
    color: "#4caf50",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: 15,
    background: "transparent",
    border: 0,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  expandBtn: {
    position: "absolute",
    top: 22,
    right: 22,
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#4caf50",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 20,
    lineHeight: 1,
    transition: "background 0.15s",
  },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    margin: "0 0 24px",
  },
  agreement: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    background: "#1e261e",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "18px 20px",
    marginBottom: 20,
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: {
    appearance: "none",
    WebkitAppearance: "none",
    flexShrink: 0,
    width: 20,
    height: 20,
    border: "2px solid rgba(255,255,255,0.25)",
    borderRadius: 4,
    background: "transparent",
    cursor: "pointer",
    marginTop: 1,
    transition: "border-color 0.15s, background 0.15s",
  },
  checkboxChecked: {
    backgroundColor: "#4caf50",
    borderColor: "#4caf50",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 9'%3E%3Cpath d='M1 4l3.5 3.5L11 1' stroke='%23fff' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "12px 9px",
  },
  agreementText: {
    color: "#c9c4bb",
    fontSize: 15,
    cursor: "pointer",
  },
};

function continueBtn(enabled) {
  return {
    display: "block",
    width: "100%",
    padding: 17,
    background: enabled ? "#4caf50" : "rgba(255,255,255,0.12)",
    color: enabled ? "#fff" : "rgba(255,255,255,0.35)",
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    borderRadius: 10,
    cursor: enabled ? "pointer" : "not-allowed",
    transition: "background 0.2s, color 0.2s",
    letterSpacing: "0.01em",
    fontFamily: "inherit",
  };
}

function RestaurantFaqCard() {
  return (
    <div style={styles.faqCard}>
      <button
        type="button"
        style={styles.expandBtn}
        aria-label="Expand"
      >
        +
      </button>
      <div style={styles.faqBadge}>Restaurant FAQ</div>
      <h2 style={styles.faqTitle}>Questions about Menuply?</h2>
      <p style={styles.faqIntro}>
        Practical answers about cost, growth expectations, and fit before moving deeper into onboarding.
      </p>
      <a href="#" style={styles.viewLink}>
        View FAQ
      </a>
    </div>
  );
}

export default function RestaurantPhilosophy() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={styles.page}>
      <main style={styles.shell}>
        <div style={styles.logo}>
          <img src={LOGO_SRC} alt="Menuply" style={styles.logoImage} />
        </div>

        <div style={styles.sectionLabel}>For Restaurants</div>

        <h1 style={styles.heading}>
          The future of the restaurant industry will not be built on higher prices alone.
        </h1>

        <p style={styles.heroSubhead}>
          The future will be built by restaurants that create more value for diners, and Menuply was built to support
          that future.
        </p>

        <p style={styles.bodyText}>
          Traditional delivery platforms have pushed restaurants to raise prices simply to cover platform fees. Menuply
          is built differently.
        </p>
        <p style={styles.bodyText}>
          Menuply is a fully self-service platform built without the heavy sales, onboarding, and operational overhead
          common in traditional delivery marketplaces. By maintaining a lower-cost operating model, Menuply gives
          restaurants greater flexibility to offer more competitive pricing, richer menu information, and better overall
          value to diners.
        </p>
        <p style={styles.bodyTextLast}>
          Restaurants always control their own pricing, but Menuply is designed for restaurant partners who intend to use
          the platform's lower-cost structure to create better value for diners.
        </p>

        <div style={styles.goalSection}>
          <p style={styles.goalIntro}>Our goal is simple:</p>
          <ul style={styles.goalList}>
            <li style={styles.goalItem}>
              <span style={styles.goalDot} aria-hidden="true" />
              <span>Help restaurants better serve their patrons and build long-term success.</span>
            </li>
            <li style={styles.goalItem}>
              <span style={styles.goalDot} aria-hidden="true" />
              <span>Help diners navigate their options and experience better value.</span>
            </li>
          </ul>
        </div>

        <div style={styles.card}>
          Menuply partners with restaurants that prioritize customer value without compromising quality. Restaurants
          aligned with these principles may receive increased visibility opportunities throughout the platform.
        </div>

        <RestaurantFaqCard />

        <hr style={styles.divider} />

        <label style={styles.agreement}>
          <input
            id="agree"
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            style={{ ...styles.checkbox, ...(agreed ? styles.checkboxChecked : null) }}
          />
          <span style={styles.agreementText}>I understand and agree with Menuply's core value philosophy.</span>
        </label>

        <button type="button" style={continueBtn(agreed)} disabled={!agreed} onClick={() => navigate(PLAN_ROUTE)}>
          Continue
        </button>
      </main>
    </div>
  );
}
