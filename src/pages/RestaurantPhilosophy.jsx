import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";

const PLAN_ROUTE = "/restaurant/signup";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px 72px",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
    color: "#101828",
  },
  shell: {
    maxWidth: 680,
    width: "100%",
  },
  heading: {
    fontSize: "clamp(1.6rem, 4vw, 2.25rem)",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.18,
    marginBottom: 32,
    marginTop: 28,
    color: "#101828",
  },
  bodyBlock: {
    marginBottom: 22,
  },
  body: {
    fontSize: 16,
    lineHeight: 1.8,
    color: "#344054",
    margin: 0,
  },
  goalIntro: {
    fontSize: 16,
    lineHeight: 1.8,
    color: "#344054",
    marginBottom: 10,
    margin: 0,
  },
  bulletList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 24px",
    display: "grid",
    gap: 10,
  },
  bulletItem: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    fontSize: 15,
    lineHeight: 1.65,
    color: "#344054",
  },
  bulletDot: {
    flexShrink: 0,
    marginTop: 6,
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#1F4E3D",
  },
  closingText: {
    fontSize: 15,
    lineHeight: 1.8,
    color: "#344054",
    marginBottom: 32,
    margin: 0,
  },
  divider: {
    height: 1,
    background: "#e4e7ec",
    margin: "28px 0",
  },
  checkRow: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    margin: "0 0 24px",
    padding: "20px 22px",
    borderRadius: 16,
    border: "1.5px solid #cfe0d8",
    background: "#f8faf9",
    cursor: "pointer",
  },
  checkbox: {
    width: 20,
    height: 20,
    marginTop: 2,
    accentColor: "#1F4E3D",
    flexShrink: 0,
    cursor: "pointer",
  },
  checkLabel: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#101828",
    cursor: "pointer",
    fontWeight: 600,
  },
};

function continueBtn(enabled) {
  return {
    width: "100%",
    height: 54,
    borderRadius: 16,
    border: 0,
    background: enabled ? "#1F4E3D" : "#d0d5dd",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 16,
    cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "inherit",
    transition: "background 0.15s",
    letterSpacing: "-0.01em",
  };
}

export default function RestaurantPhilosophy() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <BrandLockup
          subtitle="for Restaurants"
          wrapperStyle={{ alignItems: "flex-start", marginBottom: 4 }}
          subtitleStyle={{ textAlign: "left", width: "100%", paddingLeft: 6 }}
          logoProps={{ width: 160, height: 100, radius: 22, pageColor: "#ffffff" }}
        />

        <h1 style={styles.heading}>
          We believe that restaurants and diners alike deserve a platform built around value,
          fairness, and long-term sustainability.
        </h1>

        <div style={styles.bodyBlock}>
          <p style={styles.body}>
            Many restaurants operating on higher-cost third-party delivery platforms have had to
            substantially raise menu prices to absorb high commissions and other marketing costs.
            We believe that model is difficult to sustain for both restaurants and diners.
          </p>
        </div>

        <div style={styles.bodyBlock}>
          <p style={styles.body}>
            Menuply was designed with a lower-cost, restaurant-centered structure, allowing
            restaurants to offer diners stronger value without sacrificing margins. We believe this
            model is in the best interests of restaurants and diners alike.
          </p>
        </div>

        <div style={styles.bodyBlock}>
          <p style={styles.goalIntro}>Our goal is simple:</p>
        </div>

        <ul style={styles.bulletList}>
          <li style={styles.bulletItem}>
            <span style={styles.bulletDot} aria-hidden="true" />
            <span>Help restaurants grow sustainably</span>
          </li>
          <li style={styles.bulletItem}>
            <span style={styles.bulletDot} aria-hidden="true" />
            <span>Help diners discover better value</span>
          </li>
          <li style={styles.bulletItem}>
            <span style={styles.bulletDot} aria-hidden="true" />
            <span>Help diners navigate their dining and deal options</span>
          </li>
        </ul>

        <div style={{ marginBottom: 28 }}>
          <p style={styles.closingText}>
            While restaurants always control their own pricing, partners who prioritize fairness,
            quality, transparency, customer value, and meaningful deals are most aligned with the
            Menuply platform and may receive increased visibility opportunities within the platform
            experience.
          </p>
        </div>

        <div style={styles.divider} />

        <label
          style={styles.checkRow}
          onClick={() => setAgreed((v) => !v)}
        >
          <input
            id="philosophy-agree"
            type="checkbox"
            style={styles.checkbox}
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
          <span style={styles.checkLabel}>
            I understand and agree with Menuply&apos;s core value philosophy.
          </span>
        </label>

        <button
          type="button"
          style={continueBtn(agreed)}
          disabled={!agreed}
          onClick={() => navigate(PLAN_ROUTE)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
