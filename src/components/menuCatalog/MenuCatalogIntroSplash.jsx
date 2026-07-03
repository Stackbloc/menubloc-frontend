import {
  MENU_BROWSER_BOOK_SRC,
} from "../../lib/menuCatalogCategories.js";

const INK = "#1a1a1a";

function LoadingMeter({ pct }) {
  return (
    <div
      style={{
        width: "min(78%, 300px)",
        marginTop: "clamp(20px, 5vw, 32px)",
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
            color: INK,
          }}
        >
          Loading menus
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: INK,
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
          border: `2px solid ${INK}`,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            background: INK,
            transition: "width 120ms linear",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Book cover (image only) or loading spread (branding + meter).
 */
export default function MenuCatalogIntroSplash({
  visible = true,
  progress = 0,
  variant = "loading",
  bookSrc = MENU_BROWSER_BOOK_SRC,
}) {
  if (!visible) return null;

  const isCover = variant === "cover";
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const ariaLabel = isCover
    ? "Menu browser"
    : `Loading menus, ${pct} percent`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        background: "#FACC15",
        borderRadius: 16,
        boxSizing: "border-box",
        padding: "clamp(28px, 8vh, 56px) 16px 24px",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 520,
          marginTop: isCover ? 0 : "clamp(0px, 2vh, 12px)",
          transform: isCover ? "none" : "translateY(-4%)",
          pointerEvents: "none",
        }}
      >
        <img
          src={bookSrc}
          alt=""
          aria-hidden
          style={{
            display: "block",
            width: "min(88vw, 400px)",
            maxWidth: "100%",
            maxHeight: isCover ? "min(52vh, 420px)" : "36vh",
            height: "auto",
            objectFit: "contain",
            margin: "0 auto",
          }}
        />

        {!isCover ? (
          <>
            <div
              aria-hidden
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(20px, 6.5vw, 40px)",
                marginTop: "clamp(8px, 2vw, 14px)",
                color: INK,
                fontWeight: 800,
                fontSize: "clamp(18px, 5vw, 24px)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              <span
                aria-hidden
                style={{
                  fontSize: "0.92em",
                  fontWeight: 900,
                  letterSpacing: 0,
                  lineHeight: 1,
                }}
              >
                ≪
              </span>
              <span>SWIPE</span>
              <span
                aria-hidden
                style={{
                  fontSize: "0.92em",
                  fontWeight: 900,
                  letterSpacing: 0,
                  lineHeight: 1,
                }}
              >
                ≫
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "clamp(14px, 3.5vw, 24px)",
                width: "100%",
              }}
            >
              <div
                aria-hidden
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: "clamp(24px, 8vw, 52px)",
                  color: INK,
                  fontWeight: 900,
                  fontSize: "clamp(28px, 8.5vw, 46px)",
                  lineHeight: 1,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                <span>YELLOW</span>
                <span>BROWSER</span>
              </div>
              <div
                aria-hidden
                style={{
                  marginTop: "clamp(6px, 1.4vw, 10px)",
                  width: "min(94%, 340px)",
                  height: "clamp(5px, 1.2vw, 8px)",
                  background: INK,
                }}
              />
            </div>

            <LoadingMeter pct={pct} />
          </>
        ) : null}
      </div>
    </div>
  );
}
