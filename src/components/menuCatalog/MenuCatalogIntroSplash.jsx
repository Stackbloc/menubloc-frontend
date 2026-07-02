import {
  MENU_BROWSER_BOOK_SRC,
} from "../../lib/menuCatalogCategories.js";

const INK = "#1a1a1a";

/**
 * Yellow Browser intro — centered book art + live loading progress.
 * SWIPE / YELLOW BROWSER lines use explicit horizontal spacing (not baked PNG).
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
        borderRadius: 16,
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <img
          src={bookSrc}
          alt=""
          aria-hidden
          style={{
            display: "block",
            width: "min(88vw, 340px)",
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
            gap: "clamp(18px, 6vw, 36px)",
            marginTop: "clamp(8px, 2vw, 14px)",
            color: INK,
            fontWeight: 800,
            fontSize: "clamp(15px, 4.2vw, 20px)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden style={{ fontSize: "1.05em", letterSpacing: 0 }}>«</span>
          <span>SWIPE</span>
          <span aria-hidden style={{ fontSize: "1.05em", letterSpacing: 0 }}>»</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "clamp(6px, 1.5vw, 10px)",
            width: "100%",
          }}
        >
          <div
            aria-hidden
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: "clamp(20px, 7vw, 44px)",
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
              marginTop: "clamp(4px, 1vw, 8px)",
              width: "min(92%, 320px)",
              height: "clamp(5px, 1.2vw, 8px)",
              background: INK,
            }}
          />
        </div>
      </div>

      <div
        style={{
          width: "min(78%, 300px)",
          marginTop: "clamp(12px, 3vw, 20px)",
          flexShrink: 0,
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
