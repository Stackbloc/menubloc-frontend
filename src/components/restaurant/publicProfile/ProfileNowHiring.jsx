/**
 * Restrained Now Hiring module — only when status_banners includes now_hiring.
 * Does not invent job listings.
 */
import { PROFILE_GREEN, PROFILE_INK, PROFILE_MUTED, profileReadableSurfaceStyle } from "./profilePrimitives.jsx";

export default function ProfileNowHiring({
  isActive = false,
  detailsUrl = null,
  isMobile = false,
}) {
  if (!isActive) return null;

  return (
    <section
      data-testid="profile-now-hiring"
      data-profile-surface="card"
      aria-label="Now hiring"
      style={{
        ...profileReadableSurfaceStyle({
          marginBottom: isMobile ? 16 : 20,
          padding: isMobile ? "14px 14px" : "16px 18px",
        }),
        border: "1px solid #86efac",
        background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: PROFILE_GREEN,
          marginBottom: 6,
        }}
      >
        Now Hiring
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: PROFILE_INK }}>
        This restaurant is currently hiring.
      </p>
      {detailsUrl ? (
        <a
          href={detailsUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="profile-hiring-details"
          style={{
            display: "inline-block",
            marginTop: 8,
            fontSize: 13,
            fontWeight: 700,
            color: PROFILE_GREEN,
            textDecoration: "none",
          }}
        >
          View hiring details →
        </a>
      ) : (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: PROFILE_MUTED }}>
          Contact the restaurant for open roles.
        </p>
      )}
    </section>
  );
}
