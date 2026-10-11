/**
 * Search & Shop segmented control: [ Search | Menu Browser ]. Sits directly under the
 * search box; both modes share the same query.
 */

import {
  SEARCH_SHOP_MODE_MENU_BROWSER,
  SEARCH_SHOP_MODE_SEARCH,
} from "../../../lib/searchShopMode.js";

const OPTIONS = [
  { id: SEARCH_SHOP_MODE_SEARCH, label: "Search" },
  { id: SEARCH_SHOP_MODE_MENU_BROWSER, label: "Menu Browser" },
];

export default function SearchShopModeToggle({ mode, onChange, style = null }) {
  return (
    <div
      role="radiogroup"
      aria-label="Search & Shop view"
      data-testid="search-shop-mode-toggle"
      style={{ ...styles.track, ...style }}
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={`search-shop-mode-${opt.id}`}
            onClick={() => {
              if (!active) onChange?.(opt.id);
            }}
            style={{ ...styles.option, ...(active ? styles.optionActive : null) }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  track: {
    display: "flex",
    gap: 4,
    padding: 4,
    borderRadius: 999,
    background: "var(--gb-color-surface-strong, #2E3D1C)",
    border: "1px solid var(--gb-color-border, #1F2937)",
    boxSizing: "border-box",
    width: "100%",
  },
  option: {
    flex: 1,
    minWidth: 0,
    height: 36,
    border: "none",
    borderRadius: 999,
    background: "transparent",
    color: "rgba(249, 250, 251, 0.78)",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  optionActive: {
    background: "var(--gb-color-accent, #22C55E)",
    color: "#0B0F0C",
  },
};
