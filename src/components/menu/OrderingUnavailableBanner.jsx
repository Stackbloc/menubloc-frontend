import React from "react";
import {
  getOrderingAvailabilityMessage,
  isOnlineOrderingAvailable,
} from "../../lib/restaurantStatusLight.js";

/**
 * Compact fit-to-text chip when online ordering is available.
 * Green bordered rectangle — shown only when ordering is applicable.
 * Hidden when ordering is unavailable (no yellow unavailable callout).
 * Does not replace MenuPurchaseWaiterHint sticky wiring.
 */
export default function OrderingUnavailableBanner({ data, style }) {
  if (!isOnlineOrderingAvailable(data)) return null;
  const message = getOrderingAvailabilityMessage(data);
  if (!message) return null;

  return (
    <div
      role="status"
      data-testid="ordering-available-banner"
      style={{
        display: "inline-flex",
        alignItems: "center",
        alignSelf: "flex-start",
        width: "fit-content",
        maxWidth: "100%",
        margin: 0,
        padding: "3px 8px",
        borderRadius: 6,
        border: "1px solid #86efac",
        background: "#f0fdf4",
        color: "#166534",
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
