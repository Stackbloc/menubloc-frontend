function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export default function BasketSummaryBar({
  itemCount,
  subtotal,
  onOpenBasket,
  restaurantName,
  isCurrentRestaurant = true,
  headingLabel,
  summaryLabel,
  ctaLabel = "View Cart",
  onClear,
}) {
  if (!itemCount) return null;

  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;
  const heading = headingLabel || (isCurrentRestaurant
    ? "Basket"
    : `Basket from ${restaurantName || "another restaurant"}`);
  const subcopy = summaryLabel || (isCurrentRestaurant
    ? `${itemLabel} • ${formatMoney(subtotal)}`
    : `${itemLabel} already selected • ${formatMoney(subtotal)}`);

  return (
    <div style={{
      position: "fixed",
      left: 12,
      right: 12,
      bottom: 12,
      zIndex: 1100,
      maxWidth: 540,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          style={{
            alignSelf: "flex-end",
            border: "none",
            borderRadius: 999,
            background: "rgba(17,33,26,0.80)",
            color: "#f8fafc",
            fontSize: 12,
            fontWeight: 800,
            padding: "5px 14px",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          × Remove from basket
        </button>
      )}
      <button
        type="button"
        onClick={onOpenBasket}
        style={{
          border: "none",
          borderRadius: 20,
          background:
            "linear-gradient(135deg, rgba(17,33,26,0.98), rgba(24,60,44,0.98))",
          color: "#f8fafc",
          padding: "14px 18px",
          boxShadow: "0 18px 44px rgba(15,23,42,0.22)",
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
          <div style={{ display: "grid", gap: 2, textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "rgba(248,250,252,0.74)" }}>
              {heading}
            </div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>
              {subcopy}
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {ctaLabel}
            <span aria-hidden="true">→</span>
          </div>
        </div>
      </button>
    </div>
  );
}
