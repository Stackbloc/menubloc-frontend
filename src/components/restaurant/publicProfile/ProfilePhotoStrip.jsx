/**
 * Horizontal photo strip from real billboard / hero assets only.
 * Collapses when no remaining images — no empty placeholders.
 * Phase 1.5: larger tiles; exclude hero URL to avoid triple-repeat.
 */
import { PROFILE_INK } from "./profilePrimitives.jsx";

function collectPhotoUrls({ bannerPhotoUrl, billboardPreview, excludeHeroUrl }) {
  const urls = [];
  const seen = new Set();
  const exclude = String(excludeHeroUrl || bannerPhotoUrl || "").trim();
  if (exclude) seen.add(exclude);

  const push = (raw, kind) => {
    const url = String(raw || "").trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push({ url, kind });
  };

  // Prefer additional billboard images; then cover if it was not the hero.
  if (Array.isArray(billboardPreview)) {
    for (const post of billboardPreview) {
      push(post?.image_url || post?.photo_url, "billboard");
    }
  }
  push(bannerPhotoUrl, "cover");
  return urls;
}

export default function ProfilePhotoStrip({
  name = "Business",
  bannerPhotoUrl = null,
  billboardPreview = [],
  isMobile = false,
}) {
  const photos = collectPhotoUrls({
    bannerPhotoUrl,
    billboardPreview,
    excludeHeroUrl: bannerPhotoUrl,
  });
  // Phase 1.5: show strip when ≥1 remaining image (hero already shows one).
  if (!photos.length) return null;

  const tileW = isMobile ? 168 : 260;
  const tileH = isMobile ? 126 : 180;

  return (
    <section
      data-testid="profile-photo-strip"
      aria-label={`${name} photos`}
      style={{ marginBottom: isMobile ? 20 : 24 }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 0.4,
          color: PROFILE_INK,
          marginBottom: 12,
        }}
      >
        Photos
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 4,
          scrollSnapType: "x mandatory",
        }}
      >
        {photos.slice(0, 8).map((photo, idx) => (
          <img
            key={`${photo.url}-${idx}`}
            src={photo.url}
            alt={`${name} ${photo.kind === "billboard" ? "update" : "photo"} ${idx + 1}`}
            loading="lazy"
            width={tileW}
            height={tileH}
            style={{
              width: tileW,
              height: tileH,
              objectFit: "cover",
              borderRadius: 16,
              flexShrink: 0,
              scrollSnapAlign: "start",
              background: "#e7e5e4",
              boxShadow: "0 10px 28px rgba(28, 25, 23, 0.08)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
