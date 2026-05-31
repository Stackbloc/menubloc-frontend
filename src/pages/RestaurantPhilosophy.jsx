import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useNavigate } from "react-router-dom";
import { BrandLockup } from "../components/BrandLogo.jsx";
import RestaurantFAQ from "../components/RestaurantFAQ.jsx";

const PLAN_ROUTE = "/restaurant/signup";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B0F0C",
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
    color: "#F8F4EA",
  },
  body: {
    fontSize: 16,
    lineHeight: 1.85,
    color: "rgba(248,244,234,0.78)",
    margin: "0 0 22px",
  },
  goalIntro: {
    fontSize: 16,
    lineHeight: 1.85,
    color: "rgba(248,244,234,0.78)",
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
    background: "#121A14",
    border: "1.5px solid rgba(61,217,52,0.18)",
    borderRadius: 18,
    padding: "24px 26px",
    marginBottom: 28,
  },
  multiplierText: {
    fontSize: 15.5,
    lineHeight: 1.8,
    color: "rgba(248,244,234,0.78)",
    margin: "0 0 14px",
  },
  multiplierTextLast: {
    fontSize: 15.5,
    lineHeight: 1.8,
    color: "rgba(248,244,234,0.78)",
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
    border: "1.5px solid rgba(61,217,52,0.18)",
    background: "#121A14",
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
    color: "#F8F4EA",
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <BrandLockup
          subtitle={t("signup.forRestaurants", "for Restaurants")}
          wrapperStyle={{ alignItems: "flex-start", marginBottom: 4 }}
          subtitleStyle={{ textAlign: "left", width: "100%", paddingLeft: 6 }}
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#0B0F0C" }}
        />

        <h1 style={styles.heading}>
          {t(
            "onboarding.philosophy.heading",
            "Restaurants and diners alike deserve a platform built around rich, dynamic menu information, diner value, and long-term sustainability."
          )}
        </h1>

        <p style={styles.body}>
          {t(
            "onboarding.philosophy.body1",
            "Many restaurants have had to increase menu prices to help absorb the structural costs associated with operating on traditional third-party delivery platforms. These higher-cost marketplace models have often created challenges for both restaurants and diners."
          )}
        </p>

        <p style={styles.body}>
          {t(
            "onboarding.philosophy.body2",
            "Menuply was designed with a lower-cost, restaurant-centered structure intended to give restaurants greater flexibility to offer diners better day-to-day pricing, meaningful deals, richer menu information, and more direct engagement."
          )}
        </p>

        <p style={styles.body}>
          {t(
            "onboarding.philosophy.body3",
            "Prospective restaurant partners are encouraged to keep this principle in mind when joining the platform, as it reflects a core Menuply philosophy: sustainable restaurant growth should come from delivering greater value - not simply increasing costs without improving the customer experience."
          )}
        </p>

        <p style={styles.body}>
          {t(
            "onboarding.philosophy.body4",
            "When restaurants and diners come together around a shared ecosystem focused on value, transparency, and informed decision-making - powered by thousands of intelligently connected menus - the collective value of the platform multiplies."
          )}
        </p>

        <p style={styles.goalIntro}>{t("onboarding.philosophy.goalIntro", "Our goal is simple:")}</p>

        <ul style={styles.bulletList}>
          <li style={styles.bulletItem}>
            <span style={styles.bulletDot} aria-hidden="true" />
            <span>{t("onboarding.philosophy.goal1", "Help restaurants better serve their patrons and strengthen long-term success.")}</span>
          </li>
          <li style={styles.bulletItem}>
            <span style={styles.bulletDot} aria-hidden="true" />
            <span>{t("onboarding.philosophy.goal2", "Help diners better navigate their dining options and experience greater value.")}</span>
          </li>
        </ul>

        <div style={styles.multiplierBox}>
          <p style={styles.multiplierTextLast}>
            {t(
              "onboarding.philosophy.multiplierBox",
              "Restaurants always control their own pricing. However, Menuply seeks to partner with restaurants that prioritize customer value without compromising quality."
            )}
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
            {t(
              "onboarding.philosophy.agreeLabel",
              "I understand and agree with Menuply's core value philosophy."
            )}
          </span>
        </label>

        <button
          type="button"
          style={continueBtn(agreed)}
          disabled={!agreed}
          onClick={() => navigate(PLAN_ROUTE)}
        >
          {t("onboarding.philosophy.continue", "Continue")}
        </button>
      </div>
    </div>
  );
}
