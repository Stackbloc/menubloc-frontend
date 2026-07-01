import { useLanguage } from "../../context/LanguageContext.jsx";
import { MENU_CATALOG_SIDEBAR, toMenuCatalogTranslationKey } from "../../lib/menuCatalogCategories.js";

export default function MenuCatalogSidebar({
  activeSection,
  onSelect,
  isMobile = false,
}) {
  const { t } = useLanguage();

  return (
    <aside
      aria-label={t("menuCatalog.categories", "Categories")}
      style={{
        flexShrink: 0,
        width: isMobile ? "100%" : 176,
        height: isMobile ? "auto" : "100%",
        maxHeight: isMobile ? "none" : "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: isMobile ? "none" : "1px solid rgba(0,0,0,0.08)",
        borderBottom: isMobile ? "1px solid rgba(0,0,0,0.08)" : "none",
        background: "var(--gb-color-page, #f8f6f1)",
      }}
    >
      {!isMobile ? (
        <div
          style={{
            padding: "14px 16px 8px",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#667085",
            flexShrink: 0,
          }}
        >
          {t("menuCatalog.categories", "Categories")}
        </div>
      ) : null}

      <nav
        style={{
          listStyle: "none",
          margin: 0,
          padding: isMobile ? "8px 12px" : "4px 0 12px",
          display: isMobile ? "flex" : "flex",
          flexDirection: isMobile ? "row" : "column",
          flex: isMobile ? undefined : 1,
          gap: isMobile ? 4 : 0,
          overflowX: isMobile ? "auto" : "hidden",
          overflowY: isMobile ? "hidden" : "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {MENU_CATALOG_SIDEBAR.map((entry) => {
          const isActive = entry.id === activeSection;
          const label = t(toMenuCatalogTranslationKey(entry.id), entry.label);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              style={{
                display: "flex",
                alignItems: "center",
                width: isMobile ? "auto" : "100%",
                textAlign: "left",
                border: "none",
                background: isActive ? "rgba(34, 197, 94, 0.12)" : "transparent",
                color: isActive ? "#15803d" : "var(--gb-color-ink, #1a1a1a)",
                fontSize: isMobile ? 13 : 14,
                fontWeight: isActive ? 800 : 600,
                padding: isMobile ? "8px 12px" : "9px 16px",
                borderRadius: isMobile ? 999 : 0,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {isActive && !isMobile ? (
                <span aria-hidden="true" style={{ marginRight: 6, fontSize: 11 }}>►</span>
              ) : null}
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
