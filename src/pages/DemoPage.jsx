import { Link } from "react-router-dom";
import { CURATED_MENU_DESIGN_LAB_THEMES } from "../data/menuDesignLabThemes.js";

function collectPreviewImages(theme) {
  const payload = theme?.previewPayload || {};
  const images = [];
  const push = (value) => {
    const text = String(value || "").trim();
    if (text && !images.includes(text)) images.push(text);
  };

  push(payload.hero_image_url);
  push(payload.cover_image_url);

  (Array.isArray(payload.sections) ? payload.sections : []).forEach((section) => {
    push(section?.image_url);
    (Array.isArray(section?.items) ? section.items : []).forEach((item) => push(item?.image_url));
  });

  return images.slice(0, 4);
}

function MenuWindow({ theme }) {
  const swatch = theme.swatch;
  const previewImages = collectPreviewImages(theme);
  const heroImage = previewImages[0] || null;
  const thumbImages = previewImages.slice(1, 4);
  return (
    <Link
      to={`/menu-design-lab?theme=${theme.style}&demo=1`}
      style={styles.windowLink}
      aria-label={`Preview ${theme.name}`}
    >
      <div style={styles.cardCopy}>
        <div style={styles.sampleLabel}>Sample menu design</div>
        <h2 style={styles.cardTitle}>{theme.name}</h2>
        <p style={styles.bestFit}>{theme.bestFit}</p>
        <span style={styles.previewCta}>View actual menu →</span>
      </div>
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
          {heroImage ? (
            <div style={styles.photoPanel}>
              <div style={{ ...styles.heroPhoto, backgroundImage: `url(${heroImage})` }} />
              {thumbImages.length ? (
                <div style={styles.thumbRow}>
                  {thumbImages.map((src, idx) => (
                    <div key={`${src}-${idx}`} style={{ ...styles.thumb, backgroundImage: `url(${src})` }} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
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
    </Link>
  );
}

export default function DemoPage() {
  const featuredThemes = CURATED_MENU_DESIGN_LAB_THEMES.filter((theme) => ["v1", "v4", "v6"].includes(theme.style));
  const additionalThemes = CURATED_MENU_DESIGN_LAB_THEMES.filter((theme) => ["v7", "v8", "v9"].includes(theme.style));

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

      <section style={styles.section}>
        <div style={styles.sectionHeading}>Featured menu designs</div>
        <div style={styles.grid} aria-label="Featured menu design demos">
          {featuredThemes.map((theme) => (
            <MenuWindow
              key={theme.style}
              theme={{
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
              }}
            />
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeading}>Additional design directions</div>
        <div style={styles.grid} aria-label="Additional menu design demos">
          {additionalThemes.map((theme) => (
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
        </div>
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
  section: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "0 22px 30px",
    boxSizing: "border-box",
  },
  sectionHeading: {
    marginBottom: 16,
    color: "#3DD934",
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
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
    borderTop: "1px solid rgba(255,255,255,0.1)",
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
  photoPanel: {
    padding: "0 14px 14px",
    display: "grid",
    gap: 10,
  },
  heroPhoto: {
    height: 118,
    borderRadius: 12,
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
  },
  thumbRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  thumb: {
    aspectRatio: "1 / 0.72",
    borderRadius: 10,
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid rgba(255,255,255,0.1)",
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
