import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";
import RestaurantFAQ from "../components/RestaurantFAQ.jsx";

const PLAN_ROUTE = "/restaurant/signup";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px 80px",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
    color: "#101828",
  },
  shell: {
    maxWidth: 680,
    width: "100%",
  },
  heading: {
    fontSize: "clamp(1.55rem, 3.8vw, 2.15rem)",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    marginBottom: 36,
    marginTop: 28,
    color: "#101828",
  },
  body: {
    fontSize: 16,
    lineHeight: 1.85,
    color: "#344054",
    margin: "0 0 22px",
  },
  goalIntro: {
    fontSize: 16,
    lineHeight: 1.85,
    color: "#344054",
    margin: "0 0 14px",
  },
  bulletList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 32px",
    display: "grid",
    gap: 12,
  },
  bulletItem: {
    display: "flex",
    gap: 13,
    alignItems: "flex-start",
    fontSize: 15.5,
    lineHeight: 1.65,
    color: "#344054",
  },
  bulletDot: {
    flexShrink: 0,
    marginTop: 7,
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#1F4E3D",
  },
  multiplierBox: {
    background: "#f8faf9",
    border: "1.5px solid #cfe0d8",
    borderRadius: 18,
    padding: "24px 26px",
    marginBottom: 28,
  },
  multiplierText: {
    fontSize: 15.5,
    lineHeight: 1.8,
    color: "#344054",
    margin: "0 0 14px",
  },
  multiplierTextLast: {
    fontSize: 15.5,
    lineHeight: 1.8,
    color: "#344054",
    margin: 0,
  },
  multiplierHighlight: {
    fontWeight: 800,
    color: "#1F4E3D",
  },
  divider: {
    height: 1,
    background: "#e4e7ec",
    margin: "8px 0 28px",
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
          logoProps={{ width: 160, height: 100, radius: 22, pageColor: "#ffffff", imageStyle: { filter: "brightness(0)" } }}
        />

        <h1 style={styles.heading}>
          Restaurants and diners alike deserve a platform built around rich, dynamic menu
          information, diner value, and long-term sustainability.
        </h1>

        <p style={styles.body}>
          Many restaurants have had to increase menu prices to help absorb the structural costs
          associated with operating on traditional third-party delivery platforms. These
          higher-cost marketplace models have often created challenges for both restaurants and diners.
        </p>

        <p style={styles.body}>
          Menuply was designed with a lower-cost, restaurant-centered structure intended to give
          restaurants greater flexibility to offer diners better day-to-day pricing, meaningful
          deals, richer menu information, and more direct engagement. Menuply is a fully
          self-service platform built without the heavy sales, onboarding, and operational overhead
          common in traditional delivery marketplaces. By keeping structural costs low, restaurants
          can operate more efficiently on the platform and offer diners more competitive pricing and
          better overall value. The platform is built around the belief that lower structural costs
          can create stronger long-term value for both restaurants and diners.
        </p>

        <p style={styles.body}>
          Prospective restaurant partners are encouraged to keep this principle in mind when joining
          the platform, as it reflects a core Menuply philosophy: sustainable restaurant growth
          should come from delivering greater value - not simply increasing costs without improving
          the customer experience.
        </p>

        <p style={styles.body}>
          When restaurants and diners come together around a shared ecosystem focused on value,
          transparency, and informed decision-making - powered by thousands of intelligently
          connected menus - the collective value of the platform multiplies. We like to think of
          all participants, whether restaurants or diners, as &ldquo;multipliers.&rdquo;
        </p>

        <p style={styles.goalIntro}>Our goal is simple:</p>

        <ul style={styles.bulletList}>
          <li style={styles.bulletItem}>
            <span style={styles.bulletDot} aria-hidden="true" />
            <span>Help restaurants better serve their patrons and strengthen long-term success.</span>
          </li>
          <li style={styles.bulletItem}>
            <span style={styles.bulletDot} aria-hidden="true" />
            <span>Help diners better navigate their dining options and experience greater value.</span>
          </li>
        </ul>

        <div style={styles.multiplierBox}>
          <p style={styles.multiplierTextLast}>
            Restaurants always control their own pricing. However, Menuply seeks to partner with
            restaurants that prioritize customer value without compromising quality. Restaurants more
            closely aligned with these principles may receive increased visibility opportunities within
            the Menuply platform experience.
          </p>
        </div>

        <RestaurantFAQ instanceId="restaurant-onboarding-faq" />

        <div style={styles.divider} />

        <label style={styles.checkRow} onClick={() => setAgreed((v) => !v)}>
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
