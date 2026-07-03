import { useEffect, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  MENU_CATALOG_DRINK_TABS,
  toDrinkCatalogTranslationKey,
} from "../../lib/menuCatalogDrinkCategories.js";

export default function MenuCatalogDrinkCategoryTabs({
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
        aria-label={t("menuCatalog.drinkCategories", "Drink categories")}
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 0",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {MENU_CATALOG_DRINK_TABS.map((entry) => {
          const isActive = entry.id === activeSection;
          const label = t(toDrinkCatalogTranslationKey(entry.id), entry.label);
          const accent = entry.accent || "#1a1a1a";

          return (
            <button
              key={entry.id}
              type="button"
              data-active={isActive ? "true" : "false"}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSelect(entry.id)}
              style={{
                flexShrink: 0,
                border: isActive ? `2px solid ${accent}` : `2px solid ${accent}33`,
                background: isActive ? `${accent}18` : `${accent}0d`,
                color: accent,
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                padding: "7px 14px",
                borderRadius: 999,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 150ms ease, border-color 150ms ease",
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
