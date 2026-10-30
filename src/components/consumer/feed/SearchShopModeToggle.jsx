/**
 * Search | Menu Browser switch, the app's CompactSwitch (menuply-mobile src/components/CompactSwitch.tsx,
 * Andre 2026-10-26; app wins, 2026-10-29): "Search ●— Menu Browser". The chosen label is dark and bold
 * and the knob sits on its side. Tapping a label picks it; tapping the switch flips it.
 * Both modes share the same query.
 */

import {
  SEARCH_SHOP_MODE_MENU_BROWSER,
  SEARCH_SHOP_MODE_SEARCH,
} from "../../../lib/searchShopMode.js";

const TRACK_W = 40;
const TRACK_H = 22;
const KNOB = 18;
const TRAVEL = TRACK_W - KNOB - 4;

export default function SearchShopModeToggle({ mode, onChange, style = null }) {
  const browsing = mode === SEARCH_SHOP_MODE_MENU_BROWSER;
  const pick = (next) => {
    if (next !== mode) onChange?.(next);
  };
  return (
    <div
      role="radiogroup"
      aria-label="Search or Menu Browser"
      data-testid="search-shop-mode-toggle"
      style={{ ...styles.row, ...style }}
    >
      <button
        type="button"
        role="radio"
        aria-checked={!browsing}
        data-testid={`search-shop-mode-${SEARCH_SHOP_MODE_SEARCH}`}
        onClick={() => pick(SEARCH_SHOP_MODE_SEARCH)}
        style={{ ...styles.label, ...(!browsing ? styles.labelOn : null) }}
      >
        Search
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={browsing}
        aria-label="Search or Menu Browser"
        onClick={() => pick(browsing ? SEARCH_SHOP_MODE_SEARCH : SEARCH_SHOP_MODE_MENU_BROWSER)}
        style={styles.track}
      >
        <span style={{ ...styles.knob, transform: `translateX(${browsing ? TRAVEL : 0}px)` }} />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={browsing}
        data-testid={`search-shop-mode-${SEARCH_SHOP_MODE_MENU_BROWSER}`}
        onClick={() => pick(SEARCH_SHOP_MODE_MENU_BROWSER)}
        style={{ ...styles.label, ...(browsing ? styles.labelOn : null) }}
      >
        Menu Browser
      </button>
    </div>
  );
}

const styles = {
  row: { display: "inline-flex", alignItems: "center", gap: 8 },
  label: {
    border: "none",
    background: "transparent",
    padding: "11px 2px",
    margin: "-11px 0",
    fontSize: 13,
    lineHeight: "18px",
    fontWeight: 500,
    color: "#5c665f",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  labelOn: { fontWeight: 800, color: "#111613" },
  // Either side is a choice, not "off", so the track stays green both ways.
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    border: "none",
    background: "#22c55e",
    padding: 2,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxSizing: "border-box",
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
    transition: "transform 150ms",
    display: "block",
  },
};
