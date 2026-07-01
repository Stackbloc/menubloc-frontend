import { useLanguage } from "../../context/LanguageContext.jsx";

const STORAGE_KEY = "menuply:browse-menus-swipe-coach-dismissed";

export function isMenuCatalogSwipeCoachDismissed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissMenuCatalogSwipeCoach() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}

/** Fades across menus 1–3 (index 0 … 2). */
function watermarkOpacity(index) {
  if (index <= 0) return 0.44;
  if (index === 1) return 0.3;
  return 0.18;
}

/**
 * Original Menuply swipe-gesture icon — hand + horizontal arrows.
 * Not derived from third-party assets.
 */
function SwipeGestureIcon({ size = 132 }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.72)}
      viewBox="0 0 144 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left arrow */}
      <path d="M10 52H34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M10 52L20 42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 52L20 62" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Right arrow */}
      <path d="M134 52H110" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M134 52L124 42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M134 52L124 62" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Touch arc above fingertip */}
      <path
        d="M74 20C78 14 86 14 90 20"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Palm + curled fingers */}
      <path
        d="M56 68C50 68 46 63 48 57L52 44C54 38 60 38 62 44L64 52"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M64 52L66 58C67 62 64 66 60 66"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Index finger */}
      <path
        d="M62 44L66 34C68 28 76 26 80 32L84 46"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Thumb */}
      <path
        d="M48 57L42 62"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Centered swipe watermark on the first few menus.
 * Non-interactive — gestures pass through to the menu underneath.
 */
export default function MenuCatalogSwipeCoach({
  index = 0,
  visible = true,
}) {
  const { t } = useLanguage();

  if (!visible) return null;

  const opacity = watermarkOpacity(index);

  return (
    <>
      <style>{`
        @keyframes menuCatalogSwipeWatermark {
          0%, 100% { transform: translate(-50%, -50%) translateX(0); }
          50% { transform: translate(-50%, -50%) translateX(7px); }
        }
      `}</style>

      <div
        role="note"
        aria-label={t("menuCatalog.swipeCoach", "Swipe left or right for the next menu")}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 25,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "46%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            color: "#525252",
            opacity,
            animation: "menuCatalogSwipeWatermark 2.8s ease-in-out infinite",
            filter: "drop-shadow(0 1px 2px rgba(255, 255, 255, 0.18))",
            userSelect: "none",
          }}
        >
          <SwipeGestureIcon size={128} />
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {t("menuCatalog.swipe", "Swipe")}
          </div>
        </div>
      </div>
    </>
  );
}
