import { Link } from "react-router-dom";
import { CURATED_MENU_DESIGN_LAB_THEMES } from "../data/menuDesignLabThemes.js";

function MenuWindow({ theme }) {
  const swatch = theme.swatch;
  return (
    <Link
      to={`/menu-design-lab?theme=${theme.style}`}
      style={styles.windowLink}
      aria-label={`Preview ${theme.name}`}
    >
      <div style={{ ...styles.window, background: swatch.bg }}>
        <div style={styles.browserBar}>
          <span style={styles.dot} />
          <span style={styles.dot} />
          <span style={styles.dot} />
          <span style={styles.urlPill}>menuply.com/menu</span>
        </div>
        <div style={styles.windowBody}>
          <div style={{ ...styles.heroStrip, background: swatch.panel }}>
            <div style={{ ...styles.logoMark, background: swatch.accent }} />
            <div style={styles.heroText}>
              <span style={{ ...styles.heroLine, background: swatch.lines[0], width: "70%" }} />
              <span style={{ ...styles.heroLine, background: swatch.lines[1], width: "46%" }} />
            </div>
          </div>
          <div style={styles.menuPreviewGrid}>
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} style={{ ...styles.itemRow, background: swatch.lines[idx % swatch.lines.length] }}>
                <span style={{ ...styles.itemTitle, background: swatch.accent }} />
                <span style={styles.itemCopy} />
                <span style={styles.itemCopySmall} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={styles.cardCopy}>
        <div style={styles.sampleLabel}>Sample menu design</div>
        <h2 style={styles.cardTitle}>{theme.name}</h2>
        <p style={styles.bestFit}>{theme.bestFit}</p>
        <span style={styles.previewCta}>View actual menu</span>
      </div>
    </Link>
  );
}

export default function DemoPage() {
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.demoMark}>Menuply Demo</div>
      </header>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>Menuply demo</div>
        <h1 style={styles.title}>Choose a menu design to preview</h1>
        <p style={styles.copy}>
          These sample windows open live Menuply menu theme previews from the design lab. They use demo data only and are not real restaurants accepting orders.
        </p>
      </section>

      <section style={styles.grid} aria-label="Menu design demos">
        {CURATED_MENU_DESIGN_LAB_THEMES.map((theme) => (
          <MenuWindow key={theme.style} theme={{
            ...theme,
            swatch: {
              bg: theme.preset.colorDefaults.background,
              panel: theme.preset.colorDefaults.primary,
              accent: theme.preset.colorDefaults.accent,
              lines: [
                theme.preset.colorDefaults.background.startsWith("#f")
                  ? "rgba(15,23,42,0.08)"
                  : "rgba(255,255,255,0.08)",
                theme.preset.colorDefaults.background.startsWith("#f")
                  ? "rgba(15,23,42,0.72)"
                  : "rgba(255,255,255,0.72)",
                theme.preset.colorDefaults.background.startsWith("#f")
                  ? "rgba(15,23,42,0.48)"
                  : "rgba(255,255,255,0.48)",
              ],
            },
          }} />
        ))}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B0F0C",
    color: "#ffffff",
    paddingBottom: 72,
  },
  header: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "18px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  demoMark: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0,
  },
  hero: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "42px 22px 26px",
    boxSizing: "border-box",
  },
  eyebrow: {
    color: "#3DD934",
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    margin: 0,
    maxWidth: 850,
    fontSize: "clamp(2.2rem, 7vw, 4.9rem)",
    lineHeight: 0.98,
    fontWeight: 950,
    letterSpacing: 0,
  },
  copy: {
    margin: "18px 0 0",
    maxWidth: 720,
    color: "rgba(255,255,255,0.74)",
    fontSize: 18,
    lineHeight: 1.55,
  },
  grid: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "0 22px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18,
    boxSizing: "border-box",
  },
  windowLink: {
    display: "block",
    minWidth: 0,
    borderRadius: 14,
    overflow: "hidden",
    textDecoration: "none",
    color: "#ffffff",
    background: "#121A14",
    border: "1px solid #1F2937",
    boxShadow: "0 18px 48px rgba(0,0,0,0.24)",
  },
  window: {
    minHeight: 248,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  browserBar: {
    height: 36,
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "0 12px",
    background: "rgba(0,0,0,0.24)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.42)",
    flexShrink: 0,
  },
  urlPill: {
    marginLeft: 6,
    height: 18,
    minWidth: 0,
    flex: 1,
    borderRadius: 999,
    background: "rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: 750,
    lineHeight: "18px",
    padding: "0 10px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  windowBody: {
    padding: 14,
  },
  heroStrip: {
    minHeight: 76,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    boxSizing: "border-box",
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 999,
    flexShrink: 0,
  },
  heroText: {
    flex: 1,
    display: "grid",
    gap: 8,
  },
  heroLine: {
    height: 10,
    borderRadius: 999,
  },
  menuPreviewGrid: {
    display: "grid",
    gap: 10,
    marginTop: 12,
  },
  itemRow: {
    minHeight: 30,
    borderRadius: 8,
    padding: "9px 10px",
    display: "grid",
    gap: 6,
  },
  itemTitle: {
    width: "52%",
    height: 8,
    borderRadius: 999,
  },
  itemCopy: {
    width: "84%",
    height: 6,
    borderRadius: 999,
    background: "rgba(15,23,42,0.18)",
  },
  itemCopySmall: {
    width: "38%",
    height: 6,
    borderRadius: 999,
    background: "rgba(15,23,42,0.14)",
  },
  cardCopy: {
    padding: "16px 16px 18px",
  },
  sampleLabel: {
    color: "#3DD934",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: 19,
    lineHeight: 1.15,
    fontWeight: 900,
  },
  bestFit: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    lineHeight: 1.45,
  },
  previewCta: {
    display: "inline-flex",
    marginTop: 14,
    color: "#3DD934",
    fontSize: 14,
    fontWeight: 900,
  },
};
