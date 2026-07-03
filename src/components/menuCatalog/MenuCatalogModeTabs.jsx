import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  MENU_BROWSER_MODES,
  normalizeMenuBrowserMode,
  toMenuBrowserModeTranslationKey,
} from "../../lib/menuBrowserModes.js";

const INK = "#1a1a1a";

export default function MenuCatalogModeTabs({
  activeMode,
  onSelect,
}) {
  const { t } = useLanguage();
  const mode = normalizeMenuBrowserMode(activeMode);

  return (
    <div
      style={{
        flexShrink: 0,
        padding: "12px 0 4px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: INK,
          marginBottom: 10,
        }}
      >
        {t("menuBrowser.yellowBrowserTitle", "Yellow Browser")}
      </div>

      <div
        role="tablist"
        aria-label={t("menuBrowser.modes", "Browse mode")}
        style={{
          display: "inline-flex",
          gap: 0,
          border: `2px solid ${INK}`,
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {MENU_BROWSER_MODES.map((entry, index) => {
          const isActive = entry.id === mode;
          const label = t(toMenuBrowserModeTranslationKey(entry.id), entry.label);

          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(entry.id)}
              style={{
                border: "none",
                borderRight: index < MENU_BROWSER_MODES.length - 1 ? `2px solid ${INK}` : "none",
                background: isActive ? INK : "#fff",
                color: isActive ? "#fff" : INK,
                fontSize: 15,
                fontWeight: isActive ? 900 : 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "10px 28px",
                cursor: "pointer",
                minWidth: 108,
                transition: "background 150ms ease, color 150ms ease",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
