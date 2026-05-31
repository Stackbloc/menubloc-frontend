import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import PublicMenuMainContent from "../components/menu-templates/PublicMenuMainContent.jsx";
import {
  CURATED_MENU_DESIGN_LAB_THEMES,
  MENU_DESIGN_LAB_THEMES,
  getMenuDesignLabTheme,
} from "../data/menuDesignLabThemes.js";
import { normalizeMenuStyle, pickHeroImageUrl } from "../components/menu-templates/menuPresentationUtils.js";
import { buildRestaurantMenuBrand, fontStackForPreset } from "../components/menu-templates/restaurantMenuBrand.js";
import { formatMoney, getConsumerDisplayPrice } from "../lib/pricingDisplay.js";

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

function cloneThemePreview(theme, controls) {
  const base = theme?.previewPayload || {};
  const imageDensity = controls.imageDensity || "all";
  const heroEnabled = controls.heroEnabled !== false;

  const sections = Array.isArray(base.sections) ? base.sections.map((section) => ({
    ...section,
    image_url: imageDensity === "all" || imageDensity === "section" ? section.image_url || null : null,
    items: Array.isArray(section.items) ? section.items.map((item) => ({
      ...item,
      image_url: imageDensity === "all" || imageDensity === "thumbnail" ? item.image_url || null : null,
    })) : [],
  })) : [];

  return {
    ...base,
    accent_color: controls.primaryColor || base.accent_color || "#c45c26",
    hero_image_url: heroEnabled ? base.hero_image_url || null : null,
    cover_image_url: heroEnabled ? base.cover_image_url || null : null,
    sections,
  };
}

function inferBackgroundStyle(theme) {
  const bg = String(theme?.preset?.colorDefaults?.background || "").trim().toLowerCase();
  if (!bg) return "dark";
  if (bg.startsWith("#fff") || bg.startsWith("#fef") || bg.startsWith("#f7efe3")) return "paper";
  if (bg.startsWith("#f8") || bg.startsWith("#faf") || bg.startsWith("#f6")) return "light";
  return "dark";
}

function inferImageDensity(theme) {
  const itemImages = String(theme?.preset?.imageRules?.itemImages || "").trim().toLowerCase();
  const sectionImages = String(theme?.preset?.imageRules?.sectionImages || "").trim().toLowerCase();
  if (itemImages.includes("none")) return "none";
  if (itemImages.includes("all")) return "all";
  if (itemImages.includes("thumbnail") || itemImages.includes("thumbnails")) return "thumbnail";
  if (sectionImages.includes("edge") || sectionImages.includes("break") || sectionImages.includes("hero")) return "section";
  if (itemImages.includes("optional")) return "thumbnail";
  return "all";
}

