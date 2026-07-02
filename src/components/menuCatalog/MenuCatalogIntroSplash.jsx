import {
  MENU_BROWSER_BOOK_SRC,
} from "../../lib/menuCatalogCategories.js";

const INK = "#1a1a1a";

/**
 * Yellow Browser intro — centered book hero + spaced SWIPE / YELLOW BROWSER lines.
 */
export default function MenuCatalogIntroSplash({
  visible = true,
  progress = 0,
  bookSrc = MENU_BROWSER_BOOK_SRC,
}) {
  if (!visible) return null;

  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading Yellow Browser, ${pct} percent`}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        background: "#FACC15",
        borderRadius: 16,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Hero artwork — true vertical center of panel, nudged up ~6% */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px 96px",
          transform: "translateY(-6%)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 520,
          }}
        >
          <img
            src={bookSrc}
            alt=""
            aria-hidden
            style={{
              display: "block",
              width: "min(92vw, 440px)",
              maxWidth: "100%",
              height: "auto",
              objectFit: "contain",
              margin: "0 auto",
            }}
          />

          <div
            aria-hidden
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(20px, 6.5vw, 40px)",
              marginTop: "clamp(10px, 2.5vw, 16px)",
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
              marginTop: "clamp(18px, 4.5vw, 32px)",
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
        </div>
      </div>

      {/* Loading progress — pinned to bottom, does not pull hero down */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "clamp(20px, 4vw, 28px)",
          transform: "translateX(-50%)",
          width: "min(78%, 300px)",
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
    </div>
  );
}
