/**
 * Signature billboard block — collapses entirely when empty.
 * Phase 1.5: stronger visual weight as a defining Menuply feature.
 */
import { Link } from "react-router-dom";
import RestaurantBillboardStrip from "../../RestaurantBillboardStrip.jsx";
import { PROFILE_GREEN, PROFILE_INK, PROFILE_MUTED } from "./profilePrimitives.jsx";

export default function ProfileBillboardFeature({
  billboardPreview = [],
  billboardHref = null,
  isMobile = false,
}) {
  if (!Array.isArray(billboardPreview) || !billboardPreview.length) return null;

  return (
    <section
      data-testid="profile-billboard-feature"
      aria-label="Billboard"
      style={{
        marginBottom: isMobile ? 20 : 28,
        padding: isMobile ? "18px 14px 16px" : "24px 24px 20px",
        borderRadius: 18,
        background: "linear-gradient(165deg, #ecfdf5 0%, #f0fdf4 40%, #ffffff 100%)",
        border: "1px solid #86efac",
        boxShadow: "0 12px 36px rgba(22, 101, 52, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              color: PROFILE_GREEN,
              marginBottom: 4,
            }}
          >
            Billboard
          </div>
          <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: PROFILE_INK, letterSpacing: "-0.02em" }}>
            What&apos;s happening now
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: PROFILE_MUTED, lineHeight: 1.45 }}>
            Specials, events, and announcements from this business.
          </div>
        </div>
        {billboardHref ? (
          <Link
            to={billboardHref}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: PROFILE_GREEN,
              textDecoration: "none",
            }}
          >
            View full billboard →
          </Link>
        ) : null}
      </div>
      <RestaurantBillboardStrip
        posts={billboardPreview}
        isDark={false}
        isMobile={isMobile}
        muted={PROFILE_MUTED}
      />
    </section>
  );
}
