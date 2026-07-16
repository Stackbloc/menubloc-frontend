import { Link } from "react-router-dom";
import { CURATED_MENU_DESIGN_LAB_THEMES } from "../data/menuDesignLabThemes.js";

function collectDemoItems(theme, limit = 4) {
  const sections = Array.isArray(theme?.previewPayload?.sections)
    ? theme.previewPayload.sections
    : [];
  const items = [];
  for (const section of sections) {
    for (const item of section?.items || []) {
      const name = String(item?.name || "").trim();
      if (!name) continue;
      const price =
        item.price_minor_units != null
          ? `$${(Number(item.price_minor_units) / 100).toFixed(2)}`
          : item.price != null
            ? `$${Number(item.price).toFixed(2)}`
            : "";
      items.push({
        name,
        description: String(item?.description || "").trim(),
        price,
      });
      if (items.length >= limit) return items;
    }
  }
  return items;
}

function primaryHeroImage(theme) {
  const payload = theme?.previewPayload || {};
  const candidates = [
    payload.hero_image_url,
    payload.cover_image_url,
    ...(Array.isArray(payload.sections)
      ? payload.sections.map((section) => section?.image_url)
      : []),
  ];
  for (const value of candidates) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return null;
}

function buildSwatch(theme) {
  const bg = theme.preset.colorDefaults.background;
  const light =
    String(bg || "").toLowerCase().startsWith("#f") ||
    String(bg || "").toLowerCase() === "#ffffff";
  const ink = light ? "#0f1720" : "rgba(255,255,255,0.92)";
  const muted = light ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.62)";
  return {
    bg,
    panel: theme.preset.colorDefaults.primary,
    accent: theme.preset.colorDefaults.accent,
    ink,
    muted,
    rowBg: light ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.06)",
  };
}

function MenuWindow({ theme }) {
  const swatch = buildSwatch(theme);
  const restaurantName =
    theme.previewPayload?.restaurant_name || theme.previewPayload?.name || theme.name;
  const heroImage = primaryHeroImage(theme);
  const items = collectDemoItems(theme, 4);
  const href = `/menu-template-preview?previewStyle=${theme.style}`;

  return (
    <article style={styles.card}>
      <Link to={href} style={styles.nameLink} aria-label={`Open ${restaurantName} menu`}>
        {restaurantName}
      </Link>

      <Link to={href} style={{ ...styles.window, background: swatch.bg }} tabIndex={-1}>
        <div style={styles.browserBar}>
          <span style={styles.dot} />
          <span style={styles.dot} />
          <span style={styles.dot} />
          <span style={styles.urlPill}>menuply.com/menu</span>
        </div>

        <div style={styles.windowBody}>
          <div style={{ ...styles.heroStrip, background: swatch.panel }}>
            <div style={{ ...styles.logoMark, background: swatch.accent }} />
            <div style={{ ...styles.heroName, color: "#fff" }}>{restaurantName}</div>
          </div>

          {heroImage ? (
            <div
              style={{ ...styles.heroPhoto, backgroundImage: `url(${heroImage})` }}
              aria-hidden
            />
          ) : null}

          <div style={styles.menuList}>
            {items.length ? (
              items.map((item) => (
                <div key={item.name} style={{ ...styles.itemRow, background: swatch.rowBg }}>
                  <div style={styles.itemTop}>
                    <span style={{ ...styles.itemName, color: swatch.ink }}>{item.name}</span>
                    {item.price ? (
                      <span style={{ ...styles.itemPrice, color: swatch.accent }}>{item.price}</span>
                    ) : null}
                  </div>
                  {item.description ? (
                    <div style={{ ...styles.itemDesc, color: swatch.muted }}>{item.description}</div>
                  ) : null}
                </div>
              ))
            ) : (
              <div style={{ ...styles.itemDesc, color: swatch.muted }}>No items in this sample.</div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Demo order: Default first, then other guest-facing layouts. Style ids stay internal only. */
const DEMO_STYLE_ORDER = ["v1", "v14", "v13", "v15", "v12", "v16"];

export default function DemoPage() {
  const byStyle = new Map(CURATED_MENU_DESIGN_LAB_THEMES.map((theme) => [theme.style, theme]));
  const demoThemes = DEMO_STYLE_ORDER.map((style) => byStyle.get(style)).filter(Boolean);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.demoMark}>Menuply Demo</div>
      </header>

      <section style={styles.section}>
        <div style={styles.grid} aria-label="Demo menus">
          {demoThemes.map((theme) => (
            <MenuWindow key={theme.style} theme={theme} />
          ))}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b120e",
    color: "#ffffff",
    paddingBottom: 72,
  },
  header: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "18px 22px",
  },
  demoMark: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0,
  },
  section: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "12px 22px 30px",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 22,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 0,
  },
  nameLink: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.2,
    textDecoration: "underline",
    textUnderlineOffset: 3,
    textDecorationColor: "rgba(61,217,52,0.7)",
  },
  window: {
    display: "block",
    borderRadius: 14,
    overflow: "hidden",
    textDecoration: "none",
    border: "1px solid #1F2937",
    boxShadow: "0 18px 48px rgba(0,0,0,0.24)",
    minHeight: 248,
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
    minHeight: 56,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    boxSizing: "border-box",
    marginBottom: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 999,
    flexShrink: 0,
  },
  heroName: {
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  heroPhoto: {
    height: 110,
    borderRadius: 12,
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid rgba(255,255,255,0.1)",
    marginBottom: 10,
  },
  menuList: {
    display: "grid",
    gap: 8,
  },
  itemRow: {
    borderRadius: 8,
    padding: "8px 10px",
  },
  itemTop: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  itemName: {
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.25,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },
  itemDesc: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
};
