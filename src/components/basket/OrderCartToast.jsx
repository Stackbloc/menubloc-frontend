export default function OrderCartToast({ notice, onDismiss, bottomOffset = 84 }) {
  if (!notice?.message) return null;

  const isWarning = notice.tone === "warning";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: bottomOffset,
        zIndex: 1120,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          minWidth: "min(100%, 320px)",
          maxWidth: 420,
          pointerEvents: "auto",
          borderRadius: 18,
          padding: "12px 14px",
          background: isWarning ? "#fffbeb" : "#ecfdf3",
          border: `1px solid ${isWarning ? "#fde68a" : "#a7f3d0"}`,
          boxShadow: "0 16px 34px rgba(15,23,42,0.14)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: isWarning ? "#b45309" : "#047857",
            }}
          >
            {isWarning ? "Basket notice" : "Added to basket"}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: isWarning ? "#92400e" : "#166534" }}>
            {notice.message}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            border: "none",
            background: "transparent",
            color: isWarning ? "#92400e" : "#166534",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