export default function MenuDesignLabPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const selectedStyle = normalizeMenuStyle(searchParams.get("theme") || "v1");
  const selectedTheme = getMenuDesignLabTheme(selectedStyle);
  const [notice, setNotice] = useState("");
  const [controls, setControls] = useState({
    themePreset: selectedStyle,
    primaryColor: selectedTheme.preset?.colorDefaults?.primary || "#c45c26",
    accentColor: selectedTheme.preset?.colorDefaults?.accent || "#c45c26",
    backgroundStyle: inferBackgroundStyle(selectedTheme),
    imageDensity: inferImageDensity(selectedTheme),
    heroEnabled: true,
  });

  const previewData = useMemo(() => cloneThemePreview(selectedTheme, controls), [selectedTheme, controls]);
  const brand = useMemo(
    () => buildRestaurantMenuBrand(previewData, previewData.restaurant_name || previewData.name),
    [previewData]
  );
  const adjustedBrand = useMemo(() => ({
    ...brand,
    accent: controls.primaryColor || brand.accent,
    accentStrong: controls.accentColor || brand.accentStrong,
    accentBorder: controls.accentColor ? `${controls.accentColor}66` : brand.accentBorder,
    accentBorderStrong: controls.accentColor ? `${controls.accentColor}99` : brand.accentBorderStrong,
    accentSoftBg: controls.accentColor ? `${controls.accentColor}1c` : brand.accentSoftBg,
    accentBold: controls.accentColor ? `${controls.accentColor}22` : brand.accentBold,
  }), [brand, controls.accentColor, controls.primaryColor]);
  const isDarkShell = controls.backgroundStyle === "dark" || controls.backgroundStyle === "chalkboard" || controls.backgroundStyle === "charcoal";
  const isLightShell = controls.backgroundStyle === "light" || controls.backgroundStyle === "paper";

  const previewNotice = (message = "This is a sample menu design. Ordering is disabled in preview mode.") => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const templateContext = {
    isMobile,
    language: "en",
    t: (_key, fallback = "") => fallback,
    restaurantName: previewData.restaurant_name || previewData.name,
    restaurantProfileHref: null,
    menuTypeLabel: "Sample menu design",
    scheduledActiveMenuLabel: null,
    addressLine1: previewData.address_line1,
    addressLine2: [previewData.city, previewData.state, previewData.zip].filter(Boolean).join(", "),
    addressLine: [previewData.address_line1, previewData.city, previewData.state].filter(Boolean).join(", "),
    directionsHref: "",
    logoUrl: previewData.logo_url || null,
    shareData: {
      title: `${selectedTheme.name} sample menu`,
      text: "Sample menu design preview",
      url: typeof window !== "undefined" ? window.location.href : "/menu-design-lab",
    },
    shareAnalyticsContext: {
      pageType: "menu_design_lab_sample",
      menuStyle: selectedStyle,
    },
    franchiseSlot: null,
    intakeBannerSlot: (
      <div style={styles.previewBanner}>
        Sample menu design - visual preview only. Checkout and live ordering are disabled.
      </div>
    ),
    allergenBannerSlot: null,
    onOpenFilters: () => previewNotice("Filters are disabled in this sample menu design."),
    displaySections: previewData.sections || [],
    displayableItemCount: (previewData.sections || []).reduce((sum, section) => sum + (section.items || []).length, 0),
    dealItems: previewData.deal_items || [],
    filtersActive: false,
    handleClearFilters: () => {},
    data: previewData,
    currentRestaurantId: previewData.restaurant_id,
    dealMap: new Map(),
    activeCartItems: [],
    hoveredItemId: null,
    setHoveredItemId: () => {},
    removeItem: () => {},
    navigate,
    setItemSheet: () => previewNotice(),
    setAddedConfirmation: () => previewNotice(),
    commitMenuItemToBasket: () => previewNotice(),
    fmtMoney: (item) => {
      const cents = getConsumerDisplayPrice(item);
      return cents != null ? formatMoney(cents) : "";
    },
    getConsumerDisplayPrice,
    heroImageUrl: pickHeroImageUrl(previewData),
    cartLineCount: 0,
    onGoCheckout: () => previewNotice(),
    brand: adjustedBrand,
    fontStack: fontStackForPreset(brand?.fontPreset),
    menus: [],
    selectedMenuId: null,
    onSelectMenu: () => {},
    tabLoading: false,
    tabError: null,
    menuPresentation: previewData.menu_presentation || {},
  };

  const backgroundColor = isDarkShell
    ? "#0B0F0C"
    : isLightShell
      ? "#f6f0e7"
      : "#111827";

  const shellStyle = {
    ...styles.shell,
    gridTemplateColumns: isMobile ? "1fr" : "minmax(300px, 360px) minmax(0, 1fr)",
  };
  const controlGridStyle = {
    ...styles.controlGrid,
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
  };

  return (
    <main style={{ ...styles.page, background: backgroundColor }}>
      <header style={styles.header}>
        <BrandLogo width={132} height={52} radius={0} pageColor={backgroundColor} linkStyle={styles.logo} />
        <div style={styles.headerActions}>
          <Link
            to="/demo"
            style={{
              ...styles.headerLink,
              background: isDarkShell ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)",
              color: isDarkShell ? "#fff" : "#0f1720",
            }}
          >
            Demo windows
          </Link>
          <Link to="/restaurant/signup" style={styles.headerCta}>Create your menu</Link>
        </div>
      </header>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>Menu Design Lab</div>
        <h1 style={{ ...styles.title, color: isDarkShell ? "#fff" : "#0f1720" }}>Browse preset menu themes and tune the one that fits your restaurant.</h1>
        <p style={{ ...styles.copy, color: isDarkShell ? "rgba(255,255,255,0.78)" : "#475467" }}>
          The gallery below uses real sample menu data, not screenshots. Each preset can be customized from the operator page with colors, image density, and other display controls.
        </p>
      </section>

      <section style={shellStyle}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <div style={styles.panelLabel}>Theme gallery</div>
            <div style={styles.themeGrid}>
              {CURATED_MENU_DESIGN_LAB_THEMES.map((theme) => {
                const active = theme.style === selectedStyle;
                return (
                  <button
                    key={theme.style}
                    type="button"
                    onClick={() => {
                      setSearchParams({ theme: theme.style });
                      setControls((current) => ({
                        ...current,
                        themePreset: theme.style,
                        primaryColor: theme.preset?.colorDefaults?.primary || current.primaryColor,
                        accentColor: theme.preset?.colorDefaults?.accent || current.accentColor,
                        backgroundStyle: inferBackgroundStyle(theme),
                        imageDensity: inferImageDensity(theme),
                        heroEnabled: true,
                      }));
                    }}
                    style={{
                      ...styles.themeCard,
                      borderColor: active ? theme.preset.colorDefaults.accent : "rgba(148,163,184,0.2)",
                      background: active ? (isDarkShell ? "rgba(255,255,255,0.06)" : "#fff") : (isDarkShell ? "rgba(255,255,255,0.03)" : "#fff"),
                      color: isDarkShell ? "#fff" : "#0f1720",
                    }}
                  >
                    <div style={styles.sampleLabel}>Sample menu design</div>
                    <div style={styles.cardTitle}>{theme.name}</div>
                    <div style={{ ...styles.bestFit, color: isDarkShell ? "rgba(255,255,255,0.7)" : "#5b6675" }}>{theme.bestFit}</div>
                    <p style={{ ...styles.description, color: isDarkShell ? "rgba(255,255,255,0.72)" : "#667085" }}>{theme.description}</p>
                    <span style={{ ...styles.previewLink, color: active ? theme.preset.colorDefaults.accent : (isDarkShell ? "#3DD934" : "#1F4E3D") }}>Preview theme</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ ...styles.sidebarSection, ...(isDarkShell ? styles.darkPanel : styles.lightPanel) }}>
            <div style={styles.panelLabel}>Customize preset</div>
            <div style={controlGridStyle}>
              <Control label="Theme preset">
                <select
                  value={controls.themePreset}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSearchParams({ theme: next });
                    const theme = MENU_DESIGN_LAB_THEMES.find((entry) => entry.style === next);
                    setControls((current) => ({
                      ...current,
                      themePreset: next,
                      primaryColor: theme?.preset?.colorDefaults?.primary || current.primaryColor,
                      accentColor: theme?.preset?.colorDefaults?.accent || current.accentColor,
                      backgroundStyle: inferBackgroundStyle(theme),
                      imageDensity: inferImageDensity(theme),
                      heroEnabled: true,
                    }));
                  }}
                  style={styles.select}
                >
                  {MENU_DESIGN_LAB_THEMES.map((theme) => (
                    <option key={theme.style} value={theme.style}>{theme.name}</option>
                  ))}
                </select>
              </Control>
              <Control label="Primary color">
                <input
                  type="color"
                  value={controls.primaryColor}
                  onChange={(e) => setControls((c) => ({ ...c, primaryColor: e.target.value }))}
                  style={styles.color}
                />
              </Control>
              <Control label="Accent color">
                <input
                  type="color"
                  value={controls.accentColor}
                  onChange={(e) => setControls((c) => ({ ...c, accentColor: e.target.value }))}
                  style={styles.color}
                />
              </Control>
              <Control label="Background">
                <select
                  value={controls.backgroundStyle}
                  onChange={(e) => setControls((c) => ({ ...c, backgroundStyle: e.target.value }))}
                  style={styles.select}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="paper">Paper</option>
                  <option value="chalkboard">Chalkboard</option>
                </select>
              </Control>
              <Control label="Image density">
                <select
                  value={controls.imageDensity}
                  onChange={(e) => setControls((c) => ({ ...c, imageDensity: e.target.value }))}
                  style={styles.select}
                >
                  <option value="all">All images</option>
                  <option value="section">Section images</option>
                  <option value="thumbnail">Item thumbnails</option>
                  <option value="none">No images</option>
                </select>
              </Control>
              <Control label="Hero image">
                <button
                  type="button"
                  onClick={() => setControls((c) => ({ ...c, heroEnabled: !c.heroEnabled }))}
                  style={{
                    ...styles.toggleButton,
                    background: controls.heroEnabled ? "#1F4E3D" : (isDarkShell ? "rgba(255,255,255,0.06)" : "#fff"),
                    color: controls.heroEnabled ? "#fff" : (isDarkShell ? "#fff" : "#0f1720"),
                  }}
                >
                  {controls.heroEnabled ? "Enabled" : "Disabled"}
                </button>
              </Control>
            </div>
          </div>
        </aside>

        <section style={styles.previewColumn}>
          <div style={styles.previewHeader}>
            <div>
              <div style={styles.previewEyebrow}>Currently previewing</div>
              <h2 style={{ ...styles.previewTitle, color: isDarkShell ? "#fff" : "#0f1720" }}>{selectedTheme.name}</h2>
              <p style={{ ...styles.previewCopy, color: isDarkShell ? "rgba(255,255,255,0.72)" : "#667085" }}>{selectedTheme.bestFit}</p>
            </div>
            <div style={styles.previewMeta}>
              <span style={styles.sampleLabel}>Sample menu design</span>
              <button
                type="button"
                onClick={() => window.open(`/menu-template-preview?previewStyle=${selectedStyle}`, "_blank", "noopener,noreferrer")}
                style={{
                  ...styles.previewButton,
                  background: controls.primaryColor || "#1F4E3D",
                  borderColor: controls.primaryColor || "#1F4E3D",
                }}
              >
                Open preview
              </button>
            </div>
          </div>

          {notice ? <div style={styles.notice}>{notice}</div> : null}

          <div
            style={{
              ...styles.menuFrame,
              background: isDarkShell ? "#0B0F0C" : "#f7efe3",
              border: `1px solid ${controls.accentColor || "rgba(148,163,184,0.24)"}`,
            }}
          >
            <PublicMenuMainContent menuStyle={selectedStyle} templateContext={templateContext} />
          </div>
        </section>
      </section>
    </main>
  );
}

