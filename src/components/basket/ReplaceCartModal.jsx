import { useLanguage } from "../../context/LanguageContext.jsx";

// One-restaurant basket warning (Andre, 2026-10-22; design system BasketConflictSheet):
// keeping the current basket is the default; starting a new one is the explicit choice.
const backdropStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2100,
  background: "var(--mp-scrim)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const sheetStyle = {
  background: "var(--mp-surface)",
  borderRadius: "var(--mp-radius-lg) var(--mp-radius-lg) 0 0",
  padding: "var(--mp-space-4) var(--mp-space-4) calc(var(--mp-space-6) + env(safe-area-inset-bottom, 0px))",
  maxWidth: 480,
  width: "100%",
  boxShadow: "var(--mp-shadow-sheet)",
  display: "grid",
  gap: "var(--mp-space-3)",
  fontFamily: "var(--mp-font-sans)",
};

const keepButtonStyle = {
  border: "none",
  borderRadius: "var(--mp-radius-md)",
  background: "var(--mp-accent)",
  color: "var(--mp-on-accent)",
  padding: "12px 16px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const startNewButtonStyle = {
  border: "none",
  background: "none",
  color: "var(--mp-danger)",
  padding: "8px 16px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

export default function ReplaceCartModal({
  open,
  currentRestaurantName,
  nextRestaurantName,
  dishName,
  onKeep,
  onReplace,
}) {
  const { t } = useLanguage();
  if (!open) return null;
  const current = currentRestaurantName || t("basket.replace.anotherRestaurant", "another restaurant");
  const dish = dishName || nextRestaurantName || t("basket.replace.thisDish", "this dish");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("basket.replace.aria", "Basket has another restaurant")}
      style={backdropStyle}
      data-testid="basket-conflict-sheet"
    >
      <div style={sheetStyle}>
        <div style={{ alignSelf: "center", justifySelf: "center", width: 36, height: 4, borderRadius: 999, background: "var(--mp-border)" }} />
        <div style={{ fontSize: 17, lineHeight: "22px", fontWeight: 600, color: "var(--mp-ink)" }}>
          {t("basket.replace.title", "Your basket has items from {restaurant}").replace("{restaurant}", current)}
        </div>
        <div style={{ fontSize: 15, lineHeight: "21px", color: "var(--mp-ink-muted)" }}>
          {t("basket.replace.body", "One restaurant per basket. Adding {dish} starts a new basket.").replace("{dish}", dish)}
        </div>
        <button type="button" onClick={onKeep} style={keepButtonStyle} autoFocus data-testid="basket-conflict-keep">
          {t("basket.replace.keep", "Keep my {restaurant} basket").replace("{restaurant}", current)}
        </button>
        <button type="button" onClick={onReplace} style={startNewButtonStyle} data-testid="basket-conflict-start-new">
          {t("basket.replace.clear", "Start new basket with {dish}").replace("{dish}", dish)}
        </button>
      </div>
    </div>
  );
}
