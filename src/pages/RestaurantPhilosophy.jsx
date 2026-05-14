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
    maxWidth: 640,
    width: "100%",
  },
  heading: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 1.05,
    marginBottom: 24,
    marginTop: 28,
    color: "#101828",
  },
  bodyBlock: {
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    lineHeight: 1.75,
    color: "#344054",
    margin: 0,
  },
  principleList: {
    listStyle: "none",
    padding: 0,
    margin: "24px 0",
    display: "grid",
    gap: 14,
  },
  principleItem: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    fontSize: 15,
    lineHeight: 1.6,
    color: "#344054",
  },
  principleIcon: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#eef6f1",
    border: "1px solid #cfe0d8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    color: "#1F4E3D",
    fontWeight: 900,
    marginTop: 1,
  },
  closingText: {
    fontSize: 15,
    lineHeight: 1.75,
    color: "#344054",
    marginBottom: 32,
    margin: 0,
  },
  highlightText: {
    fontWeight: 800,
    color: "#1F4E3D",
  },
  checkRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    margin: "28px 0",
    padding: "18px 20px",
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
    height: 52,
    borderRadius: 16,
    border: 0,
    background: enabled ? "#1F4E3D" : "#d0d5dd",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 16,
    cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "inherit",
    transition: "background 0.15s",
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

        <div style={styles.heading}>
          We believe restaurants succeed when diners receive real value.
        </div>

        <div style={styles.bodyBlock}>
          <p style={styles.body}>
            Menuply is a platform centered on long-term customer relationships, sustainable restaurant
            growth, and better dining experiences — not simply higher fees and higher prices.
          </p>
        </div>

        <div style={styles.bodyBlock}>
          <p style={styles.body}>
            Many restaurants on more costly third-party platforms raise prices substantially to offset
            commissions and fees. Menuply was designed with a lower-cost structure so restaurants can
            compete more effectively while still protecting their margins.
          </p>
        </div>

        <ul style={styles.principleList}>
          <li style={styles.principleItem}>
            <span style={styles.principleIcon}>&#10003;</span>
            <span>Help restaurants <strong>grow sustainably</strong></span>
          </li>
          <li style={styles.principleItem}>
            <span style={styles.principleIcon}>&#10003;</span>
            <span>Help diners <strong>discover better value</strong></span>
          </li>
          <li style={styles.principleItem}>
            <span style={styles.principleIcon}>&#10003;</span>
            <span>Help bring <strong>customers back to restaurants</strong></span>
          </li>
        </ul>

        <p style={styles.closingText}>
          While restaurants always control their own pricing, partners who prioritize fairness, quality,
          transparency, and customer value are most aligned with the Menuply platform.{" "}
          <span style={styles.highlightText}>
            Restaurants offering strong everyday value and meaningful deals may receive increased
            visibility opportunities within the platform experience.
          </span>
        </p>

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
            I understand and agree with Menuply's core value philosophy.
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
