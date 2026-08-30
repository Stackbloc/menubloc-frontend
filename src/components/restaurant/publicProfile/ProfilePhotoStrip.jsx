/**
 * Horizontal photo strip from billboard / hero assets.
 * Includes paused gallery posts; excludes the active hero image to avoid repeat.
 * "Photos" heading only when empty (claim invite blank) — hidden once any photo exists.
 */
import { PROFILE_INK, PROFILE_MUTED, ProfileSectionBlank, profileReadableSurfaceStyle } from "./profilePrimitives.jsx";
import {
  normalizeWindowsPhotoOrientation,
  windowsPhotoStripTileSize,
} from "../../../lib/windowsPhotoOrientation.js";
import { resolveBillboardMediaUrl } from "../../../lib/billboardMediaUrl.js";

function collectPhotoUrls({ bannerPhotoUrl, billboardPreview, excludeHeroUrl }) {
  const urls = [];
  const seen = new Set();
  const exclude = String(excludeHeroUrl || bannerPhotoUrl || "").trim();
  if (exclude) seen.add(exclude);

  const push = (raw, kind) => {
    const url = resolveBillboardMediaUrl(raw);
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
  showClaimInvites = false,
  embedded = false,
  windowsPhotoOrientation = "portrait",
}) {
  const photos = collectPhotoUrls({
    bannerPhotoUrl,
    billboardPreview,
    excludeHeroUrl: bannerPhotoUrl,
  });
  if (!photos.length && !showClaimInvites) return null;

  const orientation = normalizeWindowsPhotoOrientation(windowsPhotoOrientation);
  const { tileW, tileH } = windowsPhotoStripTileSize({
    orientation,
    isMobile,
    embedded,
  });
  const showPhotosHeading = photos.length === 0;

  const label = showPhotosHeading ? (
    <div
      style={{
        fontSize: embedded ? 12 : 13,
        fontWeight: embedded ? 700 : 800,
        letterSpacing: 0.4,
        color: embedded ? PROFILE_MUTED : PROFILE_INK,
        marginBottom: embedded ? 8 : 12,
      }}
    >
      Photos
    </div>
  ) : null;

  const body = !photos.length ? (
    <ProfileSectionBlank testId="profile-photos-blank" message="No additional photos yet." />
  ) : (
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
            borderRadius: embedded ? 12 : 16,
            flexShrink: 0,
            scrollSnapAlign: "start",
            background: "#e7e5e4",
            boxShadow: embedded ? "none" : "0 10px 28px rgba(28, 25, 23, 0.08)",
          }}
        />
      ))}
    </div>
  );

  if (embedded) {
    return (
      <div
        data-testid="profile-photo-strip"
        data-windows-orientation={orientation}
        aria-label={`${name} photos`}
      >
        {label}
        {body}
      </div>
    );
  }

  return (
    <section
      data-testid="profile-photo-strip"
      data-windows-orientation={orientation}
      data-profile-surface="card"
      aria-label={`${name} photos`}
      style={profileReadableSurfaceStyle({
        marginBottom: isMobile ? 20 : 24,
      })}
    >
      {label}
      {body}
    </section>
  );
}
