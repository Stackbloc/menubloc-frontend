/**
 * Public profile status announcements — quiet aside only.
 * Renders only active banner IDs and valid schedule presentations.
 * Not a hero element: no pulse, no permanent multicolor glow row.
 */
import { resolveStatusBanners } from "../../lib/restaurantStatusBanners.js";

function normalizeHttpUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : "";
}

function ScheduledAsideCard({ presentation }) {
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
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        color: "#334155",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700 }}>{presentation.headline}</span>
      </div>
      {(presentation.sublines || []).slice(0, 3).map((line) => (
        <div key={line} style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.35, color: "#475569" }}>
          {line}
        </div>
      ))}
      {externalUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            marginTop: 4,
            fontSize: 12,
            fontWeight: 700,
            color: "#1d4ed8",
            textDecoration: "none",
          }}
        >
          Details ↗
        </a>
      ) : null}
    </div>
  );
}

/**
 * @param {string[]} [statusBanners]
 * @param {object[]} [statusEventPresentations]
 * @param {string} [hiringExternalUrl] — only shown for Now Hiring when a real http(s) URL exists
 * @param {"aside"|"hero"} [variant="aside"]
 */
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

  if (!simple.length && !presentations.length) return null;

  // Product placement is aside; hero variant kept for contract/API compatibility only.
  void variant;

  return (
    <div
      role="complementary"
      aria-label="Restaurant announcements"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "stretch",
      }}
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
              border: "1px solid #d1d5db",
              background: "#f8fafc",
              color: "#475569",
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
                style={{
                  marginLeft: 2,
                  color: "#1d4ed8",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Apply ↗
              </a>
            ) : null}
          </div>
        );
      })}
      {presentations.map((p) => (
        <ScheduledAsideCard
          key={`${p.status_type}-${p.headline}-${(p.sublines || []).join("|")}`}
          presentation={p}
        />
      ))}
    </div>
  );
}
