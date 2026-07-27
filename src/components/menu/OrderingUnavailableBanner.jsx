import React from "react";
import { getOrderingAvailabilityMessage } from "../../lib/restaurantStatusLight.js";

/**
 * Sticky-adjacent banner when online ordering is paused, closed, or outside hours.
 * Does not replace MenuPurchaseWaiterHint sticky wiring.
 */
export default function OrderingUnavailableBanner({ data, style }) {
  const message = getOrderingAvailabilityMessage(data);
  if (!message) return null;

  return (
    <div
      role="status"
      style={{
        margin: "0 0 10px",
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid #fcd34d",
        background: "#fffbeb",
        color: "#92400e",
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1.4,
        ...style,
      }}
    >
      {message}
    </div>
  );
}
