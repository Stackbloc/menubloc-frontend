/**
 * Always-on profile chrome above leftover camera/sheet overlays (z-index 13000).
 * Edit/Connect + Month in Food must remain clickable when a media sheet leftovers.
 */

import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import ProfileViewModeToggle from "./ProfileViewModeToggle.jsx";
import { MY_MENUPLY_MONTH_IN_FOOD_PATH } from "../../../lib/myMenuplyRoutes.js";
import { clearStuckMediaChrome } from "../../../pages/consumer/myMenuply/pendingHighlightMedia.js";

function MonthInFoodGlyph({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 3.5v3.5M16 3.5v3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="9" cy="14" r="1.15" fill="currentColor" />
      <circle cx="12.5" cy="14" r="1.15" fill="currentColor" />
      <circle cx="16" cy="14" r="1.15" fill="currentColor" />
    </svg>
  );
}

export default function ProfileViewChrome({
  previewAsConnect = false,
  onToggle,
  monthInFoodHref = MY_MENUPLY_MONTH_IN_FOOD_PATH,
  variant = "feedDark",
}) {
  if (typeof document === "undefined") return null;

  function handleToggle(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    clearStuckMediaChrome();
    onToggle?.();
  }

  return createPortal(
    <div
      style={styles.bar}
      data-testid="profile-view-chrome"
      aria-label="Profile view controls"
    >
      <ProfileViewModeToggle
        previewAsConnect={previewAsConnect}
        onToggle={handleToggle}
        variant={variant}
      />
      {monthInFoodHref ? (
        <Link
          to={monthInFoodHref}
          data-testid="profile-chrome-month-in-food"
          title="My Month in Food"
          aria-label="My Month in Food"
          style={styles.mmif}
          onClick={(event) => {
            event.stopPropagation();
            clearStuckMediaChrome();
          }}
        >
          <MonthInFoodGlyph />
        </Link>
      ) : null}
    </div>,
    document.body
  );
}

const styles = {
  bar: {
    position: "fixed",
    top: "max(10px, env(safe-area-inset-top, 0px))",
    right: 12,
    zIndex: 14000,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    pointerEvents: "auto",
  },
  mmif: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(8, 12, 10, 0.92)",
    color: "#5eead4",
    textDecoration: "none",
    flexShrink: 0,
  },
};