function Control({ label, children }) {
  return (
    <label style={styles.control}>
      <span style={styles.controlLabel}>{label}</span>
      {children}
    </label>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    color: "#0f1720",
  },
  header: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "18px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    boxSizing: "border-box",
  },
  logo: {
    display: "inline-flex",
    textDecoration: "none",
  },
  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  headerLink: {
    minHeight: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 850,
    padding: "0 16px",
  },
  headerCta: {
    minHeight: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    background: "#1F4E3D",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 850,
    padding: "0 16px",
  },
  hero: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "30px 22px 8px",
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
    fontSize: "clamp(2.1rem, 7vw, 4.4rem)",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0,
    maxWidth: 920,
  },
  copy: {
    margin: "16px 0 0",
    maxWidth: 760,
    color: "rgba(255,255,255,0.78)",
    fontSize: 17,
    lineHeight: 1.55,
  },
  shell: {
    maxWidth: 1280,
    margin: "18px auto 64px",
    padding: "0 22px",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "minmax(300px, 360px) minmax(0, 1fr)",
    gap: 18,
    alignItems: "start",
  },
  sidebar: {
    display: "grid",
    gap: 16,
  },
  sidebarSection: {
    borderRadius: 16,
    padding: 16,
    boxSizing: "border-box",
  },
  lightPanel: {
    background: "#ffffff",
    border: "1px solid #e4e9f0",
  },
  darkPanel: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 12,
    color: "#3DD934",
  },
  themeGrid: {
    display: "grid",
    gap: 10,
  },
  themeCard: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    borderRadius: 12,
    border: "1px solid",
    padding: 14,
    boxSizing: "border-box",
    cursor: "pointer",
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
    fontWeight: 900,
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
    marginTop: 14,
    fontSize: 13,
    fontWeight: 900,
  },
  controlGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  control: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "inherit",
  },
  select: {
    width: "100%",
    minHeight: 40,
    borderRadius: 10,
    border: "1px solid #d8dee6",
    background: "#fff",
    color: "#0f1720",
    fontSize: 13,
    padding: "0 12px",
    fontFamily: "inherit",
  },
  color: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid #d8dee6",
    background: "#fff",
    padding: 0,
  },
  toggleButton: {
    minHeight: 40,
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.24)",
    padding: "0 12px",
    fontWeight: 850,
    cursor: "pointer",
  },
  previewColumn: {
    minWidth: 0,
  },
  previewHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  previewEyebrow: {
    color: "#667085",
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  previewTitle: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.12,
    fontWeight: 900,
  },
  previewCopy: {
    margin: "6px 0 0",
    fontSize: 14,
    lineHeight: 1.45,
  },
  previewMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 10,
  },
  previewButton: {
    minHeight: 40,
    borderRadius: 999,
    border: "1px solid #1F4E3D",
    background: "#1F4E3D",
    color: "#fff",
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
  },
  notice: {
    marginBottom: 12,
    borderRadius: 10,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 750,
  },
  menuFrame: {
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 24px 70px rgba(15,23,42,0.18)",
  },
  previewBanner: {
    marginBottom: 14,
    borderRadius: 10,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 800,
  },
};
