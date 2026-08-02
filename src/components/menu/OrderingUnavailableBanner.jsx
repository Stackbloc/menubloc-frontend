import React from "react";
import { getOrderingAvailabilityMessage } from "../../lib/restaurantStatusLight.js";

/**
 * Compact status line when online ordering is paused, closed, or outside hours.
 * Kept intentionally short — full-width yellow blocks with large padding are an eyesore.
 * Does not replace MenuPurchaseWaiterHint sticky wiring.
 */
export default function OrderingUnavailableBanner({ data, style }) {
  const message = getOrderingAvailabilityMessage(data);
  if (!message) return null;

  return (
    <div
      role="status"
      data-testid="ordering-unavailable-banner"
      style={{
        margin: 0,
        padding: "5px 10px",
        borderRadius: 8,
        border: "1px solid #fde68a",
        background: "#fffbeb",
        color: "#92400e",
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.3,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {message}
    </div>
  );
}
