import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  MENU_BROWSER_MODES,
  toMenuBrowserModeTranslationKey,
} from "../../lib/menuBrowserModes.js";

const INK = "#1a1a1a";
const PAGE_BG = "#FACC15";

/**
 * Book spread — user picks Food or Drinks after the cover page turns.
 */
export default function MenuCatalogModePage({ onSelect }) {
  const { t } = useLanguage();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 38,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: PAGE_BG,
        borderRadius: 16,
        boxSizing: "border-box",
        padding: "32px 24px",
        animation: "menuCatalogPageIn 420ms ease-out",
      }}
    >
      <style>{`
        @keyframes menuCatalogPageIn {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "min(100%, 320px)",
        }}
      >
      <h2
        style={{
          margin: "0 0 36px",
          color: INK,
          fontSize: "clamp(22px, 6vw, 28px)",
          fontWeight: 900,
          letterSpacing: "-0.02em",
          textAlign: "center",
          lineHeight: 1.25,
          maxWidth: 320,
        }}
      >
        {t("menuBrowser.chooseModePrompt", "What do you want to browse?")}
      </h2>

      <div
        role="group"
        aria-label={t("menuBrowser.modes", "Browse mode")}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          width: "min(100%, 280px)",
        }}
      >
        {MENU_BROWSER_MODES.map((entry) => {
          const label = t(toMenuBrowserModeTranslationKey(entry.id), entry.label);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              style={{
                border: `3px solid ${INK}`,
                borderRadius: 14,
                background: "#fff",
                color: INK,
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "18px 24px",
                cursor: "pointer",
                width: "100%",
                transition: "background 150ms ease, color 150ms ease, transform 120ms ease",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}
