import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import PublicMenuMainContent from "../components/menu-templates/PublicMenuMainContent.jsx";
import MenuThemeExamplesSection from "../components/menu-templates/MenuThemeExamplesSection.jsx";
import { KBC_DEFAULT_MENU_PREVIEW_SAMPLE, MENU_TEMPLATE_PREVIEW_SAMPLE, MENU_THEME_SAMPLES } from "../data/menuTemplatePreviewSample.js";
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

function buildThemePayload(themeStyle) {
  const style = normalizeMenuStyle(themeStyle);
  const accents = {
    v1: "#1F4E3D",
    v2: "#2f7d5b",
    v3: "#f97316",
    v4: "#b68b45",
    v5: "#2563eb",
    v6: "#7a2b23",
  };
  const names = {
    v1: "KBC Default Menu Sample",
    v2: "Modern Fast Casual Sample",
    v3: "Food Truck Sample",
    v4: "Dark Premium Sample",
    v5: "Family Diner Sample",
    v6: "Premium Bistro Sample",
  };
  const basePayload = style === "v1" ? KBC_DEFAULT_MENU_PREVIEW_SAMPLE : MENU_TEMPLATE_PREVIEW_SAMPLE;
  return {
    ...basePayload,
    restaurant_name: names[style] || basePayload.restaurant_name,
    name: names[style] || basePayload.name,
    slug: `${style}-sample-menu`,
    accent_color: accents[style] || basePayload.accent_color,
    menu_style: style,
    menu_name: style === "v1" ? "Default Menu Design" : "Sample Menu Design",
    selected_menu_id: null,
  };
}

export default function MenuThemesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const selectedStyle = normalizeMenuStyle(searchParams.get("theme") || "v1");
  const selectedTheme = MENU_THEME_SAMPLES.find((theme) => theme.style === selectedStyle) || MENU_THEME_SAMPLES[0];
  const [notice, setNotice] = useState("");
  const [hoveredItemId, setHoveredItemId] = useState(null);

  const data = useMemo(() => buildThemePayload(selectedStyle), [selectedStyle]);
  const brand = useMemo(
    () => buildRestaurantMenuBrand(data, data.restaurant_name || data.name),
    [data]
  );
  const dealMap = useMemo(() => {
    const map = new Map();
    for (const deal of data.deal_items || []) {
      if (deal.id != null) map.set(deal.id, deal);
    }
    return map;
  }, [data]);

  const previewNotice = (message = "This is a sample menu design. Ordering is disabled in preview mode.") => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const templateContext = {
    isMobile,
    language: "en",
    t: (_key, fallback = "") => fallback,
    restaurantName: data.restaurant_name || data.name,
    restaurantProfileHref: null,
    menuTypeLabel: "Sample menu design",
    scheduledActiveMenuLabel: null,
    addressLine1: data.address_line1,
    addressLine2: [data.city, data.state, data.zip].filter(Boolean).join(", "),
    addressLine: [data.address_line1, data.city, data.state].filter(Boolean).join(", "),
    directionsHref: "",
    logoUrl: data.logo_url || null,
    shareData: {
      title: `${selectedTheme.name} sample menu`,
      text: "Sample menu design preview",
      url: typeof window !== "undefined" ? window.location.href : "/menu-themes",
    },
    shareAnalyticsContext: {
      pageType: "menu_theme_sample",
      menuStyle: selectedStyle,
    },
    franchiseSlot: null,
    intakeBannerSlot: (
      <div style={styles.previewBanner}>
        Sample menu design — visual preview only. Checkout and live ordering are disabled.
      </div>
    ),
    allergenBannerSlot: null,
    onOpenFilters: () => previewNotice("Filters are disabled in this sample menu design."),
    displaySections: data.sections || [],
    displayableItemCount: (data.sections || []).reduce((sum, section) => sum + (section.items || []).length, 0),
    dealItems: data.deal_items || [],
    filtersActive: false,
    handleClearFilters: () => {},
    data,
    currentRestaurantId: data.restaurant_id,
    dealMap,
    activeCartItems: [],
    hoveredItemId,
    setHoveredItemId,
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
    heroImageUrl: pickHeroImageUrl(data),
    cartLineCount: 0,
    onGoCheckout: () => previewNotice(),
    brand,
    fontStack: fontStackForPreset(brand?.fontPreset),
    menus: [],
    selectedMenuId: null,
    onSelectMenu: () => {},
    tabLoading: false,
    tabError: null,
    menuPresentation: data.menu_presentation || {},
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <BrandLogo width={132} height={52} radius={0} pageColor="#0b0f0c" linkStyle={styles.logo} />
        <Link to="/restaurant/signup" style={styles.headerCta}>Create your menu</Link>
      </header>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>Sample menu designs</div>
        <h1 style={styles.title}>Browse Menuply menu themes</h1>
        <p style={styles.copy}>
          Preview real Menuply menu layouts for different restaurant types. These examples use sample data and are not live restaurants.
        </p>
      </section>

      <MenuThemeExamplesSection />

      <section style={styles.previewShell}>
        <div style={styles.previewHeader}>
          <div>
            <div style={styles.previewEyebrow}>Currently previewing</div>
            <h2 style={styles.previewTitle}>{selectedTheme.name}</h2>
            <p style={styles.previewCopy}>{selectedTheme.bestFit}</p>
          </div>
          <div style={styles.themeSwitches}>
            {MENU_THEME_SAMPLES.map((theme) => {
              const active = theme.style === selectedStyle;
              return (
                <button
                  key={theme.style}
                  type="button"
                  onClick={() => setSearchParams({ theme: theme.style })}
                  style={{
                    ...styles.switchButton,
                    background: active ? "#1F4E3D" : "#ffffff",
                    color: active ? "#ffffff" : "#1F4E3D",
                    borderColor: active ? "#1F4E3D" : "#cbd5e1",
                  }}
                >
                  {theme.style.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {notice ? <div style={styles.notice}>{notice}</div> : null}

        <div style={styles.menuFrame}>
          <PublicMenuMainContent menuStyle={selectedStyle} templateContext={templateContext} />
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7f4",
    color: "#0f1720",
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
  logo: {
    display: "inline-flex",
    textDecoration: "none",
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
    maxWidth: 980,
    margin: "0 auto",
    padding: "42px 22px 8px",
    boxSizing: "border-box",
  },
  eyebrow: {
    color: "#1F4E3D",
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: "clamp(2.15rem, 7vw, 4.8rem)",
    lineHeight: 0.98,
    fontWeight: 900,
    letterSpacing: 0,
    maxWidth: 820,
  },
  copy: {
    margin: "18px 0 0",
    maxWidth: 680,
    color: "#475467",
    fontSize: 18,
    lineHeight: 1.55,
  },
  previewShell: {
    maxWidth: 1080,
    margin: "18px auto 64px",
    padding: "0 22px",
    boxSizing: "border-box",
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
    color: "#667085",
    fontSize: 14,
    lineHeight: 1.45,
  },
  themeSwitches: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  switchButton: {
    minHeight: 40,
    border: "1px solid",
    borderRadius: 999,
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
  },
  notice: {
    marginBottom: 12,
    borderRadius: 8,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 750,
  },
  menuFrame: {
    background: "#0B0F0C",
    borderRadius: 14,
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
