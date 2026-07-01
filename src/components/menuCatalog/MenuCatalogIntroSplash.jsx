import { MENU_BROWSER_INTRO_LOGO_SRC } from "../../lib/menuCatalogCategories.js";

/**
 * Yellow Browser intro — logo + live loading progress.
 */
export default function MenuCatalogIntroSplash({
  visible = true,
  progress = 0,
  logoSrc = MENU_BROWSER_INTRO_LOGO_SRC,
}) {
  if (!visible) return null;

  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading menus, ${pct} percent`}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FACC15",
        padding: "24px 20px",
      }}
    >
      <img
        src={logoSrc}
        alt="Yellow Browser"
        style={{
          width: "min(88vw, 340px)",
          maxHeight: "52vh",
          objectFit: "contain",
          marginBottom: 28,
        }}
      />

      <div
        style={{
          width: "min(78vw, 300px)",
          marginTop: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#1a1a1a",
            }}
          >
            Loading menus
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#1a1a1a",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {pct}%
          </span>
        </div>

        <div
          aria-hidden="true"
          style={{
            height: 10,
            borderRadius: 999,
            background: "rgba(0,0,0,0.12)",
            overflow: "hidden",
            border: "2px solid #1a1a1a",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 999,
              background: "#1a1a1a",
              transition: "width 120ms linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
