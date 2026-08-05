/**
 * Compact in-page Billboard below the hero.
 * Reuses billboard_preview creatives; collapses when empty.
 * Entrance splash remains separate (ClaimedRestaurantBillboardSplash).
 */
import {
  PROFILE_INK,
  PROFILE_MUTED,
  profileCardBorderVar,
  ProfileSectionBlank,
} from "./profilePrimitives.jsx";

function postImage(post) {
  return String(post?.image_url || post?.photo_url || "").trim();
}

function postTitle(post) {
  return String(post?.title || post?.headline || post?.cta_text || "").trim();
}

function postBody(post) {
  return String(post?.body || post?.description || post?.message || "").trim();
}

export default function ProfileBillboardBlock({
  billboardPreview = [],
  isMobile = false,
  showClaimInvites = false,
}) {
  const posts = (Array.isArray(billboardPreview) ? billboardPreview : []).filter(
    (p) => postImage(p) || postTitle(p) || postBody(p)
  );
  if (!posts.length && !showClaimInvites) return null;

  return (
    <section
      data-testid="profile-billboard-block"
      aria-label="Billboard"
      style={{ marginBottom: isMobile ? 20 : 28 }}
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
        Billboard
      </div>
      {!posts.length ? (
        <ProfileSectionBlank
          testId="profile-billboard-blank"
          message="No Billboard yet."
        />
      ) : null}
      <div style={{ display: "grid", gap: 12 }}>
        {posts.slice(0, 3).map((post, idx) => {
          const img = postImage(post);
          const title = postTitle(post);
          const body = postBody(post);
          return (
            <article
              key={post?.id || `${img}-${idx}`}
              data-testid="profile-billboard-card"
              style={{
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${profileCardBorderVar}`,
                background: "#fff",
              }}
            >
              {img ? (
                <img
                  src={img}
                  alt={title || "Billboard"}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: isMobile ? 160 : 200,
                    objectFit: "cover",
                    display: "block",
                    background: "#e7e5e4",
                  }}
                />
              ) : null}
              {(title || body) && (
                <div style={{ padding: isMobile ? "12px 14px" : "14px 16px" }}>
                  {title ? (
                    <div style={{ fontSize: 16, fontWeight: 800, color: PROFILE_INK, lineHeight: 1.3 }}>
                      {title}
                    </div>
                  ) : null}
                  {body ? (
                    <div
                      style={{
                        marginTop: title ? 6 : 0,
                        fontSize: 14,
                        color: PROFILE_MUTED,
                        lineHeight: 1.45,
                      }}
                    >
                      {body}
                    </div>
                  ) : null}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
