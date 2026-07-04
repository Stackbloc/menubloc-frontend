import {
  MENU_BROWSER_BOOK_SRC,
} from "../../lib/menuCatalogCategories.js";

const INK = "#1a1a1a";

/** Bottom spacer weight — lifts the book when SWIPE / YELLOW BROWSER sit below it. */
const SPLASH_BOTTOM_SPACER = 1.85;
const LOADING_BOTTOM_SPACER = 1.55;
const SPLASH_TOP_SPACER = 0.42;
const LOADING_TOP_SPACER = 0.48;

function IntroVerticalFrame({ bottomSpacerWeight = 1, topSpacerWeight = 1, children, style = {} }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        padding: "16px",
        overflow: "auto",
        ...style,
      }}
    >
      <div aria-hidden style={{ flex: `${topSpacerWeight} 1 0`, minHeight: 4, width: "100%" }} />
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 520,
          pointerEvents: "none",
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        style={{ flex: `${bottomSpacerWeight} 1 0`, minHeight: 4, width: "100%" }}
      />
    </div>
  );
}

function LoadingMeter({ pct }) {
  return (
    <div
      style={{
        width: "min(78%, 300px)",
        marginTop: "clamp(8px, 2.5vw, 16px)",
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

function BrandingBlock() {
  return (
    <>
      <div
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(20px, 6.5vw, 40px)",
          marginTop: "clamp(2px, 0.8vw, 6px)",
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
    </>
  );
}

/**
 * Yellow Browser splash variants:
 * - splash: full branded intro (book + SWIPE + YELLOW BROWSER, no meter)
 * - loading: plain book graphic on yellow + loading meter only (no text)
 */
export default function MenuCatalogIntroSplash({
  visible = true,
  progress = 0,
  variant = "loading",
  bookSrc = MENU_BROWSER_BOOK_SRC,
}) {
  if (!visible) return null;

  const isSplash = variant === "splash";
  const isLoading = variant === "loading";
  const showBranding = isSplash;
  const showBook = isSplash || isLoading;
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const ariaLabel = isLoading
    ? `Loading menus, ${pct} percent`
    : "Menu browser";

  return (
    <IntroVerticalFrame
      bottomSpacerWeight={isSplash ? SPLASH_BOTTOM_SPACER : LOADING_BOTTOM_SPACER}
      topSpacerWeight={isSplash ? SPLASH_TOP_SPACER : LOADING_TOP_SPACER}
      style={{
        zIndex: 40,
        background: "#FACC15",
        borderRadius: 16,
      }}
    >
      <div
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        {showBook ? (
        <img
          src={bookSrc}
          alt=""
          aria-hidden
          style={{
            display: "block",
            width: "min(88vw, 400px)",
            maxWidth: "100%",
            maxHeight: isSplash ? "36vh" : "min(48vh, 380px)",
            height: "auto",
            objectFit: "contain",
            margin: "0 auto",
          }}
        />
        ) : null}

        {showBranding ? <BrandingBlock /> : null}
        {isLoading ? <LoadingMeter pct={pct} /> : null}
      </div>
    </IntroVerticalFrame>
  );
}
