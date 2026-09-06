import { useState } from "react";
import {
  MENU_BROWSER_EXPLORE_CHIPS,
  resolveMenuBrowserSearchIntent,
} from "../../lib/menuBrowserSearchIntent.js";

/**
 * Yellow Browse search + explore chips.
 * Cuisine aliases → browse_section; otherwise → /search with location.
 */
export default function MenuCatalogBrowseSearch({
  onSelectSection,
  onNavigateSearch,
  showExploreChips = true,
}) {
  const [query, setQuery] = useState("");

  function submitIntent(raw) {
    const intent = resolveMenuBrowserSearchIntent(raw);
    if (intent.kind === "section") {
      onSelectSection?.(intent.sectionId);
      return;
    }
    onNavigateSearch?.(intent.q);
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitIntent(query);
  }

  return (
    <div data-testid="menu-browser-search" style={styles.wrap}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label htmlFor="menu-browser-search-input" style={styles.srOnly}>
          Search restaurants, food, menus
        </label>
        <input
          id="menu-browser-search-input"
          data-testid="menu-browser-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants, food, menus…"
          style={styles.input}
          autoComplete="off"
        />
        <button type="submit" data-testid="menu-browser-search-submit" style={styles.submit}>
          Search
        </button>
      </form>
      {showExploreChips ? (
        <div data-testid="menu-browser-explore-chips" style={styles.chips} role="list">
          {MENU_BROWSER_EXPLORE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              role="listitem"
              data-testid={`menu-browser-explore-${chip.label.toLowerCase()}`}
              onClick={() => submitIntent(chip.query)}
              style={styles.chip}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  wrap: {
    flexShrink: 0,
    padding: "8px 0 4px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  form: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderRadius: 12,
    border: "1.5px solid rgba(0,0,0,0.12)",
    padding: "0 12px",
    fontSize: 14,
    fontWeight: 600,
    background: "#fff",
    color: "#1a1a1a",
    boxSizing: "border-box",
  },
  submit: {
    flexShrink: 0,
    height: 40,
    padding: "0 14px",
    borderRadius: 12,
    border: "none",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  chips: {
    display: "flex",
    gap: 8,
    padding: "10px 0 2px",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
  },
  chip: {
    flexShrink: 0,
    border: "1.5px solid rgba(0,0,0,0.12)",
    background: "rgba(250,204,21,0.35)",
    color: "#1a1a1a",
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: 999,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
  },
};
