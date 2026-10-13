/**
 * Menu Browser order bar (Andre, 2026-10-13) — tells diners this menu is an ordering surface.
 * Pinned to the bottom of the menu pane (sticky inside the menu's own scroller), so the Feed
 * bottom nav never covers it:
 *   empty basket → "Your order is empty · Tap a dish to start" (only when the menu takes orders)
 *   items added  → the existing BasketSummaryBar (Review Order → /checkout)
 */

import BasketSummaryBar from "../basket/BasketSummaryBar.jsx";

export const EMPTY_ORDER_BAR_TEXT = "Your order is empty · Tap a dish to start";

export default function MenuOrderBar({
  showEmpty = false,
  insetRight = 0,
  basketProps = null,
}) {
  const hasItems = Number(basketProps?.itemCount || 0) > 0;
  if (!hasItems && !showEmpty) return null;

  return (
    <div
      data-testid="menu-order-bar"
      data-state={hasItems ? "items" : "empty"}
      style={{
        position: "sticky",
        bottom: 8,
        zIndex: 30,
        marginTop: 16,
        paddingRight: Math.max(0, Number(insetRight) || 0),
        pointerEvents: "none",
      }}
    >
      <div style={{ pointerEvents: "auto" }}>
        {hasItems ? (
          <BasketSummaryBar {...basketProps} inline />
        ) : (
          <div role="status" style={styles.empty}>
            <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <div style={styles.heading}>Your order</div>
              <div style={styles.text}>{EMPTY_ORDER_BAR_TEXT}</div>
            </div>
            {insetRight > 0 ? null : <div style={styles.side}>Pickup or delivery</div>}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 18,
    background: "linear-gradient(135deg, rgba(17,33,26,0.94), rgba(24,60,44,0.94))",
    color: "#f8fafc",
    boxShadow: "0 12px 32px rgba(15,23,42,0.18)",
  },
  heading: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "rgba(248,250,252,0.7)",
  },
  text: {
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.3,
  },
  side: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(248,250,252,0.78)",
    whiteSpace: "nowrap",
  },
};
