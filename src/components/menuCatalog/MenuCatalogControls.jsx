import { useLanguage } from "../../context/LanguageContext.jsx";

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
        justifyContent: "space-between",
        gap: 12,
        padding: isMobile ? "10px 14px" : "12px 20px",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        background: "var(--gb-color-page, #f8f6f1)",
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label={t("menuCatalog.previous", "Previous")}
        style={{
          border: "none",
          background: "transparent",
          color: hasPrev ? "#1d4ed8" : "#9ca3af",
          fontSize: 14,
          fontWeight: 700,
          cursor: hasPrev ? "pointer" : "default",
          padding: "6px 4px",
          opacity: hasPrev ? 1 : 0.5,
        }}
      >
        ← {t("menuCatalog.previous", "Previous")}
      </button>

      <span style={{ fontSize: 13, fontWeight: 700, color: "#667085" }}>
        {positionLabel}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        aria-label={t("menuCatalog.next", "Next")}
        style={{
          border: "none",
          background: "transparent",
          color: hasNext ? "#1d4ed8" : "#9ca3af",
          fontSize: 14,
          fontWeight: 700,
          cursor: hasNext ? "pointer" : "default",
          padding: "6px 4px",
          opacity: hasNext ? 1 : 0.5,
        }}
      >
        {t("menuCatalog.next", "Next")} →
      </button>
    </div>
  );
}
