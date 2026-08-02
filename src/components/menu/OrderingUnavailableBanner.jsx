import React from "react";
import { getOrderingAvailabilityMessage } from "../../lib/restaurantStatusLight.js";

/**
 * Compact fit-to-text status chip when online ordering is paused, closed, or outside hours.
 * Not a full-width yellow bar — short copy must not leave a long amber strip.
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
        display: "inline-flex",
        alignItems: "center",
        alignSelf: "flex-start",
        width: "fit-content",
        maxWidth: "100%",
        margin: 0,
        padding: "3px 8px",
        borderRadius: 6,
        border: "1px solid #fde68a",
        background: "#fffbeb",
        color: "#92400e",
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.25,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {message}
    </div>
  );
}
