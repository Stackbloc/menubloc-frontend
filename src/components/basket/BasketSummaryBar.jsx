import { useLanguage } from "../../context/LanguageContext.jsx";
function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

/**
 * Basket bar (design system BasketBar, Andre 2026-10-22): restaurant, item count, total and
 * View basket, the same on web and in the app.
 */
export default function BasketSummaryBar({
  itemCount,
  subtotal,
  onOpenBasket,
  restaurantName,
  isCurrentRestaurant = true,
  headingLabel,
  summaryLabel,
  ctaLabel,
  onClear,
  /** Menu Browser renders the bar inside its own sticky slot instead of fixed to the viewport. */
  inline = false,
}) {
  const { t } = useLanguage();
  if (!itemCount) return null;

  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;
  const heading = headingLabel || (isCurrentRestaurant
    ? (restaurantName || t("basket.heading", "Basket"))
    : `Basket from ${restaurantName || "another restaurant"}`);
  const subcopy = summaryLabel || `${itemLabel} · ${formatMoney(subtotal)}`;
  const cta = ctaLabel || t("basket.viewBasket", "View basket");

  return (
    <div
      style={{
        ...(inline
          ? { position: "relative" }
          : { position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 1100 }),
        maxWidth: 540,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontFamily: "var(--mp-font-sans)",
      }}
      data-testid="basket-summary-bar"
    >
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          style={{
            alignSelf: "flex-end",
            border: "1px solid var(--mp-border)",
            borderRadius: "var(--mp-radius-pill)",
            background: "var(--mp-surface)",
            color: "var(--mp-ink)",
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 14px",
            cursor: "pointer",
          }}
        >
          × Remove from basket
        </button>
      )}
      <button
        type="button"
        onClick={onOpenBasket}
        style={{
          border: "1px solid var(--mp-border)",
          borderRadius: "var(--mp-radius-lg)",
          background: "var(--mp-surface-alt)",
          color: "var(--mp-ink)",
          padding: "var(--mp-space-3) var(--mp-space-4)",
          boxShadow: "var(--mp-shadow-bar)",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            width: "100%",
          }}
        >
          <div style={{ display: "grid", gap: 2, textAlign: "left", minWidth: 0 }}>
            <div style={{ fontSize: 15, lineHeight: "21px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {heading}
            </div>
            <div style={{ fontSize: 13, lineHeight: "18px", color: "var(--mp-ink-muted)", fontVariantNumeric: "tabular-nums" }}>
              {subcopy}
            </div>
          </div>
          <div
            style={{
              borderRadius: "var(--mp-radius-md)",
              background: "var(--mp-accent)",
              color: "var(--mp-on-accent)",
              padding: "10px 16px",
              fontSize: 15,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {cta}
          </div>
        </div>
      </button>
    </div>
  );
}
