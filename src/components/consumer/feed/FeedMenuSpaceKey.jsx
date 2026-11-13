/**
 * The Feed's Menu button: a short space-bar key labeled "Menu" in the bottom middle of the clip,
 * its rim and word pulsing yellow ↔ white (menuply-mobile FeedClip PulsingMenu; Andre 2026-11-07
 * "the menu is important, make it apparent… do not make the space bar too long"; web follows the
 * app, Andre 2026-11-13). Fixed width so it never grows into a full-width bar. Still when the
 * viewer asks for reduced motion.
 */

/** Its top edge sits about level with the rail's last label (Share), as in the app. */
export const FEED_MENU_KEY_BOTTOM =
  "max(calc(clamp(92px, 15vh, 124px) - 30px), calc(env(safe-area-inset-bottom, 0px) + 42px))";
export const FEED_MENU_KEY_HEIGHT = 42;
/** Caption padding so the clip's words sit just above the key (they share the bottom middle). */
export const FEED_CAPTION_ABOVE_MENU_KEY = `calc(${FEED_MENU_KEY_BOTTOM} + ${FEED_MENU_KEY_HEIGHT + 12}px)`;

const CSS = `
@keyframes mpMenuKey { 0%, 100% { border-color: #FACC15; color: #FACC15; } 50% { border-color: #FFFFFF; color: #FFFFFF; } }
.mp-menu-key { animation: mpMenuKey 1.8s ease-in-out infinite; }
.mp-menu-key:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .mp-menu-key { animation: none; } }
`;

export default function FeedMenuSpaceKey({ onClick, hint = "See this restaurant's menu", active = true }) {
  return (
    <>
      <style>{CSS}</style>
      <div style={styles.row}>
        <button
          type="button"
          className={active ? "mp-menu-key" : undefined}
          style={styles.key}
          data-testid="feed-menu-key"
          aria-label="Menu"
          title={hint}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick?.();
          }}
        >
          Menu
        </button>
      </div>
    </>
  );
}

const styles = {
  row: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: FEED_MENU_KEY_BOTTOM,
    zIndex: 6,
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
  },
  key: {
    pointerEvents: "auto",
    width: 120,
    height: FEED_MENU_KEY_HEIGHT,
    boxSizing: "border-box",
    borderRadius: 10,
    border: "2px solid #FACC15",
    borderBottomWidth: 4,
    background: "rgba(0,0,0,0.4)",
    color: "#FACC15",
    fontFamily: "inherit",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "0.5px",
    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
    cursor: "pointer",
    touchAction: "manipulation",
  },
};
