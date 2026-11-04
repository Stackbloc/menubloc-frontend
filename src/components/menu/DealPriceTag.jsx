import DealIcon from "../icons/DealIcon.jsx";
import { dealPriceText, dealWasText } from "../../lib/itemDeal.js";

/**
 * Deal icon + deal price (+ the regular price struck through), wherever a dish price shows
 * (Andre 2026-11-04). `priceStyle` is the screen's own price style so it fits every menu look.
 */
export default function DealPriceTag({ deal, regular, priceStyle, wasStyle, iconSize = 18, testId = "deal-price" }) {
  if (!deal) return null;
  const now = dealPriceText(deal);
  const was = dealWasText(deal, regular);
  return (
    <span
      data-testid={testId}
      aria-label={`Deal${now ? `, ${now}` : ""}${was ? `, was ${was}` : ""}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", flexShrink: 0 }}
    >
      <DealIcon size={iconSize} />
      {now ? <span style={{ fontWeight: 800, ...priceStyle }}>{now}</span> : null}
      {was ? (
        <span style={{ textDecoration: "line-through", opacity: 0.6, fontSize: "0.85em", fontWeight: 500, ...wasStyle }}>{was}</span>
      ) : null}
    </span>
  );
}
