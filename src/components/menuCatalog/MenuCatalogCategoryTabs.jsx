import { useLanguage } from "../../context/LanguageContext.jsx";
import { MENU_CATALOG_TABS, toMenuCatalogTranslationKey } from "../../lib/menuCatalogCategories.js";

export default function MenuCatalogCategoryTabs({
  activeSection,
  onSelect,
}) {
  const { t } = useLanguage();

  return (
    <div
      style={{
        flexShrink: 0,
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        background: "var(--gb-color-page, #f8f6f1)",
      }}
    >
      <nav
        aria-label={t("menuCatalog.categories", "Categories")}
        style={{
          display: "flex",
          gap: 6,
          padding: "10px 12px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {MENU_CATALOG_TABS.map((entry) => {
          const isActive = entry.id === activeSection;
          const label = t(toMenuCatalogTranslationKey(entry.id), entry.label);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              style={{
                flexShrink: 0,
                border: isActive ? "1.5px solid rgba(34, 197, 94, 0.45)" : "1px solid rgba(0,0,0,0.08)",
                background: isActive ? "rgba(34, 197, 94, 0.14)" : "#fff",
                color: isActive ? "#15803d" : "var(--gb-color-ink, #1a1a1a)",
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                padding: "7px 14px",
                borderRadius: 999,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
