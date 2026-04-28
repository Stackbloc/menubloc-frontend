const backdropStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2100,
  background: "rgba(15,23,42,0.46)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px 16px",
};

const sheetStyle = {
  background: "#fff",
  borderRadius: 24,
  padding: "28px 24px",
  maxWidth: 420,
  width: "100%",
  boxShadow: "0 24px 56px rgba(15,23,42,0.22)",
  display: "grid",
  gap: 18,
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: 999,
  background: "#11211a",
  color: "#fff",
  padding: "13px 20px",
  fontSize: 14,
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: "1px solid rgba(17,33,26,0.12)",
  borderRadius: 999,
  background: "#fff",
  color: "#11211a",
  padding: "12px 20px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

export default function ReplaceCartModal({ open, currentRestaurantName, nextRestaurantName, onKeep, onReplace }) {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Start a new order" style={backdropStyle}>
      <div style={sheetStyle}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#11211a" }}>Start a new order?</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#475467" }}>
            Your cart already contains items from another restaurant.
            Menuply supports one restaurant per order.
          </div>
          <div style={{ fontSize: 13, color: "#667085" }}>
            Current cart: <strong style={{ color: "#11211a" }}>{currentRestaurantName || "another restaurant"}</strong>
            {nextRestaurantName ? <>{" · "}New item: <strong style={{ color: "#11211a" }}>{nextRestaurantName}</strong></> : null}
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <button type="button" onClick={onKeep} style={secondaryButtonStyle}>Keep current cart</button>
          <button type="button" onClick={onReplace} style={primaryButtonStyle}>Clear cart and add item</button>
        </div>
      </div>
    </div>
  );
}
