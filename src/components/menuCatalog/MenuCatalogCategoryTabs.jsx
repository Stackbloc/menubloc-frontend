import { useEffect, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { MENU_CATALOG_TABS, toMenuCatalogTranslationKey } from "../../lib/menuCatalogCategories.js";

const TAB_INK = "#1a1a1a";
const TAB_BORDER = "#1a1a1a";

export default function MenuCatalogCategoryTabs({
  activeSection,
  onSelect,
}) {
  const { t } = useLanguage();
  const navRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector('[data-active="true"]');
    activeBtn?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSection]);

  return (
    <div
      style={{
        flexShrink: 0,
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        background: "var(--gb-color-page, #f8f6f1)",
        position: "relative",
        zIndex: 90,
      }}
    >
      <nav
        ref={navRef}
        aria-label={t("menuCatalog.categories", "Categories")}
        style={{
          display: "flex",
          gap: 8,
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
              data-active={isActive ? "true" : "false"}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSelect(entry.id)}
              style={{
                flexShrink: 0,
                border: isActive ? `2px solid ${TAB_BORDER}` : "2px solid transparent",
                background: "transparent",
                color: TAB_INK,
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
