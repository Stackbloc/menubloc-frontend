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

function formatDemoAddress(payload = {}) {
  const line1 = String(payload.address_line1 || "").trim();
  const city = String(payload.city || "").trim();
  const state = String(payload.state || "").trim();
  const zip = String(payload.zip || "").trim();
  const cityState = [city, state].filter(Boolean).join(", ");
  const locality = [cityState, zip].filter(Boolean).join(" ");
  return [line1, locality].filter(Boolean).join(" · ");
}

function buildSwatch(theme) {
  const bg = theme.preset.colorDefaults.background;
  const light = String(bg || "").toLowerCase().startsWith("#f") || String(bg || "").toLowerCase() === "#ffffff";
  return {
    bg,
    panel: theme.preset.colorDefaults.primary,
    accent: theme.preset.colorDefaults.accent,
    lines: [
      light ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.08)",
      light ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.72)",
      light ? "rgba(15,23,42,0.48)" : "rgba(255,255,255,0.48)",
    ],
  };
}

function MenuWindow({ theme, featured = false }) {
  const swatch = buildSwatch(theme);
  const previewImages = collectPreviewImages(theme);
  const heroImage = previewImages[0] || null;
  const thumbImages = previewImages.slice(1, 4);
  const restaurantName = theme.previewPayload?.restaurant_name || theme.previewPayload?.name || theme.name;
  const address = formatDemoAddress(theme.previewPayload);
  const designLabel = theme.name === "Default" ? "Default menu" : theme.name;

  return (
    <Link
      to={`/menu-template-preview?previewStyle=${theme.style}`}
      style={{
        ...styles.windowLink,
        ...(featured ? styles.windowLinkFeatured : null),
      }}
      aria-label={`Preview ${restaurantName}`}
    >
      <div style={styles.cardCopy}>
        {featured ? <div style={styles.sampleLabel}>Default example</div> : null}
        <h2 style={styles.cardTitle}>{restaurantName}</h2>
        {address ? <p style={styles.addressLine}>{address}</p> : null}
        <p style={styles.designMeta}>{designLabel}</p>
        <span style={styles.previewCta}>View menu →</span>
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

/** Demo order: Default first, then other guest-facing layouts. Style ids stay internal only. */
const DEMO_STYLE_ORDER = ["v1", "v14", "v13", "v15", "v12", "v16"];

export default function DemoPage() {
  const byStyle = new Map(CURATED_MENU_DESIGN_LAB_THEMES.map((theme) => [theme.style, theme]));
  const demoThemes = DEMO_STYLE_ORDER.map((style) => byStyle.get(style)).filter(Boolean);
  const defaultTheme = demoThemes.find((theme) => theme.name === "Default") || demoThemes[0];
  const otherThemes = demoThemes.filter((theme) => theme !== defaultTheme);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.demoMark}>Menuply Demo</div>
      </header>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>Guest menus</div>
        <h1 style={styles.title}>See how Menuply menus look to diners</h1>
        <p style={styles.copy}>
          These are fictional restaurants for preview only. After you upload and review items in the Menu
          Worksheet, Update Menuply Menu publishes the guest menu — Default is the starting look.
        </p>
      </section>

      {defaultTheme ? (
        <section style={styles.section}>
          <div style={styles.sectionHeading}>Default menu</div>
          <div style={styles.featuredGrid} aria-label="Default menu example">
            <MenuWindow theme={defaultTheme} featured />
          </div>
        </section>
      ) : null}

      {otherThemes.length ? (
        <section style={styles.section}>
          <div style={styles.sectionHeading}>More menu looks</div>
          <div style={styles.grid} aria-label="Additional menu demos">
            {otherThemes.map((theme) => (
              <MenuWindow key={theme.style} theme={theme} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page)",
    color: "var(--gb-color-ink)",
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
  featuredGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    maxWidth: 560,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18,
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
  windowLinkFeatured: {
    borderColor: "rgba(61,217,52,0.45)",
    boxShadow: "0 22px 56px rgba(0,0,0,0.32)",
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
  addressLine: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    lineHeight: 1.45,
  },
  designMeta: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  previewCta: {
    display: "inline-flex",
    marginTop: 14,
    color: "#3DD934",
    fontSize: 14,
    fontWeight: 900,
  },
};
