/**
 * About [Restaurant Name] + Founded on every public profile.
 * Unclaimed missing Founded (and About) render empty slots; claim CTA is page-level.
 * about_us content remains the single description source for Invite to Eat preview.
 */
import ProfilePhotoStrip from "./ProfilePhotoStrip.jsx";
import {
  PROFILE_INK,
  PROFILE_MUTED,
  firstNonEmpty,
  ProfileSectionBlank,
  profileReadableSurfaceStyle,
} from "./profilePrimitives.jsx";

export default function ProfileAboutFounded({
  aboutText = "",
  foundedText = "",
  name = "Business",
  bannerPhotoUrl = null,
  billboardPreview = [],
  claimHref = null,
  claimState = null,
  isMobile = false,
  showClaimInvites = false,
  /** Dining halls: hide Founded when the year is still unknown. */
  omitEmptyFounded = false,
  /** Additional Photos strip — temporarily off on restaurant/food-truck profiles. */
  showPhotos = false,
  aboutBlankMessage = "Tell diners about this restaurant.",
  foundedBlankMessage = "Add the year or date founded.",
  windowsPhotoOrientation = "portrait",
}) {
  void claimHref;
  void claimState;
  const about = firstNonEmpty(aboutText);
  const founded = firstNonEmpty(foundedText);
  const placeName = String(name || "").trim() || "this restaurant";
  const aboutHeading = `About ${placeName}`;

  return (
    <section
      data-testid="profile-about-founded"
      data-profile-surface="card"
      aria-label={aboutHeading}
      style={profileReadableSurfaceStyle({
        marginBottom: isMobile ? 20 : 28,
        padding: isMobile ? "12px 14px" : "14px 16px",
      })}
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
        {aboutHeading}
      </div>
      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {about ? (
          <p
            data-testid="profile-about-text"
            style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: PROFILE_INK }}
          >
            {about}
          </p>
        ) : showClaimInvites ? (
          <ProfileSectionBlank testId="profile-about-blank" message={aboutBlankMessage} />
        ) : null}

        {founded || showClaimInvites || !omitEmptyFounded ? (
          <div data-testid="profile-founded">
            <div style={{ fontSize: 12, fontWeight: 700, color: PROFILE_MUTED, marginBottom: 4 }}>
              Founded
            </div>
            {founded ? (
              <div data-testid="profile-founded-value" style={{ fontSize: 14, fontWeight: 600, color: PROFILE_INK }}>
                {founded}
              </div>
            ) : showClaimInvites ? (
              <ProfileSectionBlank testId="profile-founded-blank" message={foundedBlankMessage} />
            ) : omitEmptyFounded ? null : (
              <div data-testid="profile-founded-empty" style={{ fontSize: 14, color: PROFILE_MUTED }}>
                —
              </div>
            )}
          </div>
        ) : null}

        {showPhotos ? (
          <ProfilePhotoStrip
            name={name}
            bannerPhotoUrl={bannerPhotoUrl}
            billboardPreview={billboardPreview}
            isMobile={isMobile}
            showClaimInvites={showClaimInvites}
            embedded
            windowsPhotoOrientation={windowsPhotoOrientation}
          />
        ) : null}
      </div>
    </section>
  );
}
