import { useLanguage } from "../../context/LanguageContext.jsx";
import { MENU_BROWSER_BOOK_SRC } from "../../lib/menuCatalogCategories.js";

const INK = "#1a1a1a";
const YELLOW = "#FACC15";

function FoodModeIcon({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 3v8" />
      <path d="M3 3v5" />
      <path d="M9 3v5" />
      <path d="M6 11v10" />
      <path d="M14 3c2.5 0 4 2.2 4 5.5V12" />
      <path d="M18 12v9" />
    </svg>
  );
}

function DrinkModeIcon({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 3h8l-2 9.5" />
      <path d="M6 12.5h12" />
      <path d="M9 21h6" />
      <path d="M10 12.5v6.5" />
      <path d="M14 12.5v6.5" />
    </svg>
  );
}

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
  const TargetIcon = targetMode === "drinks" ? DrinkModeIcon : FoodModeIcon;
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
        position: "fixed",
        right: "clamp(12px, 3.5vw, 20px)",
        bottom: "calc(var(--bottom-nav-h, 72px) + 14px)",
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
        <TargetIcon size={13} />
      </span>
    </button>
  );
}
