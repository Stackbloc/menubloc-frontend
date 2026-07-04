import { useLanguage } from "../../context/LanguageContext.jsx";
import { MENU_BROWSER_BOOK_SRC } from "../../lib/menuCatalogCategories.js";
import {
  toMenuBrowserModeTranslationKey,
} from "../../lib/menuBrowserModes.js";

const INK = "#1a1a1a";
const YELLOW = "#FACC15";

/**
 * Floating Food ↔ Drinks toggle for Yellow Browser.
 * Sits low on the browse pane (above BottomNav) — not near category tabs.
 */
export default function MenuCatalogModeToggleFab({
  visible = false,
  isDrinksMode = false,
  menuLoading = false,
  onToggle,
}) {
  const { t } = useLanguage();

  if (!visible || typeof onToggle !== "function") return null;

  const targetMode = isDrinksMode ? "food" : "drinks";
  const targetLabel = t(
    toMenuBrowserModeTranslationKey(targetMode),
    targetMode === "drinks" ? "Drinks" : "Food"
  );
  const ariaLabel = isDrinksMode
    ? t("menuBrowser.switchToFood", "Switch to Food menus")
    : t("menuBrowser.switchToDrinks", "Switch to Drinks menus");

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        position: "absolute",
        right: "clamp(12px, 3.5vw, 20px)",
        bottom: "clamp(14px, 3.5vh, 24px)",
        zIndex: 62,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: `3px solid ${INK}`,
        background: YELLOW,
        boxShadow: menuLoading
          ? "0 0 0 3px rgba(250, 204, 21, 0.45), 0 6px 20px rgba(0,0,0,0.22)"
          : "0 4px 16px rgba(0,0,0,0.24)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        cursor: "pointer",
        overflow: "visible",
        animation: menuLoading ? "menuCatalogFabPulse 1.4s ease-in-out infinite" : "none",
      }}
    >
      <style>{`
        @keyframes menuCatalogFabPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>

      <img
        src={MENU_BROWSER_BOOK_SRC}
        alt=""
        aria-hidden
        style={{
          display: "block",
          width: 34,
          height: 34,
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />

      <span
        aria-hidden
        style={{
          position: "absolute",
          right: -4,
          bottom: -4,
          minWidth: 22,
          height: 22,
          padding: "0 5px",
          borderRadius: 999,
          border: `2px solid ${INK}`,
          background: "#fff",
          color: INK,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          pointerEvents: "none",
        }}
      >
        {targetLabel.slice(0, 1)}
      </span>
    </button>
  );
}
