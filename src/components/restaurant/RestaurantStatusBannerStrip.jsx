/**
 * Public profile status banner strip — simple toggles + schedule presentations.
 */
import { resolveStatusBanners } from "../../lib/restaurantStatusBanners.js";

const STYLE_ID = "restaurant-status-banner-anim";

function ensureAnimationStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes menuplyStatusBannerPulse {
      0%, 100% { box-shadow: 0 0 0 0 var(--banner-glow); transform: translateY(0); }
      50% { box-shadow: 0 0 0 6px transparent; transform: translateY(-1px); }
    }
    @keyframes menuplyStatusBannerGlow {
      0%, 100% { box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06); }
      50% { box-shadow: 0 6px 18px var(--banner-glow); }
    }
  `;
  document.head.appendChild(style);
}

const TYPE_STYLE = {
  happy_hour: {
    accent: "#b45309",
    background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    border: "#fcd34d",
    glow: "rgba(245, 158, 11, 0.35)",
    emoji: "🍺",
  },
  live_music: {
    accent: "#be185d",
    background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
    border: "#f9a8d4",
    glow: "rgba(236, 72, 153, 0.3)",
    emoji: "🎵",
  },
};

function ScheduledCard({ presentation }) {
  const style = TYPE_STYLE[presentation.status_type] || TYPE_STYLE.happy_hour;
  const hot = presentation.emphasis === "now" || presentation.emphasis === "tonight";
  return (
    <div
      style={{
        "--banner-glow": style.glow,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: hot ? 220 : 180,
        maxWidth: "100%",
        padding: hot ? "12px 14px" : "10px 12px",
        borderRadius: 14,
        border: `1px solid ${style.border}`,
        background: style.background,
        color: style.accent,
        animation: hot
          ? "menuplyStatusBannerPulse 2.8s ease-in-out infinite"
          : "menuplyStatusBannerGlow 3.6s ease-in-out infinite",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden="true">{style.emoji}</span>
        <span style={{ fontSize: hot ? 13 : 12, fontWeight: 900, letterSpacing: "0.04em" }}>
          {presentation.headline}
        </span>
      </div>
      {(presentation.sublines || []).map((line) => (
        <div key={line} style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: "#7c2d12" }}>
          {presentation.status_type === "live_music" ? (
            <span style={{ color: style.accent }}>{line}</span>
          ) : (
            line
          )}
        </div>
      ))}
      {presentation.external_url ? (
        <a
          href={presentation.external_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, fontWeight: 700, color: style.accent, marginTop: 2 }}
        >
          Details →
        </a>
      ) : null}
    </div>
  );
}

export default function RestaurantStatusBannerStrip({
  statusBanners,
  statusEventPresentations = [],
}) {
  ensureAnimationStyles();
  const simple = resolveStatusBanners(statusBanners);
  const presentations = Array.isArray(statusEventPresentations)
    ? statusEventPresentations
    : [];

  if (!simple.length && !presentations.length) return null;

  return (
    <div
      role="status"
      aria-label="Restaurant status"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 14,
        alignItems: "stretch",
      }}
    >
      {simple.map((banner) => {
        const isPrimary = banner.prominence === "primary";
        return (
          <div
            key={banner.id}
            style={{
              "--banner-glow": banner.glow,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: isPrimary ? "10px 14px" : "8px 12px",
              borderRadius: 999,
              border: `1px solid ${banner.border}`,
              background: banner.background,
              color: banner.accent,
              fontSize: isPrimary ? 14 : 13,
              fontWeight: isPrimary ? 800 : 700,
              letterSpacing: isPrimary ? "-0.01em" : "0",
              lineHeight: 1.2,
              animation: isPrimary
                ? "menuplyStatusBannerPulse 2.8s ease-in-out infinite"
                : "menuplyStatusBannerGlow 3.6s ease-in-out infinite",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: isPrimary ? 16 : 14 }}>
              {banner.emoji}
            </span>
            <span>{banner.label}</span>
          </div>
        );
      })}
      {presentations.map((p) => (
        <ScheduledCard key={`${p.status_type}-${p.headline}`} presentation={p} />
      ))}
    </div>
  );
}
