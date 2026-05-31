import { Link } from "react-router-dom";
import { CURATED_MENU_DESIGN_LAB_THEMES } from "../../data/menuDesignLabThemes.js";

export default function MenuThemeExamplesSection({ compact = false, dark = false }) {
  const visibleThemes = CURATED_MENU_DESIGN_LAB_THEMES;
  const cardBg = dark ? "rgba(255,255,255,0.055)" : "#ffffff";
  const border = dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e4e9f0";
  const text = dark ? "#ffffff" : "#0f1720";
  const muted = dark ? "rgba(255,255,255,0.72)" : "#5b6675";
  const subtle = dark ? "rgba(255,255,255,0.55)" : "#667085";

  return (
    <section style={compact ? styles.compactSection : styles.section}>
      <div style={styles.headingWrap}>
        <h2 style={{ ...styles.heading, color: text }}>See how your menu could look</h2>
        <p style={{ ...styles.subheading, color: muted }}>
          Choose a professionally designed Menuply layout, then customize it for your restaurant.
        </p>
      </div>
      <div style={compact ? styles.compactGrid : styles.grid}>
        {visibleThemes.map((theme) => (
          <Link
            key={theme.style}
            to={`/menu-design-lab?theme=${theme.style}`}
            style={{
              ...styles.card,
              background: cardBg,
              border,
              color: text,
              padding: compact ? "14px 14px" : "18px 18px",
            }}
            >
            <div style={styles.sampleLabel}>Sample menu design</div>
            <div style={styles.cardTitle}>{theme.name}</div>
            <div style={{ ...styles.bestFit, color: subtle }}>{theme.bestFit}</div>
            {!compact ? (
              <p style={{ ...styles.description, color: muted }}>{theme.description}</p>
            ) : null}
            <span style={styles.previewLink}>Preview theme</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: {
    width: "100%",
    maxWidth: 1120,
    margin: "0 auto",
    padding: "54px 22px",
    boxSizing: "border-box",
  },
  compactSection: {
    width: "100%",
    marginTop: 44,
  },
  headingWrap: {
    maxWidth: 720,
    marginBottom: 22,
  },
  heading: {
    margin: "0 0 8px",
    fontSize: "clamp(1.35rem, 3vw, 2rem)",
    lineHeight: 1.12,
    fontWeight: 800,
    letterSpacing: 0,
  },
  subheading: {
    margin: 0,
    fontSize: "0.98rem",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
  },
  compactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    minHeight: 152,
    borderRadius: 8,
    textDecoration: "none",
    boxSizing: "border-box",
  },
  sampleLabel: {
    marginBottom: 10,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    color: "#3DD934",
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 1.2,
    fontWeight: 850,
    marginBottom: 7,
  },
  bestFit: {
    fontSize: 12,
    lineHeight: 1.4,
    fontWeight: 650,
  },
  description: {
    margin: "10px 0 0",
    fontSize: 13,
    lineHeight: 1.5,
  },
  previewLink: {
    marginTop: "auto",
    paddingTop: 14,
    color: "#3DD934",
    fontSize: 13,
    fontWeight: 850,
  },
};
