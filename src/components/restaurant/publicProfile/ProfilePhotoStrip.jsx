/**
 * Horizontal photo strip from real billboard / hero assets only.
 * Collapses when no images exist — no empty placeholders.
 */
import { PROFILE_MUTED } from "./profilePrimitives.jsx";

function collectPhotoUrls({ bannerPhotoUrl, billboardPreview, logoUrl }) {
  const urls = [];
  const seen = new Set();
  const push = (raw, kind) => {
    const url = String(raw || "").trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push({ url, kind });
  };

  push(bannerPhotoUrl, "cover");
  if (Array.isArray(billboardPreview)) {
    for (const post of billboardPreview) {
      push(post?.image_url || post?.photo_url, "billboard");
    }
  }
  // Logo last — only if we have nothing else, skip (logo already in hero).
  if (!urls.length) push(null, "none");
  return urls.filter((u) => u.url);
}

export default function ProfilePhotoStrip({
  name = "Business",
  bannerPhotoUrl = null,
  billboardPreview = [],
  isMobile = false,
}) {
  const photos = collectPhotoUrls({ bannerPhotoUrl, billboardPreview });
  // Need at least 2 distinct photos to justify a gallery strip (hero already shows one).
  if (photos.length < 2) return null;

  return (
    <section
      data-testid="profile-photo-strip"
      aria-label={`${name} photos`}
      style={{ marginBottom: 28 }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: PROFILE_MUTED,
          marginBottom: 10,
        }}
      >
        Photos
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
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
            width={isMobile ? 160 : 200}
            height={isMobile ? 120 : 140}
            style={{
              width: isMobile ? 160 : 200,
              height: isMobile ? 120 : 140,
              objectFit: "cover",
              borderRadius: 14,
              flexShrink: 0,
              scrollSnapAlign: "start",
              background: "#e7e5e4",
            }}
          />
        ))}
      </div>
    </section>
  );
}
