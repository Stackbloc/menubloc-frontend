import { useLanguage } from "../../context/LanguageContext.jsx";

const btnStyle = (enabled) => ({
  border: "none",
  borderRadius: 10,
  background: enabled ? "#fff" : "transparent",
  color: enabled ? "#1d4ed8" : "#9ca3af",
  fontSize: 14,
  fontWeight: 700,
  cursor: enabled ? "pointer" : "default",
  padding: "8px 14px",
  opacity: enabled ? 1 : 0.45,
  boxShadow: enabled ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: enabled ? "rgba(0,0,0,0.08)" : "transparent",
});

export default function MenuCatalogControls({
  index,
  total,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  isMobile = false,
}) {
  const { t } = useLanguage();
  const positionLabel = total > 0
    ? t("menuCatalog.position", "{current} of {total}", {
        current: index + 1,
        total,
      })
    : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "10px 14px" : "12px 20px",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        background: "var(--gb-color-page, #f8f6f1)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label={t("menuCatalog.previous", "Previous")}
          style={btnStyle(hasPrev)}
        >
          ← {t("menuCatalog.previous", "Previous")}
        </button>

        <span
          aria-live="polite"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#667085",
            padding: "0 4px",
            minWidth: 56,
            textAlign: "center",
          }}
        >
          {positionLabel}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label={t("menuCatalog.next", "Next")}
          style={btnStyle(hasNext)}
        >
          {t("menuCatalog.next", "Next")} →
        </button>
      </div>
    </div>
  );
}
