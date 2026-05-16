import { useLanguage } from "../context/LanguageContext.jsx";
import { MENU_UV_CODE, MENU_UV_I18N } from "../lib/menuVerificationLabels.js";

/**
 * UV menu notice — compact badge + Menuply definition of Unverified.
 */
export default function UvMenuNotice({
  show = true,
  variant = "banner",
  menuBanner = null,
  onClaim = null,
  style = {},
}) {
  const { t } = useLanguage();
  if (!show) return null;

  const explanation = String(menuBanner || "").trim() || t(MENU_UV_I18N.explanation);
  const title = t(MENU_UV_I18N.explanationTitle);

  if (variant === "chip") {
    return (
      <span
        title={title}
        aria-label={`${MENU_UV_CODE}: ${explanation}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 9px",
          borderRadius: 999,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.8,
          background: "rgba(0,0,0,0.30)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "rgba(255,255,255,0.85)",
          ...style,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#facc15",
            flexShrink: 0,
          }}
        />
        {t(MENU_UV_I18N.badge)}
      </span>
    );
  }

  return (
    <div
      style={{
        marginBottom: 16,
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(250, 204, 21, 0.12)",
        border: "1px solid rgba(250, 204, 21, 0.45)",
        color: "#422006",
        fontSize: 13,
        lineHeight: 1.5,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <span
          title={title}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 28,
            height: 22,
            padding: "0 8px",
            borderRadius: 6,
            background: "#facc15",
            color: "#422006",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 0.6,
            flexShrink: 0,
          }}
        >
          {MENU_UV_CODE}
        </span>
        <span style={{ flex: "1 1 200px", minWidth: 0 }}>{explanation}</span>
      </div>
      {typeof onClaim === "function" ? (
        <button
          type="button"
          onClick={onClaim}
          style={{
            marginTop: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
            color: "#0B0F0C",
            border: "none",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {t(MENU_UV_I18N.claimCta)}
        </button>
      ) : null}
    </div>
  );
}