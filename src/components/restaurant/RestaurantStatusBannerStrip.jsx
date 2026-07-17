/**
 * Quiet public announcements for Option A editorial profile.
 * Only enabled / valid statuses. No pulse, no multicolor glow row.
 */
import { resolveStatusBanners } from "../../lib/restaurantStatusBanners.js";

function normalizeHttpUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : "";
}

function ScheduledNote({ presentation }) {
  const externalUrl = normalizeHttpUrl(presentation?.external_url);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 160,
        maxWidth: "100%",
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: "#fafaf9",
        color: "#1c1917",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700 }}>{presentation.headline}</div>
      {(presentation.sublines || []).slice(0, 3).map((line) => (
        <div key={line} style={{ fontSize: 12, lineHeight: 1.4, color: "#57534e" }}>
          {line}
        </div>
      ))}
      {externalUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: "#166534", textDecoration: "none" }}
        >
          Details ↗
        </a>
      ) : null}
    </div>
  );
}

export default function RestaurantStatusBannerStrip({
  statusBanners,
  statusEventPresentations = [],
  hiringExternalUrl = "",
  variant = "aside",
}) {
  const simple = resolveStatusBanners(statusBanners);
  const presentations = Array.isArray(statusEventPresentations)
    ? statusEventPresentations
    : [];
  const hiringUrl = normalizeHttpUrl(hiringExternalUrl);
  void variant;

  if (!simple.length && !presentations.length) return null;

  return (
    <div
      role="complementary"
      aria-label="Restaurant announcements"
      style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "stretch" }}
    >
      {simple.map((banner) => {
        const isHiring = banner.id === "now_hiring";
        return (
          <div
            key={banner.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#fafaf9",
              color: "#44403c",
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 12 }}>
              {banner.emoji}
            </span>
            <span>{banner.label}</span>
            {isHiring && hiringUrl ? (
              <a
                href={hiringUrl}
                target="_blank"
                rel="noreferrer"
                style={{ marginLeft: 2, color: "#166534", fontWeight: 700, textDecoration: "none" }}
              >
                Apply ↗
              </a>
            ) : null}
          </div>
        );
      })}
      {presentations.map((p) => (
        <ScheduledNote
          key={`${p.status_type}-${p.headline}-${(p.sublines || []).join("|")}`}
          presentation={p}
        />
      ))}
    </div>
  );
}
