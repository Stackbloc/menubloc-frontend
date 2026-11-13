/**
 * Mobile Feed top bar, as in the app (menuply-mobile AppMenuButton showLocation + CartButton; the app
 * wins, Andre 2026-11-13): ☰ at the top left with the diner's location beside it, and the cart button
 * next to them whenever the basket has items. No logo and no "Log in" pill (sign-in lives in ☰ and on
 * the Profile tab). The location opens Search, where it can be changed.
 */

import { Link } from "react-router-dom";
import FeedShopBasketButton from "./FeedShopBasketButton.jsx";
import { useOrderCart } from "../../../context/OrderCartContext.jsx";
import { readDetectedLocation } from "../../../lib/discoveryLocationPersistence.js";
import { clearStuckMediaChrome } from "../../../pages/consumer/myMenuply/pendingHighlightMedia.js";

/** City the Feed plays from (same source as FeedHomePage), e.g. "Los Angeles". */
export function feedHeaderLocationLabel(storage) {
  const detected = readDetectedLocation(storage);
  const city = String(detected?.city || "").trim();
  return city || "Los Angeles";
}

/** hideLocation: the Feed's "Clips | Deals" switch needs the top middle (Today shows the location). */
export default function FeedMobileHeader({ onMoreClick, showShopBasket = false, hideLocation = false }) {
  const { itemCount } = useOrderCart();
  const place = feedHeaderLocationLabel(typeof window !== "undefined" ? window.localStorage : null);
  return (
    <header style={styles.header} data-testid="feed-mobile-header">
      <div style={styles.actions}>
        <button
          type="button"
          style={styles.moreBtn}
          data-testid="feed-more-open-mobile"
          aria-label="Open More menu"
          onClick={() => {
            clearStuckMediaChrome();
            onMoreClick?.();
          }}
        >
          ☰
        </button>
        {hideLocation ? null : (
        <Link
          to="/feed/search"
          style={styles.place}
          data-testid="feed-header-location"
          aria-label={`Your location: ${place}. Change it in Search`}
          onClick={() => clearStuckMediaChrome()}
        >
          {place}
        </Link>
        )}
        {showShopBasket || itemCount > 0 ? <FeedShopBasketButton variant="feedDark" /> : null}
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    // Left side only: the clip's cluster chip and sound button sit at the top right, as in the app.
    zIndex: 1300,
    display: "flex",
    alignItems: "center",
    padding: "max(10px, env(safe-area-inset-top)) 12px 8px max(12px, env(safe-area-inset-left))",
    pointerEvents: "none",
  },
  actions: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    pointerEvents: "auto",
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    fontSize: 17,
    lineHeight: 1,
    cursor: "pointer",
  },
  place: {
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    background: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    padding: "5px 10px",
    maxWidth: 160,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
  },
};
