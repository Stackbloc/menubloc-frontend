import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  MENU_BROWSER_MODES,
  toMenuBrowserModeTranslationKey,
} from "../../lib/menuBrowserModes.js";
import { getMenuBrowserVenueCover } from "../../lib/menuBrowserVenueCover.js";

const FALLBACK_INK = "#1a1a1a";
const FALLBACK_PAGE_BG = "#FACC15";

/**
 * Book spread — user picks Food or Drinks after the cover page turns.
 * When a venue slug is set, the page becomes a venue-specific cover ad
 * while keeping the Food / Drinks choice.
 */
export default function MenuCatalogModePage({ onSelect, venueSlug = null }) {
  const { t } = useLanguage();
  const cover = venueSlug ? getMenuBrowserVenueCover(venueSlug) : null;
  const ink = cover?.ink || FALLBACK_INK;
  const pageBg = cover?.pageBg || FALLBACK_PAGE_BG;
  const prompt = cover
    ? cover.prompt
    : t("menuBrowser.chooseModePrompt", "What do you want to browse?");

  return (
    <div
      data-testid="menu-catalog-mode-page"
      data-venue-cover={cover?.slug || ""}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 38,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: pageBg,
        borderRadius: 16,
        boxSizing: "border-box",
        padding: "24px",
        animation: "menuCatalogPageIn 420ms ease-out",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes menuCatalogPageIn {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {cover ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              cover.theme === "la-live"
                ? "linear-gradient(90deg, #c81d3a 0%, #e8c56a 45%, #8ab4ff 100%)"
                : "linear-gradient(90deg, #ff6f33 0%, #ffc857 45%, #6b3fa0 100%)",
            height: 6,
            bottom: "auto",
          }}
        />
      ) : null}

      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "min(100%, 340px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {cover ? (
          <div
            data-testid="menu-browser-venue-cover"
            style={{
              width: "100%",
              marginBottom: 22,
              padding: "18px 16px 16px",
              borderRadius: 16,
              border:
                cover.theme === "la-live"
                  ? "1px solid rgba(232,197,106,0.35)"
                  : "1px solid rgba(255,111,51,0.28)",
              background:
                cover.theme === "la-live"
                  ? "linear-gradient(145deg, rgba(28,34,48,0.92), rgba(18,22,31,0.88))"
                  : "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,243,227,0.4))",
              boxShadow:
                cover.theme === "la-live"
                  ? "0 16px 36px rgba(0,0,0,0.35)"
                  : "0 10px 28px rgba(255,111,51,0.1)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: cover.accent,
              }}
            >
              {cover.brandLine} · {cover.poweredBy}
            </p>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: "clamp(22px, 5.5vw, 28px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: ink,
              }}
            >
              {cover.headline}
            </p>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.45,
                color: cover.muted,
              }}
            >
              {cover.subhead}
            </p>
          </div>
        ) : null}

        <h2
          data-testid="menu-browser-choose-prompt"
          style={{
            margin: cover ? "0 0 22px" : "0 0 36px",
            color: ink,
            fontSize: cover ? "clamp(18px, 4.8vw, 22px)" : "clamp(22px, 6vw, 28px)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            textAlign: "center",
            lineHeight: 1.25,
            maxWidth: 320,
          }}
        >
          {prompt}
        </h2>

        <div
          role="group"
          aria-label={t("menuBrowser.modes", "Browse mode")}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            width: "min(100%, 280px)",
          }}
        >
          {MENU_BROWSER_MODES.map((entry, index) => {
            const defaultLabel = t(toMenuBrowserModeTranslationKey(entry.id), entry.label);
            const label =
              cover && entry.id === "food"
                ? cover.foodLabel
                : cover && entry.id === "drinks"
                  ? cover.drinksLabel
                  : defaultLabel;
            const primary = index === 0;
            return (
              <button
                key={entry.id}
                type="button"
                data-testid={`menu-browser-mode-${entry.id}`}
                onClick={() => onSelect(entry.id)}
                style={{
                  border: `3px solid ${cover ? cover.buttonBorder : FALLBACK_INK}`,
                  borderRadius: 14,
                  background: cover
                    ? primary
                      ? cover.buttonBg
                      : cover.secondaryButtonBg
                    : "#fff",
                  color: cover ? (primary ? cover.buttonInk : cover.ink) : FALLBACK_INK,
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "18px 24px",
                  cursor: "pointer",
                  width: "100%",
                  transition: "background 150ms ease, color 150ms ease, transform 120ms ease",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
