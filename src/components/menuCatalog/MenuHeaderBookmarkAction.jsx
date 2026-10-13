/**
 * Bookmark toggle at the end of the Menu Browser restaurant header (Andre, 2026-10-12).
 * The Menu Browser has a "Bookmarked" chip, so every menu shown there can be bookmarked.
 * Saves to the local Menu library (feedMenuLibrary) that the Bookmarked chip reads.
 */

import { useEffect, useState } from "react";
import { LIKE_ACCENT, likeButtonVisualStyle } from "../../lib/likeButtonStyles.js";
import {
  FEED_MENU_LIBRARY_CHANGED,
  isFeedMenuBookmarked,
  toggleFeedMenuBookmark,
} from "../../lib/feedMenuLibrary.js";

function safeIsBookmarked(restaurantId) {
  try {
    return isFeedMenuBookmarked(restaurantId);
  } catch {
    return false;
  }
}

function BookmarkIcon({ filled, color }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 3.5h12a1 1 0 0 1 1 1v16.2a.5.5 0 0 1-.8.4L12 16.6l-6.2 4.5a.5.5 0 0 1-.8-.4V4.5a1 1 0 0 1 1-1Z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MenuHeaderBookmarkAction({ restaurant, size = 28 }) {
  const restaurantId = restaurant?.restaurant_id;
  const [bookmarked, setBookmarked] = useState(() => safeIsBookmarked(restaurantId));
  const [note, setNote] = useState("");

  // Keyed by restaurant in CatalogMenuRenderer, so initial state is per restaurant.
  useEffect(() => {
    const sync = () => setBookmarked(safeIsBookmarked(restaurantId));
    window.addEventListener(FEED_MENU_LIBRARY_CHANGED, sync);
    return () => window.removeEventListener(FEED_MENU_LIBRARY_CHANGED, sync);
  }, [restaurantId]);

  useEffect(() => {
    if (!note) return undefined;
    const timer = window.setTimeout(() => setNote(""), 2200);
    return () => window.clearTimeout(timer);
  }, [note]);

  if (!restaurantId) return null;

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    let saved = false;
    try {
      saved = toggleFeedMenuBookmark(restaurant);
    } catch {
      setNote("Could not save bookmark");
      return;
    }
    setBookmarked(saved);
    setNote(saved ? "Bookmarked" : "Bookmark removed");
  }

  const label = bookmarked ? "Remove bookmark" : "Bookmark this menu";
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        data-testid="menu-header-bookmark"
        aria-pressed={bookmarked}
        aria-label={label}
        title={label}
        onClick={onClick}
        style={{ ...likeButtonVisualStyle({ selected: bookmarked, ghost: true }), width: size, height: size }}
      >
        <BookmarkIcon filled={bookmarked} color={bookmarked ? LIKE_ACCENT : "#475569"} />
      </button>
      {note ? (
        <span role="status" data-testid="menu-header-bookmark-note" style={styles.note}>
          {note}
        </span>
      ) : null}
    </span>
  );
}

const styles = {
  note: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    zIndex: 20,
    whiteSpace: "nowrap",
    padding: "6px 10px",
    borderRadius: 8,
    background: "rgba(15, 23, 42, 0.92)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
    pointerEvents: "none",
  },
};
