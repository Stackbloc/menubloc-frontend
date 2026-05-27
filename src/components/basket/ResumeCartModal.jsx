import { useLanguage } from "../../context/LanguageContext.jsx";

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
  background: "#14532d",
  color: "#fff",
  padding: "13px 20px",
  fontSize: 14,
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: "1px solid rgba(220,38,38,0.22)",
  borderRadius: 999,
  background: "#fff",
  color: "#dc2626",
  padding: "12px 20px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

export default function ResumeCartModal({ open, restaurantName, onKeep, onClear }) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("basket.resume.title", "Resume your order?")}
      style={backdropStyle}
    >
      <div style={sheetStyle}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#11211a" }}>
            {t("basket.resume.title", "Resume your order?")}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#475467" }}>
            {t(
              "basket.resume.bodyNamed",
              "You still have items in your cart from {name}. Would you like to continue your order or start fresh?",
              { name: restaurantName }
            )}
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <button type="button" onClick={onKeep} style={primaryButtonStyle}>
            {t("basket.resume.keepCart", "Keep my cart")}
          </button>
          <button type="button" onClick={onClear} style={secondaryButtonStyle}>
            {t("basket.resume.clearCart", "Clear cart")}
          </button>
        </div>
      </div>
    </div>
  );
}
