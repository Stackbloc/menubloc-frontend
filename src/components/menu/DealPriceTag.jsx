import DealIcon from "../icons/DealIcon.jsx";
import { dealPriceText, dealWasText } from "../../lib/itemDeal.js";

/**
 * Deal icon + deal price, with the regular price struck through right under it so the saving is
 * plain (Andre 2026-11-04: show the regular price "so the user can get a feel for the deal value"
 * without making prices confusing). One look wherever a dish price shows. `priceStyle` is the
 * screen's own price style so it fits every menu look. `align`: "end" in price columns, "start"
 * under a title. The regular price takes the row's own text color (menus have dark themes), a
 * little dimmed: readable, not faint.
 */
export default function DealPriceTag({ deal, regular, priceStyle, wasStyle, iconSize = 18, align = "end", ring = false, testId = "deal-price" }) {
  if (!deal) return null;
  const now = dealPriceText(deal);
  const was = dealWasText(deal, regular);
  return (
    <span
      data-testid={testId}
      aria-label={`Deal${now ? `, ${now}` : ""}${was ? `, regular price ${was}` : ""}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: align === "start" ? "flex-start" : "flex-end",
        gap: 1,
        whiteSpace: "nowrap",
        flexShrink: 0,
        verticalAlign: "top",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <DealIcon size={iconSize} ring={ring} />
        {now ? <span style={{ fontWeight: 800, ...priceStyle }}>{now}</span> : null}
      </span>
      {was ? (
        <span
          data-testid={`${testId}-regular`}
          style={{ textDecoration: "line-through", opacity: 0.75, fontSize: "0.8em", fontWeight: 500, lineHeight: 1.2, ...wasStyle }}
        >
          {was}
        </span>
      ) : null}
    </span>
  );
}
